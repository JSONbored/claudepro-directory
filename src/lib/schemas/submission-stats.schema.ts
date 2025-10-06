/**
 * Submission Stats Schemas
 * Zod validation for submission statistics and leaderboard data
 */

import { z } from 'zod';
import { nonNegativeInt } from './primitives/base-numbers';
import { nonEmptyString } from './primitives/base-strings';

/**
 * Submission statistics schema
 */
export const submissionStatsSchema = z.object({
  total: nonNegativeInt.describe('Total number of submissions'),
  pending: nonNegativeInt.describe('Number of pending submissions'),
  mergedThisWeek: nonNegativeInt.describe('Number of submissions merged this week'),
});

export type SubmissionStats = z.infer<typeof submissionStatsSchema>;

/**
 * Recent merged submission schema
 */
export const recentMergedSchema = z.object({
  id: z.string().uuid().describe('Submission ID'),
  content_name: nonEmptyString.describe('Name of the submitted content'),
  content_type: z
    .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'])
    .describe('Type of content'),
  merged_at: z.string().datetime().describe('When the submission was merged'),
  user: z
    .object({
      name: nonEmptyString.describe('User name'),
      slug: nonEmptyString.describe('User profile slug'),
    })
    .nullable()
    .describe('User who submitted'),
});

export type RecentMerged = z.infer<typeof recentMergedSchema>;

/**
 * Top contributor schema
 */
export const topContributorSchema = z.object({
  rank: nonNegativeInt.min(1).describe('Contributor rank (1-based)'),
  name: nonEmptyString.describe('Contributor name'),
  slug: nonEmptyString.describe('Contributor profile slug'),
  mergedCount: nonNegativeInt.describe('Number of merged submissions'),
});

export type TopContributor = z.infer<typeof topContributorSchema>;

/**
 * Template data schema
 */
export const templateDataSchema = z
  .object({
    id: nonEmptyString.describe('Template identifier'),
    name: nonEmptyString.describe('Template name'),
    description: nonEmptyString.describe('Template description'),
    category: nonEmptyString.describe('Template category'),
    tags: nonEmptyString.describe('Comma-separated tags'),
  })
  .passthrough(); // Allow type-specific fields

export type TemplateData = z.infer<typeof templateDataSchema>;
