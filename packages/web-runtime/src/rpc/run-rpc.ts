import type { Database } from '@heyclaude/database-types';
import { logActionFailure, normalizeError } from '../errors.ts';
import { toLogContextValue } from '../logger.ts';
export interface RpcClientLike {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{
    data: unknown;
    error: unknown;
  }>;
}

export interface RunRpcContext {
  action: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

export interface RunRpcDependencies {
  createClient: () => Promise<RpcClientLike>;
}

export function createRunRpc<TExtraRpc extends string = never>({
  createClient,
}: RunRpcDependencies) {
  return async function runRpc<ResultType>(
    rpcName: keyof Database['public']['Functions'] | TExtraRpc,
    args: Record<string, unknown>,
    context: RunRpcContext
  ): Promise<ResultType> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc(rpcName as string, args);
      if (error) {
        throw normalizeError(error, `RPC ${String(rpcName)} failed`);
      }
      return data as ResultType;
    } catch (error) {
      // Use dbQuery serializer for consistent database query formatting
      // Convert dbQuery object to LogContextValue-compatible structure
      const dbQueryContext: Record<string, unknown> = {
        rpcName: String(rpcName),
        args: toLogContextValue(args), // Convert args to LogContextValue-compatible type
      };
      throw logActionFailure(context.action, error, {
        dbQuery: toLogContextValue(dbQueryContext),
        ...(context.userId && { userId: context.userId }),
        ...(context.meta ? Object.fromEntries(
          Object.entries(context.meta).map(([k, v]) => [k, toLogContextValue(v)])
        ) : {}),
      });
    }
  };
}
