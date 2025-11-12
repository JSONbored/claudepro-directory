/**
 * Resend integration helpers
 * Topic assignment, property mapping, and contact management
 */

import type { NewsletterSource } from '../database.types.ts';

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
  source: NewsletterSource | string | null,
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

  // Add source-specific topics
  if (source === 'job_board') {
    topics.push(RESEND_TOPIC_IDS.job_board);
  }

  // Deduplicate
  return [...new Set(topics)];
}

/**
 * Calculate initial engagement score based on signup context
 * Higher score for more intentional signups
 */
export function calculateInitialEngagementScore(
  source: NewsletterSource | string | null,
  copyType?: string | null
): number {
  let score = 50; // Neutral baseline

  // High-intent sources get higher scores
  switch (source) {
    case 'post_copy':
      score += 15; // They copied something - highly engaged
      break;
    case 'hero':
    case 'inline':
      score += 10; // Direct subscription from CTA
      break;
    case 'footer':
    case 'footer-bar':
      score += 5; // Less prominent, still intentional
      break;
    case 'modal':
      score -= 5; // Could be accidental/pressured
      break;
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
  source: NewsletterSource | string | null;
  copyType?: string | null;
  copyCategory?: string | null;
  referrer?: string | null;
}): Record<string, string | number> {
  const { source, copyType, copyCategory, referrer } = params;

  return {
    signup_source: source || 'unknown',
    copy_type: copyType || 'none',
    primary_interest: copyCategory || 'general',
    signup_page: referrer || '/',
    engagement_score: calculateInitialEngagementScore(source, copyType),
    total_copies: copyType && copyType !== 'none' ? 1 : 0,
    last_active: new Date().toISOString(),
  };
}
