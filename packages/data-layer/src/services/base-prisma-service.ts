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
// Extract TransactionClient type from prisma.$transaction method
// This avoids namespace import issues while still getting the correct type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
        const namedParams = argNames.length > 0
          ? argNames.map((name, i) => `${name} => $${i + 1}`).join(', ')
          : '';
        const query = argNames.length === 0
          ? `SELECT * FROM ${functionName}()`
          : `SELECT * FROM ${functionName}(${namedParams})`;

        const result = await prisma.$queryRawUnsafe(query, ...argValues);

        // Prisma $queryRawUnsafe always returns arrays for SELECT * FROM function()
        // Handle unwrapping based on returnType option
        if (!Array.isArray(result)) {
          return result as T;
        }

        // Determine if we should unwrap single-element arrays
        const shouldUnwrap = returnType === 'single' || 
          (returnType === 'auto' && result.length === 1 && 
           typeof result[0] === 'object' && 
           !Array.isArray(result[0]) &&
           // Simple heuristic: functions with 'list', 'search', or returning arrays typically return arrays
           !functionName.includes('list') && 
           !functionName.includes('search') &&
           !functionName.includes('_content'));

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
    callback: (tx: TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}
