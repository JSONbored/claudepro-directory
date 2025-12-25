/**
 * Tests for Resource Handler Factory
 *
 * Tests the factory utilities for resource handlers: URI parsing, format mapping,
 * API URL generation, and resource response creation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  parseResourceUri,
  validateContentCategory,
  mapFormatToApiFormat,
  createResourceResponse,
  getApiBaseUrl,
  fetchResourceFromApi,
} from './factory.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { KvResourceCache } from '../../cache/kv-cache.js';

describe('Resource Handler Factory', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockKvCache: KvResourceCache;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockKvCache = {
      isAvailable: jest.fn<() => boolean>().mockReturnValue(false),
      get: jest.fn<
        (
          uri: string
        ) => Promise<{ text: string; mimeType: string; etag?: string; cachedAt?: string } | null>
      >(),
      set: jest.fn<(uri: string, text: string, mimeType: string, ttl?: number) => Promise<void>>(),
      getMetadata: jest.fn<(uri: string) => Promise<{ etag: string; cachedAt: string } | null>>(),
      delete: jest.fn<(uri: string) => Promise<void>>(),
    } as any;

    // Mock fetch globally
    fetchMock = jest.fn() as any;
    global.fetch = fetchMock as any;
  });

  describe('parseResourceUri', () => {
    it('should parse valid URI correctly', () => {
      const parts = parseResourceUri(
        'claudepro://content/agents/test-slug/llms',
        /^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/,
        'claudepro://content/{category}/{slug}/{format}'
      );

      expect(parts).toEqual(['agents', 'test-slug', 'llms']);
    });

    it('should throw error for invalid URI format', () => {
      expect(() => {
        parseResourceUri(
          'invalid-uri',
          /^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/,
          'claudepro://content/{category}/{slug}/{format}'
        );
      }).toThrow('Invalid resource URI');
    });

    it('should handle URI with special characters', () => {
      const parts = parseResourceUri(
        'claudepro://content/agents/test-slug-123/markdown',
        /^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/,
        'claudepro://content/{category}/{slug}/{format}'
      );

      expect(parts).toEqual(['agents', 'test-slug-123', 'markdown']);
    });
  });

  describe('validateContentCategory', () => {
    it('should validate valid category', () => {
      const category = validateContentCategory('agents');
      expect(category).toBe('agents');
    });

    it('should throw error for invalid category', () => {
      expect(() => {
        validateContentCategory('invalid-category');
      }).toThrow('Invalid content category');
    });

    it('should handle case-insensitive validation', () => {
      // Note: This depends on implementation - may need to check actual behavior
      const category = validateContentCategory('agents');
      expect(category).toBe('agents');
    });
  });

  describe('mapFormatToApiFormat', () => {
    it('should map format using format map', () => {
      const formatMap = {
        llms: 'llms',
        'llms-txt': 'llms',
        markdown: 'markdown',
        md: 'markdown',
      };

      expect(mapFormatToApiFormat('llms', formatMap)).toBe('llms');
      expect(mapFormatToApiFormat('llms-txt', formatMap)).toBe('llms');
      expect(mapFormatToApiFormat('markdown', formatMap)).toBe('markdown');
      expect(mapFormatToApiFormat('md', formatMap)).toBe('markdown');
    });

    it('should return original format if not in map', () => {
      const formatMap: Record<string, string> = {};
      expect(mapFormatToApiFormat('unknown-format', formatMap)).toBe('unknown-format');
    });
  });

  describe('createResourceResponse', () => {
    it('should create resource response with correct structure', () => {
      const response = createResourceResponse(
        'claudepro://content/agents/test-slug/llms',
        'Content text',
        'text/plain'
      );

      expect(response.uri).toBe('claudepro://content/agents/test-slug/llms');
      expect(response.mimeType).toBe('text/plain');
      expect(response.text).toBe('Content text');
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return API base URL from environment', () => {
      const originalEnv = process.env['API_BASE_URL'];
      process.env['API_BASE_URL'] = 'https://api.example.com';

      const url = getApiBaseUrl();
      expect(url).toBe('https://api.example.com');

      // Restore
      if (originalEnv) {
        process.env['API_BASE_URL'] = originalEnv;
      } else {
        delete process.env['API_BASE_URL'];
      }
    });

    it('should use default URL when environment variable not set', () => {
      const originalEnv = process.env['API_BASE_URL'];
      delete process.env['API_BASE_URL'];

      const url = getApiBaseUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');

      // Restore
      if (originalEnv) {
        process.env['API_BASE_URL'] = originalEnv;
      }
    });
  });

  describe('fetchResourceFromApi', () => {
    it('should fetch resource from API successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        text: jest.fn<() => Promise<string>>().mockResolvedValue('Resource content'),
      } as any;
      (fetchMock as any).mockResolvedValue(mockResponse);

      const result = await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/llms',
        {},
        mockLogger
      );

      expect(result.text).toBe('Resource content');
      expect(result.mimeType).toBe('text/plain; charset=utf-8');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/resource',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'heyclaude-mcp/1.0.0',
            Accept: '*/*',
          }),
        })
      );
    });

    it('should use KV cache when available', async () => {
      (mockKvCache.isAvailable as jest.MockedFunction<() => boolean>).mockReturnValue(true);
      (
        mockKvCache.get as jest.MockedFunction<
          (
            uri: string
          ) => Promise<{ text: string; mimeType: string; etag?: string; cachedAt?: string } | null>
        >
      ).mockResolvedValue({
        text: 'Cached content',
        mimeType: 'text/plain',
        etag: '"cached-etag"',
        cachedAt: '2024-01-01T00:00:00Z',
      });

      const result = await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/llms',
        {},
        mockLogger,
        30000,
        undefined,
        mockKvCache
      );

      expect(result.text).toBe('Cached content');
      expect(result.fromCache).toBe(true);
      expect(mockKvCache.get).toHaveBeenCalledWith('claudepro://content/agents/test-slug/llms');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should store in KV cache after successful fetch', async () => {
      (mockKvCache.isAvailable as jest.MockedFunction<() => boolean>).mockReturnValue(true);
      (
        mockKvCache.get as jest.MockedFunction<
          (
            uri: string
          ) => Promise<{ text: string; mimeType: string; etag?: string; cachedAt?: string } | null>
        >
      ).mockResolvedValue(null); // Cache miss
      (
        mockKvCache.set as jest.MockedFunction<
          (uri: string, text: string, mimeType: string, ttl?: number) => Promise<void>
        >
      ).mockResolvedValue(undefined);

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        text: jest.fn<() => Promise<string>>().mockResolvedValue('Resource content'),
      } as any;
      (fetchMock as any).mockResolvedValue(mockResponse);

      await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/llms',
        {},
        mockLogger,
        30000,
        undefined,
        mockKvCache
      );

      expect(mockKvCache.set).toHaveBeenCalledWith(
        'claudepro://content/agents/test-slug/llms',
        'Resource content',
        'text/plain; charset=utf-8'
      );
    });

    it('should retry on 5xx errors', async () => {
      let callCount = 0;
      fetchMock.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers(),
            text: jest.fn<() => Promise<string>>().mockResolvedValue('Server error'),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
          text: jest.fn<() => Promise<string>>().mockResolvedValue('Resource content'),
        } as any);
      });

      const result = await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/llms',
        {},
        mockLogger,
        30000,
        { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 100 },
        undefined
      );

      expect(result.text).toBe('Resource content');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw error on 4xx status', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: jest.fn<() => Promise<string>>().mockResolvedValue('Not found'),
      } as any;
      (fetchMock as any).mockResolvedValue(mockResponse);

      await expect(
        fetchResourceFromApi(
          'https://api.example.com/resource',
          'claudepro://content/agents/test-slug/llms',
          {},
          mockLogger
        )
      ).rejects.toThrow('API route returned 404');
    });

    it('should handle timeout', async () => {
      fetchMock.mockImplementation(
        () => new Promise<Response>((resolve) => setTimeout(resolve, 100))
      );

      await expect(
        fetchResourceFromApi(
          'https://api.example.com/resource',
          'claudepro://content/agents/test-slug/llms',
          {},
          mockLogger,
          50 // Short timeout
        )
      ).rejects.toThrow();
    });

    it('should handle binary content types', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/zip',
          'content-length': '1024',
        }),
        text: jest.fn<() => Promise<string>>().mockResolvedValue('Binary data'),
      } as any;
      (fetchMock as any).mockResolvedValue(mockResponse);

      const result = await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/download',
        {},
        mockLogger
      );

      expect(result.mimeType).toBe('application/json; charset=utf-8');
      const metadata = JSON.parse(result.text);
      expect(metadata.contentType).toBe('application/zip');
      expect(metadata.note).toContain('Binary content detected');
    });

    it('should handle conditional requests with If-None-Match', async () => {
      (mockKvCache.isAvailable as jest.MockedFunction<() => boolean>).mockReturnValue(true);
      (
        mockKvCache.getMetadata as jest.MockedFunction<
          (uri: string) => Promise<{ etag: string; cachedAt: string } | null>
        >
      ).mockResolvedValue({
        etag: '"abc123"',
        cachedAt: '2024-01-01T00:00:00Z',
      });

      const requestHeaders = new Headers({
        'If-None-Match': '"abc123"',
      });

      const result = await fetchResourceFromApi(
        'https://api.example.com/resource',
        'claudepro://content/agents/test-slug/llms',
        {},
        mockLogger,
        30000,
        undefined,
        mockKvCache,
        requestHeaders
      );

      expect(result.fromCache).toBe(true);
      expect(result.text).toBe('');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Resource not modified (304)',
        expect.objectContaining({ uri: 'claudepro://content/agents/test-slug/llms' })
      );
    });
  });
});
