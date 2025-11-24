'use server';

import type { RpcClientLike } from '../rpc/run-rpc.ts';
import { createRunRpc } from '../rpc/run-rpc.ts';

// createSupabaseServerClient is server-only, so we use lazy import inside the factory
// to ensure this file can be evaluated (e.g. if imported by client proxy) without side effects.
export const runRpc = createRunRpc<'ensure_user_record'>({
  createClient: async () => {
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    return (await createSupabaseServerClient()) as unknown as RpcClientLike;
  },
});
