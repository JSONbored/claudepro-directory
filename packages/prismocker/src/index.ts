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
export type { ExtractModels, PrismockerMethods, ModelName, ModelType } from './prisma-types.js';

import { PrismockerClient } from './client.js';
import type { ExtractModels } from './prisma-types.js';
import type { PrismaClient } from '@prisma/client';

/**
 * Creates a new PrismockerClient instance with full type safety.
 *
 * Prismocker is a type-safe, in-memory Prisma Client mock that provides a drop-in
 * replacement for PrismaClient in tests. It supports all Prisma operations including
 * CRUD operations, relations, transactions, aggregations, and more.
 *
 * The returned instance preserves all model types from the PrismaClient, allowing
 * full type safety without the need for `as any` assertions. All model access
 * (e.g., `prisma.companies`, `prisma.jobs`) is fully typed.
 *
 * @template T - The PrismaClient type (must extend PrismaClient, defaults to PrismaClient)
 * @param options - Configuration options for Prismocker behavior
 * @returns A PrismockerClient instance typed as ExtractModels<T>, which preserves all model types
 *
 * @example
 * ```typescript
 * import { createPrismocker } from 'prismocker';
 * import type { PrismaClient } from '@prisma/client';
 *
 * // Basic usage - fully type-safe!
 * const prisma = createPrismocker<PrismaClient>();
 * const companies = await prisma.companies.findMany(); // ✅ Fully typed!
 * const company = await prisma.companies.findUnique({ where: { id: '1' } }); // ✅ Fully typed!
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
 * @see {@link ExtractModels} for details on how type preservation works
 */
export function createPrismocker<T extends PrismaClient = PrismaClient>(
  options?: import('./types.js').PrismockerOptions
): ExtractModels<T> {
  return PrismockerClient.create(options) as ExtractModels<T>;
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
