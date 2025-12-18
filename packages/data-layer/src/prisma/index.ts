/**
 * Prisma Client Exports
 *
 * Exports Prisma Client singleton and related utilities.
 * Also re-exports Prisma types, enums, and table types for convenience.
 */

export { prisma } from './client.ts';
export type { Prisma } from '@heyclaude/database-types/prisma/client';

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
  submission_status,
  form_field_type,
  form_field_icon,
  form_grid_column,
  form_icon_position,
  content_source,
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
  interaction_type,
  follow_action,
  config_format,
  primary_action_type,
  sponsorship_tier,
  contact_action_type,
  contact_category,
  confetti_variant,
  contact_command_icon,
  notification_type,
  notification_priority,
  webhook_source,
  webhook_event_type,
} from '@heyclaude/database-types/prisma';

// Re-export enum value objects for runtime use (e.g., Object.values(), direct access)
// Using namespace import to avoid conflicts with type exports
import * as PrismaEnums from '@heyclaude/database-types/prisma';

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
export const SubmissionStatus = PrismaEnums.submission_status;
export const InteractionType = PrismaEnums.interaction_type;
export const ContactActionType = PrismaEnums.contact_action_type;
export const ContactCategory = PrismaEnums.contact_category;
export const NewsletterSource = PrismaEnums.newsletter_source;
export const UserTier = PrismaEnums.user_tier;
export const FollowAction = PrismaEnums.follow_action;
export const NotificationType = PrismaEnums.notification_type;
export const NotificationPriority = PrismaEnums.notification_priority;
export const WorkplaceType = PrismaEnums.workplace_type;
export const GuideSubcategory = PrismaEnums.guide_subcategory;

// Re-export announcement-related enum types
export type {
  announcement_icon,
  announcement_tag,
  announcement_variant,
  announcement_priority,
} from '@heyclaude/database-types/prisma';

// Re-export commonly used model types directly for convenience
// These are Prisma-generated model types using GetPayload pattern
// Note: Prisma doesn't export simple type aliases - use Prisma.modelNameGetPayload<{}> or modelNameModel
export type {
  changelogModel,
  contentModel,
  jobsModel,
  companiesModel,
  bookmarksModel,
  announcementsModel,
  notificationsModel,
  payment_plan_catalogModel,
  public_usersModel,
  user_collectionsModel,
  collection_itemsModel,
  content_submissionsModel,
  review_ratingsModel,
  review_helpful_votesModel,
  webhook_eventsModel,
  sponsored_contentModel,
} from '@heyclaude/database-types/prisma';

// Re-export JSON types from Prisma namespace
// These are Prisma's built-in JSON types (JsonValue, JsonObject, JsonArray, InputJsonValue)
// The prisma-json-types-generator enhances these types with custom type definitions
export type {
  JsonValue,
  JsonObject,
  JsonArray,
  InputJsonValue,
  InputJsonObject,
  InputJsonArray,
} from '@heyclaude/database-types/prisma';

// Type alias for convenience (JsonValue is the most commonly used JSON type)
// This matches the existing codebase usage of `Json` as an alias for `JsonValue`
import type { JsonValue } from '@heyclaude/database-types/prisma';
export type Json = JsonValue;

// NOTE: PostgreSQL function and composite types are NOT re-exported here to avoid type conflicts.
// Services should import postgres-types directly from '@heyclaude/database-types/postgres-types'.
// This prevents conflicts between Prisma model types (e.g., announcementsModel with Date objects)
// and PostgreSQL composite types (e.g., Announcements with string dates).
// Example: import type { GetActiveNotificationsArgs } from '@heyclaude/database-types/postgres-types';

// Note: Zod schemas are exported from @heyclaude/database-types/prisma/zod
// Import them directly from @heyclaude/database-types/prisma/zod/schemas/enums/*.schema in consuming packages
