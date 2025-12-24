/**
 * Feature Tests: Transactions
 *
 * Comprehensive tests for transaction support, rollback, and atomicity.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../../index.js';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from '../../jest-helpers.js';
import { setDataTyped, getDataTyped } from '../../prisma-types.js';

describe('Transaction Feature Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }
  });

  describe('Successful Transactions', () => {
    it('should commit multiple create operations', async () => {
      await prisma.$transaction(async (tx) => {
        await (tx as any).companies.create({
          data: { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
        });
        await (tx as any).companies.create({
          data: { id: 'comp-2', name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        });
      });

      const companies = await (prisma as any).companies.findMany();
      expect(companies).toHaveLength(2);
    });

    it('should commit multiple update operations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1', featured: false },
          { id: 'comp-2', name: 'Company 2', owner_id: 'owner-2', slug: 'company-2', featured: false },
        ]);
      }

      await prisma.$transaction(async (tx) => {
        await (tx as any).companies.update({ where: { id: 'comp-1' }, data: { featured: true } });
        await (tx as any).companies.update({ where: { id: 'comp-2' }, data: { featured: true } });
      });

      const comp1 = await (prisma as any).companies.findUnique({ where: { id: 'comp-1' } });
      const comp2 = await (prisma as any).companies.findUnique({ where: { id: 'comp-2' } });
      expect(comp1?.featured).toBe(true);
      expect(comp2?.featured).toBe(true);
    });

    it('should commit mixed operations (create, update, delete)', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
        ]);
      }

      await prisma.$transaction(async (tx) => {
        await (tx as any).companies.create({
          data: { id: 'comp-2', name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        });
        await (tx as any).companies.update({ where: { id: 'comp-1' }, data: { name: 'Company 1 Updated' } });
        await (tx as any).companies.delete({ where: { id: 'comp-1' } });
      });

      const companies = await (prisma as any).companies.findMany();
      expect(companies).toHaveLength(1);
      expect(companies[0].id).toBe('comp-2');
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback all changes on error', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice', balance: 100 }]);
      }

      try {
        await prisma.$transaction(async (tx) => {
          await (tx as any).users.update({ where: { id: 'user-1' }, data: { balance: 150 } });
          throw new Error('Transaction failed');
        });
      } catch (error) {
        // Expected error
      }

      const user = await (prisma as any).users.findUnique({ where: { id: 'user-1' } });
      expect(user?.balance).toBe(100); // Should be unchanged
    });

    it('should rollback multiple operations on error', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
      }

      try {
        await prisma.$transaction(async (tx) => {
          await (tx as any).users.create({ data: { id: 'user-3', name: 'Charlie' } });
          await (tx as any).users.update({ where: { id: 'user-1' }, data: { name: 'Alice Updated' } });
          throw new Error('Transaction failed');
        });
      } catch (error) {
        // Expected error
      }

      const users = await (prisma as any).users.findMany();
      expect(users).toHaveLength(2);
      const user1 = await (prisma as any).users.findUnique({ where: { id: 'user-1' } });
      expect(user1?.name).toBe('Alice'); // Should be unchanged
    });

    it('should rollback nested transaction operations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
        setDataTyped(prisma, 'posts', []);
      }

      try {
        await prisma.$transaction(async (tx) => {
          await (tx as any).users.update({ where: { id: 'user-1' }, data: { name: 'Alice Updated' } });
          await (tx as any).posts.create({ data: { id: 'post-1', user_id: 'user-1', title: 'Post 1' } });
          throw new Error('Transaction failed');
        });
      } catch (error) {
        // Expected error
      }

      const user = await (prisma as any).users.findUnique({ where: { id: 'user-1' } });
      const posts = await (prisma as any).posts.findMany();
      expect(user?.name).toBe('Alice'); // Should be unchanged
      expect(posts).toHaveLength(0); // Post should not be created
    });
  });

  describe('Transaction Isolation', () => {
    it('should isolate transactions from each other', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
      }

      // Start first transaction
      const tx1Promise = prisma.$transaction(async (tx) => {
        await (tx as any).users.update({ where: { id: 'user-1' }, data: { name: 'Alice TX1' } });
        // Wait a bit to allow second transaction to start
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'tx1-complete';
      });

      // Start second transaction (should see original data)
      const tx2Promise = prisma.$transaction(async (tx) => {
        const user = await (tx as any).users.findUnique({ where: { id: 'user-1' } });
        return user?.name;
      });

      const [tx1Result, tx2Result] = await Promise.all([tx1Promise, tx2Promise]);
      expect(tx1Result).toBe('tx1-complete');
      expect(tx2Result).toBe('Alice'); // Should see original data, not TX1 changes
    });
  });

  describe('Transaction Return Values', () => {
    it('should return transaction result', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await (tx as any).users.create({ data: { id: 'user-1', name: 'Alice' } });
        return { userId: user.id, userName: user.name };
      });

      expect(result).toEqual({ userId: 'user-1', userName: 'Alice' });
    });

    it('should return complex transaction result', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'users', [{ id: 'user-1', name: 'Alice' }]);
      }

      const result = await prisma.$transaction(async (tx) => {
        const user = await (tx as any).users.findUnique({ where: { id: 'user-1' } });
        const updated = await (tx as any).users.update({
          where: { id: 'user-1' },
          data: { name: 'Alice Updated' },
        });
        return { original: user, updated };
      });

      expect(result.original?.name).toBe('Alice');
      expect(result.updated.name).toBe('Alice Updated');
    });
  });
});

