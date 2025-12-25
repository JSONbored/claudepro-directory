import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getContentTemplates, type MergedTemplateItem } from './templates';
import type { content_category } from '@prisma/client';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock logger - use real implementation
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation
// Don't mock serializeForClient - use real implementation

// Helper function to create content_templates data for seeding
// Matches the pattern from data layer tests
// Note: display_order is required for orderBy clause in service method, even though it's not selected
function createTemplateData(overrides: {
  id: string;
  category: content_category;
  name: string;
  description: string;
  template_data?: Record<string, unknown> | null;
  display_order?: number;
  active?: boolean;
}): any {
  return {
    id: overrides.id,
    category: overrides.category,
    name: overrides.name,
    description: overrides.description,
    template_data: overrides.template_data ?? null,
    display_order: overrides.display_order ?? 0,
    active: overrides.active ?? true,
    // Note: created_at and updated_at are not needed for the query (not in select clause)
    // But Prismocker may need them for proper model representation
  };
}

describe('templates data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getContentTemplates', () => {
    it('should return content templates for category', async () => {
      // getContentTemplates uses createDataFunction which calls service.getContentTemplates
      // service.getContentTemplates uses direct Prisma calls (content_templates.findMany)
      // Seed content_templates table using Prismocker
      const mockTemplates = [
        createTemplateData({
          id: 'template-1',
          category: 'agents',
          name: 'Test Template 1',
          description: 'Test description 1',
          template_data: { category: 'agents', tags: 'test,example' },
          display_order: 1,
          active: true,
        }),
        createTemplateData({
          id: 'template-2',
          category: 'agents',
          name: 'Test Template 2',
          description: 'Test description 2',
          template_data: { category: 'agents', tags: 'another' },
          display_order: 2,
          active: true,
        }),
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const result = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'template-1');
      expect(result[0]).toHaveProperty('name', 'Test Template 1');
      expect(result[0]).toHaveProperty('templateData');
      expect(result[0]).toHaveProperty('category', 'agents');
      expect(result[0]).toHaveProperty('tags', 'test,example');
    });

    it('should return empty array when no templates found', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', []);
      }

      const result = await getContentTemplates('agents');

      expect(result).toEqual([]);
    });

    it('should filter by category correctly', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-agents-1',
          category: 'agents',
          name: 'Agents Template',
          description: 'Agents description',
          template_data: { category: 'agents' },
          display_order: 1,
          active: true,
        }),
        createTemplateData({
          id: 'template-mcp-1',
          category: 'mcp',
          name: 'MCP Template',
          description: 'MCP description',
          template_data: { category: 'mcp' },
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const agentsResult = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(agentsResult).toHaveLength(1);
      expect(agentsResult[0]).toHaveProperty('id', 'template-agents-1');

      const mcpResult = (await getContentTemplates('mcp')) as MergedTemplateItem[];
      expect(mcpResult).toHaveLength(1);
      expect(mcpResult[0]).toHaveProperty('id', 'template-mcp-1');
    });

    it('should merge template_data into result object', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-1',
          category: 'agents',
          name: 'Test Template',
          description: 'Test description',
          template_data: {
            category: 'agents',
            tags: 'test,example',
            customField: 'customValue',
          },
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const result = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('templateData');
      expect(result[0]).toHaveProperty('category', 'agents');
      expect(result[0]).toHaveProperty('tags', 'test,example');
      expect(result[0]).toHaveProperty('customField', 'customValue');
    });

    it('should handle null template_data', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-1',
          category: 'agents',
          name: 'Test Template',
          description: 'Test description',
          template_data: null,
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const result = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('templateData', null);
      expect(result[0]).toHaveProperty('id', 'template-1');
      expect(result[0]).toHaveProperty('name', 'Test Template');
    });

    it('should only return active templates', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-active',
          category: 'agents',
          name: 'Active Template',
          description: 'Active description',
          template_data: { category: 'agents' },
          display_order: 1,
          active: true,
        }),
        createTemplateData({
          id: 'template-inactive',
          category: 'agents',
          name: 'Inactive Template',
          description: 'Inactive description',
          template_data: { category: 'agents' },
          display_order: 2,
          active: false,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const result = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'template-active');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-1',
          category: 'agents',
          name: 'Test Template',
          description: 'Test description',
          template_data: { category: 'agents', tags: 'test' },
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      // Test caching behavior with real implementation
      // Cache is already cleared in beforeEach, so we start fresh
      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should hit database and populate cache
      const result1 = (await getContentTemplates('agents')) as MergedTemplateItem[];
      const cacheAfterFirst = cache.getStats().size;
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = (await getContentTemplates('agents')) as MergedTemplateItem[];
      const cacheAfterSecond = cache.getStats().size;
      expect(cacheAfterSecond).toBe(cacheAfterFirst); // Cache size unchanged (hit cache)

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
      expect(result1[0]).toHaveProperty('id', 'template-1');
    });

    it('should isolate cache entries by category (cache isolation test)', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-agents',
          category: 'agents',
          name: 'Agents Template',
          description: 'Description',
          template_data: { category: 'agents' },
          display_order: 1,
          active: true,
        }),
        createTemplateData({
          id: 'template-mcp',
          category: 'mcp',
          name: 'MCP Template',
          description: 'Description',
          template_data: { category: 'mcp' },
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call for 'agents' category
      const agentsResult1 = (await getContentTemplates('agents')) as MergedTemplateItem[];
      const cacheAfterAgents = cache.getStats().size;
      expect(cacheAfterAgents).toBeGreaterThan(cacheBefore); // Cache should have entry for agents

      // First call for 'mcp' category - should create separate cache entry
      const mcpResult1 = (await getContentTemplates('mcp')) as MergedTemplateItem[];
      const cacheAfterMcp = cache.getStats().size;
      expect(cacheAfterMcp).toBeGreaterThan(cacheAfterAgents); // Cache should have separate entry for mcp

      // Second call for 'agents' - should hit cache
      const agentsResult2 = (await getContentTemplates('agents')) as MergedTemplateItem[];
      const cacheAfterAgentsSecond = cache.getStats().size;
      expect(cacheAfterAgentsSecond).toBe(cacheAfterMcp); // Cache size unchanged (hit cache)

      // Second call for 'mcp' - should hit cache
      const mcpResult2 = (await getContentTemplates('mcp')) as MergedTemplateItem[];
      const cacheAfterMcpSecond = cache.getStats().size;
      expect(cacheAfterMcpSecond).toBe(cacheAfterAgentsSecond); // Cache size unchanged (hit cache)

      // Verify results are correct and cached
      expect(agentsResult1).toEqual(agentsResult2);
      expect(mcpResult1).toEqual(mcpResult2);
      expect(agentsResult1).toHaveLength(1);
      expect(agentsResult1[0]).toHaveProperty('id', 'template-agents');
      expect(mcpResult1).toHaveLength(1);
      expect(mcpResult1[0]).toHaveProperty('id', 'template-mcp');
    });

    it('should order templates by display_order then name', async () => {
      const mockTemplates = [
        createTemplateData({
          id: 'template-3',
          category: 'agents',
          name: 'Z Template',
          description: 'Description',
          template_data: { category: 'agents' },
          display_order: 2,
          active: true,
        }),
        createTemplateData({
          id: 'template-1',
          category: 'agents',
          name: 'A Template',
          description: 'Description',
          template_data: { category: 'agents' },
          display_order: 1,
          active: true,
        }),
        createTemplateData({
          id: 'template-2',
          category: 'agents',
          name: 'B Template',
          description: 'Description',
          template_data: { category: 'agents' },
          display_order: 1,
          active: true,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
      }

      const result = (await getContentTemplates('agents')) as MergedTemplateItem[];
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id', 'template-1'); // display_order: 1, name: 'A Template'
      expect(result[1]).toHaveProperty('id', 'template-2'); // display_order: 1, name: 'B Template'
      expect(result[2]).toHaveProperty('id', 'template-3'); // display_order: 2, name: 'Z Template'
    });
  });
});
