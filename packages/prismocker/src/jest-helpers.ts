/**
 * Jest helpers for Prismocker
 *
 * Provides type-safe utilities for using Prismocker with Jest.
 * These helpers eliminate the need for `as any` type assertions in tests.
 *
 * @example
 * ```typescript
 * import { isPrismockerClient, createMockQueryRawUnsafe } from 'prismocker/jest';
 * import type { PrismaClient } from '@prisma/client';
 *
 * let prisma: PrismaClient;
 *
 * beforeEach(() => {
 *   prisma = createPrismocker<PrismaClient>();
 *
 *   // ✅ Type-safe check
 *   if (isPrismockerClient(prisma)) {
 *     prisma.reset(); // ✅ No type assertion needed
 *     prisma.setData('companies', []); // ✅ Type-safe
 *   }
 *
 *   // ✅ Type-safe mock
 *   const mockQuery = createMockQueryRawUnsafe(prisma);
 *   prisma.$queryRawUnsafe = mockQuery;
 * });
 * ```
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Type guard to check if a PrismaClient instance is actually a PrismockerClient
 *
 * This allows TypeScript to narrow the type and access Prismocker-specific methods
 * without type assertions.
 *
 * @param prisma - PrismaClient instance to check
 * @returns True if the instance is a PrismockerClient
 *
 * @example
 * ```typescript
 * if (isPrismockerClient(prisma)) {
 *   prisma.reset(); // ✅ Type-safe, no assertion needed
 * }
 * ```
 */
export function isPrismockerClient(
  prisma: PrismaClient
): prisma is PrismaClient & {
  reset(): void;
  getData<T = any>(modelName: string): T[];
  setData<T = any>(modelName: string, data: T[]): void;
  enableDebugMode(enabled?: boolean): void;
  getQueryStats(): {
    totalQueries: number;
    queriesByModel: Record<string, number>;
    queriesByOperation: Record<string, number>;
    averageDuration: number;
    queries: Array<{
      modelName: string;
      operation: string;
      timestamp: number;
      duration?: number;
      args?: any;
      resultCount?: number;
    }>;
  };
  visualizeState(options?: {
    maxRecordsPerModel?: number;
    includeIndexes?: boolean;
    includeCache?: boolean;
  }): string;
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
 * Type-safe mock function for $queryRawUnsafe
 *
 * This type represents a Jest mock function that matches the signature
 * of PrismaClient's $queryRawUnsafe method.
 *
 * Note: We use `any` here because PrismaClient's $queryRawUnsafe is not
 * directly accessible via type indexing, but the method exists at runtime.
 */
export type MockQueryRawUnsafe = jest.MockedFunction<
  (query: string, ...values: any[]) => Promise<any[]>
>;

/**
 * Create a type-safe mock for $queryRawUnsafe
 *
 * Returns a Jest mock function that is properly typed for PrismaClient's
 * $queryRawUnsafe method. This eliminates the need for type assertions
 * when setting up mocks in tests.
 *
 * @param _prisma - PrismaClient instance (unused, kept for API consistency)
 * @returns Typed Jest mock function
 *
 * @example
 * ```typescript
 * const mockQuery = createMockQueryRawUnsafe(prisma);
 * mockQuery.mockResolvedValue([{ id: '1', name: 'Test' }]);
 * prisma.$queryRawUnsafe = mockQuery;
 * ```
 */
export function createMockQueryRawUnsafe(
  _prisma?: PrismaClient
): MockQueryRawUnsafe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jest.fn() as any as MockQueryRawUnsafe;
}

/**
 * Type-safe mock function for $queryRaw
 *
 * This type represents a Jest mock function that matches the signature
 * of PrismaClient's $queryRaw method.
 *
 * Note: We use a function signature here because PrismaClient's $queryRaw is not
 * directly accessible via type indexing, but the method exists at runtime.
 */
export type MockQueryRaw = jest.MockedFunction<
  (query: TemplateStringsArray | string, ...values: any[]) => Promise<any[]>
>;

/**
 * Create a type-safe mock for $queryRaw
 *
 * Returns a Jest mock function that is properly typed for PrismaClient's
 * $queryRaw method.
 *
 * @param _prisma - PrismaClient instance (unused, kept for API consistency)
 * @returns Typed Jest mock function
 *
 * @example
 * ```typescript
 * const mockQuery = createMockQueryRaw(prisma);
 * mockQuery.mockResolvedValue([{ id: '1', name: 'Test' }]);
 * prisma.$queryRaw = mockQuery;
 * ```
 */
export function createMockQueryRaw(_prisma?: PrismaClient): MockQueryRaw {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jest.fn() as any as MockQueryRaw;
}

/**
 * Type-safe mock function for $transaction
 *
 * This type represents a Jest mock function that matches the signature
 * of PrismaClient's $transaction method.
 *
 * Note: We use a function signature here because PrismaClient's $transaction is not
 * directly accessible via type indexing, but the method exists at runtime.
 */
export type MockTransaction = jest.MockedFunction<
  <T>(
    callback: (tx: PrismaClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: string }
  ) => Promise<T>
>;

/**
 * Create a type-safe mock for $transaction
 *
 * Returns a Jest mock function that is properly typed for PrismaClient's
 * $transaction method.
 *
 * @param _prisma - PrismaClient instance (unused, kept for API consistency)
 * @returns Typed Jest mock function
 *
 * @example
 * ```typescript
 * const mockTransaction = createMockTransaction(prisma);
 * mockTransaction.mockImplementation(async (callback) => {
 *   return callback(prisma);
 * });
 * prisma.$transaction = mockTransaction;
 * ```
 */
export function createMockTransaction(_prisma?: PrismaClient): MockTransaction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jest.fn() as any as MockTransaction;
}

