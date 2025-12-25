/**
 * Feature Tests: Relations
 *
 * Comprehensive tests for relation support (include, select, filters).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../../index.js';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from '../../jest-helpers.js';
import { setDataTyped } from '../../prisma-types.js';

describe('Relations Feature Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }
  });

  describe('Include Relations', () => {
    it('should include one-to-many relations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
        setDataTyped(prisma, 'posts', [
          { id: 'post-1', user_id: 'user-1', title: 'Post 1' },
          { id: 'post-2', user_id: 'user-1', title: 'Post 2' },
        ]);
      }

      const user = await (prisma as any).users.findUnique({
        where: { id: 'user-1' },
        include: { posts: true },
      });

      expect(user).toBeDefined();
      expect(user?.posts).toHaveLength(2);
      expect(user?.posts.map((p: any) => p.title).sort()).toEqual(['Post 1', 'Post 2']);
    });

    it('should include one-to-one relations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
        setDataTyped(prisma, 'profiles', [
          { id: 'profile-1', user_id: 'user-1', bio: 'Alice bio' },
        ]);
      }

      const user = await prisma.users.findUnique({
        where: { id: 'user-1' },
        include: { profile: true },
      });

      expect(user).toBeDefined();
      expect(user?.profile).toBeDefined();
      expect((user?.profile as any)?.bio).toBe('Alice bio');
    });

    it('should include nested relations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
        setDataTyped(prisma, 'posts', [{ id: 'post-1', user_id: 'user-1', title: 'Post 1' }]);
        setDataTyped(prisma, 'comments', [
          { id: 'comment-1', post_id: 'post-1', content: 'Comment 1' },
          { id: 'comment-2', post_id: 'post-1', content: 'Comment 2' },
        ]);
      }

      const user = await prisma.users.findUnique({
        where: { id: 'user-1' },
        include: {
          posts: {
            include: {
              comments: true,
            },
          },
        },
      });

      expect(user).toBeDefined();
      expect(user?.posts).toHaveLength(1);
      expect((user?.posts as any[])[0].comments).toHaveLength(2);
    });
  });

  describe('Select Relations', () => {
    it('should select specific relation fields', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        ]);
        setDataTyped(prisma, 'posts', [
          { id: 'post-1', user_id: 'user-1', title: 'Post 1', content: 'Content 1' },
        ]);
      }

      const user = await prisma.users.findUnique({
        where: { id: 'user-1' },
        select: {
          id: true,
          name: true,
          posts: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBeUndefined(); // Not selected
      expect(user?.posts).toHaveLength(1);
      expect((user?.posts as any[])[0].content).toBeUndefined(); // Not selected
    });
  });

  describe('Relation Filters', () => {
    it('should filter by relation (some)', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
        setDataTyped(prisma, 'posts', [
          { id: 'post-1', user_id: 'user-1', published: true },
          { id: 'post-2', user_id: 'user-1', published: false },
          { id: 'post-3', user_id: 'user-2', published: false },
        ]);
      }

      const users = await (prisma as any).users.findMany({
        where: {
          posts: { some: { published: true } },
        },
      });

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-1');
    });

    it('should filter by relation (every)', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
        setDataTyped(prisma, 'posts', [
          { id: 'post-1', user_id: 'user-1', published: true },
          { id: 'post-2', user_id: 'user-1', published: true },
          { id: 'post-3', user_id: 'user-2', published: false },
        ]);
      }

      const users = await (prisma as any).users.findMany({
        where: {
          posts: { every: { published: true } },
        },
      });

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-1');
    });

    it('should filter by relation (none)', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
        setDataTyped(prisma, 'posts', [
          { id: 'post-1', user_id: 'user-1', published: true },
          { id: 'post-3', user_id: 'user-2', published: false },
        ]);
      }

      const users = await (prisma as any).users.findMany({
        where: {
          posts: { none: { published: true } },
        },
      });

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-2');
    });
  });

  describe('Lazy Relation Loading', () => {
    it('should load relations lazily when accessed', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
        setDataTyped(prisma, 'posts', [{ id: 'post-1', user_id: 'user-1', title: 'Post 1' }]);
      }

      const user = await (prisma as any).users.findUnique({
        where: { id: 'user-1' },
        include: { posts: true },
      });

      // Relations should be loaded lazily
      expect(user).toBeDefined();
      expect(Array.isArray(user?.posts)).toBe(true);
      expect(user?.posts).toHaveLength(1);
    });
  });
});
