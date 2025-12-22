/**
 * Tests for OAuth Shared Implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  jsonError,
  handleOAuthTokenShared,
  type OAuthAdapter,
} from '../../../../packages/mcp-server/src/routes/oauth/shared.js';
import { createMockEnv, createMockLogger } from '../fixtures/test-utils.js';

describe('OAuth Shared Implementation', () => {
  describe('jsonError', () => {
    it('should create error response with default status 400', () => {
      const response = jsonError('invalid_request', 'Test error description');
      const data = response.json().then((body) => {
        expect(body.error).toBe('invalid_request');
        expect(body.error_description).toBe('Test error description');
      });

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      return data;
    });

    it('should create error response with status 500', () => {
      const response = jsonError('server_error', 'Internal server error', 500);
      expect(response.status).toBe(500);
    });

    it('should set correct CORS headers for GET requests', () => {
      const response = jsonError('invalid_request', 'Error', 400, 'GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    });
  });

  describe('handleOAuthTokenShared', () => {
    let mockAdapter: OAuthAdapter;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockLogger = createMockLogger();
      mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockAdapter = {
        parseEnv: vi.fn().mockResolvedValue({
          supabase: {
            url: 'https://supabase.example.com',
          },
        }),
        createLogger: vi.fn().mockReturnValue(mockLogger),
      };
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('https://example.com/oauth/token', { method: 'GET' });
      const env = createMockEnv();

      const response = await handleOAuthTokenShared(request, env, mockAdapter);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('Only POST method');
    });

    it('should reject unsupported grant types', async () => {
      const formData = new FormData();
      formData.append('grant_type', 'client_credentials');

      const request = new Request('https://example.com/oauth/token', {
        method: 'POST',
        body: formData,
      });
      const env = createMockEnv();

      const response = await handleOAuthTokenShared(request, env, mockAdapter);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('unsupported_grant_type');
    });

    it('should reject requests with missing parameters', async () => {
      const formData = new FormData();
      formData.append('grant_type', 'authorization_code');
      // Missing code, redirect_uri, client_id, code_verifier

      const request = new Request('https://example.com/oauth/token', {
        method: 'POST',
        body: formData,
      });
      const env = createMockEnv();

      const response = await handleOAuthTokenShared(request, env, mockAdapter);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('Missing required parameters');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should forward valid token requests to Supabase', async () => {
      const mockTokenResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockTokenResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const formData = new FormData();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', 'auth-code');
      formData.append('redirect_uri', 'https://client.example.com/callback');
      formData.append('client_id', 'client-id');
      formData.append('code_verifier', 'code-verifier');

      const request = new Request('https://example.com/oauth/token', {
        method: 'POST',
        body: formData,
      });
      const env = createMockEnv({
        SUPABASE_URL: 'https://supabase.example.com',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      });

      const response = await handleOAuthTokenShared(request, env, mockAdapter);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.access_token).toBe('test-token');
      expect(mockFetch).toHaveBeenCalled();
      // Check the fetch was called with correct URL
      if (mockFetch.mock.calls.length > 0) {
        const fetchRequest = mockFetch.mock.calls[0][0] as Request;
        expect(fetchRequest.url).toContain('/oauth/token');
      }
    });
  });
});

