/**
 * Build Environment Variables Test
 *
 * SAFEGUARD: Ensures local builds work without Supabase env vars
 *
 * This test prevents regression of the issue where checking NODE_ENV === 'development'
 * caused builds to fail because Next.js sets NODE_ENV=production during build.
 *
 * The test verifies that Supabase clients return mock clients in local environments
 * (when VERCEL and CI env vars are not set), allowing contributors to build without
 * Supabase credentials.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Supabase Clients - Local Environment Fallback', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('should return mock client when env vars missing in local environment (no VERCEL/CI)', async () => {
    // Simulate local environment without Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VERCEL;
    delete process.env.CI;

    // This should NOT throw - it should return a mock client
    const { createClient: createBrowserClient } = await import('@/src/lib/supabase/client');
    const browserClient = createBrowserClient();

    expect(browserClient).toBeDefined();
    expect(browserClient.auth).toBeDefined();
    expect(browserClient.auth.getUser).toBeDefined();
  });

  it('should return mock server client when env vars missing in local environment', async () => {
    // Simulate local environment without Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VERCEL;
    delete process.env.CI;

    // This should NOT throw - it should return a mock client
    const { createClient: createServerClient } = await import('@/src/lib/supabase/server');
    const serverClient = await createServerClient();

    expect(serverClient).toBeDefined();
    expect(serverClient.auth).toBeDefined();
    expect(serverClient.from).toBeDefined();
  });

  it('should return mock admin client when env vars missing in local environment', async () => {
    // Simulate local environment without Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VERCEL;
    delete process.env.CI;

    // This should NOT throw - it should return a mock client
    const { createClient: createAdminClient } = await import('@/src/lib/supabase/admin-client');
    const adminClient = await createAdminClient();

    expect(adminClient).toBeDefined();
    expect(adminClient.auth).toBeDefined();
    expect(adminClient.from).toBeDefined();
  });

  it('should throw error when env vars missing in CI environment', async () => {
    // Simulate CI environment without Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.CI = 'true';

    const { createClient: createBrowserClient } = await import('@/src/lib/supabase/client');

    // This SHOULD throw in CI - we want builds to fail if env vars are missing
    expect(() => createBrowserClient()).toThrow('Missing required Supabase environment variables');
  });

  it('should throw error when env vars missing in Vercel environment', async () => {
    // Simulate Vercel environment without Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.VERCEL = '1';

    const { createClient: createBrowserClient } = await import('@/src/lib/supabase/client');

    // This SHOULD throw in Vercel - we want builds to fail if env vars are missing
    expect(() => createBrowserClient()).toThrow('Missing required Supabase environment variables');
  });

  it('should work with real env vars in any environment', async () => {
    // Simulate environment with valid Supabase env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.VERCEL = '1'; // Even in Vercel, should work if env vars present

    const { createClient: createBrowserClient } = await import('@/src/lib/supabase/client');
    const browserClient = createBrowserClient();

    expect(browserClient).toBeDefined();
    expect(browserClient.auth).toBeDefined();
  });
});
