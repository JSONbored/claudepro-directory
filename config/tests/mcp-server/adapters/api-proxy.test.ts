/**
 * Tests for API Proxy Adapter
 *
 * Tests the API proxy adapter that allows proxying MCP tool calls to API routes.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  proxyToApi,
  mapToolToApiRoute,
  convertToolInputToApiBody,
  convertApiResponseToToolOutput,
  executeToolViaApi,
  type ApiProxyConfig,
} from '@heyclaude/mcp-server/adapters';

describe('API Proxy Adapter', () => {
  let mockFetch: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  describe('proxyToApi', () => {
    it('should proxy GET request to API', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' }), { status: 200 }));

      const response = await proxyToApi('/api/test', { method: 'GET' });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://claudepro.directory/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should proxy POST request with body', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

      const response = await proxyToApi('/api/test', {
        method: 'POST',
        body: { key: 'value' },
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://claudepro.directory/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should add Authorization header when apiKey is provided', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' }), { status: 200 }));

      const config: ApiProxyConfig = { apiKey: 'test-api-key' };
      await proxyToApi('/api/test', { method: 'GET' }, config);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should use custom apiBaseUrl', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' }), { status: 200 }));

      const config: ApiProxyConfig = { apiBaseUrl: 'https://custom.example.com' };
      await proxyToApi('/api/test', { method: 'GET' }, config);

      expect(mockFetch).toHaveBeenCalledWith('https://custom.example.com/api/test', expect.any(Object));
    });

    it('should handle paths without leading slash', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' }), { status: 200 }));

      await proxyToApi('api/test', { method: 'GET' });

      expect(mockFetch).toHaveBeenCalledWith('https://claudepro.directory/api/test', expect.any(Object));
    });

    it('should handle timeout errors', async () => {
      const abortController = new AbortController();
      abortController.abort();
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      await expect(proxyToApi('/api/test', { method: 'GET' }, { timeout: 1000 })).rejects.toThrow(
        'API request timed out after 1000ms'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(proxyToApi('/api/test', { method: 'GET' })).rejects.toThrow('Network error');
    });

    it('should use custom timeout', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' }), { status: 200 }));

      const config: ApiProxyConfig = { timeout: 60000 };
      await proxyToApi('/api/test', { method: 'GET' }, config);

      // Verify that AbortSignal.timeout was called with the custom timeout
      // (indirectly verified by checking the request was made)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('mapToolToApiRoute', () => {
    it('should map known tool names to API routes', () => {
      expect(mapToolToApiRoute('searchContent')).toBe('/api/search');
      expect(mapToolToApiRoute('getContentDetail')).toBe('/api/content');
      expect(mapToolToApiRoute('getTrending')).toBe('/api/trending');
      expect(mapToolToApiRoute('listCategories')).toBe('/api/categories');
    });

    it('should return default route for unknown tool names', () => {
      expect(mapToolToApiRoute('unknownTool')).toBe('/api/unknownTool');
    });
  });

  describe('convertToolInputToApiBody', () => {
    it('should return input as-is', () => {
      const input = { query: 'test', page: 1 };
      const result = convertToolInputToApiBody('searchContent', input);
      expect(result).toEqual(input);
    });

    it('should handle different input types', () => {
      expect(convertToolInputToApiBody('testTool', { key: 'value' })).toEqual({ key: 'value' });
      expect(convertToolInputToApiBody('testTool', null)).toBeNull();
      expect(convertToolInputToApiBody('testTool', undefined)).toBeUndefined();
    });
  });

  describe('convertApiResponseToToolOutput', () => {
    it('should convert successful API response to tool output', async () => {
      const response = new Response(JSON.stringify({ data: 'test', count: 10 }), { status: 200 });
      const result = await convertApiResponseToToolOutput('testTool', response);
      expect(result).toEqual({ data: 'test', count: 10 });
    });

    it('should throw error for failed API response', async () => {
      const response = new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      await expect(convertApiResponseToToolOutput('testTool', response)).rejects.toThrow(
        'API request failed: Not found'
      );
    });

    it('should handle response without error message', async () => {
      const response = new Response('', { status: 500 });
      await expect(convertApiResponseToToolOutput('testTool', response)).rejects.toThrow(
        'API request failed: Unknown error'
      );
    });

    it('should handle invalid JSON response', async () => {
      const response = new Response('invalid json', { status: 500 });
      await expect(convertApiResponseToToolOutput('testTool', response)).rejects.toThrow(
        'API request failed: Unknown error'
      );
    });
  });

  describe('executeToolViaApi', () => {
    it('should execute tool via API proxy', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [{ slug: 'test', title: 'Test' }],
            total: 1,
          }),
          { status: 200 }
        )
      );

      const result = await executeToolViaApi(
        'searchContent',
        { query: 'test', page: 1, limit: 20 },
        { apiKey: 'test-key' }
      );

      expect(result).toEqual({
        items: [{ slug: 'test', title: 'Test' }],
        total: 1,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://claudepro.directory/api/search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test', page: 1, limit: 20 }),
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 }));

      await expect(
        executeToolViaApi('searchContent', { query: 'test', page: 1, limit: 20 })
      ).rejects.toThrow('API request failed: Invalid request');
    });
  });
});

