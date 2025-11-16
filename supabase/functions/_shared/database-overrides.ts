/**
 * Database Type Overrides for Edge Functions
 *
 * Provides cleaner type definitions and helper types for Supabase edge functions.
 * Similar to src/types/database-overrides.ts but tailored for edge function usage.
 *
 * This file is NOT auto-generated and should be manually maintained.
 */

import { supabaseAnon, supabaseServiceRole } from './clients/supabase.ts';
import type { Database as DatabaseGenerated } from './database.types.ts';
import type { ExtendedDatabase } from './database-extensions.types.ts';

/**
 * Database type with proper overrides for edge functions
 *
 * Uses intersection type to combine DatabaseGenerated with pgmq_public schema
 * This ensures Supabase's type system can properly infer RPC functions and table operations
 * while also supporting pgmq_public schema operations
 */
export type Database = DatabaseGenerated & {
  pgmq_public: ExtendedDatabase['pgmq_public'];
};

/**
 * Re-export Json type for convenience
 */
export type { Json } from './database.types.ts';

/**
 * Table row helper type
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type Job = Tables<'jobs'>
 */
export type Tables<T extends keyof DatabaseGenerated['public']['Tables']> =
  DatabaseGenerated['public']['Tables'][T]['Row'];

/**
 * Table insert helper type
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type JobInsert = TablesInsert<'jobs'>
 */
export type TablesInsert<T extends keyof DatabaseGenerated['public']['Tables']> =
  DatabaseGenerated['public']['Tables'][T]['Insert'];

/**
 * Table update helper type
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type JobUpdate = TablesUpdate<'jobs'>
 */
export type TablesUpdate<T extends keyof DatabaseGenerated['public']['Tables']> =
  DatabaseGenerated['public']['Tables'][T]['Update'];

/**
 * RPC function Args helper type
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type BuildJobEmbedArgs = RpcArgs<'build_job_discord_embed'>
 */
export type RpcArgs<T extends keyof DatabaseGenerated['public']['Functions']> =
  DatabaseGenerated['public']['Functions'][T]['Args'];

/**
 * RPC function Returns helper type
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type BuildJobEmbedReturn = RpcReturns<'build_job_discord_embed'>
 */
export type RpcReturns<T extends keyof DatabaseGenerated['public']['Functions']> =
  DatabaseGenerated['public']['Functions'][T]['Returns'];

/**
 * Enum helper type
 * @example
 * type JobStatus = Enums<'job_status'>
 */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

/**
 * Type-safe table insert helper function
 * Properly types the insert operation to avoid 'never' inference
 */
export function insertTable<T extends keyof DatabaseGenerated['public']['Tables']>(
  table: T,
  data: DatabaseGenerated['public']['Tables'][T]['Insert']
) {
  // Use satisfies to validate data type, then use the client directly
  // Return the query builder so callers can chain .select(), .single(), etc.
  const validatedData = data satisfies DatabaseGenerated['public']['Tables'][T]['Insert'];
  // The Supabase client may infer 'never' but we validate the data type with satisfies
  // This ensures type safety while working around Supabase's type inference limitations
  // We use a type assertion here because Supabase's type system has a known limitation
  // where it infers 'never' for valid table operations. The data is validated with satisfies.
  type InsertBuilder = {
    insert: (values: DatabaseGenerated['public']['Tables'][T]['Insert']) => {
      select: (columns?: string) => {
        single: <R>() => Promise<{ data: R | null; error: unknown }>;
      };
    };
  };
  // Type assertion needed due to Supabase client type inference limitation
  // Data is validated with satisfies, but client infers 'never' - this is a known Supabase limitation
  return (supabaseServiceRole.from(table) as unknown as InsertBuilder).insert(validatedData);
}

/**
 * Type-safe table update helper function
 * Properly types the update operation to avoid 'never' inference
 */
export async function updateTable<T extends keyof DatabaseGenerated['public']['Tables']>(
  table: T,
  data: DatabaseGenerated['public']['Tables'][T]['Update'],
  id: string
): Promise<{ error: unknown }> {
  // Use satisfies to validate data type, then use the client directly
  const validatedData = data satisfies DatabaseGenerated['public']['Tables'][T]['Update'];
  // The Supabase client may infer 'never' but we validate the data type with satisfies
  // Type assertion needed due to Supabase client type inference limitation
  // Data is validated with satisfies, but client infers 'never' - this is a known Supabase limitation
  type UpdateBuilder = {
    update: (values: DatabaseGenerated['public']['Tables'][T]['Update']) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
  return (supabaseServiceRole.from(table) as unknown as UpdateBuilder)
    .update(validatedData)
    .eq('id', id);
}

/**
 * Type-safe table upsert helper function
 * Properly types the upsert operation to avoid 'never' inference
 */
export async function upsertTable<T extends keyof DatabaseGenerated['public']['Tables']>(
  table: T,
  data:
    | DatabaseGenerated['public']['Tables'][T]['Insert']
    | DatabaseGenerated['public']['Tables'][T]['Insert'][]
): Promise<{ error: unknown }> {
  // Use satisfies to validate data type, then use the client directly
  const validatedData = data satisfies
    | DatabaseGenerated['public']['Tables'][T]['Insert']
    | DatabaseGenerated['public']['Tables'][T]['Insert'][];
  // The Supabase client may infer 'never' but we validate the data type with satisfies
  // Type assertion needed due to Supabase client type inference limitation
  // Data is validated with satisfies, but client infers 'never' - this is a known Supabase limitation
  type UpsertBuilder = {
    upsert: (
      values:
        | DatabaseGenerated['public']['Tables'][T]['Insert']
        | DatabaseGenerated['public']['Tables'][T]['Insert'][]
    ) => Promise<{ error: unknown }>;
  };
  return (supabaseServiceRole.from(table) as unknown as UpsertBuilder).upsert(validatedData);
}

/**
 * Type-safe RPC call helper function
 * Properly types the RPC call to avoid 'undefined' inference
 */
export async function callRpc<T extends keyof DatabaseGenerated['public']['Functions']>(
  functionName: T,
  args: DatabaseGenerated['public']['Functions'][T]['Args'],
  useAnon = false
): Promise<{
  data: DatabaseGenerated['public']['Functions'][T]['Returns'] | null;
  error: unknown;
}> {
  const client = useAnon ? supabaseAnon : supabaseServiceRole;
  // Use satisfies to validate args type, then use the client directly
  const validatedArgs = args satisfies DatabaseGenerated['public']['Functions'][T]['Args'];
  // The Supabase client may infer 'undefined' but we validate the args type with satisfies
  // Type assertion needed due to Supabase client type inference limitation
  // Args are validated with satisfies, but client infers 'undefined' - this is a known Supabase limitation
  type RpcClient = {
    rpc: <T extends keyof DatabaseGenerated['public']['Functions']>(
      name: T,
      args: DatabaseGenerated['public']['Functions'][T]['Args']
    ) => Promise<{
      data: DatabaseGenerated['public']['Functions'][T]['Returns'] | null;
      error: unknown;
    }>;
  };
  return (client as unknown as RpcClient).rpc(functionName, validatedArgs);
}
