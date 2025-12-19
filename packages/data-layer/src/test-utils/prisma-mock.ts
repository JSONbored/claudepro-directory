/**
 * Prisma Mock Utilities for Testing
 *
 * Provides mock factories and utilities for testing Prisma-based services.
 * Uses Prismock for in-memory Prisma Client that reads schema.prisma.
 */

import { vi } from 'vitest';
import { createPrismock } from 'prismock';

/**
 * Create a mock Prisma Client instance using Prismock
 *
 * ARCHITECTURAL FIX: According to Prismock documentation for custom client paths,
 * we should use `createPrismock(Prisma)` with the Prisma namespace from our custom
 * output location. This avoids importing `@prisma/client` entirely, which triggers
 * Node.js v25's TypeScript processing issue in node_modules.
 *
 * Our Prisma client is generated to: @heyclaude/database-types/prisma/client
 * We import the Prisma namespace from there and use it with createPrismock.
 *
 * Note: Prismock doesn't support $queryRawUnsafe for RPC calls, so we add
 * a mock for that method which is used by BasePrismaService.callRpc().
 *
 * @example
 * ```typescript
 * const mockPrisma = await createMockPrismaClientAsync();
 * mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: '123', name: 'Test' }]);
 * ```
 */
export async function createMockPrismaClientAsync(): Promise<any> {
  // Import Prisma namespace from our custom client location (not @prisma/client)
  // This avoids the Node.js v25 TypeScript processing issue
  const { Prisma } = await import('@heyclaude/database-types/prisma/client');
  
  // Use createPrismock with our custom Prisma namespace
  // This is the recommended approach for custom client paths per Prismock docs
  const PrismockClient = createPrismock(Prisma);
  const prismock = new PrismockClient();
  
  // Add mocks for raw query methods (used by BasePrismaService for RPC calls)
  (prismock as any).$queryRawUnsafe = vi.fn();
  (prismock as any).$queryRaw = vi.fn();
  (prismock as any).$executeRawUnsafe = vi.fn();
  (prismock as any).$executeRaw = vi.fn();
  (prismock as any).$transaction = vi.fn();
  
  return prismock;
}

// Synchronous version is not supported - must use async version
// This is because we need to dynamically import the Prisma namespace
export function createMockPrismaClient(): any {
  throw new Error(
    `Synchronous Prismock initialization is not supported. ` +
    `Use setupPrismockMockAsync() in async vi.mock factories instead. ` +
    `Example: vi.mock('../prisma/client.ts', async () => { const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts'); return { prisma: await setupPrismockMockAsync() }; });`
  );
}

/**
 * Type for mock Prisma Client
 * 
 * This is the return type from createPrismock, which is compatible with PrismaClient.
 * Use this type instead of importing PrismockClient directly to avoid triggering
 * Prismock's internal @prisma/client import.
 */
export type MockPrismaClient = Awaited<ReturnType<typeof createMockPrismaClientAsync>>;

/**
 * Setup Prismock mock for the prisma singleton (async version - preferred)
 *
 * Use this in test files to mock the prisma singleton from '../prisma/client.ts'
 * This version uses createPrismock with our custom Prisma namespace, which avoids
 * importing @prisma/client entirely (per Prismock docs for custom client paths).
 *
 * @example
 * ```typescript
 * // In your test file
 * vi.mock('../prisma/client.ts', async () => {
 *   const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts');
 *   return {
 *     prisma: await setupPrismockMockAsync(),
 *   };
 * });
 * ```
 */
export async function setupPrismockMockAsync() {
  return await createMockPrismaClientAsync();
}

/**
 * Setup Prismock mock for the prisma singleton (sync version - not supported)
 *
 * This function is not supported. Always use setupPrismockMockAsync() instead.
 *
 * @example
 * ```typescript
 * // In your test file - ALWAYS use async version
 * vi.mock('../prisma/client.ts', async () => {
 *   const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts');
 *   return {
 *     prisma: await setupPrismockMockAsync(),
 *   };
 * });
 * ```
 */
export function setupPrismockMock() {
  return createMockPrismaClient();
}
