/**
 * Type Safety Tests for Prismocker
 *
 * These tests verify that Prismocker provides full type safety without requiring
 * `as any` assertions. All model access should be fully typed.
 */

import { describe, it, expect } from '@jest/globals';
import { createPrismocker } from '../../index.js';
import type { PrismaClient } from '@prisma/client';
import type { ExtractModels } from '../../prisma-types.js';

describe('Type Safety', () => {
  it('should return ExtractModels<PrismaClient> type', () => {
    const prisma = createPrismocker<PrismaClient>();
    
    // Type check: prisma should be ExtractModels<PrismaClient>
    const _typeCheck: ExtractModels<PrismaClient> = prisma;
    
    // Verify Prismocker methods are available
    expect(typeof prisma.reset).toBe('function');
    expect(typeof prisma.setData).toBe('function');
    expect(typeof prisma.getData).toBe('function');
  });

  it('should allow model access without type assertions', async () => {
    const prisma = createPrismocker<PrismaClient>();
    
    // This should work without (prisma as any)
    // If TypeScript compiles, the types are working correctly
    const companies = await prisma.companies.findMany();
    
    // Verify it's an array (runtime check)
    expect(Array.isArray(companies)).toBe(true);
  });

  it('should preserve model types through ExtractModels', () => {
    const prisma = createPrismocker<PrismaClient>();
    
    // Type check: prisma.companies should be typed as PrismaClient['companies']
    // We can't directly test this at runtime, but if TypeScript compiles,
    // the types are preserved correctly
    
    // Verify model access works
    expect(prisma.companies).toBeDefined();
    expect(typeof prisma.companies.findMany).toBe('function');
  });

  it('should allow Prismocker methods without type assertions', () => {
    const prisma = createPrismocker<PrismaClient>();
    
    // All Prismocker methods should be available without assertions
    prisma.reset();
    prisma.setData('companies', []);
    const data = prisma.getData('companies');
    
    expect(Array.isArray(data)).toBe(true);
  });
});

