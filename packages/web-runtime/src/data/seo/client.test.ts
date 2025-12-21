import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getSEOMetadata, getSEOMetadataWithSchemas } from './client';
import { env } from '@heyclaude/shared-runtime/schemas/env';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock env
vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

// Mock cached-data-factory - use globalThis to avoid hoisting issues
vi.mock('../cached-data-factory', () => {
  if (!(globalThis as any).__seoMocks) {
    (globalThis as any).__seoMocks = {
      getSEOMetadataInternal: vi.fn(),
    };
  }
  
  return {
    createDataFunction: vi.fn((config: any) => {
      if (!(globalThis as any).__dataFunctionConfigs) {
        (globalThis as any).__dataFunctionConfigs = new Map();
      }
      (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
      
      if (config.operation === 'getSEOMetadata') {
        return (globalThis as any).__seoMocks.getSEOMetadataInternal;
      }
      return vi.fn().mockResolvedValue(null);
    }),
  };
});

describe('seo client data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if ((globalThis as any).__seoMocks) {
      (globalThis as any).__seoMocks.getSEOMetadataInternal.mockClear();
    }
    // Ensure env vars are set for tests (reset from any previous test that cleared them)
    vi.mocked(env).NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    vi.mocked(env).NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  describe('getSEOMetadata', () => {
    it('should return metadata without schemas', async () => {
      const mockMetadata = {
        title: 'Test Title',
        description: 'Test Description',
        keywords: ['test'],
        openGraphType: 'website' as const,
        robots: { follow: true, index: true },
        twitterCard: 'summary_large_image' as const,
      };
      (globalThis as any).__seoMocks.getSEOMetadataInternal.mockResolvedValue(mockMetadata);

      const result = await getSEOMetadata('/test-route');

      expect(result).toEqual(mockMetadata);
      expect((globalThis as any).__seoMocks.getSEOMetadataInternal).toHaveBeenCalledWith({
        includeSchemas: false,
        route: '/test-route',
      });
    });

    it('should return metadata with schemas when requested', async () => {
      const mockResult = {
        metadata: {
          title: 'Test Title',
          description: 'Test Description',
          keywords: ['test'],
          openGraphType: 'website' as const,
          robots: { follow: true, index: true },
          twitterCard: 'summary_large_image' as const,
        },
        schemas: [{ '@type': 'WebSite' }],
      };
      (globalThis as any).__seoMocks.getSEOMetadataInternal.mockResolvedValue(mockResult);

      const result = await getSEOMetadata('/test-route', { includeSchemas: true });

      expect(result).toEqual(mockResult);
      expect((globalThis as any).__seoMocks.getSEOMetadataInternal).toHaveBeenCalledWith({
        includeSchemas: true,
        route: '/test-route',
      });
    });

    it('should return null when environment variables missing', async () => {
      vi.mocked(env).NEXT_PUBLIC_SUPABASE_URL = '';
      vi.mocked(env).NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      const result = await getSEOMetadata('/test-route');

      expect(result).toBeNull();
      expect((globalThis as any).__seoMocks.getSEOMetadataInternal).not.toHaveBeenCalled();
    });
  });

  describe('getSEOMetadataWithSchemas', () => {
    it('should return metadata with schemas', async () => {
      const mockResult = {
        metadata: {
          title: 'Test Title',
          description: 'Test Description',
          keywords: ['test'],
          openGraphType: 'website' as const,
          robots: { follow: true, index: true },
          twitterCard: 'summary_large_image' as const,
        },
        schemas: [{ '@type': 'WebSite' }],
      };
      (globalThis as any).__seoMocks.getSEOMetadataInternal.mockResolvedValue(mockResult);

      const result = await getSEOMetadataWithSchemas('/test-route');

      expect(result).toEqual(mockResult);
    });

    it('should return null when result is not wrapped', async () => {
      const mockResult = {
        title: 'Test Title',
        description: 'Test Description',
      };
      (globalThis as any).__seoMocks.getSEOMetadataInternal.mockResolvedValue(mockResult);

      const result = await getSEOMetadataWithSchemas('/test-route');

      expect(result).toBeNull();
    });
  });
});

