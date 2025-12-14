/**
 * Prisma Mock Utilities for Testing
 *
 * Provides mock factories and utilities for testing Prisma-based services.
 * Uses jest-mock-extended for type-safe mocking.
 */

import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '../../../generators/dist/prisma/index.js';

/**
 * Create a mock Prisma Client instance
 *
 * Use this in tests to mock Prisma Client operations.
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaClient();
 * mockPrisma.companies.findUnique.mockResolvedValue({
 *   id: '123',
 *   name: 'Acme Corp',
 *   slug: 'acme-corp',
 * });
 * ```
 */
export function createMockPrismaClient(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Type for mock Prisma Client
 */
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
