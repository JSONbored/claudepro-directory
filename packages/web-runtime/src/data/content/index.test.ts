import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getContentBatchBySlugs } from './index';
import type { content_category } from '@prisma/client';

// groupItemsByCategory is not exported, so we'll test it indirectly through getContentBatchBySlugs

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock database-types to avoid schema generation issues
vi.mock('@heyclaude/database-types/postgres-types', () => ({
  GetPopularContentReturns: [],
  GetTrendingContentReturns: [],
  GetTrendingMetricsWithContentReturns: [],
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
  Prisma: {
    contentGetPayload: vi.fn(),
  },
}));

// Mock service factory
const mockContentService = {
  getEnrichedContentList: vi.fn(),
};

vi.mock('../service-factory.ts', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    if (serviceKey === 'content') {
      return mockContentService;
    }
    throw new Error(`Unknown service: ${serviceKey}`);
  }),
}));

// Mock logger
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../../logger.ts', () => ({
  logger: {
    child: vi.fn(() => mockChildLogger),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock constants
vi.mock('../config/constants.ts', () => ({
  QUERY_LIMITS: {
    content: {
      default: 30,
    },
  },
}));

// Mock normalizeError from shared-runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: vi.fn((error, message) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || String(error));
  }),
}));

describe('content/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContentBatchBySlugs', () => {
    it('should return empty map for empty input', async () => {
      const result = await getContentBatchBySlugs([]);
      expect(result.size).toBe(0);
      expect(mockContentService.getEnrichedContentList).not.toHaveBeenCalled();
    });

    it('should fetch content for single category', async () => {
      const mockItems = [
        { id: '1', slug: 'agent-1', title: 'Agent 1', category: 'agents' },
        { id: '2', slug: 'agent-2', title: 'Agent 2', category: 'agents' },
      ];

      mockContentService.getEnrichedContentList.mockResolvedValue(mockItems);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
        { category: 'agents', slug: 'agent-2' },
      ]);

      expect(mockContentService.getEnrichedContentList).toHaveBeenCalledTimes(1);
      expect(mockContentService.getEnrichedContentList).toHaveBeenCalledWith({
        p_category: 'agents',
        p_limit: 2,
        p_offset: 0,
        p_slugs: ['agent-1', 'agent-2'],
      });
      expect(result.size).toBe(2);
      expect(result.get('agent-1')).toEqual(mockItems[0]);
      expect(result.get('agent-2')).toEqual(mockItems[1]);
    });

    it('should fetch content for multiple categories in parallel', async () => {
      const mockAgents = [
        { id: '1', slug: 'agent-1', title: 'Agent 1', category: 'agents' },
      ];
      const mockMcp = [
        { id: '2', slug: 'mcp-1', title: 'MCP 1', category: 'mcp' },
      ];

      mockContentService.getEnrichedContentList
        .mockResolvedValueOnce(mockAgents)
        .mockResolvedValueOnce(mockMcp);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
        { category: 'mcp', slug: 'mcp-1' },
      ]);

      expect(mockContentService.getEnrichedContentList).toHaveBeenCalledTimes(2);
      expect(result.size).toBe(2);
      expect(result.get('agent-1')).toEqual(mockAgents[0]);
      expect(result.get('mcp-1')).toEqual(mockMcp[0]);
    });

    it('should handle items without slugs', async () => {
      const mockItems = [
        { id: '1', slug: 'agent-1', title: 'Agent 1', category: 'agents' },
        { id: '2', slug: null, title: 'Agent 2', category: 'agents' }, // No slug
        { id: '3', slug: 'agent-3', title: 'Agent 3', category: 'agents' },
      ];

      mockContentService.getEnrichedContentList.mockResolvedValue(mockItems);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
        { category: 'agents', slug: 'agent-2' },
        { category: 'agents', slug: 'agent-3' },
      ]);

      // Items without slugs should be skipped
      expect(result.size).toBe(2);
      expect(result.get('agent-1')).toBeDefined();
      expect(result.get('agent-3')).toBeDefined();
      expect(result.has('agent-2')).toBe(false);
    });

    it('should handle duplicate slugs across categories', async () => {
      const mockAgents = [
        { id: '1', slug: 'duplicate-slug', title: 'Agent', category: 'agents' },
      ];
      const mockMcp = [
        { id: '2', slug: 'duplicate-slug', title: 'MCP', category: 'mcp' },
      ];

      mockContentService.getEnrichedContentList
        .mockResolvedValueOnce(mockAgents)
        .mockResolvedValueOnce(mockMcp);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'duplicate-slug' },
        { category: 'mcp', slug: 'duplicate-slug' },
      ]);

      // NOTE: Last one wins - this is expected Map behavior
      // The Map.set() will overwrite, so the last category's item will be in the result
      // This is acceptable since slugs should be unique per category in practice
      expect(result.size).toBe(1);
      expect(result.get('duplicate-slug')).toEqual(mockMcp[0]); // Last one wins
    });

    it('should return empty map on service error', async () => {
      mockContentService.getEnrichedContentList.mockRejectedValue(
        new Error('Service error')
      );

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
      ]);

      expect(result.size).toBe(0);
      // Error should be logged
      const { logger } = await import('../../logger.ts');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle service returning empty arrays', async () => {
      mockContentService.getEnrichedContentList.mockResolvedValue([]);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
      ]);

      expect(result.size).toBe(0);
    });

    it('should handle partial failures (some categories succeed, some fail)', async () => {
      // First category succeeds, second fails
      mockContentService.getEnrichedContentList
        .mockResolvedValueOnce([
          { id: '1', slug: 'agent-1', title: 'Agent 1', category: 'agents' },
        ])
        .mockRejectedValueOnce(new Error('MCP service error'));

      // FIXED: Now uses Promise.allSettled to preserve successful results
      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
        { category: 'mcp', slug: 'mcp-1' },
      ]);

      // Should preserve successful results even if some categories fail
      expect(result.size).toBe(1);
      expect(result.get('agent-1')).toBeDefined();
      
      // Error should be logged as warning (not error, since we have partial success)
      // The logger.warn() is called directly on the logger
      const { logger } = await import('../../logger.ts');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle items with missing slug field (undefined)', async () => {
      const mockItems = [
        { id: '1', slug: 'agent-1', title: 'Agent 1', category: 'agents' },
        { id: '2', title: 'Agent 2', category: 'agents' }, // slug is undefined
      ];

      mockContentService.getEnrichedContentList.mockResolvedValue(mockItems);

      const result = await getContentBatchBySlugs([
        { category: 'agents', slug: 'agent-1' },
      ]);

      // Items without slug should be skipped
      expect(result.size).toBe(1);
      expect(result.get('agent-1')).toBeDefined();
    });

    it('should handle very large batches', async () => {
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        category: 'agents' as content_category,
        slug: `agent-${i}`,
      }));

      const mockItems = largeBatch.map((item, i) => ({
        id: String(i),
        slug: item.slug,
        title: `Agent ${i}`,
        category: 'agents',
      }));

      mockContentService.getEnrichedContentList.mockResolvedValue(mockItems);

      const result = await getContentBatchBySlugs(largeBatch);

      expect(result.size).toBe(100);
      expect(mockContentService.getEnrichedContentList).toHaveBeenCalledWith({
        p_category: 'agents',
        p_limit: 100,
        p_offset: 0,
        p_slugs: largeBatch.map((item) => item.slug),
      });
    });
  });
});
