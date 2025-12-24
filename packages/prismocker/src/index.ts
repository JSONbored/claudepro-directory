/**
 * Prismocker - A type-safe, in-memory Prisma Client mock for testing
 *
 * @packageDocumentation
 */

// Type augmentation is automatically picked up by TypeScript
// No runtime import needed - types-augmentation.d.ts extends PrismaClient types

export { PrismockerClient } from './client.js';
export type { PrismockerOptions } from './types.js';
export { QueryCache } from './query-cache.js';
export { IndexManager } from './index-manager.js';
export type { IndexConfig } from './index-manager.js';

import { PrismockerClient } from './client.js';

/**
 * Creates a new PrismockerClient instance typed as the specified PrismaClient type.
 *
 * Prismocker is a type-safe, in-memory Prisma Client mock that provides a drop-in
 * replacement for PrismaClient in tests. It supports all Prisma operations including
 * CRUD operations, relations, transactions, aggregations, and more.
 *
 * @template T - The PrismaClient type (usually inferred from @prisma/client)
 * @param options - Configuration options for Prismocker behavior
 * @returns A PrismockerClient instance typed as T, which can be used exactly like PrismaClient
 *
 * @example
 * ```typescript
 * import { createPrismocker } from 'prismocker';
 * import type { PrismaClient } from '@prisma/client';
 *
 * // Basic usage
 * const prisma = createPrismocker<PrismaClient>();
 * const users = await prisma.user.findMany();
 *
 * // With options
 * const prisma = createPrismocker<PrismaClient>({
 *   logQueries: true,
 *   enableIndexes: true,
 *   enableQueryCache: true,
 * });
 * ```
 *
 * @see {@link PrismockerOptions} for all available configuration options
 */
export function createPrismocker<T = any>(
  options?: import('./types.js').PrismockerOptions
): T {
  return PrismockerClient.create(options) as unknown as T;
}

/**
 * Default export for convenience.
 *
 * Allows importing Prismocker as a default export:
 * ```typescript
 * import createPrismocker from 'prismocker';
 * ```
 *
 * @example
 * ```typescript
 * import createPrismocker from 'prismocker';
 * import type { PrismaClient } from '@prisma/client';
 *
 * const prisma = createPrismocker<PrismaClient>();
 * ```
 */
export default createPrismocker;

