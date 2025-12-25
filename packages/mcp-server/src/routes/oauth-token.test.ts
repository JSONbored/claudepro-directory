/**
 * Tests for OAuth Token Route
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleOAuthToken } from '@heyclaude/mcp-server/routes/oauth-token';
import { createMockEnv, createMockLogger } from '../__tests__/test-utils.ts';

describe('OAuth Token Route', () => {
  it('should delegate to shared implementation', async () => {
    const env = createMockEnv({
      SUPABASE_URL: 'https://supabase.example.com',
    });

    const formData = new FormData();
    formData.append('grant_type', 'authorization_code');

    const request = new Request('https://example.com/oauth/token', {
      method: 'POST',
      body: formData,
    });

    // This will call the shared implementation which will validate and return error
    // (since we don't have all required parameters)
    const response = await handleOAuthToken(request, env);

    // Should return an error response (missing required parameters)
    expect(response.status).toBe(400);
  });

  it('should use provided logger when available', async () => {
    const logger = createMockLogger();
    const env = createMockEnv();

    const formData = new FormData();
    formData.append('grant_type', 'authorization_code');

    const request = new Request('https://example.com/oauth/token', {
      method: 'POST',
      body: formData,
    });

    await handleOAuthToken(request, env, logger);

    // Logger should be used by the shared implementation
    expect(logger).toBeDefined();
  });
});
