/**
 * Activity Schema
 * Types and schemas for user activity tracking
 */

import { z } from 'zod';

/**
 * Activity type enum
 */
export const activityTypeSchema = z.enum(['post', 'comment', 'vote', 'submission']);

export type ActivityType = z.infer<typeof activityTypeSchema>;

/**
 * Activity filter schema
 */
export const activityFilterSchema = z.object({
  type: activityTypeSchema.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type ActivityFilter = z.infer<typeof activityFilterSchema>;

/**
 * Base activity item
 */
export type BaseActivity = {
  id: string;
  type: ActivityType;
  created_at: string;
};

/**
 * Post activity
 */
export type PostActivity = BaseActivity & {
  type: 'post';
  title: string;
  url: string | null;
  vote_count: number;
  comment_count: number;
};

/**
 * Comment activity
 */
export type CommentActivity = BaseActivity & {
  type: 'comment';
  content: string;
  post_id: string;
  post_title: string;
};

/**
 * Vote activity
 */
export type VoteActivity = BaseActivity & {
  type: 'vote';
  post_id: string;
  post_title: string;
};

/**
 * Submission activity
 */
export type SubmissionActivity = BaseActivity & {
  type: 'submission';
  content_type: string;
  content_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  pr_url: string | null;
};

/**
 * Union type for all activities
 */
export type Activity = PostActivity | CommentActivity | VoteActivity | SubmissionActivity;

/**
 * Activity summary statistics schema
 */
export const activitySummarySchema = z.object({
  total_posts: z.number().int().nonnegative(),
  total_comments: z.number().int().nonnegative(),
  total_votes: z.number().int().nonnegative(),
  total_submissions: z.number().int().nonnegative(),
  merged_submissions: z.number().int().nonnegative(),
  total_activity: z.number().int().nonnegative(),
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;

/**
 * Post activity schema
 */
export const postActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.literal('post'),
  title: z.string(),
  url: z.string().nullable(),
  vote_count: z.number().int().nonnegative(),
  comment_count: z.number().int().nonnegative(),
  created_at: z.string(),
});

/**
 * Comment activity schema
 */
export const commentActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.literal('comment'),
  content: z.string(),
  post_id: z.string().uuid(),
  post_title: z.string(),
  created_at: z.string(),
});

/**
 * Vote activity schema
 */
export const voteActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.literal('vote'),
  post_id: z.string().uuid(),
  post_title: z.string(),
  created_at: z.string(),
});

/**
 * Submission activity schema
 */
export const submissionActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.literal('submission'),
  content_type: z.string(),
  content_name: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'merged']),
  pr_url: z.string().nullable(),
  created_at: z.string(),
});

/**
 * Activity union schema
 */
export const activitySchema = z.discriminatedUnion('type', [
  postActivitySchema,
  commentActivitySchema,
  voteActivitySchema,
  submissionActivitySchema,
]);

/**
 * Activity timeline response schema
 */
export const activityTimelineResponseSchema = z.object({
  activities: z.array(activitySchema),
  hasMore: z.boolean(),
});

export type ActivityTimelineResponse = z.infer<typeof activityTimelineResponseSchema>;

/**
 * Reputation breakdown schema
 */
export const reputationBreakdownSchema = z.object({
  from_posts: z.number().int().nonnegative(),
  from_votes_received: z.number().int().nonnegative(),
  from_comments: z.number().int().nonnegative(),
  from_submissions: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export type ReputationBreakdown = z.infer<typeof reputationBreakdownSchema>;
