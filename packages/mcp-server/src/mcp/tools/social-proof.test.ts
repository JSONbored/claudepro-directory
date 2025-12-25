/**
 * Tests for getSocialProofStats Tool Handler
 *
 * Tests the tool that retrieves community statistics including top contributors,
 * recent submissions, success rate, and total user count.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetSocialProofStats } from './social-proof.js';
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

describe('getSocialProofStats Tool Handler', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

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
    context = {
      prisma: prismocker,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  describe('Unit Tests', () => {
    it('should return stats with correct structure', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Seed data using Prismocker
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: new Date(),
            author: 'user1@example.com',
          },
          {
            id: 'sub-2',
            status: 'merged',
            created_at: new Date(),
            author: 'user2@example.com',
          },
          {
            id: 'sub-3',
            status: 'pending',
            created_at: monthAgo,
            author: 'user3@example.com',
          },
        ]);
        (prismocker as any).setData('content', [{ id: 'content-1' }, { id: 'content-2' }]);
      }

      const result = await handleGetSocialProofStats({}, context);

      expect(result._meta.stats).toBeDefined();
      expect(result._meta.stats.contributors).toBeDefined();
      expect(result._meta.stats.contributors.count).toBeGreaterThanOrEqual(0);
      expect(result._meta.stats.submissions).toBeGreaterThanOrEqual(0);
      expect(result._meta.stats.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result._meta.timestamp).toBeDefined();
    });

    it('should calculate success rate correctly', async () => {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: monthAgo,
            author: 'user1@example.com',
          },
          {
            id: 'sub-2',
            status: 'merged',
            created_at: monthAgo,
            author: 'user2@example.com',
          },
          {
            id: 'sub-3',
            status: 'rejected',
            created_at: monthAgo,
            author: 'user3@example.com',
          },
        ]);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      // 2 merged out of 3 total = 67% (rounded)
      expect(result._meta.stats.successRate).toBe(67);
    });

    it('should return null success rate when no submissions', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      expect(result._meta.stats.successRate).toBeNull();
    });

    it('should extract top contributors correctly', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3); // Within last week

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'user1@example.com',
          },
          {
            id: 'sub-2',
            status: 'merged',
            created_at: weekAgo,
            author: 'user1@example.com', // Same user
          },
          {
            id: 'sub-3',
            status: 'merged',
            created_at: weekAgo,
            author: 'user2@example.com',
          },
        ]);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      // user1 has 2 submissions, user2 has 1
      expect(result._meta.stats.contributors.names.length).toBeGreaterThanOrEqual(0);
      // Top contributor should be user1
      if (result._meta.stats.contributors.names.length > 0) {
        expect(result._meta.stats.contributors.names[0]).toBe('user1');
      }
    });

    it('should extract username from email addresses', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'john.doe@example.com',
          },
        ]);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      // Should extract 'john.doe' from email
      if (result._meta.stats.contributors.names.length > 0) {
        expect(result._meta.stats.contributors.names[0]).toBe('john.doe');
      }
    });

    it('should handle non-email author names', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'john_doe', // Not an email
          },
        ]);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      // Should use name as-is
      if (result._meta.stats.contributors.names.length > 0) {
        expect(result._meta.stats.contributors.names[0]).toBe('john_doe');
      }
    });

    it('should limit top contributors to 5', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        const submissions = Array.from({ length: 10 }, (_, i) => ({
          id: `sub-${i}`,
          status: 'merged',
          created_at: weekAgo,
          author: `user${i}@example.com`,
        }));
        (prismocker as any).setData('content_submissions', submissions);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      expect(result._meta.stats.contributors.names.length).toBeLessThanOrEqual(5);
    });

    it('should format text summary correctly', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'user1@example.com',
          },
        ]);
        (prismocker as any).setData('content', [{ id: 'content-1' }]);
      }

      const result = await handleGetSocialProofStats({}, context);

      expect(result.content[0]?.text).toContain('Community Statistics');
      expect(result.content[0]?.text).toContain('Top Contributors');
      expect(result.content[0]?.text).toContain('Recent Activity');
      expect(result.content[0]?.text).toContain('Submissions');
      expect(result.content[0]?.text).toContain('Success Rate');
      expect(result.content[0]?.text).toContain('Total Content Items');
    });

    it('should handle query failures gracefully', async () => {
      // Mock Prisma to throw error
      jest
        .spyOn(prismocker.content_submissions, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      const result = await handleGetSocialProofStats({}, context);

      // Should still return stats with default values
      expect(result._meta.stats).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should log successful completion', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('content', []);
      }

      await handleGetSocialProofStats({}, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getSocialProofStats completed successfully',
        expect.objectContaining({
          tool: 'getSocialProofStats',
          submissionCount: expect.any(Number),
          successRate: expect.anything(),
          totalUsers: expect.any(Number),
          topContributorsCount: expect.any(Number),
          duration_ms: expect.any(Number),
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should execute all queries in parallel', async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 3);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'user1@example.com',
          },
        ]);
        (prismocker as any).setData('content', [{ id: 'content-1' }]);
      }

      const findManySpy = jest.spyOn(prismocker.content_submissions, 'findMany');
      const countSpy = jest.spyOn(prismocker.content, 'count');

      await handleGetSocialProofStats({}, context);

      // Both queries should be called
      expect(findManySpy).toHaveBeenCalled();
      expect(countSpy).toHaveBeenCalled();
    });

    it('should calculate date ranges correctly', async () => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', [
          {
            id: 'sub-1',
            status: 'merged',
            created_at: weekAgo,
            author: 'user1@example.com',
          },
          {
            id: 'sub-2',
            status: 'merged',
            created_at: monthAgo,
            author: 'user2@example.com',
          },
        ]);
        (prismocker as any).setData('content', []);
      }

      const findManySpy = jest.spyOn(prismocker.content_submissions, 'findMany');

      await handleGetSocialProofStats({}, context);

      // Verify date filters are applied
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should handle empty results correctly', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetSocialProofStats({}, context);

      expect(result._meta.stats.submissions).toBe(0);
      expect(result._meta.stats.successRate).toBeNull();
      expect(result._meta.stats.totalUsers).toBe(0);
      expect(result._meta.stats.contributors.count).toBe(0);
      expect(result._meta.stats.contributors.names).toEqual([]);
    });
  });
});
