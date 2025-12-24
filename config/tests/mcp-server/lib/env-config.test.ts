/**
 * Tests for Environment Configuration
 */

import { describe, it, expect } from '@jest/globals';
import { parseSimpleEnv, type SimpleEnvConfig } from '@heyclaude/mcp-server/lib/env-config';
import { createMockEnv } from '../fixtures/test-utils.js';

describe('Environment Configuration', () => {
  it('should parse minimal configuration with defaults', () => {
    const env = createMockEnv({ NODE_ENV: 'production' });
    const config = parseSimpleEnv(env);

    expect(config.nodeEnv).toBe('production');
    expect(config.site.siteUrl).toBe('https://claudepro.directory');
    expect(config.site.appUrl).toBe('https://claudepro.directory');
    expect(config.newsletter.countTtlSeconds).toBe(300);
  });

  it('should parse full configuration', () => {
    const env = createMockEnv({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
      APP_URL: 'https://app.example.com',
      SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      INNGEST_EVENT_KEY: 'event-key',
      INNGEST_SIGNING_KEY: 'signing-key',
      INNGEST_URL: 'https://inngest.example.com',
      NEWSLETTER_COUNT_TTL_S: '600',
    });

    const config = parseSimpleEnv(env);

    expect(config.nodeEnv).toBe('development');
    expect(config.site.siteUrl).toBe('https://example.com');
    expect(config.site.appUrl).toBe('https://app.example.com');
    expect(config.supabase.url).toBe('https://supabase.example.com');
    expect(config.supabase.anonKey).toBe('anon-key');
    expect(config.supabase.serviceRoleKey).toBe('service-role-key');
    expect(config.inngest.eventKey).toBe('event-key');
    expect(config.inngest.signingKey).toBe('signing-key');
    expect(config.inngest.url).toBe('https://inngest.example.com');
    expect(config.newsletter.countTtlSeconds).toBe(600);
  });

  it('should handle SUPABASE_URL fallback to NEXT_PUBLIC_SUPABASE_URL', () => {
    const env = createMockEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://public.supabase.example.com',
    });
    const config = parseSimpleEnv(env);

    expect(config.supabase.url).toBe('https://public.supabase.example.com');
  });

  it('should handle SUPABASE_ANON_KEY fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    const env = createMockEnv({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
    });
    const config = parseSimpleEnv(env);

    expect(config.supabase.anonKey).toBe('public-anon-key');
  });

  it('should handle optional inngest config', () => {
    const env = createMockEnv({
      NODE_ENV: 'production',
    });
    const config = parseSimpleEnv(env);

    expect(config.inngest.eventKey).toBeUndefined();
    expect(config.inngest.signingKey).toBeUndefined();
    expect(config.inngest.url).toBeUndefined();
  });
});

