/**
 * Type augmentation for PrismockerClient
 *
 * This module augments PrismaClient types to include Prismocker-specific methods
 * when using Prismocker in tests. This eliminates the need for `as any` type assertions.
 *
 * @example
 * ```typescript
 * import type { PrismaClient } from '@prisma/client';
 * import { createPrismocker } from 'prismocker';
 *
 * const prisma = createPrismocker<PrismaClient>();
 *
 * // ✅ Type-safe, no assertions needed
 * prisma.reset();
 * prisma.setData('companies', []);
 * const data = prisma.getData('companies');
 * ```
 */

import type { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    /**
     * Reset all in-memory data (Prismocker-specific)
     *
     * Clears all model stores and resets the PrismockerClient to its initial state.
     * Useful for test isolation between test cases.
     *
     * @example
     * ```typescript
     * beforeEach(() => {
     *   prisma.reset();
     * });
     * ```
     */
    reset(): void;

    /**
     * Get all data for a model (Prismocker-specific)
     *
     * Returns a copy of all records stored in the in-memory store for the specified model.
     * Useful for debugging and verifying test data state.
     *
     * @param modelName - Model name (e.g., 'companies', 'jobs', 'users')
     * @returns Array of records for the specified model
     *
     * @example
     * ```typescript
     * const companies = prisma.getData('companies');
     * console.log(`Found ${companies.length} companies`);
     * ```
     */
    getData<T = any>(modelName: string): T[];

    /**
     * Set data for a model (Prismocker-specific)
     *
     * Replaces all data in the in-memory store for the specified model with the provided data.
     * Useful for seeding test data before running tests.
     *
     * @param modelName - Model name (e.g., 'companies', 'jobs', 'users')
     * @param data - Array of records to set for the model
     *
     * @example
     * ```typescript
     * prisma.setData('companies', [
     *   { id: '1', name: 'Company 1', owner_id: 'user-1' },
     *   { id: '2', name: 'Company 2', owner_id: 'user-2' },
     * ]);
     * ```
     */
    setData<T = any>(modelName: string, data: T[]): void;

    /**
     * Enable debug mode (Prismocker-specific)
     *
     * When enabled, Prismocker will log all queries with detailed information
     * and track query statistics for debugging purposes.
     *
     * @param enabled Whether to enable debug mode (default: true)
     *
     * @example
     * ```typescript
     * prisma.enableDebugMode();
     * // All queries will be logged and tracked
     * await prisma.companies.findMany();
     * const stats = prisma.getQueryStats();
     * ```
     */
    enableDebugMode(enabled?: boolean): void;

    /**
     * Get query statistics (Prismocker-specific)
     *
     * Returns statistics about all queries executed since the last reset.
     * Useful for debugging and performance analysis.
     *
     * @returns Query statistics object with total queries, queries by model/operation, average duration, etc.
     *
     * @example
     * ```typescript
     * const stats = prisma.getQueryStats();
     * console.log(`Total queries: ${stats.totalQueries}`);
     * console.log(`Average duration: ${stats.averageDuration}ms`);
     * console.log(`Queries by model:`, stats.queriesByModel);
     * ```
     */
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

    /**
     * Visualize current state of all stores (Prismocker-specific)
     *
     * Returns a formatted string representation of all data in all stores,
     * useful for debugging and understanding the current state.
     *
     * @param options Visualization options (maxRecordsPerModel, includeIndexes, includeCache)
     * @returns Formatted string representation of the state
     *
     * @example
     * ```typescript
     * const visualization = prisma.visualizeState({
     *   maxRecordsPerModel: 5,
     *   includeIndexes: true,
     *   includeCache: true,
     * });
     * console.log(visualization);
     * ```
     */
    visualizeState(options?: {
      maxRecordsPerModel?: number;
      includeIndexes?: boolean;
      includeCache?: boolean;
    }): string;
  }
}

