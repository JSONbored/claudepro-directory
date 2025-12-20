/**
 * Prismock Auto-Mock for @prisma/client
 *
 * This file implements the Prismock approach for custom client paths.
 * Since we use a custom output path (../node_modules/.prisma/client),
 * we must use createPrismock instead of PrismockClient.
 *
 * @see https://github.com/morintd/prismock#using-a-custom-client-path
 *
 * Note: createPrismock doesn't support $queryRawUnsafe, $queryRaw, $executeRawUnsafe,
 * $executeRaw, or $transaction. These methods should be mocked in test files using
 * vi.spyOn() when needed for RPC calls.
 */

import { createPrismock } from 'prismock';
import { Prisma } from '@prisma/client';

// Create PrismockClient using createPrismock with our custom Prisma import
// This is required when using custom output paths
// createPrismock returns a class that extends PrismaClient
// For Prisma 7 with engineType="client", we need to handle adapter requirement
const PrismockClientBase = createPrismock(Prisma);

// Create a dummy adapter that satisfies Prisma 7's validation
// Prismock doesn't actually use this adapter, but Prisma 7 validates it
const dummyAdapter = {
  query: async () => [],
  execute: async () => 0,
};

// Export the PrismockClient directly - test files should pass { adapter: dummyAdapter }
// when creating new instances if needed
export * from '@prisma/client';
export { PrismockClientBase as PrismaClient };
