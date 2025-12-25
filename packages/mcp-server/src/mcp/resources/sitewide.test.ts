/**
 * Tests for Sitewide Resource Handler
 *
 * Tests the sitewide resource handler: URI parsing, format mapping, and API proxy integration.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleSitewideResource } from './sitewide.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';

// Mock factory functions
jest.mock('./factory', () => ({
  parseResourceUri: jest.fn((uri: string) => {
    const match = uri.match(/^claudepro:\/\/sitewide\/(.+)$/);
    if (!match) throw new Error('Invalid URI');
    return [match[1]];
  }),
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
  mapFormatToApiFormat,
  createResourceResponse,
  getApiBaseUrl,
  fetchResourceFromApi,
} from './factory.js';

describe('Sitewide Resource Handler', () => {
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
    it('should parse sitewide URI correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Sitewide content',
        mimeType: 'text/plain',
      });

      await handleSitewideResource('claudepro://sitewide/llms', mockLogger);

      expect(parseResourceUri).toHaveBeenCalledWith(
        'claudepro://sitewide/llms',
        expect.any(RegExp),
        'claudepro://sitewide/{format}'
      );
    });

    it('should map format correctly', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Sitewide content',
        mimeType: 'text/plain',
      });

      await handleSitewideResource('claudepro://sitewide/llms-txt', mockLogger);

      expect(mapFormatToApiFormat).toHaveBeenCalledWith('llms-txt', expect.any(Object));
    });

    it('should build correct API URL', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Sitewide content',
        mimeType: 'text/plain',
      });

      await handleSitewideResource('claudepro://sitewide/llms', mockLogger);

      expect(fetchResourceFromApiMock).toHaveBeenCalledWith(
        'https://api.example.com/api/content/sitewide?format=llms',
        'claudepro://sitewide/llms',
        expect.objectContaining({
          format: 'llms',
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

      await expect(handleSitewideResource('invalid-uri', mockLogger)).rejects.toThrow(
        'Invalid URI'
      );
    });

    it('should throw error for missing format', async () => {
      (parseResourceUri as jest.Mock).mockReturnValue(['']);

      await expect(handleSitewideResource('claudepro://sitewide/', mockLogger)).rejects.toThrow(
        'missing required format'
      );
    });

    it('should pass KV cache to fetchResourceFromApi', async () => {
      fetchResourceFromApiMock.mockResolvedValue({
        text: 'Sitewide content',
        mimeType: 'text/plain',
      });

      await handleSitewideResource('claudepro://sitewide/llms', mockLogger, mockKvCache);

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
        text: 'Sitewide content',
        mimeType: 'text/plain',
      });

      const result = await handleSitewideResource(
        'claudepro://sitewide/llms',
        mockLogger,
        mockKvCache
      );

      expect(result.uri).toBe('claudepro://sitewide/llms');
      expect(result.text).toBe('Sitewide content');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should handle different formats', async () => {
      const formats = ['llms', 'llms-txt', 'readme', 'json'];

      for (const format of formats) {
        fetchResourceFromApiMock.mockResolvedValue({
          text: 'Sitewide content',
          mimeType: 'text/plain',
        });

        const result = await handleSitewideResource(`claudepro://sitewide/${format}`, mockLogger);

        expect(result.uri).toBe(`claudepro://sitewide/${format}`);
      }
    });
  });
});
