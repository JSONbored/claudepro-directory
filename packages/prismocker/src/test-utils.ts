/**
 * Test utilities for Prismocker
 *
 * Provides convenient helpers for common testing patterns with Prismocker.
 * These utilities simplify test setup and data management.
 *
 * @example
 * ```typescript
 * import { createTestPrisma, resetAndSeed, createTestDataFactory } from 'prismocker/test-utils';
 * import type { PrismaClient } from '@prisma/client';
 *
 * const prisma = createTestPrisma();
 *
 * const companyFactory = createTestDataFactory({
 *   name: 'Test Company',
 *   owner_id: 'test-user',
 *   slug: 'test-company',
 * });
 *
 * beforeEach(() => {
 *   resetAndSeed(prisma, {
 *     companies: [
 *       companyFactory({ name: 'Company 1' }),
 *       companyFactory({ name: 'Company 2' }),
 *     ],
 *   });
 * });
 * ```
 */

import type { PrismaClient } from '@prisma/client';
import { createPrismocker } from './index.js';

/**
 * Create a test PrismaClient instance with Prismocker
 *
 * This is a convenience wrapper around `createPrismocker<PrismaClient>()`
 * that provides a cleaner API for test setup.
 *
 * @param options - Optional Prismocker configuration
 * @returns PrismaClient instance (actually PrismockerClient)
 *
 * @example
 * ```typescript
 * const prisma = createTestPrisma();
 * await prisma.companies.create({ data: { name: 'Test' } });
 * ```
 */
export function createTestPrisma(
  options?: import('./types.js').PrismockerOptions
): PrismaClient {
  return createPrismocker<PrismaClient>(options);
}

/**
 * Check if a PrismaClient instance is a PrismockerClient
 *
 * This is a runtime check that works without Jest-specific types.
 * For Jest-specific type guards, use `isPrismockerClient` from 'prismocker/jest-helpers'.
 */
function isPrismockerInstance(prisma: PrismaClient): prisma is PrismaClient & {
  reset(): void;
  getData<T = any>(modelName: string): T[];
  setData<T = any>(modelName: string, data: T[]): void;
} {
  return (
    'reset' in prisma &&
    typeof (prisma as any).reset === 'function' &&
    'getData' in prisma &&
    typeof (prisma as any).getData === 'function' &&
    'setData' in prisma &&
    typeof (prisma as any).setData === 'function'
  );
}

/**
 * Seed test data into Prismocker
 *
 * Seeds multiple models with test data in a single call.
 * This is useful for setting up complex test scenarios with related data.
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param data - Object mapping model names to arrays of records
 *
 * @example
 * ```typescript
 * seedTestData(prisma, {
 *   companies: [{ id: '1', name: 'Company 1' }],
 *   jobs: [{ id: '1', company_id: '1', title: 'Job 1' }],
 * });
 * ```
 */
export function seedTestData<T extends Record<string, any[]>>(
  prisma: PrismaClient,
  data: T
): void {
  if (!isPrismockerInstance(prisma)) {
    const isPrismaClient = prisma && typeof prisma === 'object' && 'findMany' in prisma;
    const suggestion = isPrismaClient
      ? 'You passed a real PrismaClient. In tests, use createTestPrisma() or createPrismocker<PrismaClient>() to get a PrismockerClient instance.'
      : 'The provided instance is not a PrismockerClient. Use createTestPrisma() or createPrismocker<PrismaClient>() to create a test instance.';
    
    throw new Error(
      `Prismocker: seedTestData requires a PrismockerClient instance.\n\n` +
      `${suggestion}\n\n` +
      `Example:\n` +
      `  import { createTestPrisma } from 'prismocker/test-utils';\n` +
      `  const prisma = createTestPrisma<PrismaClient>();\n` +
      `  seedTestData(prisma, { companies: [...] });\n\n` +
      `Or:\n` +
      `  import { createPrismocker } from 'prismocker';\n` +
      `  const prisma = createPrismocker<PrismaClient>();\n` +
      `  seedTestData(prisma, { companies: [...] });`
    );
  }

  for (const [model, records] of Object.entries(data)) {
    prisma.setData(model, records);
  }
}

/**
 * Reset and seed Prismocker in one call
 *
 * This is a convenience function that combines `reset()` and `seedTestData()`.
 * Useful for test setup in `beforeEach` hooks.
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param data - Optional object mapping model names to arrays of records
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetAndSeed(prisma, {
 *     companies: [{ id: '1', name: 'Company 1' }],
 *   });
 * });
 * ```
 */
export function resetAndSeed<T extends Record<string, any[]>>(
  prisma: PrismaClient,
  data?: T
): void {
  if (!isPrismockerInstance(prisma)) {
    const isPrismaClient = prisma && typeof prisma === 'object' && 'findMany' in prisma;
    const suggestion = isPrismaClient
      ? 'You passed a real PrismaClient. In tests, use createTestPrisma() or createPrismocker<PrismaClient>() to get a PrismockerClient instance.'
      : 'The provided instance is not a PrismockerClient. Use createTestPrisma() or createPrismocker<PrismaClient>() to create a test instance.';
    
    throw new Error(
      `Prismocker: resetAndSeed requires a PrismockerClient instance.\n\n` +
      `${suggestion}\n\n` +
      `Example:\n` +
      `  import { createTestPrisma, resetAndSeed } from 'prismocker/test-utils';\n` +
      `  const prisma = createTestPrisma<PrismaClient>();\n` +
      `  resetAndSeed(prisma, { companies: [...] });\n\n` +
      `Or:\n` +
      `  import { createPrismocker } from 'prismocker';\n` +
      `  import { resetAndSeed } from 'prismocker/test-utils';\n` +
      `  const prisma = createPrismocker<PrismaClient>();\n` +
      `  resetAndSeed(prisma, { companies: [...] });`
    );
  }

  prisma.reset();
  if (data) {
    seedTestData(prisma, data);
  }
}

/**
 * Create a test data factory function
 *
 * Returns a factory function that creates test data objects with default values.
 * Override specific fields by passing them as arguments.
 *
 * @param defaults - Default values for the data object
 * @returns Factory function that creates data objects
 *
 * @example
 * ```typescript
 * const companyFactory = createTestDataFactory({
 *   name: 'Test Company',
 *   owner_id: 'test-user',
 *   slug: 'test-company',
 * });
 *
 * const company1 = companyFactory({ name: 'Company 1' });
 * const company2 = companyFactory({ name: 'Company 2', slug: 'company-2' });
 * ```
 */
export function createTestDataFactory<T extends Record<string, any>>(
  defaults: Partial<T>
) {
  return (overrides?: Partial<T>): T => {
    return {
      ...defaults,
      ...overrides,
    } as T;
  };
}

/**
 * Create a snapshot of current Prismocker state
 *
 * Captures the current state of all models in Prismocker.
 * Useful for snapshot testing or state verification.
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param modelNames - Optional array of model names to snapshot (defaults to all)
 * @returns Object mapping model names to arrays of records
 *
 * @example
 * ```typescript
 * const snapshot = snapshotPrismocker(prisma);
 * expect(snapshot.companies).toHaveLength(2);
 * ```
 */
export function snapshotPrismocker(
  prisma: PrismaClient,
  modelNames?: string[]
): Record<string, any[]> {
  if (!isPrismockerInstance(prisma)) {
    const isPrismaClient = prisma && typeof prisma === 'object' && 'findMany' in prisma;
    const suggestion = isPrismaClient
      ? 'You passed a real PrismaClient. In tests, use createTestPrisma() or createPrismocker<PrismaClient>() to get a PrismockerClient instance.'
      : 'The provided instance is not a PrismockerClient. Use createTestPrisma() or createPrismocker<PrismaClient>() to create a test instance.';
    
    throw new Error(
      `Prismocker: snapshotPrismocker requires a PrismockerClient instance.\n\n` +
      `${suggestion}\n\n` +
      `Example:\n` +
      `  import { createTestPrisma, snapshotPrismocker } from 'prismocker/test-utils';\n` +
      `  const prisma = createTestPrisma<PrismaClient>();\n` +
      `  const snapshot = snapshotPrismocker(prisma, ['companies', 'jobs']);\n\n` +
      `Or:\n` +
      `  import { createPrismocker } from 'prismocker';\n` +
      `  import { snapshotPrismocker } from 'prismocker/test-utils';\n` +
      `  const prisma = createPrismocker<PrismaClient>();\n` +
      `  const snapshot = snapshotPrismocker(prisma, ['companies', 'jobs']);`
    );
  }

  const snapshot: Record<string, any[]> = {};

  if (modelNames) {
    // Snapshot only specified models
    for (const model of modelNames) {
      snapshot[model] = prisma.getData(model);
    }
  } else {
    // Snapshot all models (requires tracking model names)
    // For now, we'll need to pass model names or track them
    // This is a limitation - we could enhance PrismockerClient to track models
      throw new Error(
        `Prismocker: snapshotPrismocker without modelNames is not yet supported.\n\n` +
        `Prismocker needs to know which models to snapshot. Please provide an array of model names.\n\n` +
        `Example:\n` +
        `  const snapshot = snapshotPrismocker(prisma, ['companies', 'jobs', 'users']);\n\n` +
        `This limitation exists because Prismocker doesn't track model names automatically.\n` +
        `You can get model names from your Prisma schema or by checking which models you've used in your tests.\n\n` +
        `Future enhancement: This may be supported in a future version when Prismocker tracks model names automatically.`
      );
  }

  return snapshot;
}

/**
 * Restore Prismocker from a snapshot
 *
 * Restores Prismocker state from a previously captured snapshot.
 * Useful for resetting to a known state during tests.
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param snapshot - Snapshot object from snapshotPrismocker()
 *
 * @example
 * ```typescript
 * const snapshot = snapshotPrismocker(prisma, ['companies', 'jobs']);
 * // ... modify data ...
 * restorePrismocker(prisma, snapshot);
 * ```
 */
export function restorePrismocker(
  prisma: PrismaClient,
  snapshot: Record<string, any[]>
): void {
  if (!isPrismockerInstance(prisma)) {
    const isPrismaClient = prisma && typeof prisma === 'object' && 'findMany' in prisma;
    const suggestion = isPrismaClient
      ? 'You passed a real PrismaClient. In tests, use createTestPrisma() or createPrismocker<PrismaClient>() to get a PrismockerClient instance.'
      : 'The provided instance is not a PrismockerClient. Use createTestPrisma() or createPrismocker<PrismaClient>() to create a test instance.';
    
    throw new Error(
      `Prismocker: restorePrismocker requires a PrismockerClient instance.\n\n` +
      `${suggestion}\n\n` +
      `Example:\n` +
      `  import { createTestPrisma, snapshotPrismocker, restorePrismocker } from 'prismocker/test-utils';\n` +
      `  const prisma = createTestPrisma<PrismaClient>();\n` +
      `  const snapshot = snapshotPrismocker(prisma, ['companies']);\n` +
      `  // ... modify data ...\n` +
      `  restorePrismocker(prisma, snapshot);\n\n` +
      `Or:\n` +
      `  import { createPrismocker } from 'prismocker';\n` +
      `  import { snapshotPrismocker, restorePrismocker } from 'prismocker/test-utils';\n` +
      `  const prisma = createPrismocker<PrismaClient>();\n` +
      `  const snapshot = snapshotPrismocker(prisma, ['companies']);\n` +
      `  restorePrismocker(prisma, snapshot);`
    );
  }

  prisma.reset();
  for (const [model, data] of Object.entries(snapshot)) {
    prisma.setData(model, data);
  }
}

