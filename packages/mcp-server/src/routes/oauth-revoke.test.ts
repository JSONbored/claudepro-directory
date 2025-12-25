/**
 * Tests for OAuth Token Revocation Route (RFC 7009)
 *
 * Tests the proxy endpoint that forwards token revocation requests to Supabase Auth.
 * Per RFC 7009, always returns 200 even if token doesn't exist.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleOAuthRevoke } from './oauth-revoke.js';
import { createMockLogger } from '../__tests__/test-utils.ts';
import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('OAuth Token Revocation Route', () => {
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
    it('should forward revocation request to Supabase Auth', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://test.supabase.co/auth/v1/oauth/revoke',
          method: 'POST',
        }),
        expect.any(Object)
      );
      // RFC 7009: Always returns 200
      expect(response.status).toBe(200);
    });

    it('should return 200 for non-POST requests (RFC 7009)', async () => {
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'GET',
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200, even for invalid requests
      expect(response.status).toBe(200);
    });

    it('should return 200 even if token is missing (RFC 7009)', async () => {
      const formData = new FormData();
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200, even for invalid requests
      expect(response.status).toBe(200);
    });

    it('should forward token_type_hint parameter', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-token');
      formData.append('token_type_hint', 'refresh_token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      expect(fetchMock).toHaveBeenCalled();
      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.text();
      expect(fetchBody).toContain('token=test-token');
      expect(fetchBody).toContain('token_type_hint=refresh_token');
    });

    it('should forward client_id parameter if provided', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-token');
      formData.append('client_id', 'test-client');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.text();
      expect(fetchBody).toContain('token=test-token');
      expect(fetchBody).toContain('client_id=test-client');
    });

    it('should always return 200 even if Supabase returns error (RFC 7009)', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'invalid-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200, even if revocation fails
      expect(response.status).toBe(200);
    });

    it('should include CORS headers in response', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });

    it('should return empty body (RFC 7009)', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      const body = await response.text();
      expect(body).toBe('');
    });

    it('should handle fetch errors and still return 200 (RFC 7009)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const formData = new FormData();
      formData.append('token', 'test-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200, even on error
      expect(response.status).toBe(200);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should sanitize token input', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', '  test-token  ');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.text();
      expect(fetchBody).toContain('token=test-token');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full revocation flow (RFC 7009 compliance)', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'test-access-token');
      formData.append('token_type_hint', 'access_token');
      formData.append('client_id', 'test-client');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const body = await response.text();
      expect(body).toBe('');
    });

    it('should prevent token enumeration (RFC 7009)', async () => {
      // Even if token doesn't exist, return 200
      fetchMock.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
      });

      const formData = new FormData();
      formData.append('token', 'non-existent-token');
      const request = new Request('https://example.com/oauth/revoke', {
        method: 'POST',
        body: formData,
      });

      const response = await handleOAuthRevoke(request, mockEnv, mockLogger as RuntimeLogger);

      // RFC 7009: Always returns 200 to prevent token enumeration
      expect(response.status).toBe(200);
    });
  });
});
