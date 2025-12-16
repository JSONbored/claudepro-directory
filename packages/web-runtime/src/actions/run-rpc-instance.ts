'use server';

import { createRunRpc } from '../rpc/run-rpc.ts';

/**
 * RPC instance for server actions
 *
 * Modernized for Prisma - all RPCs go through BasePrismaService.
 * Uses Prisma client for database operations.
 */
export const runRpc = createRunRpc<'ensure_user_record'>();
