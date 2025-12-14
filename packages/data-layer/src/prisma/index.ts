/**
 * Prisma Client Exports
 *
 * Exports Prisma Client singleton and related utilities.
 * Also re-exports Prisma types, enums, and table types for convenience.
 */

export { prisma } from './client.ts';
export type { Prisma } from '../../../generators/dist/prisma/index.js';

// Re-export commonly used enum types directly
export type {
  content_category,
  job_type,
  job_category,
  job_status,
  job_tier,
  job_plan,
  experience_level,
  workplace_type,
  sort_option,
  trending_period,
  submission_type,
  form_field_type,
  form_grid_column,
  form_icon_position,
  copy_type,
  newsletter_interest,
  newsletter_source,
  newsletter_subscription_status,
  oauth_provider,
  user_role,
  user_tier,
  changelog_category,
  changelog_source,
  focus_area_type,
  integration_type,
  use_case_type,
  config_format,
  primary_action_type,
} from '../../../generators/dist/prisma/index.js';

// Re-export enum value objects for runtime use (e.g., Object.values(), direct access)
// Using namespace import to avoid conflicts with type exports
import * as PrismaEnums from '../../../generators/dist/prisma/index.js';

export const ContentCategory = PrismaEnums.content_category;
export const ConfigFormat = PrismaEnums.config_format;
export const PrimaryActionType = PrismaEnums.primary_action_type;
export const ChangelogCategory = PrismaEnums.changelog_category;
export const ChangelogSource = PrismaEnums.changelog_source;
export const JobType = PrismaEnums.job_type;
export const JobCategory = PrismaEnums.job_category;
export const ExperienceLevel = PrismaEnums.experience_level;
export const FocusAreaType = PrismaEnums.focus_area_type;
export const IntegrationType = PrismaEnums.integration_type;
export const UseCaseType = PrismaEnums.use_case_type;
export const SubmissionType = PrismaEnums.submission_type;

// Re-export announcement-related enum types
export type {
  announcement_icon,
  announcement_tag,
  announcement_variant,
  announcement_priority,
} from '../../../generators/dist/prisma/index.js';

// Re-export commonly used table types directly (for convenience)
// Note: Only export types that actually exist in Prisma generated types
export type {
  sponsored_content,
  app_settings,
  email_engagement_summary,
  email_blocklist,
  notifications,
  email_sequences,
  newsletter_subscriptions,
  jobs,
  content,
  companies,
  public_users,
  collection_items,
  bookmarks,
  content_votes,
  changelog,
  user_collections,
  announcements,
  payment_plan_catalog,
} from '../../../generators/dist/prisma/index.js';
