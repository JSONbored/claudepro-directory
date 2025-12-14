'use server';

import { createRunRpc } from '../rpc/run-rpc.ts';

/**
 * RPC instance for server actions
 *
 * Modernized for Prisma - all RPCs go through BasePrismaService.
 * No longer uses Supabase client.
 */
export const runRpc = createRunRpc<'ensure_user_record'>();
