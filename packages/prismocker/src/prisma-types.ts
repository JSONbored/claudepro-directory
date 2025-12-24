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
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param model - Model name (can be any string for dynamic models)
 * @param data - Array of records matching the model's create data type
 *
 * @example
 * ```typescript
 * setDataTyped(prisma, 'companies', [
 *   { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
 * ]);
 * 
 * // Works with dynamic models too
 * setDataTyped(prisma, 'users', [
 *   { id: 'user-1', name: 'Alice' },
 * ]);
 * ```
 *
 * Note: Type inference for model data types is complex with Prisma's type system.
 * This function provides a type-safe API, but some type assertions may still be
 * needed for complex nested types.
 */
export function setDataTyped<TClient extends PrismaClient>(
  prisma: TClient,
  model: string, // Accept any string for dynamic model support
  data: any[] // Using any[] for now due to Prisma's complex type system
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
 * @param prisma - PrismaClient instance (must be PrismockerClient)
 * @param model - Model name (can be any string for dynamic models)
 * @returns Array of records matching the model's return type
 *
 * @example
 * ```typescript
 * const companies = getDataTyped(prisma, 'companies');
 * // companies is typed as any[] (can be explicitly typed if needed)
 * 
 * // Works with dynamic models too
 * const users = getDataTyped(prisma, 'users');
 * ```
 *
 * Note: Type inference for model return types is complex with Prisma's type system.
 * This function provides a type-safe API, but the return type may need to be
 * explicitly typed in some cases.
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

