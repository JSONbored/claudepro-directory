/**
 * Prisma Mock Utilities for Testing
 *
 * Provides mock factories and utilities for testing Prisma-based services.
 * Uses Prismock for in-memory Prisma Client that reads schema.prisma.
 */

import { vi } from 'vitest';
import { generatePrismock, generateDMMF } from 'prismock';

/**
 * Create a mock Prisma Client instance using Prismock
 *
 * Prismock automatically reads your schema.prisma and generates all models.
 * This provides a fully functional in-memory Prisma Client for testing.
 *
 * Note: Prismock doesn't support $queryRawUnsafe for RPC calls, so we add
 * a mock for that method which is used by BasePrismaService.callRpc().
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaClient();
 * mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: '123', name: 'Test' }]);
 * ```
 */
// ARCHITECTURAL FIX: PrismockClient internally imports @prisma/client which triggers
// Node.js v25 to try to process TypeScript files in node_modules/.prisma/client/,
// causing ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING.
//
// The solution: Use generatePrismock() with schemaPath instead of PrismockClient.
// generatePrismock reads the schema directly without importing the Prisma client.
// However, it's async, so we need to handle that in test setup.

export async function createMockPrismaClientAsync(): Promise<any> {
  const path = require('path');
  const fs = require('fs');
  
  // Find prisma/schema.prisma relative to project root
  const projectRoot = path.resolve(__dirname, '../../../');
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  
  // Verify schema exists
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}. Make sure prisma/schema.prisma exists.`);
  }
  
  // Use generatePrismock with schemaPath - this avoids importing @prisma/client
  const prismock = await generatePrismock({ schemaPath });
  
  // Add mocks for raw query methods (used by BasePrismaService for RPC calls)
  (prismock as any).$queryRawUnsafe = vi.fn();
  (prismock as any).$queryRaw = vi.fn();
  (prismock as any).$executeRawUnsafe = vi.fn();
  (prismock as any).$executeRaw = vi.fn();
  (prismock as any).$transaction = vi.fn();
  
  return prismock;
}

// Synchronous version using generatePrismockSync (requires DMMF)
// This is a workaround - we generate DMMF first, then create Prismock synchronously
export function createMockPrismaClient(): any {
  const path = require('path');
  const fs = require('fs');
  
  // Find prisma/schema.prisma relative to project root
  const projectRoot = path.resolve(__dirname, '../../../');
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  
  // Verify schema exists
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}. Make sure prisma/schema.prisma exists.`);
  }
  
  // ARCHITECTURAL FIX: Use generatePrismockSync with DMMF to avoid importing @prisma/client
  // This requires generating DMMF first, which is async, so we can't do it synchronously
  // Instead, we'll throw a clear error directing users to use the async version
  throw new Error(
    `Synchronous Prismock initialization is not supported due to Node.js v25 TypeScript processing issue. ` +
    `Use setupPrismockMockAsync() in async vi.mock factories instead. ` +
    `Example: vi.mock('../prisma/client.ts', async () => { const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts'); return { prisma: await setupPrismockMockAsync() }; });`
  );
}

/**
 * Type for mock Prisma Client
 */
export type MockPrismaClient = Awaited<ReturnType<typeof createMockPrismaClientAsync>>;

/**
 * Setup Prismock mock for the prisma singleton (async version - preferred)
 *
 * Use this in test files to mock the prisma singleton from '../prisma/client.ts'
 * This version uses generatePrismock which avoids importing @prisma/client
 *
 * @example
 * ```typescript
 * // In your test file
 * vi.mock('../prisma/client.ts', async () => {
 *   const { setupPrismockMockAsync } = require('../test-utils/prisma-mock.ts');
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
 * Setup Prismock mock for the prisma singleton (sync version - may fail)
 *
 * Use this only if async version doesn't work. Prefer setupPrismockMockAsync().
 *
 * @example
 * ```typescript
 * // In your test file
 * vi.mock('../prisma/client.ts', () => {
 *   const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
 *   return {
 *     prisma: setupPrismockMock(),
 *   };
 * });
 * ```
 */
export function setupPrismockMock() {
  return createMockPrismaClient();
}
