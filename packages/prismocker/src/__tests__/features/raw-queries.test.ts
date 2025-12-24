/**
 * Feature Tests: Raw Queries
 *
 * Comprehensive tests for $queryRaw, $queryRawUnsafe, $executeRaw, $executeRawUnsafe.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../../index.js';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from '../../jest-helpers.js';
import { setDataTyped, getDataTyped } from '../../prisma-types.js';

describe('Raw Queries Feature Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }
  });

  describe('$queryRaw and $queryRawUnsafe', () => {
    it('should execute SELECT query via SQL parser', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = (await customPrisma.$queryRawUnsafe(
        "SELECT * FROM users WHERE email = 'alice@example.com'"
      )) as Array<{ id: string; name: string; email: string }>;

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should use custom queryRawExecutor when provided', async () => {
      const customExecutor = async (query: string, stores: Map<string, any[]>) => {
        if (query.includes('CUSTOM_QUERY')) {
          return [{ id: 'custom-1', name: 'Custom Result' }];
        }
        return [];
      };

      const customPrisma = createPrismocker<PrismaClient>({
        queryRawExecutor: customExecutor,
      });

      const result = await customPrisma.$queryRawUnsafe('CUSTOM_QUERY');
      expect(result).toEqual([{ id: 'custom-1', name: 'Custom Result' }]);
    });

    it('should handle $queryRaw with template strings', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
      }

      const userId = 'user-1';
      const result = (await customPrisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`) as Array<{
        id: string;
        name: string;
      }>;

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
    });
  });

  describe('$executeRaw and $executeRawUnsafe', () => {
    it('should execute INSERT via SQL parser', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', []);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "INSERT INTO users (id, name, email) VALUES ('user-1', 'Alice', 'alice@example.com')"
      );

      expect(result).toBe(1);

      const users = isPrismockerClient(customPrisma) ? getDataTyped(customPrisma, 'users') : [];
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Alice');
    });

    it('should execute UPDATE via SQL parser', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "UPDATE users SET name = 'Alice Updated' WHERE id = 'user-1'"
      );

      expect(result).toBe(1);

      const user = await customPrisma.users.findUnique({ where: { id: 'user-1' } });
      expect(user?.name).toBe('Alice Updated');
    });

    it('should execute DELETE via SQL parser', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe("DELETE FROM users WHERE id = 'user-1'");

      expect(result).toBe(1);

      const users = await customPrisma.users.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-2');
    });

    it('should use custom executeRawExecutor when provided', async () => {
      const customExecutor = async (query: string, stores: Map<string, any[]>) => {
        if (query.includes('CUSTOM_UPDATE')) {
          return 5; // Return affected rows
        }
        return 0;
      };

      const customPrisma = createPrismocker<PrismaClient>({
        executeRawExecutor: customExecutor,
      });

      const result = await customPrisma.$executeRawUnsafe('CUSTOM_UPDATE users SET ...');
      expect(result).toBe(5);
    });

    it('should handle $executeRaw with template strings', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        ]);
      }

      const userId = 'user-1';
      const newName = 'Alice Updated';
      const result = await customPrisma.$executeRaw`UPDATE users SET name = ${newName} WHERE id = ${userId}`;

      expect(result).toBe(1);

      const user = await customPrisma.users.findUnique({ where: { id: 'user-1' } });
      expect(user?.name).toBe('Alice Updated');
    });
  });

  describe('SQL Parser Edge Cases', () => {
    it('should handle quoted string values in SQL', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: "John O'Brien", email: 'john@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "UPDATE users SET name = 'John Updated' WHERE id = 'user-1'"
      );

      expect(result).toBe(1);
    });

    it('should handle numeric values in SQL', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', age: 25 },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe('UPDATE users SET age = 30 WHERE id = \'user-1\'');

      expect(result).toBe(1);

      const user = await customPrisma.users.findUnique({ where: { id: 'user-1' } });
      expect(user?.age).toBe(30);
    });
  });
});

