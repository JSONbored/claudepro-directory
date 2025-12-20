/**
 * Base Prisma Service Class
 *
 * Provides common Prisma operations and RPC wrapper for Prisma-based services.
 * This base class matches the interface pattern of existing Supabase-based services.
 *
 * Note: Prisma doesn't have native RPC support, so we use $queryRaw for RPC calls.
 * Most complex RPCs will stay as SQL (via this wrapper), while simple queries
 * can be converted to Prisma queries directly.
 */

// Import prisma from data-layer/prisma export
import { prisma as defaultPrisma } from '../prisma/client.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';
import { withSmartCache } from '../utils/request-cache.ts';
import type { Prisma, PrismaClient } from '@prisma/client';
// Extract TransactionClient type from prisma.$transaction method
// This avoids namespace import issues while still getting the correct type
type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Base class for Prisma-based services
 *
 * Provides:
 * - RPC wrapper for calling PostgreSQL functions
 * - Raw SQL execution for complex queries
 * - Error handling and logging
 * - Request-scoped caching (via withSmartCache)
 *
 * Supports both singleton Prisma client (default) and injected Prisma client (for Cloudflare Workers).
 *
 * @example
 * ```typescript
 * // Default: Uses singleton Prisma client
 * export class CompaniesPrismaService extends BasePrismaService {
 *   async getCompanyProfile(slug: string) {
 *     return this.callRpc('get_company_profile', { p_slug: slug });
 *   }
 * }
 *
 * // With injected Prisma client (for Cloudflare Workers)
 * export class CompaniesPrismaService extends BasePrismaService {
 *   constructor(prismaClient?: PrismaClient) {
 *     super(prismaClient);
 *   }
 *   async getCompanyProfile(slug: string) {
 *     return this.callRpc('get_company_profile', { p_slug: slug });
 *   }
 * }
 * ```
 */
export abstract class BasePrismaService {
  /**
   * Prisma client instance
   * Uses injected client if provided, otherwise falls back to singleton
   */
  protected readonly prisma: PrismaClient;

  /**
   * Constructor
   *
   * @param prismaClient - Optional Prisma client instance (for Cloudflare Workers)
   *                       If not provided, uses the singleton Prisma client
   */
  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }
  /**
   * Call PostgreSQL RPC function
   *
   * Note: Prisma doesn't have native RPC support, so we use $queryRaw.
   * This wrapper provides the same interface as Supabase's `supabase.rpc()`.
   *
   * @param functionName - Name of the PostgreSQL function (e.g., 'get_company_profile')
   * @param args - Arguments to pass to the function
   * @param options - Optional configuration
   * @returns Result from the RPC function
   *
   * @example
   * ```typescript
   * const result = await this.callRpc('get_company_profile', {
   *   p_slug: 'acme-corp',
   * });
   * ```
   */
  protected async callRpc<T = unknown>(
    functionName: string,
    args: Record<string, unknown> = {},
    options?: {
      useCache?: boolean;
      methodName?: string;
      /** Return type pattern: 'array' for SETOF functions, 'single' for composite types, 'auto' to detect */
      returnType?: 'array' | 'single' | 'auto';
    }
  ): Promise<T> {
    const { useCache = true, methodName, returnType = 'auto' } = options || {};

    const rpcCall = async (): Promise<T> => {
      try {
        // Convert args to PostgreSQL function call format
        // PostgreSQL functions use named parameters (e.g., p_slug, p_user_id)
        const argNames = Object.keys(args);
        const argValues = Object.values(args);

        // Build parameterized query with named parameters using PostgreSQL's => syntax
        // This ensures parameters are passed in the correct order regardless of object key order
        // Format: function_name(p_param1 => $1, p_param2 => $2, ...)
        const namedParams =
          argNames.length > 0 ? argNames.map((name, i) => `${name} => $${i + 1}`).join(', ') : '';
        const query =
          argNames.length === 0
            ? `SELECT * FROM ${functionName}()`
            : `SELECT * FROM ${functionName}(${namedParams})`;

        const result = await this.prisma.$queryRawUnsafe(query, ...argValues);

        // Prisma $queryRawUnsafe always returns arrays for SELECT * FROM function()
        // Handle unwrapping based on returnType option
        if (!Array.isArray(result)) {
          return result as T;
        }

        // Handle empty arrays for single-return functions
        if (result.length === 0) {
          // For single-return functions, empty array means no data - return undefined
          // For array-return functions, empty array is valid - return []
          const isArrayReturn =
            returnType === 'array' ||
            (returnType === 'auto' &&
              (functionName.includes('list') ||
                functionName.includes('search') ||
                functionName.includes('_content')));
          if (!isArrayReturn) {
            return undefined as T;
          }
          return result as T;
        }

        // Determine if we should unwrap single-element arrays
        // Heuristic: functions with 'list' in name typically return arrays
        // Functions with 'search' can return either arrays OR composite types (objects)
        // We check if result[0] is a primitive (string, number, boolean) or object (not array) to determine if it's a single return
        // If result[0] is an object (not array), it's a composite type and should be unwrapped even for 'search' functions
        const shouldUnwrap =
          returnType === 'single' ||
          (returnType === 'auto' &&
            result.length === 1 &&
            // Allow unwrapping for primitives (string, number, boolean) or objects (not arrays)
            (typeof result[0] !== 'object' || (typeof result[0] === 'object' && !Array.isArray(result[0]))) &&
            // Simple heuristic: functions with 'list' typically return arrays
            // Functions with 'search' can return composite types (objects) which should be unwrapped
            // Only exclude unwrapping if result[0] is an array (indicating array return type)
            !(functionName.includes('list') && Array.isArray(result[0])));
            // Note: We allow unwrapping for 'search' functions if result[0] is an object (composite type)
            // This fixes issues with search_content_optimized, search_unified which return composite types

        if (shouldUnwrap && result.length === 1) {
          return result[0] as T;
        }

        return result as T;
      } catch (error) {
        logRpcError(error, {
          rpcName: functionName,
          operation: methodName || 'callRpc',
          args,
        });
        throw error;
      }
    };

    // Use smart cache for read-only operations
    if (useCache) {
      return withSmartCache(functionName, methodName || functionName, rpcCall, args);
    }

    return rpcCall();
  }

  /**
   * Execute raw SQL query
   *
   * Use this for complex queries that can't be expressed with Prisma's query builder.
   * Always use parameterized queries to prevent SQL injection.
   *
   * OPTIMIZATION: Type-safe wrapper for $queryRawUnsafe with better error handling.
   *
   * @param query - SQL query string with placeholders ($1, $2, etc.)
   * @param params - Parameters for the query
   * @returns Query result with proper typing
   *
   * @example
   * ```typescript
   * const result = await this.executeRaw<Array<{ count: bigint }>>(
   *   'SELECT COUNT(*) as count FROM content WHERE category = $1',
   *   'agents'
   * );
   * ```
   */
  protected async executeRaw<T = unknown>(query: string, ...params: unknown[]): Promise<T> {
    try {
      // OPTIMIZATION: Explicit type assertion for better type safety
      // Prisma $queryRawUnsafe returns unknown[], so we assert to T
      const result = await this.prisma.$queryRawUnsafe(query, ...params);
      return result as T;
    } catch (error) {
      logRpcError(error, {
        rpcName: 'executeRaw',
        operation: 'BasePrismaService.executeRaw',
        args: { query: query.substring(0, 100) }, // Log first 100 chars only
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   *
   * Use this for operations that need to be atomic.
   *
   * OPTIMIZATION: Added timeout configuration to prevent hanging transactions.
   *
   * @param callback - Transaction callback that receives Prisma transaction client
   * @param options - Optional transaction configuration
   * @returns Result from the transaction
   *
   * @example
   * ```typescript
   * const result = await this.transaction(async (tx) => {
   *   const company = await tx.companies.create({ data: {...} });
   *   await tx.jobs.create({ data: { company_id: company.id, ...} });
   *   return company;
   * }, { timeout: 10000 }); // 10 second timeout
   * ```
   */
  protected async transaction<T>(
    callback: (tx: TransactionClient) => Promise<T>,
    options?: {
      /** Maximum time (in milliseconds) the transaction can run before timing out */
      timeout?: number;
      /** Isolation level for the transaction */
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    // OPTIMIZATION: Add timeout to prevent hanging transactions
    // Default timeout: 30 seconds (matches query timeout)
    const timeout = options?.timeout ?? 30000;

    // Build transaction options, only including isolationLevel if provided
    const transactionOptions: {
      maxWait: number;
      timeout: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    } = {
      maxWait: timeout, // Maximum time to wait for a transaction slot
      timeout, // Maximum time the transaction can run
    };

    // Only add isolationLevel if provided (handles undefined properly with exactOptionalPropertyTypes)
    if (options?.isolationLevel !== undefined) {
      transactionOptions.isolationLevel = options.isolationLevel;
    }

    return this.prisma.$transaction(callback, transactionOptions);
  }
}
