'use server';

import type { RpcClientLike } from '../rpc/run-rpc.ts';
import { createRunRpc } from '../rpc/run-rpc.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

export const runRpc = createRunRpc<'ensure_user_record'>({
  createClient: async () =>
    (await createSupabaseServerClient()) as unknown as RpcClientLike,
});
