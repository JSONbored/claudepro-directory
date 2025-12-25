/**
 * Tests for getTemplates Tool Handler
 *
 * Tests the tool that gets submission templates for creating new content.
 * Includes template retrieval, template validation, and formatting.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetTemplates } from './templates.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

describe('getTemplates Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  beforeEach(() => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  describe('Unit Tests', () => {
    it('should return templates when data is an object', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [
            { name: 'name', description: 'Agent name', type: 'string' },
            { name: 'description', description: 'Agent description', type: 'string' },
          ],
          required_fields: ['name', 'description'],
          examples: [],
        },
        mcp: {
          template_name: 'MCP Server Template',
          description: 'Template for MCP servers',
          fields: [{ name: 'name', description: 'Server name', type: 'string' }],
          required_fields: ['name'],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.count).toBe(2);
      expect(result._meta.templates).toHaveLength(2);
      expect(result._meta.templates[0].category).toBe('agents');
      expect(result._meta.templates[0].name).toBe('AI Agent Template');
      expect(result._meta.templates[0].fields).toHaveLength(2);
      expect(result._meta.templates[0].requiredFields).toEqual(['name', 'description']);
      expect(result.content[0].text).toContain('Content Submission Templates');
      expect(result.content[0].text).toContain('AI Agent Template');
    });

    it('should return templates when data is already an array', async () => {
      const mockTemplates = [
        {
          category: 'agents',
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [{ name: 'name', description: 'Agent name', type: 'string' }],
          required_fields: ['name'],
          examples: [],
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.count).toBe(1);
      expect(result._meta.templates[0].category).toBe('agents');
      expect(result._meta.templates[0].name).toBe('AI Agent Template');
    });

    it('should return empty result when no templates found', async () => {
      queryRawUnsafeSpy.mockResolvedValue([{ templates: {} }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.count).toBe(0);
      expect(result._meta.templates).toHaveLength(0);
      expect(result.content[0].text).toContain('No templates configured');
    });

    it('should handle templates with missing fields gracefully', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          // Missing description, fields, etc.
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.templates[0].description).toBe('');
      expect(result._meta.templates[0].fields).toEqual([]);
      expect(result._meta.templates[0].requiredFields).toEqual([]);
    });

    it('should use category as name fallback', async () => {
      const mockTemplates = {
        agents: {
          // No template_name or name
          description: 'Template for AI agents',
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.templates[0].name).toBe('agents');
    });

    it('should format template fields correctly', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [
            { name: 'name', description: 'Agent name', type: 'string' },
            { name: 'description', description: 'Agent description', type: 'string' },
          ],
          required_fields: ['name'],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result.content[0].text).toContain('name (required)');
      expect(result.content[0].text).toContain('description (optional)');
    });

    it('should include category in text summary', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [],
          required_fields: [],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({ category: 'agents' }, context);

      expect(result.content[0].text).toContain('for agents');
    });

    it('should log successful completion', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [],
          required_fields: [],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      await handleGetTemplates({}, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getTemplates completed successfully',
        expect.objectContaining({
          tool: 'getTemplates',
          category: 'agents',
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Database error'));

      await expect(handleGetTemplates({}, context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getTemplates tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getTemplates',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ContentService', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [
            { name: 'name', description: 'Agent name', type: 'string' },
            { name: 'description', description: 'Agent description', type: 'string' },
          ],
          required_fields: ['name'],
          examples: [{ name: 'Example Agent', description: 'Example description' }],
        },
        mcp: {
          template_name: 'MCP Server Template',
          description: 'Template for MCP servers',
          fields: [{ name: 'name', description: 'Server name', type: 'string' }],
          required_fields: ['name'],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      const result = await handleGetTemplates({}, context);

      expect(result._meta.templates).toHaveLength(2);
      expect(result._meta.templates[0].category).toBe('agents');
      expect(result._meta.templates[0].examples).toHaveLength(1);
      expect(result._meta.templates[1].category).toBe('mcp');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockTemplates = {
        agents: {
          template_name: 'AI Agent Template',
          description: 'Template for AI agents',
          fields: [],
          required_fields: [],
          examples: [],
        },
      };

      queryRawUnsafeSpy.mockResolvedValue([{ templates: mockTemplates }]);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetTemplates({}, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetTemplates({}, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
