/**
 * UTM Parameter Templates for Email Campaigns
 * Provides consistent UTM tracking across all email types
 *
 * Usage:
 * ```ts
 * import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
 *
 * const params = EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST;
 * // { source: 'email', medium: 'newsletter', campaign: 'weekly_digest' }
 * ```
 *
 * @module lib/utils/utm-templates
 */

/**
 * UTM parameter structure for email campaigns
 */
export interface EmailUTMParams {
  source: 'email' | 'partner_email' | 'ph_launch';
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

/**
 * Email campaign UTM templates
 * Single source of truth for all email UTM parameters
 */
export const EMAIL_UTM_TEMPLATES = {
  // Newsletter campaigns
  WEEKLY_DIGEST: {
    source: 'email' as const,
    medium: 'newsletter',
    campaign: 'weekly_digest',
  },

  // Onboarding sequence
  ONBOARDING_WELCOME: {
    source: 'email' as const,
    medium: 'onboarding',
    campaign: 'welcome_series',
    content: 'step_1_welcome',
  },
  ONBOARDING_GETTING_STARTED: {
    source: 'email' as const,
    medium: 'onboarding',
    campaign: 'welcome_series',
    content: 'step_2_getting_started',
  },
  ONBOARDING_POWER_TIPS: {
    source: 'email' as const,
    medium: 'onboarding',
    campaign: 'welcome_series',
    content: 'step_3_power_tips',
  },
  ONBOARDING_COMMUNITY: {
    source: 'email' as const,
    medium: 'onboarding',
    campaign: 'welcome_series',
    content: 'step_4_community',
  },
  ONBOARDING_STAY_ENGAGED: {
    source: 'email' as const,
    medium: 'onboarding',
    campaign: 'welcome_series',
    content: 'step_5_stay_engaged',
  },

  // Lead magnets
  LEAD_MAGNET_CHEAT_SHEET: {
    source: 'email' as const,
    medium: 'lead_magnet',
    campaign: 'cheat_sheet',
  },
  LEAD_MAGNET_STARTER_PACK: {
    source: 'email' as const,
    medium: 'lead_magnet',
    campaign: 'starter_pack',
  },
  LEAD_MAGNET_CALCULATOR: {
    source: 'email' as const,
    medium: 'lead_magnet',
    campaign: 'calculator',
  },
  LEAD_MAGNET_TEMPLATES: {
    source: 'email' as const,
    medium: 'lead_magnet',
    campaign: 'templates',
  },

  // Product Hunt launch
  PH_PRE_LAUNCH: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'pre_launch',
  },
  PH_LAUNCH_DAY: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'launch_day',
  },
  PH_MID_DAY_REMINDER: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'mid_day_reminder',
  },
  PH_POST_LAUNCH_WEEK_1: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'post_launch_week_1',
  },
  PH_POST_LAUNCH_WEEK_2: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'post_launch_week_2',
  },
  PH_POST_LAUNCH_WEEK_3: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'post_launch_week_3',
  },
  PH_POST_LAUNCH_WEEK_4: {
    source: 'ph_launch' as const,
    medium: 'product_hunt',
    campaign: 'post_launch_week_4',
  },

  // Partner campaigns
  PARTNER_WELCOME: {
    source: 'partner_email' as const,
    medium: 'partner_outreach',
    campaign: 'partnership_welcome',
  },
  PARTNER_NURTURE_VALUE_PROP: {
    source: 'partner_email' as const,
    medium: 'partner_outreach',
    campaign: 'partnership_nurture',
    content: 'value_prop',
  },
  PARTNER_NURTURE_CASE_STUDY: {
    source: 'partner_email' as const,
    medium: 'partner_outreach',
    campaign: 'partnership_nurture',
    content: 'case_study',
  },
  PARTNER_NURTURE_PRICING: {
    source: 'partner_email' as const,
    medium: 'partner_outreach',
    campaign: 'partnership_nurture',
    content: 'pricing_cta',
  },

  // Re-engagement campaigns
  REENGAGEMENT_INACTIVE: {
    source: 'email' as const,
    medium: 'reengagement',
    campaign: 'inactive_subscribers',
  },

  // Announcements
  ANNOUNCEMENT_FEATURE: {
    source: 'email' as const,
    medium: 'announcement',
    campaign: 'new_feature',
  },
  ANNOUNCEMENT_UPDATE: {
    source: 'email' as const,
    medium: 'announcement',
    campaign: 'product_update',
  },
} as const satisfies Record<string, EmailUTMParams>;

/**
 * UTM template type for type safety
 */
export type EmailUTMTemplate = (typeof EMAIL_UTM_TEMPLATES)[keyof typeof EMAIL_UTM_TEMPLATES];

/**
 * Get UTM template by name
 *
 * @param templateName - Template name key
 * @returns UTM parameters or undefined if not found
 */
export function getUTMTemplate(
  templateName: keyof typeof EMAIL_UTM_TEMPLATES
): EmailUTMTemplate | undefined {
  return EMAIL_UTM_TEMPLATES[templateName];
}

/**
 * Create segment-specific UTM parameters
 *
 * @param baseTemplate - Base UTM template
 * @param segment - Segment identifier (e.g., 'agents_only', 'mcp_only')
 * @returns UTM parameters with segment term
 *
 * @example
 * ```ts
 * const segmentedUTM = createSegmentedUTM(
 *   EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST,
 *   'agents_only'
 * );
 * // { source: 'email', medium: 'newsletter', campaign: 'weekly_digest', term: 'segment_agents_only' }
 * ```
 */
export function createSegmentedUTM(
  baseTemplate: EmailUTMTemplate,
  segment: string
): EmailUTMParams {
  return {
    ...baseTemplate,
    term: `segment_${segment}`,
  };
}

/**
 * Create content-specific UTM parameters
 *
 * @param baseTemplate - Base UTM template
 * @param content - Content identifier (e.g., 'primary_cta', 'agent_spotlight_1')
 * @returns UTM parameters with content identifier
 *
 * @example
 * ```ts
 * const contentUTM = createContentUTM(
 *   EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST,
 *   'primary_cta'
 * );
 * // { source: 'email', medium: 'newsletter', campaign: 'weekly_digest', content: 'primary_cta' }
 * ```
 */
export function createContentUTM(baseTemplate: EmailUTMTemplate, content: string): EmailUTMParams {
  return {
    ...baseTemplate,
    content,
  };
}
