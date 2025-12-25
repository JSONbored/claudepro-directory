/**
 * Tests for downloadContentForPlatform Tool Handler
 *
 * Tests the tool that downloads content formatted for specific platforms.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleDownloadContentForPlatform } from './download-platform.js';
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
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

describe('downloadContentForPlatform Tool Handler', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mockElicit: jest.Mock;

  beforeEach(() => {
    clearRequestCache();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    mockElicit = jest.fn();
    context = {
      prisma: prismocker,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
      elicit: mockElicit,
    };
  });

  describe('Unit Tests', () => {
    it('should format content for claude-code platform', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'claude-code',
          targetDirectory: '/Users/test/.claude',
        },
        context
      );

      expect(result._meta.platform).toBe('claude-code');
      expect(result._meta.filename).toBe('test-slug.json');
      expect(result._meta.targetDirectory).toBe('/Users/test/.claude');
      expect(result._meta.category).toBe('agents');
      expect(result._meta.slug).toBe('test-slug');
      expect(result._meta.installationInstructions).toBeDefined();
      expect(result.content[0]?.text).toContain('claude-code');
    });

    it('should format content for cursor platform', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'cursor',
          targetDirectory: '/Users/test/.cursor',
        },
        context
      );

      expect(result._meta.platform).toBe('cursor');
      expect(result._meta.filename).toBe('test-slug.json');
      expect(result._meta.targetDirectory).toBe('/Users/test/.cursor');
    });

    it('should use default platform when not provided', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          targetDirectory: '/Users/test/.claude',
        },
        context
      );

      expect(result._meta.platform).toBe('claude-code'); // Default
    });

    it('should elicit targetDirectory when missing', async () => {
      mockElicit.mockResolvedValue('/Users/test/.claude');

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'claude-code',
        },
        context
      );

      expect(mockElicit).toHaveBeenCalled();
      expect(result._meta.targetDirectory).toBe('/Users/test/.claude');
    });

    it('should validate slug format', async () => {
      await expect(
        handleDownloadContentForPlatform(
          {
            category: 'agents',
            slug: 'invalid slug!', // Invalid characters
            platform: 'claude-code',
            targetDirectory: '/Users/test/.claude',
          },
          context
        )
      ).rejects.toThrow('Invalid slug format');
    });

    it('should validate platform', async () => {
      await expect(
        handleDownloadContentForPlatform(
          {
            category: 'agents',
            slug: 'test-slug',
            platform: 'invalid-platform',
            targetDirectory: '/Users/test/.claude',
          },
          context
        )
      ).rejects.toThrow('Invalid platform');
    });

    it('should handle content not found', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', []);
      }

      await expect(
        handleDownloadContentForPlatform(
          {
            category: 'agents',
            slug: 'nonexistent-slug',
            platform: 'claude-code',
            targetDirectory: '/Users/test/.claude',
          },
          context
        )
      ).rejects.toThrow();
    });

    it('should sanitize slug and targetDirectory', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: '  test-slug  ', // Has whitespace
          platform: 'claude-code',
          targetDirectory: '  /Users/test/.claude  ', // Has whitespace
        },
        context
      );

      // Should be sanitized (trimmed)
      expect(result._meta.slug).toBe('test-slug');
      expect(result._meta.targetDirectory).toBe('/Users/test/.claude');
    });

    it('should include installation instructions', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'claude-code',
          targetDirectory: '/Users/test/.claude',
        },
        context
      );

      expect(result._meta.installationInstructions).toBeDefined();
      expect(Array.isArray(result._meta.installationInstructions)).toBe(true);
      expect(result._meta.installationInstructions.length).toBeGreaterThan(0);
    });

    it('should log errors when content fetch fails', async () => {
      jest.spyOn(prismocker.content, 'findUnique').mockRejectedValue(new Error('Database error'));

      await expect(
        handleDownloadContentForPlatform(
          {
            category: 'agents',
            slug: 'test-slug',
            platform: 'claude-code',
            targetDirectory: '/Users/test/.claude',
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should fetch content using Prisma', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const findUniqueSpy = jest.spyOn(prismocker.content, 'findUnique');

      await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'claude-code',
          targetDirectory: '/Users/test/.claude',
        },
        context
      );

      expect(findUniqueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug_category: {
              slug: 'test-slug',
              category: 'agents',
            },
          },
        })
      );
    });

    it('should handle different platforms correctly', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const platforms = ['claude-code', 'cursor', 'chatgpt-codex', 'generic'];

      for (const platform of platforms) {
        const result = await handleDownloadContentForPlatform(
          {
            category: 'agents',
            slug: 'test-slug',
            platform: platform as any,
            targetDirectory: '/Users/test/.claude',
          },
          context
        );

        expect(result._meta.platform).toBe(platform);
      }
    });

    it('should generate correct full path', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-slug',
            category: 'agents',
            title: 'Test Content',
            display_title: 'Test Content',
            description: 'Test description',
            content_data: { config: 'value' },
          },
        ]);
      }

      const result = await handleDownloadContentForPlatform(
        {
          category: 'agents',
          slug: 'test-slug',
          platform: 'claude-code',
          targetDirectory: '/Users/test/.claude',
        },
        context
      );

      expect(result._meta.fullPath).toBe('/Users/test/.claude/test-slug.json');
    });
  });
});
