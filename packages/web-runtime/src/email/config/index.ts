/**
 * Email Configuration
 *
 * Configuration presets and utilities for email templates.
 *
 * @module packages/web-runtime/src/email/config
 */

export {
  EMAIL_CTA_PRESETS,
  getCtaPreset,
  type EmailCtaPreset,
  type EmailCtaPresetId,
} from './cta-presets';

export {
  buildSubscriptionFooter,
  buildOnboardingFooter,
  type FooterLine,
  type FooterLineParams,
  type SubscriptionFooterPreset,
  type OnboardingFooterPreset,
} from './footer-presets';

export {
  EMAIL_CONFIG,
  getEmailConfig,
  getResendEnv,
  validateEmailEnvironment,
  APP_URL,
  RATE_LIMITS,
  JOBS_FROM,
  COMMUNITY_FROM,
  HELLO_FROM,
  ONBOARDING_FROM,
  CONTACT_FROM,
  type EmailTemplate,
} from './email-config';
