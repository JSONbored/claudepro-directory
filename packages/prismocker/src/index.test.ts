/**
 * Basic tests for Prismocker
 * 
 * These tests verify the core functionality works correctly.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from './index';
import type { PrismaClient } from '@prisma/client';

describe('Prismocker', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }
  });

  it('should create a record', async () => {
    // Use actual Prisma model from schema (e.g., companies)
    const company = await prisma.companies.create({
      data: {
        name: 'Test Company',
        owner_id: 'test-owner-id',
        slug: 'test-company',
      },
    });

    expect(company.name).toBe('Test Company');
    expect(company.slug).toBe('test-company');
    expect(company.id).toBeDefined();
  });

  it('should find many records', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(2);
  });

  it('should find unique record', async () => {
    const created = await prisma.companies.create({
      data: { id: 'test-id', name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
    });

    const found = await prisma.companies.findUnique({ where: { id: 'test-id' } });
    expect(found).toEqual(created);
  });

  it('should filter records with where clause', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const companies = await prisma.companies.findMany({
      where: { owner_id: 'owner-1' },
    });

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Company 1');
  });

  it('should update a record', async () => {
    const created = await prisma.companies.create({
      data: { name: 'Original Name', owner_id: 'owner-1', slug: 'original-slug' },
    });

    const updated = await prisma.companies.update({
      where: { id: created.id },
      data: { name: 'Updated Name' },
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a record', async () => {
    const created = await prisma.companies.create({
      data: { name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
    });

    await prisma.companies.delete({ where: { id: created.id } });

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(0);
  });

  it('should count records', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const count = await prisma.companies.count();
    expect(count).toBe(2);
  });

  it('should reset all data', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(0);
  });

  it('should support $queryRawUnsafe (stub)', async () => {
    const result = await prisma.$queryRawUnsafe('SELECT 1');
    expect(result).toEqual([]);
  });

  it('should support $transaction (simplified)', async () => {
    const result = await prisma.$transaction(async (tx) => {
      return await tx.companies.create({
        data: { name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
      });
    });

    expect(result.name).toBe('Test Company');
  });
});

