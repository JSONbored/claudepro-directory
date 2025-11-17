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
 */
export type GetFilterJobsReturn = {
  jobs: Array<DatabaseGenerated['public']['Tables']['jobs']['Row']>;
  total_count: number;
} | null;

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
    Functions: DatabaseGenerated['public']['Functions'] & {
      filter_jobs: {
        Args: {
          p_query?: string | null;
          p_category?: string | null;
          p_employment_type?: string | null;
          p_experience_level?: string | null;
          p_remote_only?: boolean | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: GetFilterJobsReturn;
      };
      query_content_embeddings: {
        Args: {
          query_embedding: string; // JSON stringified vector
          match_threshold?: number;
          match_limit?: number;
          p_categories?: string[] | null;
          p_tags?: string[] | null;
          p_authors?: string[] | null;
          p_offset?: number;
        };
        Returns: Array<{
          _featured: Json;
          author: string;
          author_profile_url: string;
          bookmark_count: number;
          category: string;
          combined_score: number;
          copyCount: number;
          created_at: string;
          date_added: string;
          description: string;
          examples: Json;
          features: Json;
          id: string;
          relevance_score: number;
          slug: string;
          source: string;
          tags: string[];
          title: string;
          updated_at: string;
          use_cases: Json;
          viewCount: number;
        }>;
      };
    };
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
 * Uses DatabaseGenerated directly to ensure proper type inference
 * @example
 * type JobUpdate = TablesUpdate<'jobs'>
 */
export type TablesUpdate<T extends keyof DatabaseGenerated['public']['Tables']> =
  DatabaseGenerated['public']['Tables'][T]['Update'];

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
 * Common enum type aliases (for convenience)
 * Extracted from database enums for easier usage in edge functions
 */
export type WebhookDirection = Enums<'webhook_direction'>;

/**
 * Valid values for webhook_direction enum
 * Source: Database enum definition
 */
export const WEBHOOK_DIRECTION_VALUES = [
  'inbound',
  'outbound',
] as const satisfies readonly WebhookDirection[];

/**
 * Type guard for webhook_direction enum values
 */
export function isWebhookDirection(value: string): value is WebhookDirection {
  return WEBHOOK_DIRECTION_VALUES.includes(value as WebhookDirection);
}

export type SettingType = Enums<'setting_type'>;

/**
 * Setting type values array for runtime use (validation, etc.)
 */
export const SETTING_TYPE_VALUES = [
  'boolean',
  'string',
  'number',
  'json',
] as const satisfies readonly SettingType[];

/**
 * Type guard for setting_type enum values
 */
export function isSettingType(value: string): value is SettingType {
  return SETTING_TYPE_VALUES.includes(value as SettingType);
}

export type WorkplaceType = Enums<'workplace_type'>;

/**
 * Workplace type values array for runtime use (validation, etc.)
 */
export const WORKPLACE_TYPE_VALUES = [
  'Remote',
  'On site',
  'Hybrid',
] as const satisfies readonly WorkplaceType[];

/**
 * Type guard for workplace_type enum values
 */
export function isWorkplaceType(value: string): value is WorkplaceType {
  return WORKPLACE_TYPE_VALUES.includes(value as WorkplaceType);
}

export type ContentCategory = Enums<'content_category'>;

/**
 * Content category values array for runtime use (validation, etc.)
 * Must match database enum: content_category
 * Database values: agents, mcp, rules, commands, hooks, statuslines, skills, collections, guides, jobs, changelog
 */
export const CONTENT_CATEGORY_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const satisfies readonly ContentCategory[];

/**
 * Type guard for content_category enum values
 */
export function isContentCategory(value: string): value is ContentCategory {
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory);
}

/**
 * Alias for CONTENT_CATEGORY_VALUES (backward compatibility)
 * @deprecated Use CONTENT_CATEGORY_VALUES instead
 */
export const VALID_CONTENT_CATEGORIES = CONTENT_CATEGORY_VALUES;

export type JobStatus = Enums<'job_status'>;

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
] as const satisfies readonly JobStatus[];

/**
 * Type guard for job_status enum values
 */
export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUS_VALUES.includes(value as JobStatus);
}

export type SortOption = Enums<'sort_option'>;

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
] as const satisfies readonly SortOption[];

/**
 * Type guard for sort_option enum values
 */
export function isSortOption(value: string): value is SortOption {
  return SORT_OPTION_VALUES.includes(value as SortOption);
}

export type SortDirection = Enums<'sort_direction'>;

/**
 * Sort direction values array for runtime use (validation, etc.)
 * Must match database enum: sort_direction
 * Database values: asc, desc
 */
export const SORT_DIRECTION_VALUES = ['asc', 'desc'] as const satisfies readonly SortDirection[];

/**
 * Type guard for sort_direction enum values
 */
export function isSortDirection(value: string): value is SortDirection {
  return SORT_DIRECTION_VALUES.includes(value as SortDirection);
}

export type SubmissionType = Enums<'submission_type'>;

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
] as const satisfies readonly SubmissionType[];

/**
 * Type guard for submission_type enum values
 */
export function isSubmissionType(value: string): value is SubmissionType {
  return SUBMISSION_TYPE_VALUES.includes(value as SubmissionType);
}

export type SubmissionStatus = Enums<'submission_status'>;

/**
 * Submission status values array for runtime use (validation, etc.)
 * Must match database enum: submission_status
 * Database values: pending, approved, rejected, spam, merged
 */
export const SUBMISSION_STATUS_VALUES = [
  'pending',
  'approved',
  'rejected',
  'spam',
  'merged',
] as const satisfies readonly SubmissionStatus[];

/**
 * Type guard for submission_status enum values
 */
export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return SUBMISSION_STATUS_VALUES.includes(value as SubmissionStatus);
}

export type NewsletterSource = Enums<'newsletter_source'>;

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
] as const satisfies readonly NewsletterSource[];

/**
 * Type guard for newsletter_source enum values
 */
export function isNewsletterSource(value: string): value is NewsletterSource {
  return NEWSLETTER_SOURCE_VALUES.includes(value as NewsletterSource);
}

export type ContactCategory = Enums<'contact_category'>;

/**
 * Contact category values array for runtime use (validation, etc.)
 * Must match database enum: contact_category
 * Database values: bug, feature, partnership, general, other
 */
export const CONTACT_CATEGORY_VALUES = [
  'bug',
  'feature',
  'partnership',
  'general',
  'other',
] as const satisfies readonly ContactCategory[];

/**
 * Type guard for contact_category enum values
 */
export function isContactCategory(value: string): value is ContactCategory {
  return CONTACT_CATEGORY_VALUES.includes(value as ContactCategory);
}

export type ContactActionType = Enums<'contact_action_type'>;

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
] as const satisfies readonly ContactActionType[];

/**
 * Type guard for contact_action_type enum values
 */
export function isContactActionType(value: string): value is ContactActionType {
  return CONTACT_ACTION_TYPE_VALUES.includes(value as ContactActionType);
}

export type TrendingMetric = Enums<'trending_metric'>;

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
] as const satisfies readonly TrendingMetric[];

/**
 * Type guard for trending_metric enum values
 */
export function isTrendingMetric(value: string): value is TrendingMetric {
  return TRENDING_METRIC_VALUES.includes(value as TrendingMetric);
}

export type TrendingPeriod = Enums<'trending_period'>;

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
] as const satisfies readonly TrendingPeriod[];

/**
 * Type guard for trending_period enum values
 */
export function isTrendingPeriod(value: string): value is TrendingPeriod {
  return TRENDING_PERIOD_VALUES.includes(value as TrendingPeriod);
}

export type UseCaseType = Enums<'use_case_type'>;

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
] as const satisfies readonly UseCaseType[];

/**
 * Type guard for use_case_type enum values
 */
export function isUseCaseType(value: string): value is UseCaseType {
  return USE_CASE_TYPE_VALUES.includes(value as UseCaseType);
}

export type ChangelogCategory = Enums<'changelog_category'>;

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
] as const satisfies readonly ChangelogCategory[];

/**
 * Type guard for changelog_category enum values
 */
export function isChangelogCategory(value: string): value is ChangelogCategory {
  return CHANGELOG_CATEGORY_VALUES.includes(value as ChangelogCategory);
}

export type ExperienceLevel = Enums<'experience_level'>;

/**
 * Valid values for experience_level enum
 * Source: Database enum definition
 */
export const EXPERIENCE_LEVEL_VALUES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly ExperienceLevel[];

/**
 * Type guard for experience_level enum values
 */
export function isExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_LEVEL_VALUES.includes(value as ExperienceLevel);
}

export type FocusAreaType = Enums<'focus_area_type'>;

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
] as const satisfies readonly FocusAreaType[];

/**
 * Type guard for focus_area_type enum values
 */
export function isFocusAreaType(value: string): value is FocusAreaType {
  return FOCUS_AREA_TYPE_VALUES.includes(value as FocusAreaType);
}

export type AnnouncementPriority = Enums<'announcement_priority'>;

/**
 * Valid values for announcement_priority enum
 * Source: Database enum definition
 */
export const ANNOUNCEMENT_PRIORITY_VALUES = [
  'high',
  'medium',
  'low',
] as const satisfies readonly AnnouncementPriority[];

/**
 * Type guard for announcement_priority enum values
 */
export function isAnnouncementPriority(value: string): value is AnnouncementPriority {
  return ANNOUNCEMENT_PRIORITY_VALUES.includes(value as AnnouncementPriority);
}

export type AnnouncementVariant = Enums<'announcement_variant'>;

/**
 * Valid values for announcement_variant enum
 * Source: Database enum definition
 */
export const ANNOUNCEMENT_VARIANT_VALUES = [
  'default',
  'outline',
  'secondary',
  'destructive',
] as const satisfies readonly AnnouncementVariant[];

/**
 * Type guard for announcement_variant enum values
 */
export function isAnnouncementVariant(value: string): value is AnnouncementVariant {
  return ANNOUNCEMENT_VARIANT_VALUES.includes(value as AnnouncementVariant);
}

export type ConfettiVariant = Enums<'confetti_variant'>;

/**
 * Valid values for confetti_variant enum
 * Source: Database enum definition
 */
export const CONFETTI_VARIANT_VALUES = [
  'success',
  'celebration',
  'milestone',
  'subtle',
] as const satisfies readonly ConfettiVariant[];

/**
 * Type guard for confetti_variant enum values
 */
export function isConfettiVariant(value: string): value is ConfettiVariant {
  return CONFETTI_VARIANT_VALUES.includes(value as ConfettiVariant);
}

export type NotificationPriority = Enums<'notification_priority'>;

/**
 * Valid values for notification_priority enum
 * Source: Database enum definition
 */
export const NOTIFICATION_PRIORITY_VALUES = [
  'high',
  'medium',
  'low',
] as const satisfies readonly NotificationPriority[];

/**
 * Type guard for notification_priority enum values
 */
export function isNotificationPriority(value: string): value is NotificationPriority {
  return NOTIFICATION_PRIORITY_VALUES.includes(value as NotificationPriority);
}

export type NotificationType = Enums<'notification_type'>;

/**
 * Valid values for notification_type enum
 * Source: Database enum definition
 */
export const NOTIFICATION_TYPE_VALUES = [
  'announcement',
  'feedback',
] as const satisfies readonly NotificationType[];

/**
 * Type guard for notification_type enum values
 */
export function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_TYPE_VALUES.includes(value as NotificationType);
}

export type GuideSubcategory = Enums<'guide_subcategory'>;

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
] as const satisfies readonly GuideSubcategory[];

/**
 * Type guard for guide_subcategory enum values
 */
export function isGuideSubcategory(value: string): value is GuideSubcategory {
  return GUIDE_SUBCATEGORY_VALUES.includes(value as GuideSubcategory);
}

export type IntegrationType = Enums<'integration_type'>;

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
] as const satisfies readonly IntegrationType[];

/**
 * Type guard for integration_type enum values
 */
export function isIntegrationType(value: string): value is IntegrationType {
  return INTEGRATION_TYPE_VALUES.includes(value as IntegrationType);
}

export type UserTier = Enums<'user_tier'>;

/**
 * User tier values array for runtime use (validation, etc.)
 */
export const USER_TIER_VALUES = [
  'free',
  'pro',
  'enterprise',
] as const satisfies readonly UserTier[];

/**
 * Type guard for user_tier enum values
 */
export function isUserTier(value: string): value is UserTier {
  return USER_TIER_VALUES.includes(value as UserTier);
}

export type PaymentStatus = Enums<'payment_status'>;

/**
 * Payment status values array for runtime use (validation, etc.)
 */
export const PAYMENT_STATUS_VALUES = [
  'unpaid',
  'paid',
  'refunded',
] as const satisfies readonly PaymentStatus[];

/**
 * Type guard for payment_status enum values
 */
export function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUS_VALUES.includes(value as PaymentStatus);
}

export type Environment = Enums<'environment'>;

/**
 * Environment values array for runtime use (validation, etc.)
 */
export const ENVIRONMENT_VALUES = [
  'development',
  'preview',
  'production',
] as const satisfies readonly Environment[];

/**
 * Type guard for environment enum values
 */
export function isEnvironment(value: string): value is Environment {
  return ENVIRONMENT_VALUES.includes(value as Environment);
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
 * Returns weekly digest data including new content and trending items for email campaigns.
 *
 * @see {@link https://claudepro.directory} Weekly digest emails sent every Monday
 */
export type GetWeeklyDigestReturn = {
  /** Formatted week range string (e.g., "December 2-8, 2025") */
  weekOf: string;
  /** ISO date string for week start (YYYY-MM-DD) */
  weekStart: string;
  /** ISO date string for week end (YYYY-MM-DD) */
  weekEnd: string;
  /** Array of new content items added during the week (top 5) */
  newContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    date_added: string; // ISO timestamp
    url: string; // Full URL: https://claudepro.directory/{category}/{slug}
  }>;
  /** Array of trending content items (top 3) */
  trendingContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    url: string; // Full URL: https://claudepro.directory/{category}/{slug}
    viewCount: number; // Total views from get_trending_metrics
  }>;
};

/**
 * get_due_sequence_emails RPC return type
 * Returns array of due email sequence items that need to be processed.
 *
 * Used for onboarding email sequence automation - fetches emails that are due
 * to receive their next sequence step.
 *
 * @see {@link https://claudepro.directory} Email sequence automation
 */
export type GetDueSequenceEmailsReturn = Array<{
  /** UUID of the email sequence schedule record */
  id: string;
  /** Email address of the recipient */
  email: string;
  /** Step number in the sequence (2-5 for onboarding sequence) */
  step: number;
}>;

/**
 * get_company_profile RPC return type
 * Returns company profile with active jobs and statistics
 *
 * Structure:
 * - company: Full company row from companies table
 * - active_jobs: Array of active job listings (subset of job fields)
 * - stats: Company job statistics from company_job_stats view
 *
 * Returns NULL if company not found (slug doesn't exist or owner_id IS NULL)
 */
export type GetCompanyProfileReturn = {
  company: Tables<'companies'>;
  active_jobs: Array<{
    id: string;
    slug: string;
    title: string;
    company: string;
    company_logo: string | null;
    location: string | null;
    description: string | null;
    salary: string | null;
    remote: boolean;
    type: string | null;
    workplace: string | null;
    experience: string | null;
    category: string | null;
    tags: string[];
    tier: string | null;
    posted_at: string;
    expires_at: string | null;
    view_count: number;
    click_count: number;
    link: string;
  }>;
  stats: {
    total_jobs: number | null;
    active_jobs: number | null;
    featured_jobs: number | null;
    remote_jobs: number | null;
    avg_salary_min: number | null;
    total_views: number | null;
    total_clicks: number | null;
    click_through_rate: number | null;
    latest_job_posted_at: string | null;
  };
} | null;

/**
 * reorder_collection_items RPC return type
 * Returns result of reordering collection items with batch update status
 *
 * Structure:
 * - Success case: { success: true, updated: number, errors: Array<{ itemId, error }> }
 * - Failure case: { success: false, error: string, updated: 0 }
 *
 * The errors array contains items that failed during batch update.
 * Empty array [] if all items updated successfully.
 */
export type ReorderCollectionItemsReturn =
  | {
      success: true;
      updated: number;
      errors: Array<{
        itemId: string;
        error: string;
      }>;
    }
  | {
      success: false;
      error: string;
      updated: 0;
    };

/**
 * generate_metadata_complete RPC return type
 * Returns SEO metadata and optional JSON-LD schemas based on route pattern
 *
 * Structure:
 * - When p_include = 'metadata': Returns metadata object only
 * - When p_include includes 'schemas': Returns { metadata: {...}, schemas: [...] }
 *
 * Function never returns NULL (always returns a JSONB object)
 */
export type GenerateMetadataCompleteReturn =
  | {
      title: string;
      description: string;
      keywords: string[];
      openGraphType: 'profile' | 'website';
      twitterCard: 'summary_large_image';
      robots: {
        index: boolean;
        follow: boolean;
      };
      _debug?: {
        pattern: string;
        route: string;
        category?: string;
        slug?: string;
        error?: string;
      };
    }
  | {
      metadata: {
        title: string;
        description: string;
        keywords: string[];
        openGraphType: 'profile' | 'website';
        twitterCard: 'summary_large_image';
        robots: {
          index: boolean;
          follow: boolean;
        };
        _debug?: {
          pattern: string;
          route: string;
          category?: string;
          slug?: string;
          error?: string;
        };
      };
      schemas: Json[];
    };

/**
 * get_api_health RPC return type
 * Returns API health status with database connectivity and table checks
 *
 * Structure:
 * - status: Overall health status (healthy/degraded/unhealthy)
 * - timestamp: ISO timestamp of health check
 * - apiVersion: API version string (currently '1.0.0')
 * - checks: Individual health check results for database, content table, and category configs
 *
 * Status determination:
 * - healthy: All checks pass
 * - degraded: Some checks fail (contentTable or categoryConfigs)
 * - unhealthy: Database connectivity fails
 *
 * Note: Function always returns a result (never NULL)
 */
export type GetApiHealthReturn = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiVersion: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency: number;
      error?: string;
    };
    contentTable: {
      status: 'ok' | 'error';
      count: number;
      error?: string;
    };
    categoryConfigs: {
      status: 'ok' | 'error';
      count: number;
      error?: string;
    };
  };
};

/**
 * generate_markdown_export RPC return type
 * Returns markdown export for a content item with optional metadata and footer
 *
 * Structure:
 * - Success case: { success: true, markdown: string, filename: string, length: number, content_id: string }
 * - Failure case: { success: false, error: string }
 *
 * Function always returns a result (never NULL)
 * Markdown field is always a string (text type in PostgreSQL)
 * Filename format: "{slug}.md"
 * Length is the character count of the generated markdown
 */
export type GenerateMarkdownExportReturn =
  | {
      success: true;
      markdown: string;
      filename: string;
      length: number;
      content_id: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * generate_readme_data RPC return type
 * Returns structured data for README.md generation
 *
 * Structure:
 * - categories: Array of category configurations with items
 * - totalCount: Total number of content items across all categories
 * - categoryBreakdown: Record mapping category names to item counts
 *
 * Categories filtered to: agents, mcp, hooks, commands, rules, skills, statuslines, collections
 * Items are sorted by title within each category.
 *
 * Note: Function always returns a result (never NULL)
 */
export type GenerateReadmeDataReturn = {
  categories: Array<{
    category: string;
    title: string;
    description: string;
    icon_name: string;
    url_slug: string;
    items: Array<{
      slug: string;
      title: string;
      description: string;
    }>;
  }>;
  totalCount: number;
  categoryBreakdown: Record<string, number>;
};

/**
 * get_app_settings RPC return type
 * Returns a key-value map of app settings with metadata.
 *
 * Keys are setting_key values, values contain setting metadata including
 * the actual setting value, type, description, category, environment, etc.
 *
 * Note: This RPC is not currently used by the application codebase.
 * The application uses Statsig Dynamic Configs instead. This type definition
 * is provided for completeness and potential future use.
 *
 * @see {@link https://claudepro.directory} App settings configuration
 */
export type GetAppSettingsReturn = Record<
  string,
  {
    /** The actual setting value (can be any JSON-serializable value) */
    value: Json;
    /** The type of the setting value */
    type: SettingType;
    /** Human-readable description of the setting */
    description: string | null;
    /** Category grouping for the setting */
    category: string | null;
    /** Environment where this setting applies (null = all environments) */
    environment: Environment | null;
    /** Whether this setting is currently enabled (always true in return) */
    enabled: boolean;
    /** Version number for the setting */
    version: number;
  }
>;
