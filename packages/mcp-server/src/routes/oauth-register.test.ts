/**
 * Tests for OAuth Dynamic Client Registration Route (RFC 7591)
 *
 * Tests the proxy endpoint that forwards client registration requests to Supabase Auth.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleOAuthRegister } from './oauth-register.js';
import { createMockLogger } from '../__tests__/test-utils.ts';
import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('OAuth Dynamic Client Registration Route', () => {
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
    it('should forward registration request to Supabase Auth', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () =>
          JSON.stringify({
            client_id: 'new-client-id',
            client_secret: 'new-client-secret',
          }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://test.supabase.co/auth/v1/oauth/register',
          method: 'POST',
        }),
        expect.any(Object)
      );
      expect(response.status).toBe(201);
    });

    it('should return error for non-POST requests', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'GET',
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_request');
      expect(body.error_description).toContain('Only POST method');
    });

    it('should return error for missing redirect_uris', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
      expect(body.error_description).toContain('redirect_uris');
    });

    it('should return error for empty redirect_uris array', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uris: [] }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
    });

    it('should validate redirect_uri format', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['not-a-valid-url'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
      expect(body.error_description).toContain('Invalid redirect_uri format');
    });

    it('should validate redirect_uri protocol', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['file:///invalid'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
      expect(body.error_description).toContain('protocol');
    });

    it('should validate all redirect_uris in array', async () => {
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://valid.com/callback', 'invalid-url'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
    });

    it('should forward complete registration data to Supabase', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () =>
          JSON.stringify({
            client_id: 'new-client-id',
            client_secret: 'new-client-secret',
          }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const registrationData = {
        redirect_uris: ['https://example.com/callback'],
        client_name: 'Test Client',
        scope: 'openid email',
      };
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.json();
      expect(fetchBody.redirect_uris).toEqual(['https://example.com/callback']);
      expect(fetchBody.client_name).toBe('Test Client');
      expect(fetchBody.scope).toBe('openid email');
    });

    it('should forward response from Supabase Auth', async () => {
      const mockResponseBody = JSON.stringify({
        client_id: 'new-client-id',
        client_secret: 'new-client-secret',
        client_id_issued_at: 1234567890,
        client_secret_expires_at: 0,
      });
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () => mockResponseBody,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.client_id).toBe('new-client-id');
      expect(body.client_secret).toBe('new-client-secret');
    });

    it('should include CORS headers in response', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () => JSON.stringify({ client_id: 'test' }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });

    it('should handle Supabase Auth errors', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ error: 'invalid_client_metadata' }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('invalid_client_metadata');
    });

    it('should handle fetch errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('server_error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full client registration flow', async () => {
      const mockResponseBody = JSON.stringify({
        client_id: 'new-client-id',
        client_secret: 'new-client-secret',
        client_id_issued_at: 1234567890,
        client_secret_expires_at: 0,
        redirect_uris: ['https://example.com/callback'],
      });
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () => mockResponseBody,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const registrationData = {
        redirect_uris: ['https://example.com/callback'],
        client_name: 'Test Client',
        scope: 'openid email',
      };
      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.client_id).toBe('new-client-id');
      expect(body.client_secret).toBe('new-client-secret');
      expect(body.redirect_uris).toEqual(['https://example.com/callback']);
    });

    it('should handle multiple redirect URIs', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        text: async () => JSON.stringify({ client_id: 'test' }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const request = new Request('https://example.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback', 'https://example.com/callback2'],
        }),
      });

      const response = await handleOAuthRegister(request, mockEnv, mockLogger as RuntimeLogger);

      expect(response.status).toBe(201);
      const fetchCall = fetchMock.mock.calls[0][0] as Request;
      const fetchBody = await fetchCall.json();
      expect(fetchBody.redirect_uris.length).toBe(2);
    });
  });
});
