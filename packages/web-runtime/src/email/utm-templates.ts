/**
 * UTM Parameter Templates for Email Campaigns
 * Provides consistent UTM tracking across all email types
 *
 * @module packages/web-runtime/src/email/utm-templates
 */

/**
 * UTM parameter structure for email campaigns
 */
export interface EmailUTMParams {
  source: 'email' | 'partner_email';
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
  CHANGELOG_RELEASE: {
    source: 'email' as const,
    medium: 'newsletter',
    campaign: 'changelog_release',
  },
  MCP_SERVER_LAUNCH: {
    source: 'email' as const,
    medium: 'announcement',
    campaign: 'mcp_server_launch',
  },

  // Transactional emails
  JOB_POSTED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-posted',
  },
  PASSWORD_RESET: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'password-reset',
  },
  EMAIL_CHANGE: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'email-change',
  },

  // MFA emails
  TRANSACTIONAL_MFA_FACTOR_ADDED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'mfa',
    content: 'factor_added',
  },
  TRANSACTIONAL_MFA_FACTOR_REMOVED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'mfa',
    content: 'factor_removed',
  },

  // Job lifecycle emails
  JOB_SUBMITTED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-submitted',
  },
  JOB_APPROVED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-approved',
  },
  JOB_REJECTED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-rejected',
  },
  JOB_PAYMENT_CONFIRMED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-payment-confirmed',
  },
  JOB_EXPIRING: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-expiring',
  },
  JOB_EXPIRED: {
    source: 'email' as const,
    medium: 'transactional',
    campaign: 'job-expired',
  },

  // Drip campaign emails
  DRIP_POWER_USER_TIPS: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'newsletter_onboarding',
    content: 'power_user_tips',
  },
  DRIP_ENGAGEMENT_NUDGE: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'newsletter_onboarding',
    content: 'engagement_nudge',
  },
  DRIP_DIGEST_PREVIEW: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'newsletter_onboarding',
    content: 'digest_preview',
  },
  DRIP_JOB_CONFIRMATION: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'job_posting',
    content: 'confirmation',
  },
  DRIP_JOB_SHARE_REMINDER: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'job_posting',
    content: 'share_reminder',
  },
  DRIP_JOB_PERFORMANCE_REPORT: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'job_posting',
    content: 'performance_report',
  },
  DRIP_JOB_EXPIRATION_REMINDER: {
    source: 'email' as const,
    medium: 'drip',
    campaign: 'job_posting',
    content: 'expiration_reminder',
  },

  // Contact form emails
  CONTACT_ADMIN: {
    source: 'email' as const,
    medium: 'contact',
    campaign: 'form_submission',
    content: 'admin_notification',
  },
  CONTACT_USER_CONFIRMATION: {
    source: 'email' as const,
    medium: 'contact',
    campaign: 'form_submission',
    content: 'user_confirmation',
  },
} as const satisfies Record<string, EmailUTMParams>;

/**
 * UTM template type for type safety
 */
export type EmailUTMTemplate = (typeof EMAIL_UTM_TEMPLATES)[keyof typeof EMAIL_UTM_TEMPLATES];

/**
 * Get UTM template by name
 */
export function getUTMTemplate(
  templateName: keyof typeof EMAIL_UTM_TEMPLATES
): EmailUTMTemplate | undefined {
  return EMAIL_UTM_TEMPLATES[templateName];
}

/**
 * Create segment-specific UTM parameters
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
 */
export function createContentUTM(baseTemplate: EmailUTMTemplate, content: string): EmailUTMParams {
  return {
    ...baseTemplate,
    content,
  };
}
