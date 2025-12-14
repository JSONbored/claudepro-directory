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
import { prisma } from '../prisma/client.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';
import { withSmartCache } from '../utils/request-cache.ts';
import type { Prisma } from '../../../generators/dist/prisma/index.js';

/**
 * Base class for Prisma-based services
 *
 * Provides:
 * - RPC wrapper for calling PostgreSQL functions
 * - Raw SQL execution for complex queries
 * - Error handling and logging
 * - Request-scoped caching (via withSmartCache)
 *
 * @example
 * ```typescript
 * export class CompaniesPrismaService extends BasePrismaService {
 *   async getCompanyProfile(slug: string) {
 *     // Option 1: Use Prisma query directly
 *     return prisma.companies.findUnique({
 *       where: { slug },
 *     });
 *
 *     // Option 2: Use RPC wrapper for complex RPCs
 *     return this.callRpc('get_company_profile', { p_slug: slug });
 *   }
 * }
 * ```
 */
export abstract class BasePrismaService {
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
    }
  ): Promise<T> {
    const { useCache = true, methodName } = options || {};

    const rpcCall = async (): Promise<T> => {
      try {
        // Convert args to PostgreSQL function call format
        // PostgreSQL functions use named parameters (e.g., p_slug, p_user_id)
        const argNames = Object.keys(args);
        const argValues = Object.values(args);

        if (argNames.length === 0) {
          // No arguments - simple function call
          const query = `SELECT * FROM ${functionName}()`;
          const result = await prisma.$queryRawUnsafe(query);
          return Array.isArray(result) && result.length === 1
            ? (result[0] as T)
            : (result as T);
        }

        // Build parameterized query with named parameters
        // PostgreSQL supports both positional ($1, $2) and named parameters
        // We'll use positional for compatibility
        const placeholders = argNames.map((_, i) => `$${i + 1}`).join(', ');
        const query = `SELECT * FROM ${functionName}(${placeholders})`;

        const result = await prisma.$queryRawUnsafe(query, ...argValues);

        // Handle different return types:
        // - Single row: return the row
        // - Multiple rows: return array
        // - Composite type: return as-is
        if (Array.isArray(result)) {
          if (result.length === 1) {
            return result[0] as T;
          }
          return result as T;
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
   * @param query - SQL query string with placeholders ($1, $2, etc.)
   * @param params - Parameters for the query
   * @returns Query result
   *
   * @example
   * ```typescript
   * const result = await this.executeRaw<{ count: bigint }[]>(
   *   'SELECT COUNT(*) as count FROM content WHERE category = $1',
   *   'agents'
   * );
   * ```
   */
  protected async executeRaw<T = unknown>(
    query: string,
    ...params: unknown[]
  ): Promise<T> {
    try {
      return (await prisma.$queryRawUnsafe(query, ...params)) as T;
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
   * @param callback - Transaction callback that receives Prisma transaction client
   * @returns Result from the transaction
   *
   * @example
   * ```typescript
   * const result = await this.transaction(async (tx) => {
   *   const company = await tx.companies.create({ data: {...} });
   *   await tx.jobs.create({ data: { company_id: company.id, ...} });
   *   return company;
   * });
   * ```
   */
  protected async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}
