/**
 * Domain Events
 *
 * Type-safe domain event definitions for the application.
 * Events represent significant state changes and trigger side effects.
 *
 * Production Standards:
 * - Zod schemas for runtime validation
 * - Past-tense naming (represents something that happened)
 * - Immutable event data
 * - Rich metadata for audit trails
 *
 * Event Categories:
 * - User Events: user.created, user.updated, user.deleted
 * - Content Events: content.created, content.updated, content.viewed
 * - Email Events: email.captured, email.subscribed, email.bounced
 * - Submission Events: submission.created, submission.merged
 * - Analytics Events: analytics.tracked, analytics.error
 *
 * @module lib/events/domain-events
 */

import { z } from 'zod';
import { createTypedEventEmitter } from './event-bus';

// =====================================================
// EVENT SCHEMAS
// =====================================================

/**
 * User Events
 */
export const UserCreatedEventSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  provider: z.enum(['email', 'github', 'google']).optional(),
  createdAt: z.date(),
});

export const UserUpdatedEventSchema = z.object({
  userId: z.string().uuid(),
  changes: z.record(z.string(), z.unknown()),
  updatedAt: z.date(),
});

export const UserDeletedEventSchema = z.object({
  userId: z.string().uuid(),
  deletedAt: z.date(),
  reason: z.string().optional(),
});

/**
 * Email Events
 */
export const EmailCapturedEventSchema = z.object({
  email: z.string().email(),
  source: z.enum(['footer', 'modal', 'inline', 'post_copy', 'homepage', 'content_page']),
  contentType: z.string().optional(),
  contentSlug: z.string().optional(),
  referrer: z.string().optional(),
  capturedAt: z.date(),
});

export const EmailSubscribedEventSchema = z.object({
  email: z.string().email(),
  contactId: z.string().optional(),
  source: z.string(),
  lists: z.array(z.string()).optional(),
  subscribedAt: z.date(),
});

export const EmailBouncedEventSchema = z.object({
  email: z.string().email(),
  bounceType: z.enum(['hard', 'soft', 'unknown']),
  bounceCount: z.number().int(),
  error: z.string().optional(),
  bouncedAt: z.date(),
});

export const EmailComplainedEventSchema = z.object({
  email: z.string().email(),
  feedbackType: z.string().optional(),
  complainedAt: z.date(),
});

/**
 * Content Events
 */
export const ContentViewedEventSchema = z.object({
  contentType: z.enum([
    'agent',
    'mcp',
    'command',
    'rule',
    'hook',
    'statusline',
    'collection',
    'guide',
  ]),
  contentSlug: z.string(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  referrer: z.string().optional(),
  viewedAt: z.date(),
});

export const ContentCreatedEventSchema = z.object({
  contentType: z.string(),
  contentId: z.string(),
  contentSlug: z.string(),
  authorId: z.string().uuid(),
  createdAt: z.date(),
});

export const ContentUpdatedEventSchema = z.object({
  contentType: z.string(),
  contentId: z.string(),
  contentSlug: z.string(),
  changes: z.record(z.string(), z.unknown()),
  updatedBy: z.string().uuid(),
  updatedAt: z.date(),
});

/**
 * Submission Events
 */
export const SubmissionCreatedEventSchema = z.object({
  submissionId: z.string().uuid(),
  userId: z.string().uuid(),
  contentType: z.enum(['agents', 'mcp_servers', 'commands', 'rules', 'hooks', 'statuslines']),
  contentName: z.string(),
  createdAt: z.date(),
});

export const SubmissionApprovedEventSchema = z.object({
  submissionId: z.string().uuid(),
  userId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  approvedAt: z.date(),
});

export const SubmissionRejectedEventSchema = z.object({
  submissionId: z.string().uuid(),
  userId: z.string().uuid(),
  rejectedBy: z.string().uuid(),
  reason: z.string().optional(),
  rejectedAt: z.date(),
});

export const SubmissionMergedEventSchema = z.object({
  submissionId: z.string().uuid(),
  userId: z.string().uuid(),
  prUrl: z.string().url(),
  mergedBy: z.string().uuid(),
  mergedAt: z.date(),
});

/**
 * Vote Events
 */
export const VoteCreatedEventSchema = z.object({
  voteId: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  createdAt: z.date(),
});

export const VoteRemovedEventSchema = z.object({
  voteId: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  removedAt: z.date(),
});

/**
 * Comment Events
 */
export const CommentCreatedEventSchema = z.object({
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  content: z.string(),
  createdAt: z.date(),
});

export const CommentUpdatedEventSchema = z.object({
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  updatedAt: z.date(),
});

export const CommentDeletedEventSchema = z.object({
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  deletedAt: z.date(),
});

/**
 * Badge Events
 */
export const BadgeEarnedEventSchema = z.object({
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  badgeName: z.string(),
  earnedAt: z.date(),
});

/**
 * Reputation Events
 */
export const ReputationChangedEventSchema = z.object({
  userId: z.string().uuid(),
  previousReputation: z.number().int(),
  newReputation: z.number().int(),
  change: z.number().int(),
  reason: z.string(),
  changedAt: z.date(),
});

/**
 * Analytics Events
 */
export const AnalyticsTrackedEventSchema = z.object({
  eventName: z.string(),
  payload: z.record(z.string(), z.unknown()),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  trackedAt: z.date(),
});

export const AnalyticsErrorEventSchema = z.object({
  errorType: z.string(),
  errorMessage: z.string(),
  errorCode: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.date(),
});

// =====================================================
// TYPED EVENT EMITTERS
// =====================================================

/**
 * User Events
 */
export const UserEvents = {
  created: createTypedEventEmitter('user.created', UserCreatedEventSchema),
  updated: createTypedEventEmitter('user.updated', UserUpdatedEventSchema),
  deleted: createTypedEventEmitter('user.deleted', UserDeletedEventSchema),
} as const;

/**
 * Email Events
 */
export const EmailEvents = {
  captured: createTypedEventEmitter('email.captured', EmailCapturedEventSchema),
  subscribed: createTypedEventEmitter('email.subscribed', EmailSubscribedEventSchema),
  bounced: createTypedEventEmitter('email.bounced', EmailBouncedEventSchema),
  complained: createTypedEventEmitter('email.complained', EmailComplainedEventSchema),
} as const;

/**
 * Content Events
 */
export const ContentEvents = {
  viewed: createTypedEventEmitter('content.viewed', ContentViewedEventSchema),
  created: createTypedEventEmitter('content.created', ContentCreatedEventSchema),
  updated: createTypedEventEmitter('content.updated', ContentUpdatedEventSchema),
} as const;

/**
 * Submission Events
 */
export const SubmissionEvents = {
  created: createTypedEventEmitter('submission.created', SubmissionCreatedEventSchema),
  approved: createTypedEventEmitter('submission.approved', SubmissionApprovedEventSchema),
  rejected: createTypedEventEmitter('submission.rejected', SubmissionRejectedEventSchema),
  merged: createTypedEventEmitter('submission.merged', SubmissionMergedEventSchema),
} as const;

/**
 * Vote Events
 */
export const VoteEvents = {
  created: createTypedEventEmitter('vote.created', VoteCreatedEventSchema),
  removed: createTypedEventEmitter('vote.removed', VoteRemovedEventSchema),
} as const;

/**
 * Comment Events
 */
export const CommentEvents = {
  created: createTypedEventEmitter('comment.created', CommentCreatedEventSchema),
  updated: createTypedEventEmitter('comment.updated', CommentUpdatedEventSchema),
  deleted: createTypedEventEmitter('comment.deleted', CommentDeletedEventSchema),
} as const;

/**
 * Badge Events
 */
export const BadgeEvents = {
  earned: createTypedEventEmitter('badge.earned', BadgeEarnedEventSchema),
} as const;

/**
 * Reputation Events
 */
export const ReputationEvents = {
  changed: createTypedEventEmitter('reputation.changed', ReputationChangedEventSchema),
} as const;

/**
 * Analytics Events
 */
export const AnalyticsEvents = {
  tracked: createTypedEventEmitter('analytics.tracked', AnalyticsTrackedEventSchema),
  error: createTypedEventEmitter('analytics.error', AnalyticsErrorEventSchema),
} as const;

// =====================================================
// TYPE EXPORTS
// =====================================================

export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;
export type UserUpdatedEvent = z.infer<typeof UserUpdatedEventSchema>;
export type UserDeletedEvent = z.infer<typeof UserDeletedEventSchema>;

export type EmailCapturedEvent = z.infer<typeof EmailCapturedEventSchema>;
export type EmailSubscribedEvent = z.infer<typeof EmailSubscribedEventSchema>;
export type EmailBouncedEvent = z.infer<typeof EmailBouncedEventSchema>;
export type EmailComplainedEvent = z.infer<typeof EmailComplainedEventSchema>;

export type ContentViewedEvent = z.infer<typeof ContentViewedEventSchema>;
export type ContentCreatedEvent = z.infer<typeof ContentCreatedEventSchema>;
export type ContentUpdatedEvent = z.infer<typeof ContentUpdatedEventSchema>;

export type SubmissionCreatedEvent = z.infer<typeof SubmissionCreatedEventSchema>;
export type SubmissionApprovedEvent = z.infer<typeof SubmissionApprovedEventSchema>;
export type SubmissionRejectedEvent = z.infer<typeof SubmissionRejectedEventSchema>;
export type SubmissionMergedEvent = z.infer<typeof SubmissionMergedEventSchema>;

export type VoteCreatedEvent = z.infer<typeof VoteCreatedEventSchema>;
export type VoteRemovedEvent = z.infer<typeof VoteRemovedEventSchema>;

export type CommentCreatedEvent = z.infer<typeof CommentCreatedEventSchema>;
export type CommentUpdatedEvent = z.infer<typeof CommentUpdatedEventSchema>;
export type CommentDeletedEvent = z.infer<typeof CommentDeletedEventSchema>;

export type BadgeEarnedEvent = z.infer<typeof BadgeEarnedEventSchema>;

export type ReputationChangedEvent = z.infer<typeof ReputationChangedEventSchema>;

export type AnalyticsTrackedEvent = z.infer<typeof AnalyticsTrackedEventSchema>;
export type AnalyticsErrorEvent = z.infer<typeof AnalyticsErrorEventSchema>;
