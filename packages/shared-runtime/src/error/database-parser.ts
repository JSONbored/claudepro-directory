/**
 * Database Error Parser - PostgreSQL constraint violations → user-friendly messages
 * Replaces Zod validation layer by parsing CHECK constraint names.
 */

import { Constants } from '@heyclaude/database-types';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Constraint name → user-friendly error message mapping
 * Generated from database CHECK constraints
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Bookmarks
  bookmarks_notes_length: 'Bookmark notes must be 500 characters or less',
  bookmarks_content_slug_pattern: 'Invalid content reference format',

  // Content
  content_slug_pattern: 'Slug must be 3-100 lowercase characters (letters, numbers, hyphens only)',
  content_category_check: `Invalid category. Must be one of: ${Constants.public.Enums.content_category.join(', ')}`,
  content_avg_rating_check: 'Rating must be between 0 and 5',
  content_download_url_check: 'Download URL must start with /downloads/ or https://',
  content_guide_subcategory_check: `Guide subcategory must be one of: ${Constants.public.Enums.guide_subcategory.join(', ')}`,

  // Profiles
  profiles_display_name_check: 'Display name must be 1-100 characters',
  profiles_bio_check: 'Bio must be 500 characters or less',
  profiles_website_check: 'Website must be a valid URL (http:// or https://)',
  profiles_social_x_link_check: 'Social link must be a valid URL (http:// or https://)',
  profiles_work_check: 'Work info must be 100 characters or less',
  profiles_interests_check: 'Maximum 10 interests allowed',
  profiles_total_bookmarks_check: 'Invalid bookmark count',
  profiles_total_submissions_check: 'Invalid submission count',
  profiles_total_views_check: 'Invalid view count',

  // Collections
  user_collections_name_length: 'Collection name must be 2-100 characters',
  user_collections_description_length: 'Collection description must be 500 characters or less',
  user_collections_slug_pattern:
    'Collection slug must be 2-100 lowercase characters (letters, numbers, hyphens only)',
  collection_items_notes_length: 'Item notes must be 500 characters or less',
  collection_items_order_min: 'Display order must be 0 or greater',

  // Newsletter
  newsletter_subscriptions_email_check: 'Invalid email format',
  newsletter_subscriptions_status_check:
    'Invalid status. Must be one of: active, unsubscribed, bounced, complained (newsletter_subscription_status ENUM)',

  // Review Ratings
  review_ratings_rating_range: 'Rating must be between 1 and 5',
  review_ratings_review_text_length: 'Review text must be 2000 characters or less',
  review_ratings_helpful_count_check: 'Invalid helpful count',

  // Interactions
  user_interactions_interaction_type_check: 'Invalid interaction type',
  user_interactions_content_type_check: 'Invalid content type',

  // Submissions
  content_submissions_name_check: 'Name must be 2-100 characters',
  content_submissions_description_check: 'Description must be 10-500 characters',
  content_submissions_author_check: 'Author name must be 2-100 characters',
  content_submissions_github_url_check: 'GitHub URL must start with https://github.com/',
  content_submissions_github_pr_url_check: 'GitHub PR URL format is invalid',
  content_submissions_spam_score_check: 'Invalid spam score',

  // Notifications
  notifications_title_check: 'Title must be 5-100 characters',
  notifications_message_check: 'Message must be 10-500 characters',
  notifications_id_check: 'ID must contain only lowercase letters, numbers, and hyphens',
  notifications_action_label_check: 'Action label must be 50 characters or less',
  notifications_icon_check: 'Icon name must be 50 characters or less',

  // Changelog
  changelog_title_check: 'Title must be at least 3 characters',
  changelog_description_check: 'Description must be 10-500 characters',
  changelog_slug_check: 'Slug must be 3-100 lowercase characters (letters, numbers, hyphens only)',
  changelog_version_check: 'Version must follow semver format (e.g., v1.0.0)',

  // Posts
  posts_title_length: 'Title must be 3-300 characters',
  posts_content_length: 'Content must be 5000 characters or less',

  // Jobs
  jobs_payment_method_check: 'Invalid payment method',
};

/**
 * PostgreSQL error code → generic error message mapping
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists', // unique_violation
  '23503': 'Referenced record does not exist', // foreign_key_violation
  '23514': 'Invalid data provided', // check_violation (fallback)
  '23502': 'Required field is missing', // not_null_violation
  '22001': 'Text is too long', // string_data_right_truncation
  '22P02': 'Invalid data format', // invalid_text_representation
  '42501': 'Permission denied', // insufficient_privilege
  '42P01': 'Table or view does not exist', // undefined_table
  PGRST116: 'No data found', // PostgREST specific
};

/**
 * Parse PostgreSQL/Supabase error and return user-friendly message
 */
export function parseDatabaseError(error: PostgrestError): Error {
  // Extract constraint name from error message
  const constraintMatch = error.message.match(/constraint "([^"]+)"/);

  if (constraintMatch?.[1]) {
    const constraintName = constraintMatch[1];
    const friendlyMessage = CONSTRAINT_MESSAGES[constraintName];

    if (friendlyMessage) {
      return new Error(friendlyMessage);
    }
  }

  // Fallback to error code mapping
  if (error.code) {
    const codeMessage = ERROR_CODE_MESSAGES[error.code];
    if (codeMessage) {
      return new Error(codeMessage);
    }
  }

  // Final fallback: return original error message
  return new Error(error.message || 'An unexpected error occurred');
}

/**
 * Type guard for PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
