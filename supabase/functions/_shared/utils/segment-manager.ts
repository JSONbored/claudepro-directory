/**
 * Resend Segment Manager - Behavioral segment assignment
 *
 * Manages 3-segment limit on free tier:
 * - High Engagement (70-100): Power users, frequent interactions
 * - Medium Engagement (40-69): Active but not super-engaged
 * - Low Engagement (0-39): New users, inactive, at-risk
 *
 * Note: Segments do NOT auto-update in Resend. You must:
 * 1. Evaluate engagement_score in your application
 * 2. Call syncContactSegment() to update Resend via API
 * 3. Trigger on: new signup, email opens/clicks, user activity
 */

import type { Resend } from 'npm:resend@4.0.0';

/**
 * Production Resend Segment IDs
 * - Active Subscribers (70+ engagement score)
 * - New Subscribers (subscribed <7 days, any score)
 * - At-Risk (0-39 engagement score, inactive)
 */
export const RESEND_SEGMENT_IDS = {
  high_engagement: '7757f565-bb4e-4a3e-bfd8-59f7636a6c14', // Active Subscribers
  medium_engagement: '6fadc736-c46a-452e-b3bd-8bfedb83f988', // New Subscribers
  low_engagement: '2d86c140-fdff-4f22-b9bf-7efa0f7897e9', // At-Risk
} as const;

/**
 * Determine target segment based on engagement score
 * Only ONE segment per contact (3-segment limit)
 */
export function determineSegmentByEngagement(engagementScore: number): string | null {
  if (engagementScore >= 70) {
    return RESEND_SEGMENT_IDS.high_engagement;
  }
  if (engagementScore >= 40) {
    return RESEND_SEGMENT_IDS.medium_engagement;
  }
  if (engagementScore >= 0) {
    return RESEND_SEGMENT_IDS.low_engagement;
  }
  return null;
}

/**
 * Sync contact to correct segment (removes from others)
 * Call this whenever engagement_score changes
 *
 * @param resend - Resend client instance
 * @param contactId - Resend contact ID (NOT email)
 * @param engagementScore - Current engagement score (0-100)
 */
export async function syncContactSegment(
  resend: Resend,
  contactId: string,
  engagementScore: number
): Promise<void> {
  const targetSegment = determineSegmentByEngagement(engagementScore);

  console.log(
    `[SEGMENT] Syncing contact ${contactId} (score: ${engagementScore}) to segment: ${targetSegment || 'none'}`
  );

  try {
    // Get current segments
    const { data: currentSegments } = await resend.contacts.segments.list({
      contactId,
    });

    const currentSegmentIds = currentSegments?.data?.map((s) => s.id) || [];
    const allManagedSegmentIds = Object.values(RESEND_SEGMENT_IDS);

    console.log(`[SEGMENT] Current segments: ${currentSegmentIds.join(', ') || 'none'}`);

    // Remove from wrong segments (only our managed segments)
    for (const segmentId of currentSegmentIds) {
      if (segmentId !== targetSegment && allManagedSegmentIds.includes(segmentId)) {
        await resend.contacts.segments.remove({
          contactId,
          segmentId,
        });
        console.log(`[SEGMENT] ✓ Removed from segment: ${segmentId}`);
      }
    }

    // Add to correct segment if not already there
    if (targetSegment && !currentSegmentIds.includes(targetSegment)) {
      await resend.contacts.segments.add({
        contactId,
        segmentId: targetSegment,
      });
      console.log(`[SEGMENT] ✓ Added to segment: ${targetSegment}`);
    } else if (targetSegment) {
      console.log(`[SEGMENT] Already in correct segment: ${targetSegment}`);
    }
  } catch (error) {
    console.error('[SEGMENT] Segment sync failed:', error);
    // Don't throw - segment assignment failures shouldn't break core flows
  }
}

/**
 * Calculate new engagement score based on activity
 * Returns clamped score (0-100)
 *
 * @param currentScore - Current engagement score
 * @param activityType - Type of activity that occurred
 */
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
      newScore += 10; // Strongest signal
      break;
    case 'copy_content':
      newScore += 8; // High-intent action
      break;
    case 'email_open':
      newScore += 5; // Medium signal (can be inflated by privacy features)
      break;
    case 'visit_page':
      newScore += 2; // Low signal
      break;
    case 'email_bounce':
      newScore -= 20; // Significant negative
      break;
    case 'email_complaint':
      newScore = 0; // Critical - reset to zero
      break;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, newScore));
}

/**
 * Full contact engagement update: properties + segment sync
 * Call this from webhook handlers or activity trackers
 *
 * @param resend - Resend client instance
 * @param email - Contact email address
 * @param activityType - Type of activity that occurred
 */
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
    console.log(`[ENGAGEMENT] Updating ${email} for activity: ${activityType}`);

    // Get current contact
    const { data: contact } = await resend.contacts.get({ email });

    if (!contact) {
      console.warn(`[ENGAGEMENT] Contact not found: ${email}`);
      return;
    }

    const currentScore = (contact.properties?.engagement_score as number) || 50;
    const newScore = calculateEngagementChange(currentScore, activityType);

    console.log(`[ENGAGEMENT] Score change: ${currentScore} → ${newScore} (${activityType})`);

    // Update contact properties
    await resend.contacts.update({
      email,
      properties: {
        engagement_score: newScore,
        last_active: new Date().toISOString(),
      },
    });

    console.log('[ENGAGEMENT] ✓ Properties updated');

    // Sync segment if contact ID available
    if (contact.id) {
      await syncContactSegment(resend, contact.id, newScore);
    }

    console.log(`[ENGAGEMENT] ✓ Complete for ${email}`);
  } catch (error) {
    console.error(`[ENGAGEMENT] Failed to update ${email}:`, error);
    // Don't throw - engagement updates are non-critical
  }
}
