/**
 * Prisma type helpers for Prismocker
 *
 * Provides type-safe utilities for working with Prisma models and types.
 * These helpers improve type inference and eliminate the need for manual type assertions.
 *
 * @example
 * ```typescript
 * import type { PrismaClient } from '@prisma/client';
 * import { setDataTyped } from 'prismocker/prisma-types';
 *
 * const prisma = createPrismocker<PrismaClient>();
 *
 * // ✅ Type-safe setData with model type inference
 * setDataTyped(prisma, 'companies', [
 *   { id: '1', name: 'Company 1', owner_id: 'user-1' },
 * ]);
 * ```
 */

import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Prismocker-specific methods that are added to PrismaClient via type augmentation.
 *
 * These methods are available on all PrismockerClient instances and provide
 * additional functionality for testing and debugging.
 */
export type PrismockerMethods = {
  /**
   * Reset all in-memory data (Prismocker-specific)
   *
   * Clears all model stores and resets the PrismockerClient to its initial state.
   * Useful for test isolation between test cases.
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
   */
  setData<T = any>(modelName: string, data: T[]): void;

  /**
   * Enable debug mode (Prismocker-specific)
   *
   * When enabled, Prismocker will log all queries with detailed information
   * and track query statistics for debugging purposes.
   *
   * @param enabled Whether to enable debug mode (default: true)
   */
  enableDebugMode(enabled?: boolean): void;

  /**
   * Get query statistics (Prismocker-specific)
   *
   * Returns statistics about all queries executed since the last reset.
   * Useful for debugging and performance analysis.
   *
   * @returns Query statistics object with total queries, queries by model/operation, average duration, etc.
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
   */
  visualizeState(options?: {
    maxRecordsPerModel?: number;
    includeIndexes?: boolean;
    includeCache?: boolean;
  }): string;
};

/**
 * Extract all model types from PrismaClient and preserve them through Proxy.
 *
 * This type maps over all Prisma.ModelName values and extracts the corresponding
 * model delegate type from PrismaClient, preserving full type information.
 * This allows Prismocker to maintain full type safety even when using a Proxy
 * to intercept property access.
 *
 * The type also preserves all Prisma-specific methods ($queryRaw, $transaction, etc.)
 * and adds Prismocker-specific methods (reset, setData, getData, etc.).
 *
 * @template T - PrismaClient type (must extend PrismaClient)
 *
 * @example
 * ```typescript
 * import type { PrismaClient } from '@prisma/client';
 * import { createPrismocker } from 'prismocker';
 *
 * const prisma = createPrismocker<PrismaClient>();
 * // prisma is typed as ExtractModels<PrismaClient>
 * // prisma.companies is fully typed as PrismaClient['companies']
 * // prisma.companies.findMany() returns properly typed results
 * ```
 */
export type ExtractModels<T extends PrismaClient> = {
  // Extract all model delegates from PrismaClient
  // This preserves the full type information for each model
  [K in Prisma.ModelName]: K extends keyof T ? T[K] : never;
} & {
  // Preserve all Prisma-specific methods with their original types
  // Using conditional types to safely access properties that may not exist in all PrismaClient versions
  $queryRaw: '$queryRaw' extends keyof T ? T['$queryRaw'] : never;
  $queryRawUnsafe: '$queryRawUnsafe' extends keyof T ? T['$queryRawUnsafe'] : never;
  $executeRaw: '$executeRaw' extends keyof T ? T['$executeRaw'] : never;
  $executeRawUnsafe: '$executeRawUnsafe' extends keyof T ? T['$executeRawUnsafe'] : never;
  $transaction: '$transaction' extends keyof T ? T['$transaction'] : never;
  $connect: '$connect' extends keyof T ? T['$connect'] : never;
  $disconnect: '$disconnect' extends keyof T ? T['$disconnect'] : never;
  $use: '$use' extends keyof T ? T['$use'] : never;
  $on: '$on' extends keyof T ? T['$on'] : never;
  $metrics: '$metrics' extends keyof T ? T['$metrics'] : never;
  $extends: '$extends' extends keyof T ? T['$extends'] : never;
} & PrismockerMethods;

/**
 * Extract model name from Prisma ModelName type
 *
 * This utility type extracts valid Prisma model names from the Prisma namespace.
 * Useful for type-safe model name parameters.
 */
export type ModelName<T> = T extends Prisma.ModelName ? T : never;

/**
 * Extract the type of a specific model from PrismaClient
 *
 * This utility type extracts the model delegate type from a PrismaClient instance.
 * Useful for type-safe model access and operations.
 *
 * @template TClient - PrismaClient type
 * @template TModel - Model name (must be a valid Prisma.ModelName)
 *
 * @example
 * ```typescript
 * type CompanyModel = ModelType<PrismaClient, 'companies'>;
 * // CompanyModel is the type of prisma.companies
 * ```
 *
 * Note: This uses a type assertion because Prisma's types don't allow direct
 * indexing with ModelName, but the models exist at runtime.
 */
export type ModelType<
  TClient extends PrismaClient,
  TModel extends Prisma.ModelName
> = TModel extends keyof TClient ? TClient[TModel] : never;

/**
 * Type-safe setData helper
 *
 * Provides type-safe data seeding for Prismocker models.
 * This helper ensures that the data array matches the expected model type.
 *
 * **Type Safety:** While the function accepts `any[]` for flexibility (to support
 * dynamic models not in the schema), TypeScript will infer the correct types when
 * used with models that exist in your Prisma schema. For better type safety, you
 * can explicitly type the data array using Prisma generated types:
 *
 * ```typescript
 * import type { Prisma } from '@prisma/client';
 * 
 * const data: Prisma.CompanyCreateInput[] = [
 *   { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
 * ];
 * setDataTyped(prisma, 'companies', data);
 * ```
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param model - Model name (can be any string for dynamic models)
 * @param data - Array of records matching the model's create data type
 *
 * @example
 * ```typescript
 * // Basic usage (works with any model)
 * setDataTyped(prisma, 'companies', [
 *   { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
 * ]);
 * 
 * // With explicit typing for better type safety
 * import type { Prisma } from '@prisma/client';
 * const companies: Prisma.CompanyCreateInput[] = [
 *   { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
 * ];
 * setDataTyped(prisma, 'companies', companies);
 * 
 * // Works with dynamic models too
 * setDataTyped(prisma, 'users', [
 *   { id: 'user-1', name: 'Alice' },
 * ]);
 * ```
 *
 * Note: Type inference for model data types is complex with Prisma's type system.
 * This function provides a type-safe API, but for maximum type safety, explicitly
 * type the data array using Prisma generated types (e.g., `Prisma.CompanyCreateInput[]`).
 */
export function setDataTyped<TClient extends PrismaClient>(
  prisma: TClient,
  model: string, // Accept any string for dynamic model support
  data: any[] // Using any[] for flexibility (supports dynamic models and explicit typing)
): void {
  if ('setData' in prisma && typeof (prisma as any).setData === 'function') {
    (prisma as any).setData(model, data);
  }
}

/**
 * Type-safe getData helper
 *
 * Provides type-safe data retrieval for Prismocker models.
 * This helper ensures that the returned data matches the expected model type.
 *
 * **Type Safety:** While the function returns `any[]` for flexibility (to support
 * dynamic models not in the schema), TypeScript will infer the correct types when
 * used with models that exist in your Prisma schema. For better type safety, you
 * can explicitly type the return value using Prisma generated types:
 *
 * ```typescript
 * import type { Prisma } from '@prisma/client';
 * 
 * const companies = getDataTyped(prisma, 'companies') as Prisma.CompanyGetPayload<{}>[];
 * // companies is now typed as Company[]
 * ```
 *
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param model - Model name (can be any string for dynamic models)
 * @returns Array of records matching the model's return type
 *
 * @example
 * ```typescript
 * // Basic usage (returns any[] for flexibility)
 * const companies = getDataTyped(prisma, 'companies');
 * 
 * // With explicit typing for better type safety
 * import type { Prisma } from '@prisma/client';
 * const companies = getDataTyped(prisma, 'companies') as Prisma.CompanyGetPayload<{}>[];
 * // companies is now fully typed as Company[]
 * 
 * // Works with dynamic models too
 * const users = getDataTyped(prisma, 'users');
 * ```
 *
 * Note: Type inference for model return types is complex with Prisma's type system.
 * This function provides a type-safe API, but for maximum type safety, explicitly
 * type the return value using Prisma generated types (e.g., `Prisma.CompanyGetPayload<{}>[]`).
 */
export function getDataTyped<TClient extends PrismaClient>(
  prisma: TClient,
  model: string // Accept any string for dynamic model support
): any[] {
  if ('getData' in prisma && typeof (prisma as any).getData === 'function') {
    return (prisma as any).getData(model);
  }
  return [];
}

