import type { Database } from '@heyclaude/database-types';
import { logActionFailure, normalizeError } from '../errors.ts';
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
      throw logActionFailure(context.action, error, {
        rpc: rpcName,
        userId: context.userId,
        ...(context.meta ?? {}),
      });
    }
  };
}
