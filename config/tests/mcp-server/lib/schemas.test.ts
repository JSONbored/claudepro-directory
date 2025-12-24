/**
 * Tests for Zod Schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  mcpPaginationSchema,
  mcpCategoryFilterSchema,
  mcpTagsFilterSchema,
  mcpSlugSchema,
  mcpSearchQuerySchema,
  mcpLimitSchema,
  mcpPlatformSchema,
  mcpUrlSchema,
  mcpEmailSchema,
  mcpDateTimeSchema,
  createContentFilterSchema,
  createPaginatedContentSchema,
  createContentListResponseSchema,
} from '@heyclaude/mcp-server/lib/schemas';

describe('MCP Schemas', () => {
  describe('mcpPaginationSchema', () => {
    it('should validate pagination with defaults', () => {
      const result = mcpPaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should validate custom pagination values', () => {
      const result = mcpPaginationSchema.parse({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should reject invalid page numbers', () => {
      expect(() => mcpPaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => mcpPaginationSchema.parse({ page: -1 })).toThrow();
    });

    it('should reject invalid limit values', () => {
      expect(() => mcpPaginationSchema.parse({ limit: 0 })).toThrow();
      expect(() => mcpPaginationSchema.parse({ limit: 100 })).toThrow(); // Max 50
    });
  });

  describe('mcpCategoryFilterSchema', () => {
    it('should accept valid category', () => {
      const result = mcpCategoryFilterSchema.parse('agents');
      expect(result).toBe('agents');
    });

    it('should accept undefined', () => {
      const result = mcpCategoryFilterSchema.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('mcpTagsFilterSchema', () => {
    it('should validate array of strings', () => {
      const result = mcpTagsFilterSchema.parse(['tag1', 'tag2']);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should accept undefined', () => {
      const result = mcpTagsFilterSchema.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('mcpSlugSchema', () => {
    it('should validate non-empty string', () => {
      const result = mcpSlugSchema.parse('test-slug');
      expect(result).toBe('test-slug');
    });

    it('should reject empty string', () => {
      expect(() => mcpSlugSchema.parse('')).toThrow();
    });
  });

  describe('mcpSearchQuerySchema', () => {
    it('should accept search query string', () => {
      const result = mcpSearchQuerySchema.parse('test query');
      expect(result).toBe('test query');
    });

    it('should accept undefined', () => {
      const result = mcpSearchQuerySchema.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('mcpLimitSchema', () => {
    it('should validate limit with default when undefined', () => {
      const result = mcpLimitSchema.parse(undefined);
      expect(result).toBe(20);
    });

    it('should validate custom limit', () => {
      const result = mcpLimitSchema.parse(10);
      expect(result).toBe(10);
    });

    it('should reject values outside range', () => {
      expect(() => mcpLimitSchema.parse(0)).toThrow();
      expect(() => mcpLimitSchema.parse(100)).toThrow();
    });
  });

  describe('mcpPlatformSchema', () => {
    it('should validate known platforms', () => {
      expect(mcpPlatformSchema.parse('claude-code')).toBe('claude-code');
      expect(mcpPlatformSchema.parse('cursor')).toBe('cursor');
      expect(mcpPlatformSchema.parse('chatgpt-codex')).toBe('chatgpt-codex');
      expect(mcpPlatformSchema.parse('generic')).toBe('generic');
    });

    it('should default to claude-code', () => {
      const result = mcpPlatformSchema.parse(undefined);
      expect(result).toBe('claude-code');
    });

    it('should reject unknown platforms', () => {
      expect(() => mcpPlatformSchema.parse('unknown')).toThrow();
    });
  });

  describe('mcpUrlSchema', () => {
    it('should validate URL', () => {
      const result = mcpUrlSchema.parse('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should accept undefined', () => {
      const result = mcpUrlSchema.parse(undefined);
      expect(result).toBeUndefined();
    });

    it('should reject invalid URLs', () => {
      expect(() => mcpUrlSchema.parse('not-a-url')).toThrow();
    });
  });

  describe('mcpEmailSchema', () => {
    it('should validate email', () => {
      const result = mcpEmailSchema.parse('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid emails', () => {
      expect(() => mcpEmailSchema.parse('not-an-email')).toThrow();
    });
  });

  describe('mcpDateTimeSchema', () => {
    it('should validate ISO 8601 date-time', () => {
      const result = mcpDateTimeSchema.parse('2024-01-15T10:30:00Z');
      expect(result).toBe('2024-01-15T10:30:00Z');
    });

    it('should reject invalid date-time', () => {
      expect(() => mcpDateTimeSchema.parse('not-a-date')).toThrow();
    });
  });

  describe('createContentFilterSchema', () => {
    it('should create schema with category and tags', () => {
      const schema = createContentFilterSchema();
      const result = schema.parse({ category: 'agents', tags: ['ai'] });
      expect(result.category).toBe('agents');
      expect(result.tags).toEqual(['ai']);
    });

    it('should include additional fields', () => {
      const schema = createContentFilterSchema({
        query: mcpSearchQuerySchema,
      });
      const result = schema.parse({ category: 'agents', query: 'test' });
      expect(result.query).toBe('test');
    });
  });

  describe('createPaginatedContentSchema', () => {
    it('should create schema with pagination', () => {
      const schema = createPaginatedContentSchema();
      const result = schema.parse({ page: 1, limit: 20 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('createContentListResponseSchema', () => {
    it('should create response schema with items and count', () => {
      const itemSchema = mcpSlugSchema;
      const schema = createContentListResponseSchema(itemSchema);
      const result = schema.parse({ items: ['item1', 'item2'], count: 2 });
      expect(result.items).toEqual(['item1', 'item2']);
      expect(result.count).toBe(2);
    });

    it('should include pagination when requested', () => {
      const itemSchema = mcpSlugSchema;
      const schema = createContentListResponseSchema(itemSchema, true);
      const result = schema.parse({
        items: ['item1'],
        count: 1,
        pagination: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
          hasMore: true,
        },
      });
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(100);
    });
  });
});

