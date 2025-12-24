// Note: RPC function types come from postgres-types generator - RPC names are just strings
import { logActionFailure } from '../errors.ts';
import { toLogContextValue } from '../logger.ts';
import { BasePrismaService } from '@heyclaude/data-layer';

export interface RunRpcContext {
  action: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Prisma-based RPC wrapper
 *
 * Modernized for Prisma - uses BasePrismaService.callRpc() internally.
 * All RPCs go through Prisma's $queryRaw for PostgreSQL function calls.
 */
class PrismaRpcService extends BasePrismaService {
  /**
   * Call RPC function via Prisma
   *
   * Uses BasePrismaService.callRpc() which executes PostgreSQL functions
   * via Prisma's $queryRaw. Automatically detects mutations and disables caching.
   */
  async callRpcForAction<ResultType>(
    rpcName: string,
    args: Record<string, unknown>,
    context: RunRpcContext
  ): Promise<ResultType> {
    try {
      // Detect mutations - these don't use caching
      const isMutation =
        rpcName.includes('insert') ||
        rpcName.includes('update') ||
        rpcName.includes('delete') ||
        rpcName.includes('create') ||
        rpcName.includes('remove') ||
        rpcName.includes('ensure') ||
        rpcName.includes('toggle') ||
        rpcName.includes('add') ||
        rpcName.includes('remove');

      const result = await this.callRpc<ResultType>(rpcName, args, {
        methodName: context.action,
        useCache: !isMutation,
      });
      return result;
    } catch (error) {
      // Format error with context for logging
      const dbQueryContext: Record<string, unknown> = {
        rpcName: String(rpcName),
        args: toLogContextValue(args),
      };
      throw logActionFailure(context.action, error, {
        dbQuery: toLogContextValue(dbQueryContext),
        ...(context.userId && { userId: context.userId }),
        ...(context.meta
          ? Object.fromEntries(
              Object.entries(context.meta).map(([k, v]) => [k, toLogContextValue(v)])
            )
          : {}),
      });
    }
  }
}

// Singleton instance for RPC service
const rpcService = new PrismaRpcService();

/**
 * Create a runRpc function for server actions
 *
 * Modernized for Prisma - all RPCs go through BasePrismaService.
 * Uses Prisma client for database operations.
 */
export function createRunRpc<TExtraRpc extends string = never>() {
  return async function runRpc<ResultType>(
    rpcName: string | TExtraRpc,
    args: Record<string, unknown>,
    context: RunRpcContext
  ): Promise<ResultType> {
    return rpcService.callRpcForAction<ResultType>(rpcName as string, args, context);
  };
}
