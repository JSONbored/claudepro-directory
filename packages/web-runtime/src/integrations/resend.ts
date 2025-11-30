/**
 * Resend integration helpers
 * Topic assignment, property mapping, contact management, and segments.
 *
 * @module packages/web-runtime/src/integrations/resend
 */

import { Resend } from 'resend';
import { Constants, type Database, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { createUtilityContext, withTimeout, TIMEOUT_PRESETS } from '@heyclaude/shared-runtime';
import { normalizeError } from '../errors';
import { logger, type LogContext } from '../logger';
import { runWithRetry } from './http-client';
import { getResendEnv } from '../email/config/email-config';

/**
 * Cached Resend client instance
 */
let _resendClient: Resend | null = null;

/**
 * Get or create a Resend client instance
 */
export function getResendClient(): Resend {
  if (!_resendClient) {
    const { apiKey } = getResendEnv();
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    _resendClient = new Resend(apiKey);
  }
  return _resendClient;
}

const RESEND_API_BASE_URL = 'https://api.resend.com';

export class ResendApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly rawBody?: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ResendApiError';
  }
}

type ResendSdkError = {
  message: string;
  statusCode: number | null;
  name: string;
};

type ResendSdkResponse<T> = {
  data: T | null;
  error: ResendSdkError | null;
  headers?: Record<string, string> | null;
};

function assertResendSuccess<T>(response: ResendSdkResponse<T>, descriptor: string): T {
  if (response.error || response.data === null) {
    throw new ResendApiError(
      `${descriptor} failed: ${response.error?.message ?? 'Unknown Resend error'}`,
      response.error?.statusCode ?? null
    );
  }
  return response.data;
}

type ResendApiRequestOptions = {
  path: string;
  method?: string;
  payload?: unknown;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

type ResendApiResponse<T> = {
  data: T;
  status: number;
  rawBody: string;
};

export async function callResendApi<T>({
  path,
  method = 'GET',
  payload,
  apiKey,
  fetchImpl = fetch,
}: ResendApiRequestOptions): Promise<ResendApiResponse<T>> {
  const resolvedApiKey = apiKey ?? getResendEnv().apiKey;
  if (!resolvedApiKey) {
    throw new ResendApiError('Missing Resend API key', null);
  }

  const normalizedPath = normalizeResendPath(path);
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${resolvedApiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  if (payload !== undefined) {
    init.body = JSON.stringify(payload);
  }

  try {
    const response = await withTimeout(
      fetchImpl(`${RESEND_API_BASE_URL}${normalizedPath}`, init),
      TIMEOUT_PRESETS.external,
      `Resend ${method.toUpperCase()} ${normalizedPath} timed out`
    );

    const rawBody = await response.text();
    let parsedBody: unknown = rawBody;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // Ignore JSON parse errors; keep raw text
    }

    if (!response.ok) {
      throw new ResendApiError(
        `Resend ${method.toUpperCase()} ${normalizedPath} failed with ${response.status}`,
        response.status,
        rawBody,
        parsedBody
      );
    }

    return {
      data: parsedBody as T,
      status: response.status,
      rawBody,
    };
  } catch (error) {
    // Log all Resend API errors for observability
    const logContext = createUtilityContext('resend', 'call-resend-api', {
      path: normalizedPath,
      method,
    });
    const errorObj = normalizeError(error, 'Resend API error');

    if (error instanceof ResendApiError) {
      // Log Resend API errors with status and response body
      logger.error('Resend API call failed', errorObj, {
        ...toLogContext(logContext),
        status: error.status ?? 0,
        responseBody: error.rawBody ?? '',
      });
      throw error;
    }

    // Log unexpected errors
    logger.error('Resend API request error', errorObj, toLogContext(logContext));
    throw new ResendApiError(normalizeError(error, 'Unknown Resend request error').message, null);
  }
}

function normalizeResendPath(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (!path.startsWith('/v')) {
    return `/v1${path}`;
  }
  return path;
}

/**
 * Convert utility context to LogContext type
 */
function toLogContext(ctx: Record<string, unknown>): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value ?? null;
    } else if (Array.isArray(value)) {
      result[key] = value.map(String);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

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

const NEWSLETTER_INTEREST_VALUES = Constants.public.Enums.newsletter_interest;
const NEWSLETTER_INTEREST_SET = new Set(NEWSLETTER_INTEREST_VALUES);

export function resolveNewsletterInterest(
  copyCategory?: DatabaseGenerated['public']['Enums']['content_category'] | string | null,
  fallback: DatabaseGenerated['public']['Enums']['newsletter_interest'] = 'general'
): DatabaseGenerated['public']['Enums']['newsletter_interest'] {
  if (copyCategory) {
    const normalized =
      copyCategory.toString().toLowerCase() as DatabaseGenerated['public']['Enums']['newsletter_interest'];
    if (NEWSLETTER_INTEREST_SET.has(normalized)) {
      return normalized;
    }
  }
  return fallback;
}

/**
 * Determine initial Resend topic IDs to assign to a new contact based on content category.
 */
export function inferInitialTopics(
  _source: Database['public']['Enums']['newsletter_source'] | string | null,
  copyCategory?: Database['public']['Enums']['content_category'] | string | null
): string[] {
  const topics: string[] = [];

  // Everyone gets weekly digest by default (opt-out topic)
  topics.push(RESEND_TOPIC_IDS.weekly_digest);

  // Add category-specific topics based on what they interacted with
  if (copyCategory) {
    const normalizedCategory = copyCategory.toLowerCase();
    switch (normalizedCategory) {
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

  // Deduplicate
  return [...new Set(topics)];
}

/**
 * Assigns the provided topic IDs to a Resend contact and opts the contact into each topic.
 */
async function assignTopicsToContact(
  resend: Resend,
  contactId: string,
  topicIds: string[],
  logContext: LogContext
): Promise<void> {
  if (topicIds.length === 0) {
    return;
  }

  try {
    await runWithRetry(
      async () => {
        const updateResponse = await resend.contacts.topics.update({
          id: contactId,
          topics: topicIds.map((id) => ({
            id,
            subscription: 'opt_in',
          })),
        });
        assertResendSuccess(updateResponse, 'contacts.topics.update');
      },
      {
        attempts: 3,
        baseDelayMs: 500,
        onRetry(attempt, error, delay) {
          logger.warn('[resend] topic assignment throttled', {
            ...logContext,
            attempt,
            delay,
            reason: error.message,
          });
        },
      }
    );

    logger.info('Topics assigned successfully', {
      ...logContext,
      topic_count: topicIds.length,
    });
  } catch (error) {
    const errorObj = normalizeError(error, 'Failed to assign topics');
    if (error instanceof ResendApiError) {
      logger.error('Failed to assign topics', errorObj, {
        ...logContext,
        status: error.status ?? 0,
        response_body: error.rawBody ?? '',
      });
    } else {
      logger.error('Failed to assign topics', errorObj, logContext);
    }
  }
}

/**
 * Calculate initial engagement score based on signup context
 */
export function calculateInitialEngagementScore(
  source: Database['public']['Enums']['newsletter_source'] | string | null,
  copyType?: string | null
): number {
  let score = 50; // Neutral baseline

  if (source) {
    switch (source) {
      case 'post_copy':
        score += 15;
        break;
      case 'inline':
        score += 10;
        break;
      case 'footer':
        score += 5;
        break;
      case 'modal':
        score -= 5;
        break;
      case 'homepage':
      case 'content_page':
      case 'resend_import':
      case 'oauth_signup':
        break;
    }
  }

  if (copyType) {
    switch (copyType) {
      case 'code':
        score += 10;
        break;
      case 'markdown':
      case 'llmstxt':
        score += 5;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Build contact properties object for Resend.
 */
export function buildContactProperties(params: {
  source: Database['public']['Enums']['newsletter_source'] | string | null;
  copyType?: string | null;
  referrer?: string | null;
  primaryInterest: DatabaseGenerated['public']['Enums']['newsletter_interest'];
}): Record<string, string | number> {
  const { source, copyType, referrer, primaryInterest } = params;
  const sourceValue: string | null = source ?? null;

  return {
    signup_source: sourceValue || 'unknown',
    copy_type: copyType || 'none',
    primary_interest: primaryInterest,
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

const SEGMENT_MIN_INTERVAL_MS = 1200;
const SEGMENT_JITTER_MS = 300;
let segmentLimiterTail: Promise<void> = Promise.resolve();
let lastSegmentCallAt = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleSegmentApiCall<T>(operation: () => Promise<T>): Promise<T> {
  const run = async () => {
    const now = Date.now();
    const elapsed = now - lastSegmentCallAt;
    const wait = Math.max(0, SEGMENT_MIN_INTERVAL_MS - elapsed);
    if (wait > 0) {
      await delay(wait + Math.random() * SEGMENT_JITTER_MS);
    }
    const result = await operation();
    lastSegmentCallAt = Date.now();
    return result;
  };

  const task = segmentLimiterTail.then(run);
  segmentLimiterTail = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

const RESEND_SEGMENTS_SUPPORTED = true;

export function determineSegmentByEngagement(
  engagementScore: number
): (typeof RESEND_SEGMENT_IDS)[keyof typeof RESEND_SEGMENT_IDS] | null {
  if (engagementScore >= 70) return RESEND_SEGMENT_IDS.high_engagement;
  if (engagementScore >= 40) return RESEND_SEGMENT_IDS.medium_engagement;
  if (engagementScore >= 0) return RESEND_SEGMENT_IDS.low_engagement;
  return null;
}

type SegmentSyncOptions = {
  mode?: 'initial' | 'update';
};

export async function syncContactSegment(
  resend: Resend,
  contactId: string,
  engagementScore: number,
  options?: SegmentSyncOptions
): Promise<void> {
  if (!RESEND_SEGMENTS_SUPPORTED) {
    return;
  }

  const logContext: LogContext = {
    utility: 'resend',
    operation: 'sync-contact-segment',
    contactId,
  };
  const mode = options?.mode ?? 'update';
  const targetSegment = determineSegmentByEngagement(engagementScore);
  const managedSegmentIds = new Set(Object.values(RESEND_SEGMENT_IDS));

  try {
    let currentSegmentIds: string[] = [];

    if (mode === 'update') {
      currentSegmentIds = await runWithRetry(() => listSegmentsWithRetry(resend, contactId), {
        attempts: 3,
        baseDelayMs: 500,
        onRetry(attempt, error, delay) {
          logger.warn('[resend] segment list throttled', {
            ...logContext,
            attempt,
            delay,
            reason: error.message,
          });
        },
      });

      for (const segmentId of currentSegmentIds) {
        const typedSegmentId = segmentId as (typeof RESEND_SEGMENT_IDS)[keyof typeof RESEND_SEGMENT_IDS];
        if (typedSegmentId !== targetSegment && managedSegmentIds.has(typedSegmentId)) {
          await runWithRetry(
            async () => {
              const removeResponse = await scheduleSegmentApiCall(() =>
                resend.contacts.segments.remove({
                  contactId,
                  segmentId: typedSegmentId,
                })
              );
              assertResendSuccess(removeResponse, 'contacts.segments.remove');
            },
            {
              attempts: 3,
              baseDelayMs: 500,
              onRetry(attempt, error, delay) {
                logger.warn('[resend] segment removal throttled', {
                  ...logContext,
                  attempt,
                  delay,
                  reason: error.message,
                });
              },
            }
          );
        }
      }
    }

    const shouldAddSegment =
      targetSegment &&
      (mode === 'initial' || (mode === 'update' && !currentSegmentIds.includes(targetSegment)));

    if (shouldAddSegment && targetSegment) {
      await runWithRetry(
        async () => {
          const addResponse = await scheduleSegmentApiCall(() =>
            resend.contacts.segments.add({
              contactId,
              segmentId: targetSegment,
            })
          );
          assertResendSuccess(addResponse, 'contacts.segments.add');
        },
        {
          attempts: 3,
          baseDelayMs: 500,
          onRetry(attempt, error, delay) {
            logger.warn('[resend] segment add throttled', {
              ...logContext,
              attempt,
              delay,
              reason: error.message,
            });
          },
        }
      );
    }
  } catch (err) {
    const errorObj = normalizeError(err, 'Segment sync failed');
    if (err instanceof ResendApiError) {
      logger.error('Segment sync failed', errorObj, {
        ...logContext,
        status: err.status ?? 0,
        response_body: err.rawBody ?? '',
      });
    } else {
      logger.error('Segment sync failed', errorObj, logContext);
    }
  }
}

export function calculateEngagementChange(
  currentScore: number,
  activityType: 'email_open' | 'email_click' | 'email_bounce' | 'email_complaint' | 'copy_content' | 'visit_page'
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
  activityType: 'email_open' | 'email_click' | 'email_bounce' | 'email_complaint' | 'copy_content' | 'visit_page'
): Promise<void> {
  const logContext: LogContext = {
    utility: 'resend',
    operation: 'update-contact-engagement',
    email,
  };

  try {
    type ResendContact = {
      id?: string;
      email?: string;
      properties?: {
        engagement_score?: number;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };

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
      logger.warn('contact not found', logContext);
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
    const errorObj = normalizeError(error, 'failed to update contact');
    logger.error('failed to update contact', errorObj, logContext);
  }
}

/**
 * Retrieve the list of segment IDs associated with a Resend contact.
 */
async function listSegmentsWithRetry(resend: Resend, contactId: string): Promise<string[]> {
  const response = await runWithRetry(
    () =>
      scheduleSegmentApiCall(() =>
        resend.contacts.segments.list({
          contactId,
          limit: 100,
        })
      ),
    SEGMENT_RETRY
  );

  const segments = assertResendSuccess(response, 'contacts.segments.list');
  return segments.data.map((segment) => segment.id);
}

/**
 * Send an email through Resend and return the API response while logging failures.
 * Uses internal Resend client if not provided.
 */
export async function sendEmail(
  options: {
    to: string;
    subject: string;
    html: string;
    from: string;
    tags?: Array<{ name: string; value: string }>;
    replyTo?: string;
  },
  timeoutMessage = 'Resend email send timed out',
  resendClient?: Resend
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const resend = resendClient ?? getResendClient();
  const logContext = createUtilityContext('resend', 'send-email', { to: options.to });

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
    logger.error('Email send failed', new Error(error.message), toLogContext(logContext));
  }

  return { data, error };
}

/**
 * Create or find a contact in Resend, assign initial newsletter topics and an engagement segment.
 * Uses internal Resend client if not provided.
 */
export async function syncContactToResend(
  email: string,
  contactProperties: Record<string, string | number>,
  validatedSource: Database['public']['Enums']['newsletter_source'] | string | null,
  copy_category: Database['public']['Enums']['content_category'] | string | null | undefined,
  resendClient?: Resend
): Promise<{
  resendContactId: string | null;
  syncStatus: DatabaseGenerated['public']['Enums']['newsletter_sync_status'];
  syncError: string | null;
  topicIds: string[];
}> {
  const resend = resendClient ?? getResendClient();
  const logContext: LogContext = {
    utility: 'resend',
    operation: 'sync-contact',
    email,
  };

  let resendContactId: string | null = null;
  let syncStatus: DatabaseGenerated['public']['Enums']['newsletter_sync_status'] = 'synced';
  let syncError: string | null = null;
  let topicIds: string[] = [];
  const resendEnv = getResendEnv();

  // Validate required environment variables
  if (!resendEnv.audienceId) {
    throw new Error('Missing RESEND_AUDIENCE_ID environment variable');
  }
  const audienceId = resendEnv.audienceId;

  try {
    logger.info('Creating Resend contact', logContext, {
      contact_properties: JSON.stringify(contactProperties),
    });

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
        audienceId,
        email,
        unsubscribed: false,
        properties: contactProperties,
      }),
      TIMEOUT_PRESETS.external,
      'Resend contact creation timed out'
    );

    if (resendError) {
      if (resendError.message?.includes('already exists') || resendError.message?.includes('duplicate')) {
        logger.info('Email already in Resend, skipping contact creation', logContext, {
          sync_status: 'skipped',
        });
        syncStatus = 'skipped';
        syncError = 'Email already in audience';
      } else {
        logger.error('Resend contact creation failed', new Error(resendError.message ?? 'Unknown error'), logContext, {
          sync_status: 'failed',
        });
        syncStatus = 'failed';
        syncError = resendError.message || 'Unknown Resend error';
      }
    } else if (contact?.id) {
      resendContactId = contact.id;
      logger.info('Contact created', logContext, {
        resend_contact_id: resendContactId,
      });

      // Assign topics based on signup context
      topicIds = inferInitialTopics(validatedSource, copy_category);
      logger.info('Assigning topics', logContext, {
        topic_count: topicIds.length,
        topic_ids: topicIds.join(','),
      });

      await assignTopicsToContact(resend, resendContactId, topicIds, logContext);

      // Assign to engagement segment
      const engagementScore = contactProperties['engagement_score'] as number;
      try {
        await withTimeout(
          syncContactSegment(resend, resendContactId, engagementScore, { mode: 'initial' }),
          TIMEOUT_PRESETS.external,
          'Resend segment assignment timed out'
        );
        logger.info('Segment assigned successfully', logContext);
      } catch (segmentException) {
        const errorObj = normalizeError(segmentException, 'Segment assignment exception');
        logger.error('Segment assignment exception', errorObj, logContext);
      }
    }
  } catch (resendException) {
    const errorObj = normalizeError(resendException, 'Unexpected Resend error');
    logger.error('Unexpected Resend error', errorObj, logContext);
    syncStatus = 'failed';
    syncError = resendException instanceof Error ? resendException.message : 'Unknown error';
  }

  return { resendContactId, syncStatus, syncError, topicIds };
}

/**
 * Enrolls an email address into the onboarding email sequence.
 * Uses the Supabase RPC to enroll the email in the sequence.
 */
export async function enrollInOnboardingSequence(email: string): Promise<void> {
  const logContext: LogContext = {
    utility: 'resend',
    operation: 'enroll-onboarding-sequence',
    email,
  };

  try {
    // Dynamically import to avoid circular dependency issues
    const { createSupabaseAdminClient } = await import('../supabase/admin');
    const supabase = createSupabaseAdminClient();

    const enrollArgs = {
      p_email: email,
    } satisfies DatabaseGenerated['public']['Functions']['enroll_in_email_sequence']['Args'];

    const { error } = await supabase.rpc('enroll_in_email_sequence', enrollArgs);

    if (error) {
      logger.warn('Sequence enrollment RPC failed', {
        ...logContext,
        errorMessage: error.message,
      });
    } else {
      logger.info('Enrolled in onboarding sequence', logContext);
    }
  } catch (sequenceError) {
    const errorObj = normalizeError(sequenceError, 'Sequence enrollment failed');
    logger.warn('Sequence enrollment failed', {
      ...logContext,
      errorMessage: errorObj.message,
    });
  }
}
