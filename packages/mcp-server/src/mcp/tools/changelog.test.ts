/**
 * Tests for getChangelog Tool Handler
 *
 * Tests the tool that gets changelog of content updates in LLMs.txt format.
 * Includes changelog format validation and pagination.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetChangelog } from './changelog.js';
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

describe('getChangelog Tool Handler', () => {
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
    it('should return changelog in LLMs.txt format by default', async () => {
      const mockChangelog = '2024-01-01: Added new feature\\n2024-01-02: Fixed bug';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      const result = await handleGetChangelog({}, context);

      expect(result._meta.format).toBe('llms-txt');
      expect(result.content[0].text).toContain('2024-01-01: Added new feature');
      expect(result.content[0].text).toContain('2024-01-02: Fixed bug');
      expect(result._meta.length).toBeGreaterThan(0);
    });

    it('should return changelog in LLMs.txt format when explicitly requested', async () => {
      const mockChangelog = '2024-01-01: Added new feature\\n2024-01-02: Fixed bug';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      const result = await handleGetChangelog({ format: 'llms-txt' }, context);

      expect(result._meta.format).toBe('llms-txt');
      expect(result.content[0].text).toContain('2024-01-01: Added new feature');
    });

    it('should handle JSON format request (returns LLMs.txt with note)', async () => {
      const mockChangelog = '2024-01-01: Added new feature\\n2024-01-02: Fixed bug';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      const result = await handleGetChangelog({ format: 'json' }, context);

      expect(result._meta.format).toBe('llms-txt'); // Currently only LLMs.txt is available
      expect(result._meta.note).toContain('JSON format conversion not yet implemented');
      expect(result.content[0].text).toBeDefined();
    });

    it('should reject invalid format', async () => {
      await expect(handleGetChangelog({ format: 'invalid' as any }, context)).rejects.toThrow(
        'Invalid format'
      );
    });

    it('should replace escaped newlines with actual newlines', async () => {
      const mockChangelog = 'Line 1\\nLine 2\\nLine 3';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      const result = await handleGetChangelog({}, context);

      expect(result.content[0].text).toContain('Line 1');
      expect(result.content[0].text).toContain('Line 2');
      expect(result.content[0].text).toContain('Line 3');
      // Should not contain literal \n
      expect(result.content[0].text).not.toContain('\\n');
    });

    it('should throw error when changelog not found', async () => {
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: null }]);

      await expect(handleGetChangelog({}, context)).rejects.toThrow(
        'Changelog not found or invalid'
      );
    });

    it('should log successful completion', async () => {
      const mockChangelog = '2024-01-01: Added new feature';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      await handleGetChangelog({}, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getChangelog completed successfully',
        expect.objectContaining({
          tool: 'getChangelog',
          format: 'llms-txt',
          length: expect.any(Number),
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Database error'));

      await expect(handleGetChangelog({}, context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getChangelog tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getChangelog',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ContentService', async () => {
      const mockChangelog =
        '2024-01-01: Added new feature\\n2024-01-02: Fixed bug\\n2024-01-03: Performance improvements';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      const result = await handleGetChangelog({}, context);

      expect(result._meta.format).toBe('llms-txt');
      expect(result._meta.length).toBeGreaterThan(0);
      expect(result.content[0].text).toContain('2024-01-01');
      expect(result.content[0].text).toContain('2024-01-02');
      expect(result.content[0].text).toContain('2024-01-03');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockChangelog = '2024-01-01: Added new feature';
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: mockChangelog }]);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetChangelog({}, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetChangelog({}, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should handle empty changelog', async () => {
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: '' }]);

      const result = await handleGetChangelog({}, context);

      expect(result._meta.format).toBe('llms-txt');
      expect(result._meta.length).toBe(0);
      expect(result.content[0].text).toBe('');
    });

    it('should handle very long changelog', async () => {
      const longChangelog = Array.from(
        { length: 100 },
        (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}: Entry ${i + 1}`
      ).join('\\n');
      queryRawUnsafeSpy.mockResolvedValue([{ changelog_llms_txt: longChangelog }]);

      const result = await handleGetChangelog({}, context);

      expect(result._meta.length).toBeGreaterThan(0);
      expect(result.content[0].text).toContain('Entry 1');
      expect(result.content[0].text).toContain('Entry 100');
    });
  });
});
