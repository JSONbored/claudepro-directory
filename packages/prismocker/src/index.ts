/**
 * Prismocker - A type-safe, in-memory Prisma Client mock for testing
 *
 * @packageDocumentation
 */

export { PrismockerClient } from './client.js';
export type { PrismockerOptions } from './types.js';

import { PrismockerClient } from './client.js';

/**
 * Create a new PrismockerClient instance
 *
 * @example
 * ```typescript
 * import { createPrismocker } from 'prismocker';
 * import type { PrismaClient } from '@prisma/client';
 *
 * const prisma = createPrismocker<PrismaClient>();
 * const users = await prisma.user.findMany();
 * ```
 */
export function createPrismocker<T = any>(
  options?: import('./types.js').PrismockerOptions
): T {
  return PrismockerClient.create(options) as unknown as T;
}

/**
 * Default export for convenience
 */
export default createPrismocker;

