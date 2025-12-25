/**
 * Tests for Content Resource Handler
 *
 * Tests the content resource handler: URI parsing, format mapping, API proxy integration,
 * and KV cache integration.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleContentResource } from './content.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';

// Mock factory functions
jest.mock('./factory', () => ({
  parseResourceUri: jest.fn((uri: string) => {
    const match = uri.match(/^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) throw new Error('Invalid URI');
    return [match[1], match[2], match[3]];
  }),
  validateContentCategory: jest.fn((category: string) => category),
  mapFormatToApiFormat: jest.fn((format: string) => format),
  createResourceResponse: jest.fn((uri: string, text: string, mimeType: string) => ({
    uri,
    text,
    mimeType,
  })),
  getApiBaseUrl: jest.fn(() => 'https://api.example.com'),
  fetchResourceFromApi: jest.fn(),
}));

import {
  parseResourceUri,
  validateContentCategory,
  mapFormatToApiFormat,
  createResourceResponse,
  getApiBaseUrl,
  fetchResourceFromApi,
} from './factory.js';

describe('Content Resource Handler', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockKvCache: KvResourceCache;
  let fetchResourceFromApiMock: jest.MockedFunction<typeof fetchResourceFromApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockKvCache = {
      isAvailable: jest.fn().mockReturnValue(false),
      get: jest.fn(),
      set: jest.fn(),
      getMetadata: jest.fn(),
      delete: jest.fn(),
    } as any;

    fetchResourceFromApiMock = fetchResourceFromApi as jest.MockedFunction<
      typeof fetchResourceFromApi
    >;
  });

  describe('Unit Tests', () => {
    it('should parse content URI correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource('claudepro://content/agents/test-slug/llms', mockLogger);

      expect(parseResourceUri).toHaveBeenCalledWith(
        'claudepro://content/agents/test-slug/llms',
        expect.any(RegExp),
        'claudepro://content/{category}/{slug}/{format}'
      );
    });

    it('should validate category', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource('claudepro://content/agents/test-slug/llms', mockLogger);

      expect(validateContentCategory).toHaveBeenCalledWith('agents');
    });

    it('should map format correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource('claudepro://content/agents/test-slug/llms-txt', mockLogger);

      expect(mapFormatToApiFormat).toHaveBeenCalled();
    });

    it('should build correct API URL for standard formats', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource('claudepro://content/agents/test-slug/llms', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/content/agents/test-slug?format=llms',
        'claudepro://content/agents/test-slug/llms',
        expect.objectContaining({
          category: 'agents',
          slug: 'test-slug',
          format: 'llms',
        }),
        mockLogger,
        30000,
        undefined,
        undefined,
        undefined
      );
    });

    it('should build correct API URL for storage format', async () => {
      (mapFormatToApiFormat as jest.Mock).mockReturnValue('storage-metadata');
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'application/json',
      });

      await handleContentResource('claudepro://content/agents/test-slug/storage', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/content/agents/test-slug?format=storage&metadata=true',
        'claudepro://content/agents/test-slug/storage',
        expect.any(Object),
        mockLogger,
        30000,
        undefined,
        undefined,
        undefined
      );
    });

    it('should throw error for invalid URI', async () => {
      (parseResourceUri as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid URI');
      });

      await expect(handleContentResource('invalid-uri', mockLogger)).rejects.toThrow('Invalid URI');
    });

    it('should throw error for missing URI parts', async () => {
      (parseResourceUri as jest.Mock).mockReturnValue(['agents', '', '']);

      await expect(
        handleContentResource('claudepro://content/agents//llms', mockLogger)
      ).rejects.toThrow('missing required parts');
    });

    it('should pass KV cache to fetchResourceFromApi', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource(
        'claudepro://content/agents/test-slug/llms',
        mockLogger,
        mockKvCache
      );

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        mockLogger,
        30000,
        undefined,
        mockKvCache,
        undefined
      );
    });

    it('should pass request headers to fetchResourceFromApi', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      const requestHeaders = new Headers({
        'If-None-Match': '"abc123"',
      });

      await handleContentResource(
        'claudepro://content/agents/test-slug/llms',
        mockLogger,
        mockKvCache,
        requestHeaders
      );

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        mockLogger,
        30000,
        undefined,
        mockKvCache,
        requestHeaders
      );
    });

    it('should include cache metadata in response', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
        etag: '"abc123"',
        cachedAt: '2024-01-01T00:00:00Z',
        cacheHeaders: { 'Cache-Control': 'public, max-age=3600' },
        fromCache: true,
      });

      const result = await handleContentResource(
        'claudepro://content/agents/test-slug/llms',
        mockLogger
      );

      expect(result.etag).toBe('"abc123"');
      expect(result.cachedAt).toBe('2024-01-01T00:00:00Z');
      expect(result.cacheHeaders).toBeDefined();
      expect(result.fromCache).toBe(true);
    });

    it('should create resource response correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      await handleContentResource('claudepro://content/agents/test-slug/llms', mockLogger);

      expect(createResourceResponse).toHaveBeenCalledWith(
        'claudepro://content/agents/test-slug/llms',
        'Content text',
        'text/plain'
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle full resource request flow', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Content text',
        mimeType: 'text/plain',
      });

      const result = await handleContentResource(
        'claudepro://content/agents/test-slug/llms',
        mockLogger,
        mockKvCache
      );

      expect(result.uri).toBe('claudepro://content/agents/test-slug/llms');
      expect(result.text).toBe('Content text');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should handle different formats', async () => {
      const formats = ['llms', 'llms-txt', 'markdown', 'md', 'json', 'storage'];

      for (const format of formats) {
        fetchResourceFromApiMock.mockResolvedValue({
          text: 'Content text',
          mimeType: 'text/plain',
        });

        const result = await handleContentResource(
          `claudepro://content/agents/test-slug/${format}`,
          mockLogger
        );

        expect(result.uri).toBe(`claudepro://content/agents/test-slug/${format}`);
      }
    });

    it('should handle different categories', async () => {
      const categories = ['agents', 'mcp', 'rules'];

      for (const category of categories) {
        fetchResourceFromApiMock.mockResolvedValue({
          text: 'Content text',
          mimeType: 'text/plain',
        });

        const result = await handleContentResource(
          `claudepro://content/${category}/test-slug/llms`,
          mockLogger
        );

        expect(result.uri).toBe(`claudepro://content/${category}/test-slug/llms`);
      }
    });
  });
});
