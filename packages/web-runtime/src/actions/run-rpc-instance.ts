'use server';

import type { RpcClientLike } from '../rpc/run-rpc.ts';
import { createRunRpc } from '../rpc/run-rpc.ts';

// createSupabaseServerClient is server-only, so we use lazy import inside the factory
// to ensure this file can be evaluated (e.g. if imported by client proxy) without side effects.
export const runRpc = createRunRpc<'ensure_user_record'>({
  createClient: async () => {
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const client = await createSupabaseServerClient();
    // Type compatibility: SupabaseServerClient has an rpc method that matches RpcClientLike interface
    // The rpc method signature is compatible: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
    // We use a type assertion here because TypeScript doesn't recognize the structural compatibility
    return client as unknown as RpcClientLike;
  },
});
