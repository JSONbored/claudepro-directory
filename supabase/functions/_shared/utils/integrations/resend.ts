/**
 * Resend integration helpers
 * Topic assignment, property mapping, contact management, and segments.
 */

import type { Resend } from 'npm:resend@4.0.0';
import { RESEND_ENV } from '../../config/email-config.ts';
import type { Database, Database as DatabaseGenerated } from '../../database.types.ts';

import type { BaseLogContext } from '../logging.ts';
import { createUtilityContext, logError, logInfo, logWarn } from '../logging.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../timeout.ts';
import { runWithRetry } from './http-client.ts';

/**
 * Resend Topic IDs (static configuration)
 * Created in Resend dashboard - hardcoded for performance
 */
export const RESEND_TOPIC_IDS = {
  weekly_digest: 'e231386b-4f2e-4242-90d1-ca24bd200ade',
  agents_prompts: 'e1cb8d1b-1378-4032-b435-9b969545c22d',
  mcp_integrations: '24fc6289-895b-4167-b213-c407e3279814',
  commands_automation: 'ad5384cc-7b40-4e09-9423-216b9103dec9',
  guides_tutorials: 'c6799b64-d247-4ef1-8377-32cf8ac9acb6',
  community_highlights: '26842da7-f18f-48e3-8e78-79c052e311f2',
  job_board: '900424b3-7ccf-4bac-b244-31af6cac5b72',
  platform_updates: 'f84d94d8-76aa-4abf-8ff6-3dfd916b56e6',
} as const;

/**
 * Infer initial topics based on signup context
 * Auto-assigns relevant topics to maximize engagement
 */
export function inferInitialTopics(
  _source: Database['public']['Enums']['newsletter_source'] | string | null,
  copyCategory?: string | null
): string[] {
  const topics: string[] = [];

  // Everyone gets weekly digest by default (opt-out topic)
  topics.push(RESEND_TOPIC_IDS.weekly_digest);

  // Add category-specific topics based on what they interacted with
  if (copyCategory) {
    switch (copyCategory.toLowerCase()) {
      case 'agents':
      case 'rules':
        topics.push(RESEND_TOPIC_IDS.agents_prompts);
        break;
      case 'mcp':
        topics.push(RESEND_TOPIC_IDS.mcp_integrations);
        break;
      case 'commands':
      case 'hooks':
      case 'statuslines':
        topics.push(RESEND_TOPIC_IDS.commands_automation);
        break;
      case 'guides':
        topics.push(RESEND_TOPIC_IDS.guides_tutorials);
        break;
    }
  }

  // Add source-specific topics (only for valid enum values)
  // Note: RESEND_TOPIC_IDS.job_board exists but is not assigned via newsletter_source enum
  // Job board subscriptions should use a valid enum value like 'homepage' or 'content_page'

  // Deduplicate
  return [...new Set(topics)];
}

/**
 * Calculate initial engagement score based on signup context
 * Higher score for more intentional signups
 */
export function calculateInitialEngagementScore(
  source: Database['public']['Enums']['newsletter_source'] | string | null,
  copyType?: string | null
): number {
  let score = 50; // Neutral baseline

  // High-intent sources get higher scores
  if (source) {
    switch (source) {
      case 'post_copy':
        score += 15; // They copied something - highly engaged
        break;
      case 'inline':
        score += 10; // Direct subscription from CTA
        break;
      case 'footer':
        score += 5; // Less prominent, still intentional
        break;
      case 'modal':
        score -= 5; // Could be accidental/pressured
        break;
      // Other enum values don't affect score
      case 'homepage':
      case 'content_page':
      case 'resend_import':
      case 'oauth_signup':
        break;
    }
  }

  // Copy type indicates engagement level
  if (copyType) {
    switch (copyType) {
      case 'code':
        score += 10; // Technical user, highly engaged
        break;
      case 'markdown':
      case 'llmstxt':
        score += 5; // Power user
        break;
    }
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Build contact properties object for Resend
 * Maps our database fields to Resend custom properties
 */
export function buildContactProperties(params: {
  source: Database['public']['Enums']['newsletter_source'] | string | null;
  copyType?: string | null;
  copyCategory?: string | null;
  referrer?: string | null;
}): Record<string, string | number> {
  const { source, copyType, copyCategory, referrer } = params;
  // Convert newsletter_source to string | null for database compatibility
  const sourceValue: string | null = source ?? null;

  return {
    signup_source: sourceValue || 'unknown',
    copy_type: copyType || 'none',
    primary_interest: copyCategory || 'general',
    signup_page: referrer || '/',
    engagement_score: calculateInitialEngagementScore(source, copyType),
    total_copies: copyType && copyType !== 'none' ? 1 : 0,
    last_active: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*                              Segmentation API                              */
/* -------------------------------------------------------------------------- */

export const RESEND_SEGMENT_IDS = {
  high_engagement: '7757f565-bb4e-4a3e-bfd8-59f7636a6c14',
  medium_engagement: '6fadc736-c46a-452e-b3bd-8bfedb83f988',
  low_engagement: '2d86c140-fdff-4f22-b9bf-7efa0f7897e9',
} as const;

const SEGMENT_RETRY = {
  attempts: 3,
  baseDelayMs: 750,
};

export function determineSegmentByEngagement(
  engagementScore: number
): (typeof RESEND_SEGMENT_IDS)[keyof typeof RESEND_SEGMENT_IDS] | null {
  if (engagementScore >= 70) return RESEND_SEGMENT_IDS.high_engagement;
  if (engagementScore >= 40) return RESEND_SEGMENT_IDS.medium_engagement;
  if (engagementScore >= 0) return RESEND_SEGMENT_IDS.low_engagement;
  return null;
}

export async function syncContactSegment(
  resend: Resend,
  contactId: string,
  engagementScore: number
): Promise<void> {
  const targetSegment = determineSegmentByEngagement(engagementScore);
  const managedSegmentIds = new Set(Object.values(RESEND_SEGMENT_IDS));

  try {
    const currentSegmentIds = await listSegmentsWithRetry(resend, contactId);

    for (const segmentId of currentSegmentIds) {
      const typedSegmentId =
        segmentId as (typeof RESEND_SEGMENT_IDS)[keyof typeof RESEND_SEGMENT_IDS];
      if (typedSegmentId !== targetSegment && managedSegmentIds.has(typedSegmentId)) {
        await runWithRetry(
          () =>
            (
              resend.contacts as unknown as {
                segments: {
                  remove: (args: {
                    id: string;
                    segmentId: string;
                  }) => Promise<{ data: unknown; error: unknown }>;
                };
              }
            ).segments.remove({
              id: contactId,
              segmentId: typedSegmentId,
            }),
          SEGMENT_RETRY
        );
      }
    }

    if (targetSegment && !currentSegmentIds.includes(targetSegment)) {
      await runWithRetry(
        () =>
          (
            resend.contacts as unknown as {
              segments: {
                add: (args: {
                  id: string;
                  segmentId: string;
                }) => Promise<{ data: unknown; error: unknown }>;
              };
            }
          ).segments.add({
            id: contactId,
            segmentId: targetSegment,
          }),
        SEGMENT_RETRY
      );
    }
  } catch (error) {
    const logContext = createUtilityContext('resend', 'sync-contact-segment', {
      contactId,
    });
    logError('Segment sync failed', logContext, error);
  }
}

export function calculateEngagementChange(
  currentScore: number,
  activityType:
    | 'email_open'
    | 'email_click'
    | 'email_bounce'
    | 'email_complaint'
    | 'copy_content'
    | 'visit_page'
): number {
  let newScore = currentScore;

  switch (activityType) {
    case 'email_click':
      newScore += 10;
      break;
    case 'copy_content':
      newScore += 8;
      break;
    case 'email_open':
      newScore += 5;
      break;
    case 'visit_page':
      newScore += 2;
      break;
    case 'email_bounce':
      newScore -= 20;
      break;
    case 'email_complaint':
      newScore = 0;
      break;
  }

  return Math.max(0, Math.min(100, newScore));
}

export async function updateContactEngagement(
  resend: Resend,
  email: string,
  activityType:
    | 'email_open'
    | 'email_click'
    | 'email_bounce'
    | 'email_complaint'
    | 'copy_content'
    | 'visit_page'
): Promise<void> {
  try {
    // Resend API requires audienceId for contacts.get
    // Type assertion needed because Resend types may not include all fields
    type ResendContact = {
      id?: string;
      email?: string;
      properties?: {
        engagement_score?: number;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };

    // Resend API types don't fully expose all fields - use type assertions for proper typing
    type ResendContactResponse = {
      data: ResendContact | null;
      error: unknown;
    };
    type ResendContactsApi = {
      get: (args: { email: string; audienceId?: string }) => Promise<ResendContactResponse>;
      update: (args: {
        email: string;
        properties?: Record<string, unknown>;
        audienceId?: string;
      }) => Promise<{ data: unknown; error: unknown }>;
    };

    const contactsApi = resend.contacts as unknown as ResendContactsApi;
    const { data: contact } = await runWithRetry(() => contactsApi.get({ email }), SEGMENT_RETRY);

    if (!contact?.['data']) {
      const logContext = createUtilityContext('resend', 'update-contact-engagement', { email });
      logWarn('contact not found', logContext);
      return;
    }

    const contactData = contact['data'] as ResendContact;
    const currentScore = (contactData.properties?.['engagement_score'] as number) || 50;
    const newScore = calculateEngagementChange(currentScore, activityType);

    await runWithRetry(
      () =>
        contactsApi.update({
          email,
          properties: {
            engagement_score: newScore,
            last_active: new Date().toISOString(),
          },
        }),
      SEGMENT_RETRY
    );

    if (contactData.id) {
      await syncContactSegment(resend, contactData.id, newScore);
    }
  } catch (error) {
    const logContext = createUtilityContext('resend', 'update-contact-engagement', { email });
    logError('failed to update contact', logContext, error);
  }
}

async function listSegmentsWithRetry(resend: Resend, contactId: string): Promise<string[]> {
  const { data } = await runWithRetry(
    () =>
      (
        resend.contacts as unknown as {
          segments: {
            list: (args: { id: string }) => Promise<{
              data: { data?: Array<{ id: string }> } | null;
              error: unknown;
            }>;
          };
        }
      ).segments.list({
        id: contactId,
      }),
    SEGMENT_RETRY
  );

  return (
    (data as { data?: Array<{ id: string }> } | null)?.data?.map((segment) => segment.id) ?? []
  );
}

/**
 * Send email via Resend with timeout and logging
 * Centralized email sending utility for consistent error handling and logging
 */
export async function sendEmail(
  resend: Resend,
  options: {
    to: string;
    subject: string;
    html: string;
    from: string;
    tags?: Array<{ name: string; value: string }>;
    replyTo?: string;
  },
  logContext: BaseLogContext,
  timeoutMessage = 'Resend email send timed out'
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const { data, error } = (await withTimeout(
    resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.tags && { tags: options.tags }),
      ...(options.replyTo && { replyTo: options.replyTo }),
    }),
    TIMEOUT_PRESETS.external,
    timeoutMessage
  )) as { data: { id: string } | null; error: { message: string } | null };

  if (error) {
    logError('Email send failed', logContext, error);
  }

  return { data, error };
}

/**
 * Sync contact to Resend: create contact, assign topics, assign segment
 * Returns sync status and contact ID for database storage
 */
export async function syncContactToResend(
  resend: Resend,
  email: string,
  contactProperties: Record<string, unknown>,
  validatedSource: Database['public']['Enums']['newsletter_source'] | string | null,
  copy_category: Database['public']['Enums']['content_category'] | string | null | undefined,
  logContext: BaseLogContext
): Promise<{
  resendContactId: string | null;
  syncStatus: DatabaseGenerated['public']['Enums']['newsletter_sync_status'];
  syncError: string | null;
  topicIds: string[];
}> {
  let resendContactId: string | null = null;
  let syncStatus: DatabaseGenerated['public']['Enums']['newsletter_sync_status'] = 'synced';
  let syncError: string | null = null;
  let topicIds: string[] = [];

  try {
    logInfo('Creating Resend contact', {
      ...logContext,
      contact_properties: contactProperties,
    });

    // Create contact with properties
    type ResendContactsCreateApi = {
      create: (args: {
        audienceId: string;
        email: string;
        unsubscribed?: boolean;
        properties?: Record<string, unknown>;
      }) => Promise<{
        data: { id: string } | null;
        error: { message?: string } | null;
      }>;
    };
    const contactsApi = resend.contacts as unknown as ResendContactsCreateApi;
    const { data: contact, error: resendError } = await withTimeout(
      contactsApi.create({
        audienceId: RESEND_ENV.audienceId,
        email,
        unsubscribed: false,
        properties: contactProperties,
      }),
      TIMEOUT_PRESETS.external,
      'Resend contact creation timed out'
    );

    if (resendError) {
      if (
        resendError.message?.includes('already exists') ||
        resendError.message?.includes('duplicate')
      ) {
        logInfo('Email already in Resend, skipping contact creation', {
          ...logContext,
          sync_status: 'skipped',
        });
        syncStatus = 'skipped';
        syncError = 'Email already in audience';
      } else {
        logError(
          'Resend contact creation failed',
          { ...logContext, sync_status: 'failed' },
          resendError
        );
        syncStatus = 'failed';
        syncError = resendError.message || 'Unknown Resend error';
      }
    } else if (contact?.id) {
      resendContactId = contact.id;
      logInfo('Contact created', {
        ...logContext,
        resend_contact_id: resendContactId,
      });

      // Assign topics based on signup context
      try {
        topicIds = inferInitialTopics(validatedSource, copy_category);
        logInfo('Assigning topics', {
          ...logContext,
          topic_count: topicIds.length,
          topic_ids: topicIds,
        });

        if (topicIds.length > 0) {
          type ResendContactsTopicsApi = {
            topics: {
              update: (args: { contactId: string; topicIds: string[] }) => Promise<{
                data: unknown;
                error: { message?: string } | null;
              }>;
            };
          };
          const contactsWithTopics = resend.contacts as unknown as ResendContactsTopicsApi;
          const { error: topicError } = await withTimeout(
            contactsWithTopics.topics.update({
              contactId: resendContactId,
              topicIds,
            }),
            TIMEOUT_PRESETS.external,
            'Resend topic assignment timed out'
          );

          if (topicError) {
            logError('Failed to assign topics', logContext, topicError);
          } else {
            logInfo('Topics assigned successfully', logContext);
          }
        }
      } catch (topicException) {
        logError('Topic assignment exception', logContext, topicException);
      }

      // Assign to engagement segment
      try {
        const engagementScore = contactProperties['engagement_score'] as number;
        await withTimeout(
          syncContactSegment(resend, resendContactId, engagementScore),
          TIMEOUT_PRESETS.external,
          'Resend segment assignment timed out'
        );
        logInfo('Segment assigned successfully', logContext);
      } catch (segmentException) {
        logError('Segment assignment exception', logContext, segmentException);
      }
    }
  } catch (resendException) {
    logError('Unexpected Resend error', logContext, resendException);
    syncStatus = 'failed';
    syncError = resendException instanceof Error ? resendException.message : 'Unknown error';
  }

  return { resendContactId, syncStatus, syncError, topicIds };
}

/**
 * Enroll email in onboarding sequence
 * Helper function to avoid duplication
 */
export async function enrollInOnboardingSequence(
  email: string,
  logContext: BaseLogContext
): Promise<void> {
  try {
    const { supabaseServiceRole: supabaseClient } = await import('../../clients/supabase.ts');
    const enrollArgs = {
      p_email: email,
    } satisfies DatabaseGenerated['public']['Functions']['enroll_in_email_sequence']['Args'];
    await supabaseClient.rpc('enroll_in_email_sequence', enrollArgs);
  } catch (sequenceError) {
    logError('Sequence enrollment failed', logContext, sequenceError);
  }
}
