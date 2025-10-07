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
 * Activity summary statistics
 */
export type ActivitySummary = {
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_submissions: number;
  merged_submissions: number;
  total_activity: number;
};

/**
 * Reputation breakdown
 */
export type ReputationBreakdown = {
  from_posts: number;
  from_votes_received: number;
  from_comments: number;
  from_submissions: number;
  total: number;
};
