import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { ContentService } from './content.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('ContentService', () => {
  let contentService: ContentService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    contentService = new ContentService();
  });

  describe('getSitewideReadme', () => {
    it('should return README data on success', async () => {
      const mockData = {
        readme_content: '# Test README',
        last_updated: '2024-01-01',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideReadme();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_readme_data')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Database error');
    });

    it('should handle null data gracefully', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await contentService.getSitewideReadme();
      expect(result).toBeUndefined();
    });
  });

  describe('getSitewideLlmsTxt', () => {
    it('should return llms.txt data on success', async () => {
      const mockData = {
        content: '# LLMs.txt content',
        categories: ['agents', 'skills'],
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideLlmsTxt();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitewide_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on RPC failure', async () => {
      const mockError = new Error('RPC timeout');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideLlmsTxt()).rejects.toThrow('RPC timeout');
    });
  });

  describe('getChangelogLlmsTxt', () => {
    it('should return changelog llms.txt data', async () => {
      const mockData = {
        content: '# Changelog',
        entries: [],
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getChangelogLlmsTxt();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty changelog data', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(
        [{ content: '', entries: [] }] as any
      );

      const result = await contentService.getChangelogLlmsTxt();
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('entries');
    });
  });

  describe('error handling', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = new Error('Test error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow();
      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'generate_readme_data',
        operation: 'ContentService.getSitewideReadme',
        args: {},
      });
    });

    it('should propagate database connection errors', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(new Error('Connection refused'));

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Connection refused');
    });
  });
});