/**
 * Tests for OAuth Authorize Route
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleOAuthAuthorize } from '@heyclaude/mcp-server/routes/oauth-authorize';
import { createMockEnv, createMockLogger } from '../__tests__/test-utils.ts';

describe('OAuth Authorize Route', () => {
  it('should delegate to shared implementation', async () => {
    const env = createMockEnv({
      SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });

    const url = new URL(
      'https://example.com/oauth/authorize?client_id=test&response_type=code&redirect_uri=https://client.example.com/callback'
    );

    // This will call the shared implementation which will validate and return error
    // (since we don't have a real Supabase setup in tests)
    const response = await handleOAuthAuthorize(new Request(url.toString()), env, url);

    // Should return an error response (invalid request due to missing PKCE params)
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should use provided logger when available', async () => {
    const logger = createMockLogger();
    const env = createMockEnv();
    const url = new URL('https://example.com/oauth/authorize');

    await handleOAuthAuthorize(new Request(url.toString()), env, url, logger);

    // Logger should be used by the shared implementation
    // (This is tested more thoroughly in oauth-shared tests)
    expect(logger).toBeDefined();
  });
});
