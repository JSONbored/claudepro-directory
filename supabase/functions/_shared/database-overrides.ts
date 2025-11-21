/**
 * Database Type Overrides for Edge Functions
 *
 * Provides cleaner type definitions and helper types for Supabase edge functions.
 * Similar to src/types/database-overrides.ts but tailored for edge function usage.
 *
 * This file is NOT auto-generated and should be manually maintained.
 */

import { supabaseAnon, supabaseServiceRole } from './clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from './database.types.ts';
import type { ExtendedDatabase } from './database-extensions.types.ts';

/**
 * filter_jobs RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['Functions']['filter_jobs']['Returns']
 */

/**
 * get_category_configs_with_features RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['CompositeTypes']['category_config_with_features'][]
 */

/**
 * Database type with proper overrides for edge functions
 *
 * Uses intersection type to combine DatabaseGenerated with pgmq_public schema
 * This ensures Supabase's type system can properly infer RPC functions and table operations
 * while also supporting pgmq_public schema operations
 *
 * Also includes function overrides for better type safety
 */
export type Database = DatabaseGenerated & {
  pgmq_public: ExtendedDatabase['pgmq_public'];
  public: DatabaseGenerated['public'] & {
    Enums: DatabaseGenerated['public']['Enums'];
    Tables: DatabaseGenerated['public']['Tables'];
    Functions: DatabaseGenerated['public']['Functions'];
  };
};

/**
 * Re-export Json type for convenience
 */
export type { Json };

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
 * Uses Database type to include extended fields (e.g., mcpb_storage_url, etc.)
 * @example
 * type JobUpdate = TablesUpdate<'jobs'>
 * type ContentUpdate = TablesUpdate<'content'> // Includes mcpb_storage_url, mcpb_build_hash, mcpb_last_built_at
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * RPC function Args helper type
 * Uses Database type to support overridden functions
 * @example
 * type BuildJobEmbedArgs = RpcArgs<'build_job_discord_embed'>
 * type FilterJobsArgs = RpcArgs<'filter_jobs'>
 */
export type RpcArgs<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Args'];

/**
 * RPC function Returns helper type
 * Uses Database type to support overridden functions
 * @example
 * type BuildJobEmbedReturn = RpcReturns<'build_job_discord_embed'>
 * type FilterJobsReturn = RpcReturns<'filter_jobs'>
 */
export type RpcReturns<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns'];

/**
 * Enum helper type
 * @example
 * type JobStatus = Enums<'job_status'>
 */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

/**
 * All ENUM types should be accessed directly via Database['public']['Enums']['enum_name']
 * No convenience aliases - use exact naming for consistency
 */

/**
 * Valid values for webhook_direction enum
 * Source: Database enum definition
 */
export const WEBHOOK_DIRECTION_VALUES = [
  'inbound',
  'outbound',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['webhook_direction'][];

/**
 * Type guard for webhook_direction enum values
 */
export function isWebhookDirection(
  value: string
): value is DatabaseGenerated['public']['Enums']['webhook_direction'] {
  return WEBHOOK_DIRECTION_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['webhook_direction']
  );
}

// WorkplaceType removed - use Database['public']['Enums']['workplace_type'] directly

/**
 * Workplace type values array for runtime use (validation, etc.)
 */
export const WORKPLACE_TYPE_VALUES = [
  'Remote',
  'On site',
  'Hybrid',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['workplace_type'][];

/**
 * Type guard for workplace_type enum values
 */
export function isWorkplaceType(
  value: string
): value is DatabaseGenerated['public']['Enums']['workplace_type'] {
  return WORKPLACE_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['workplace_type']
  );
}

// JobStatus removed - use Database['public']['Enums']['job_status'] directly

/**
 * Job status values array for runtime use (validation, etc.)
 * Must match database enum: job_status
 * Database values: draft, pending_payment, pending_review, active, expired, rejected, deleted
 */
export const JOB_STATUS_VALUES = [
  'draft',
  'pending_payment',
  'pending_review',
  'active',
  'expired',
  'rejected',
  'deleted',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['job_status'][];

/**
 * Type guard for job_status enum values
 */
export function isJobStatus(
  value: string
): value is DatabaseGenerated['public']['Enums']['job_status'] {
  return JOB_STATUS_VALUES.includes(value as DatabaseGenerated['public']['Enums']['job_status']);
}

// SortOption removed - use Database['public']['Enums']['sort_option'] directly

/**
 * Sort option values array for runtime use (validation, etc.)
 * Must match database enum: sort_option
 * Database values: relevance, date, popularity, name, updated, created, views, trending
 */
export const SORT_OPTION_VALUES = [
  'relevance',
  'date',
  'popularity',
  'name',
  'updated',
  'created',
  'views',
  'trending',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['sort_option'][];

/**
 * Type guard for sort_option enum values
 */
export function isSortOption(
  value: string
): value is DatabaseGenerated['public']['Enums']['sort_option'] {
  return SORT_OPTION_VALUES.includes(value as DatabaseGenerated['public']['Enums']['sort_option']);
}

// SortDirection removed - use Database['public']['Enums']['sort_direction'] directly

/**
 * Sort direction values array for runtime use (validation, etc.)
 * Must match database enum: sort_direction
 * Database values: asc, desc
 */
export const SORT_DIRECTION_VALUES = [
  'asc',
  'desc',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['sort_direction'][];

/**
 * Type guard for sort_direction enum values
 */
export function isSortDirection(
  value: string
): value is DatabaseGenerated['public']['Enums']['sort_direction'] {
  return SORT_DIRECTION_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['sort_direction']
  );
}

// SubmissionType removed - use Database['public']['Enums']['submission_type'] directly

/**
 * Submission type values array for runtime use (validation, etc.)
 * Must match database enum: submission_type
 * Database values: agents, mcp, rules, commands, hooks, statuslines, skills
 */
export const SUBMISSION_TYPE_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['submission_type'][];

/**
 * Type guard for submission_type enum values
 */
export function isSubmissionType(
  value: string
): value is DatabaseGenerated['public']['Enums']['submission_type'] {
  return SUBMISSION_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['submission_type']
  );
}

// NewsletterSource removed - use Database['public']['Enums']['newsletter_source'] directly

/**
 * Newsletter source values array for runtime use (validation, etc.)
 * Must match database enum: newsletter_source
 * Database values: footer, homepage, modal, content_page, inline, post_copy, resend_import, oauth_signup
 */
export const NEWSLETTER_SOURCE_VALUES = [
  'footer',
  'homepage',
  'modal',
  'content_page',
  'inline',
  'post_copy',
  'resend_import',
  'oauth_signup',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['newsletter_source'][];

/**
 * Type guard for newsletter_source enum values
 */
export function isNewsletterSource(
  value: string
): value is DatabaseGenerated['public']['Enums']['newsletter_source'] {
  return NEWSLETTER_SOURCE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['newsletter_source']
  );
}

// ContactActionType removed - use Database['public']['Enums']['contact_action_type'] directly

/**
 * Valid values for contact_action_type enum
 * Source: Database enum definition
 */
export const CONTACT_ACTION_TYPE_VALUES = [
  'internal',
  'external',
  'route',
  'sheet',
  'easter-egg',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['contact_action_type'][];

/**
 * Type guard for contact_action_type enum values
 */
export function isContactActionType(
  value: string
): value is DatabaseGenerated['public']['Enums']['contact_action_type'] {
  return CONTACT_ACTION_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['contact_action_type']
  );
}

// TrendingMetric removed - use Database['public']['Enums']['trending_metric'] directly

/**
 * Valid values for trending_metric enum
 * Source: Database enum definition
 */
export const TRENDING_METRIC_VALUES = [
  'views',
  'likes',
  'shares',
  'downloads',
  'all',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['trending_metric'][];

/**
 * Type guard for trending_metric enum values
 */
export function isTrendingMetric(
  value: string
): value is DatabaseGenerated['public']['Enums']['trending_metric'] {
  return TRENDING_METRIC_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['trending_metric']
  );
}

// TrendingPeriod removed - use Database['public']['Enums']['trending_period'] directly

/**
 * Valid values for trending_period enum
 * Source: Database enum definition
 */
export const TRENDING_PERIOD_VALUES = [
  'today',
  'week',
  'month',
  'year',
  'all',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['trending_period'][];

/**
 * Type guard for trending_period enum values
 */
export function isTrendingPeriod(
  value: string
): value is DatabaseGenerated['public']['Enums']['trending_period'] {
  return TRENDING_PERIOD_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['trending_period']
  );
}

// UseCaseType removed - use Database['public']['Enums']['use_case_type'] directly

/**
 * Valid values for use_case_type enum
 * Source: Database enum definition
 */
export const USE_CASE_TYPE_VALUES = [
  'code-review',
  'api-development',
  'frontend-development',
  'data-science',
  'content-creation',
  'devops-infrastructure',
  'general-development',
  'testing-qa',
  'security-audit',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['use_case_type'][];

/**
 * Type guard for use_case_type enum values
 */
export function isUseCaseType(
  value: string
): value is DatabaseGenerated['public']['Enums']['use_case_type'] {
  return USE_CASE_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['use_case_type']
  );
}

// ChangelogCategory removed - use Database['public']['Enums']['changelog_category'] directly

/**
 * Valid values for changelog_category enum
 * Source: Database enum definition
 */
export const CHANGELOG_CATEGORY_VALUES = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['changelog_category'][];

/**
 * Type guard for changelog_category enum values
 */
export function isChangelogCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['changelog_category'] {
  return CHANGELOG_CATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['changelog_category']
  );
}

// ExperienceLevel removed - use Database['public']['Enums']['experience_level'] directly

/**
 * Valid values for experience_level enum
 * Source: Database enum definition
 */
export const EXPERIENCE_LEVEL_VALUES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['experience_level'][];

/**
 * Type guard for experience_level enum values
 */
export function isExperienceLevel(
  value: string
): value is DatabaseGenerated['public']['Enums']['experience_level'] {
  return EXPERIENCE_LEVEL_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['experience_level']
  );
}

// FocusAreaType removed - use Database['public']['Enums']['focus_area_type'] directly

/**
 * Valid values for focus_area_type enum
 * Source: Database enum definition
 */
export const FOCUS_AREA_TYPE_VALUES = [
  'security',
  'performance',
  'documentation',
  'testing',
  'code-quality',
  'automation',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['focus_area_type'][];

/**
 * Type guard for focus_area_type enum values
 */
export function isFocusAreaType(
  value: string
): value is DatabaseGenerated['public']['Enums']['focus_area_type'] {
  return FOCUS_AREA_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['focus_area_type']
  );
}

// ConfettiVariant removed - use Database['public']['Enums']['confetti_variant'] directly

/**
 * Valid values for confetti_variant enum
 * Source: Database enum definition
 */
export const CONFETTI_VARIANT_VALUES = [
  'success',
  'celebration',
  'milestone',
  'subtle',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['confetti_variant'][];

/**
 * Type guard for confetti_variant enum values
 */
export function isConfettiVariant(
  value: string
): value is DatabaseGenerated['public']['Enums']['confetti_variant'] {
  return CONFETTI_VARIANT_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['confetti_variant']
  );
}

// NotificationPriority removed - use Database['public']['Enums']['notification_priority'] directly

/**
 * Valid values for notification_priority enum
 * Source: Database enum definition
 */
export const NOTIFICATION_PRIORITY_VALUES = [
  'high',
  'medium',
  'low',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['notification_priority'][];

/**
 * Type guard for notification_priority enum values
 */
export function isNotificationPriority(
  value: string
): value is DatabaseGenerated['public']['Enums']['notification_priority'] {
  return NOTIFICATION_PRIORITY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['notification_priority']
  );
}

// NotificationType removed - use Database['public']['Enums']['notification_type'] directly

/**
 * Valid values for notification_type enum
 * Source: Database enum definition
 */
export const NOTIFICATION_TYPE_VALUES = [
  'announcement',
  'feedback',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['notification_type'][];

/**
 * Type guard for notification_type enum values
 */
export function isNotificationType(
  value: string
): value is DatabaseGenerated['public']['Enums']['notification_type'] {
  return NOTIFICATION_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['notification_type']
  );
}

// GuideSubcategory removed - use Database['public']['Enums']['guide_subcategory'] directly

/**
 * Valid values for guide_subcategory enum
 * Source: Database enum definition
 */
export const GUIDE_SUBCATEGORY_VALUES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['guide_subcategory'][];

/**
 * Type guard for guide_subcategory enum values
 */
export function isGuideSubcategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['guide_subcategory'] {
  return GUIDE_SUBCATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['guide_subcategory']
  );
}

// IntegrationType removed - use Database['public']['Enums']['integration_type'] directly

/**
 * Valid values for integration_type enum
 * Source: Database enum definition
 */
export const INTEGRATION_TYPE_VALUES = [
  'github',
  'database',
  'cloud-aws',
  'cloud-gcp',
  'cloud-azure',
  'communication',
  'none',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['integration_type'][];

/**
 * Type guard for integration_type enum values
 */
export function isIntegrationType(
  value: string
): value is DatabaseGenerated['public']['Enums']['integration_type'] {
  return INTEGRATION_TYPE_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['integration_type']
  );
}

// UserTier removed - use Database['public']['Enums']['user_tier'] directly

/**
 * User tier values array for runtime use (validation, etc.)
 */
export const USER_TIER_VALUES = [
  'free',
  'pro',
  'enterprise',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['user_tier'][];

/**
 * Type guard for user_tier enum values
 */
export function isUserTier(
  value: string
): value is DatabaseGenerated['public']['Enums']['user_tier'] {
  return USER_TIER_VALUES.includes(value as DatabaseGenerated['public']['Enums']['user_tier']);
}

// PaymentStatus removed - use Database['public']['Enums']['payment_status'] directly

/**
 * Payment status values array for runtime use (validation, etc.)
 */
export const PAYMENT_STATUS_VALUES = [
  'unpaid',
  'paid',
  'refunded',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['payment_status'][];

/**
 * Type guard for payment_status enum values
 */
export function isPaymentStatus(
  value: string
): value is DatabaseGenerated['public']['Enums']['payment_status'] {
  return PAYMENT_STATUS_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['payment_status']
  );
}

/**
 * Type-safe table insert helper function
 * Properly types the insert operation to avoid 'never' inference
 * Returns a query builder that supports chaining .select(), .single(), etc.
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
  // Direct call without double cast - preserves actual query builder methods
  // Type assertion via unknown to match actual Supabase PostgrestFilterBuilder structure
  // At runtime, this returns a query builder with .select() method that chains to .single()
  // We cast the entire from().insert() chain to bypass type inference while preserving runtime behavior
  return (
    supabaseServiceRole.from(table) as unknown as {
      insert: (values: DatabaseGenerated['public']['Tables'][T]['Insert']) => {
        select: (columns?: string) => {
          single: <R>() => Promise<{ data: R | null; error: unknown }>;
        };
      };
    }
  ).insert(validatedData);
}

/**
 * Type-safe table update helper function
 * Properly types the update operation to avoid 'never' inference
 * Uses Database type to include extended fields (e.g., mcpb_storage_url, etc.)
 */
export async function updateTable<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Update'],
  id: string
): Promise<{ error: unknown }> {
  // Use satisfies to validate data type, then use the client directly
  const validatedData = data satisfies Database['public']['Tables'][T]['Update'];
  // The Supabase client may infer 'never' but we validate the data type with satisfies
  // Type assertion needed due to Supabase client type inference limitation
  // Data is validated with satisfies, but client infers 'never' - this is a known Supabase limitation
  type UpdateBuilder = {
    update: (values: Database['public']['Tables'][T]['Update']) => {
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
 * Type-safe RPC call helper function with timeout and circuit breaker
 * Properly types the RPC call to avoid 'undefined' inference
 */
export async function callRpc<T extends keyof Database['public']['Functions']>(
  functionName: T,
  args: Database['public']['Functions'][T]['Args'],
  useAnon = false,
  options?: {
    timeoutMs?: number;
    useCircuitBreaker?: boolean;
  }
): Promise<{
  data: Database['public']['Functions'][T]['Returns'] | null;
  error: unknown;
}> {
  // Lazy import to avoid circular dependencies
  // Files are now included via static type imports above
  const { withTimeout, TIMEOUT_PRESETS } = await import('./utils/timeout.ts');
  const { withCircuitBreaker, CIRCUIT_BREAKER_CONFIGS } = await import(
    './utils/circuit-breaker.ts'
  );

  const timeoutMs = options?.timeoutMs ?? TIMEOUT_PRESETS.rpc;
  const useCircuitBreaker = options?.useCircuitBreaker ?? true;

  const executeRpc = async () => {
    const client = useAnon ? supabaseAnon : supabaseServiceRole;
    // Use satisfies to validate args type, then use the client directly
    const validatedArgs = args satisfies Database['public']['Functions'][T]['Args'];
    // The Supabase client may infer 'undefined' but we validate the args type with satisfies
    // Type assertion needed due to Supabase client type inference limitation
    // Args are validated with satisfies, but client infers 'undefined' - this is a known Supabase limitation
    type RpcClient = {
      rpc: <T extends keyof Database['public']['Functions']>(
        name: T,
        args: Database['public']['Functions'][T]['Args']
      ) => Promise<{
        data: Database['public']['Functions'][T]['Returns'] | null;
        error: unknown;
      }>;
    };
    return (client as unknown as RpcClient).rpc(functionName, validatedArgs);
  };

  const rpcPromise = useCircuitBreaker
    ? withCircuitBreaker(`rpc:${String(functionName)}`, executeRpc, CIRCUIT_BREAKER_CONFIGS.rpc)
    : executeRpc();

  try {
    return await withTimeout(rpcPromise, timeoutMs, `RPC call ${String(functionName)} timed out`);
  } catch (error) {
    // If timeout or circuit breaker error, return error response
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.message.includes('Circuit breaker'))
    ) {
      return {
        data: null,
        error,
      };
    }
    throw error;
  }
}

/**
 * get_weekly_digest RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['Functions']['get_weekly_digest']['Returns']
 */

/**
 * get_company_profile RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['CompositeTypes']['company_profile_result']
 */

/**
 * reorder_collection_items RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['Functions']['reorder_collection_items']['Returns']
 */

/**
 * generate_metadata_complete RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['Functions']['generate_metadata_complete']['Returns'] (Json)
 */

/**
 * generate_readme_data RPC return type
 * REMOVED: Now using generated type from database.types.ts
 * Use: DatabaseGenerated['public']['Functions']['generate_readme_data']['Returns'] (Json)
 */
