/**
 * Basic tests for Prismocker
 * 
 * These tests verify the core functionality works correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPrismocker } from './index.js';

describe('Prismocker', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = createPrismocker();
    prisma.reset();
  });

  it('should create a record', async () => {
    const user = await prisma.user.create({
      data: { name: 'John', email: 'john@example.com' },
    });

    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
    expect(user.id).toBeDefined();
  });

  it('should find many records', async () => {
    await prisma.user.create({ data: { name: 'John' } });
    await prisma.user.create({ data: { name: 'Jane' } });

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(2);
  });

  it('should find unique record', async () => {
    const created = await prisma.user.create({
      data: { id: '1', name: 'John' },
    });

    const found = await prisma.user.findUnique({ where: { id: '1' } });
    expect(found).toEqual(created);
  });

  it('should filter records with where clause', async () => {
    await prisma.user.create({ data: { name: 'John', age: 25 } });
    await prisma.user.create({ data: { name: 'Jane', age: 30 } });

    const users = await prisma.user.findMany({
      where: { age: { gt: 25 } },
    });

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Jane');
  });

  it('should update a record', async () => {
    const created = await prisma.user.create({ data: { name: 'John' } });

    const updated = await prisma.user.update({
      where: { id: created.id },
      data: { name: 'Jane' },
    });

    expect(updated.name).toBe('Jane');
  });

  it('should delete a record', async () => {
    const created = await prisma.user.create({ data: { name: 'John' } });

    await prisma.user.delete({ where: { id: created.id } });

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(0);
  });

  it('should count records', async () => {
    await prisma.user.create({ data: { name: 'John' } });
    await prisma.user.create({ data: { name: 'Jane' } });

    const count = await prisma.user.count();
    expect(count).toBe(2);
  });

  it('should reset all data', async () => {
    await prisma.user.create({ data: { name: 'John' } });
    await prisma.user.create({ data: { name: 'Jane' } });

    prisma.reset();

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(0);
  });

  it('should support $queryRawUnsafe (stub)', async () => {
    const result = await prisma.$queryRawUnsafe('SELECT 1');
    expect(result).toEqual([]);
  });

  it('should support $transaction (simplified)', async () => {
    const result = await prisma.$transaction(async (tx: any) => {
      return await tx.user.create({ data: { name: 'John' } });
    });

    expect(result.name).toBe('John');
  });
});

