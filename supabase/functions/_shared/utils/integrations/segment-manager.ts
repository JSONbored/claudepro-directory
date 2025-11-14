import type { Resend } from 'npm:resend@4.0.0';
import { runWithRetry } from './http.ts';

export const RESEND_SEGMENT_IDS = {
  high_engagement: '7757f565-bb4e-4a3e-bfd8-59f7636a6c14',
  medium_engagement: '6fadc736-c46a-452e-b3bd-8bfedb83f988',
  low_engagement: '2d86c140-fdff-4f22-b9bf-7efa0f7897e9',
} as const;

const RETRY_OPTIONS = {
  attempts: 3,
  baseDelayMs: 750,
};

export function determineSegmentByEngagement(engagementScore: number): string | null {
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

  console.log('[SEGMENT] syncing contact', {
    contactId,
    engagementScore,
    targetSegment,
  });

  try {
    const currentSegments = await listSegmentsWithRetry(resend, contactId);
    const currentSegmentIds = currentSegments.map((segment) => segment.id);
    const managedSegmentIds = new Set(Object.values(RESEND_SEGMENT_IDS));

    console.log('[SEGMENT] current segments', {
      contactId,
      currentSegmentIds,
    });

    for (const segmentId of currentSegmentIds) {
      if (segmentId !== targetSegment && managedSegmentIds.has(segmentId)) {
        await runWithRetry(
          () =>
            resend.contacts.segments.remove({
              contactId,
              segmentId,
            }),
          {
            ...RETRY_OPTIONS,
            onRetry: (attempt, error, delay) => {
              console.warn('[SEGMENT] retry remove', {
                contactId,
                segmentId,
                attempt,
                delay,
                error,
              });
            },
          }
        );
        console.log('[SEGMENT] removed', { contactId, segmentId });
      }
    }

    if (targetSegment && !currentSegmentIds.includes(targetSegment)) {
      await runWithRetry(
        () =>
          resend.contacts.segments.add({
            contactId,
            segmentId: targetSegment,
          }),
        {
          ...RETRY_OPTIONS,
          onRetry: (attempt, error, delay) => {
            console.warn('[SEGMENT] retry add', {
              contactId,
              targetSegment,
              attempt,
              delay,
              error,
            });
          },
        }
      );
      console.log('[SEGMENT] added', { contactId, targetSegment });
    } else if (targetSegment) {
      console.log('[SEGMENT] already in target segment', { contactId, targetSegment });
    }
  } catch (error) {
    console.error('[SEGMENT] sync failed', { contactId, error });
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
    console.log('[ENGAGEMENT] updating contact', { email, activityType });

    const { data: contact } = await runWithRetry(() => resend.contacts.get({ email }), {
      ...RETRY_OPTIONS,
      onRetry: (attempt, error, delay) => {
        console.warn('[ENGAGEMENT] retry contact get', { email, attempt, delay, error });
      },
    });

    if (!contact) {
      console.warn('[ENGAGEMENT] contact not found', { email });
      return;
    }

    const currentScore = (contact.properties?.engagement_score as number) || 50;
    const newScore = calculateEngagementChange(currentScore, activityType);

    console.log('[ENGAGEMENT] score updated', { email, currentScore, newScore });

    await runWithRetry(
      () =>
        resend.contacts.update({
          email,
          properties: {
            engagement_score: newScore,
            last_active: new Date().toISOString(),
          },
        }),
      {
        ...RETRY_OPTIONS,
        onRetry: (attempt, error, delay) => {
          console.warn('[ENGAGEMENT] retry contact update', { email, attempt, delay, error });
        },
      }
    );

    if (contact.id) {
      await syncContactSegment(resend, contact.id, newScore);
    }

    console.log('[ENGAGEMENT] update complete', { email });
  } catch (error) {
    console.error('[ENGAGEMENT] failed to update contact', { email, error });
  }
}

async function listSegmentsWithRetry(resend: Resend, contactId: string) {
  const { data } = await runWithRetry(
    () =>
      resend.contacts.segments.list({
        contactId,
      }),
    {
      ...RETRY_OPTIONS,
      onRetry: (attempt, error, delay) => {
        console.warn('[SEGMENT] retry list', { contactId, attempt, delay, error });
      },
    }
  );
  return data?.data ?? [];
}
