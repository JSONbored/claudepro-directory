/**
 * Tests for Category Resource Handler
 *
 * Tests the category resource handler: URI parsing, format mapping, and API proxy integration.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleCategoryResource } from './category.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';

// Mock factory functions
jest.mock('./factory', () => ({
  parseResourceUri: jest.fn((uri: string) => {
    const match = uri.match(/^claudepro:\/\/category\/([^/]+)\/(.+)$/);
    if (!match) throw new Error('Invalid URI');
    return [match[1], match[2]];
  }),
  validateContentCategory: jest.fn((category: string) => category),
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
  createResourceResponse,
  getApiBaseUrl,
  fetchResourceFromApi,
} from './factory.js';

describe('Category Resource Handler', () => {
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
    it('should parse category URI correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Category content',
        mimeType: 'text/plain',
      });

      await handleCategoryResource('claudepro://category/agents/llms-category', mockLogger);

      expect(parseResourceUri).toHaveBeenCalledWith(
        'claudepro://category/agents/llms-category',
        expect.any(RegExp),
        'claudepro://category/{category}/{format}'
      );
    });

    it('should validate category', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Category content',
        mimeType: 'text/plain',
      });

      await handleCategoryResource('claudepro://category/agents/llms-category', mockLogger);

      expect(validateContentCategory).toHaveBeenCalledWith('agents');
    });

    it('should build correct API URL for llms-category format', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Category content',
        mimeType: 'text/plain',
      });

      await handleCategoryResource('claudepro://category/agents/llms-category', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/content/agents?format=llms-category',
        'claudepro://category/agents/llms-category',
        expect.objectContaining({
          category: 'agents',
          format: 'llms-category',
        }),
        mockLogger,
        30000,
        undefined,
        undefined,
        undefined
      );
    });

    it('should build correct API URL for RSS format', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'RSS feed',
        mimeType: 'application/rss+xml',
      });

      await handleCategoryResource('claudepro://category/agents/rss', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/feeds?type=rss&category=agents',
        'claudepro://category/agents/rss',
        expect.objectContaining({
          category: 'agents',
          format: 'rss',
        }),
        mockLogger,
        30000,
        undefined,
        undefined,
        undefined
      );
    });

    it('should build correct API URL for Atom format', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Atom feed',
        mimeType: 'application/atom+xml',
      });

      await handleCategoryResource('claudepro://category/agents/atom', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/feeds?type=atom&category=agents',
        'claudepro://category/agents/atom',
        expect.objectContaining({
          category: 'agents',
          format: 'atom',
        }),
        mockLogger,
        30000,
        undefined,
        undefined,
        undefined
      );
    });

    it('should build correct API URL for JSON format', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'JSON content',
        mimeType: 'application/json',
      });

      await handleCategoryResource('claudepro://category/agents/json', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/content/agents?format=json',
        'claudepro://category/agents/json',
        expect.objectContaining({
          category: 'agents',
          format: 'json',
        }),
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

      await expect(handleCategoryResource('invalid-uri', mockLogger)).rejects.toThrow(
        'Invalid URI'
      );
    });

    it('should throw error for missing URI parts', async () => {
      (parseResourceUri as jest.Mock).mockReturnValue(['agents', '']);

      await expect(
        handleCategoryResource('claudepro://category/agents/', mockLogger)
      ).rejects.toThrow('missing required parts');
    });

    it('should pass KV cache to fetchResourceFromApi', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Category content',
        mimeType: 'text/plain',
      });

      await handleCategoryResource(
        'claudepro://category/agents/llms-category',
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
  });

  describe('Integration Tests', () => {
    it('should handle full resource request flow', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Category content',
        mimeType: 'text/plain',
      });

      const result = await handleCategoryResource(
        'claudepro://category/agents/llms-category',
        mockLogger,
        mockKvCache
      );

      expect(result.uri).toBe('claudepro://category/agents/llms-category');
      expect(result.text).toBe('Category content');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should handle different formats', async () => {
      const formats = ['llms-category', 'rss', 'atom', 'json'];

      for (const format of formats) {
        fetchResourceFromApiMock.mockResolvedValue({
          text: 'Category content',
          mimeType: 'text/plain',
        });

        const result = await handleCategoryResource(
          `claudepro://category/agents/${format}`,
          mockLogger
        );

        expect(result.uri).toBe(`claudepro://category/agents/${format}`);
      }
    });
  });
});
