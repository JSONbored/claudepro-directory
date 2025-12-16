/**
 * Prisma Mock Utilities for Testing
 *
 * Provides mock factories and utilities for testing Prisma-based services.
 * Uses Prismock for in-memory Prisma Client that reads schema.prisma.
 */

import { vi } from 'vitest';
import { PrismockClient } from 'prismock';

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
export function createMockPrismaClient(): InstanceType<typeof PrismockClient> & {
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
  $executeRaw: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
} {
  const prismock = new PrismockClient();
  
  // Add mocks for raw query methods (used by BasePrismaService for RPC calls)
  (prismock as any).$queryRawUnsafe = vi.fn();
  (prismock as any).$queryRaw = vi.fn();
  (prismock as any).$executeRawUnsafe = vi.fn();
  (prismock as any).$executeRaw = vi.fn();
  (prismock as any).$transaction = vi.fn();
  
  return prismock as any;
}

/**
 * Type for mock Prisma Client
 */
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Setup Prismock mock for the prisma singleton
 *
 * Use this in test files to mock the prisma singleton from '../prisma/client.ts'
 *
 * @example
 * ```typescript
 * // In your test file
 * vi.mock('../prisma/client.ts', () => ({
 *   prisma: setupPrismockMock(),
 * }));
 * ```
 */
export function setupPrismockMock() {
  return createMockPrismaClient();
}
