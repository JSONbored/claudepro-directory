/**
 * Tests for OAuth Token Introspection Route (RFC 7662)
 *
 * Tests the proxy endpoint that forwards token introspection requests to Supabase Auth.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleOAuthIntrospect } from './oauth-introspect.js';
import { createMockLogger } from '../__tests__/test-utils.ts';
import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('OAuth Token Introspection Route', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: RuntimeEnv;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = {
      SUPABASE_URL: 'https://test.supabase.co',
    } as RuntimeEnv;

    fetchMock = global.fetch as jest.Mock;
  });

  describe('Unit Tests', () => {
    it('should forward introspection request to Supabase Auth', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ active: true, exp: 1234567890 }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://test.supabase.co/auth/v1/oauth/introspect',
          method: 'POST',
        }),
        expect.any(Object)
      );
      expect(response.status).toBe(200);
    });

    it('should return error for non-POST requests', async () => {
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'GET',
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_request');
      expect(body.error_description).toContain('Only POST method');
    });

    it('should return error for missing token parameter', async () => {
      const formData = new FormData();
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_request');
      expect(body.error_description).toContain('Missing required parameter: token');
    });

    it('should forward token_type_hint parameter', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ active: true }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'test-token');
      formData.append('token_type_hint', 'access_token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(fetchMock).toHaveBeenCalled();
      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.text();
      expect(fetchBody).toContain('token=test-token');
      expect(fetchBody).toContain('token_type_hint=access_token');
    });

    it('should forward response from Supabase Auth', async () => {
      const mockResponseBody = JSON.stringify({
        active: true,
        exp: 1234567890,
        scope: 'openid email',
      });
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => mockResponseBody,
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.active).toBe(true);
      expect(body.exp).toBe(1234567890);
    });

    it('should include CORS headers in response', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ active: true }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });

    it('should handle Supabase Auth errors', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ error: 'invalid_token' }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'invalid-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_token');
    });

    it('should handle fetch errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('server_error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should sanitize token input', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ active: true }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', '  test-token  ');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.text();
      expect(fetchBody).toContain('token=test-token');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full introspection flow', async () => {
      const mockResponseBody = JSON.stringify({
        active: true,
        exp: 1234567890,
        scope: 'openid email',
        client_id: 'test-client',
      });
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => mockResponseBody,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'test-access-token');
      formData.append('token_type_hint', 'access_token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.active).toBe(true);
      expect(body.scope).toBe('openid email');
    });

    it('should handle inactive token response', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ active: false }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('token', 'expired-token');
      const request = new Request('https://example.com/oauth/introspect', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthIntrospect(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.active).toBe(false);
    });
  });
});
