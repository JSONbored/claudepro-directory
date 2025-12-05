// Update entry point
export * from '../actions/safe-action.ts';
// Export ParseStrategy and safeParse from data.ts (exports both value and type)
export { ParseStrategy, safeParse } from '../data.ts';
// REMOVED: export * from '../actions/feature-flags.ts'; - Causes module-level evaluation during SSR, use lazy imports
export * from '../storage/image-storage.ts';
export * from '../storage/image-utils.ts';
export * from '../supabase/server.ts'; // Export server client
export * from '../edge/call-edge-function.ts';
export * from '../edge/transform.ts';
export * from '../edge/search-client.ts';
export * from '../seo/og.ts';
export * from '../auth/get-authenticated-user.ts';

// Static Config Getters (sync)
export {
  getTimeoutConfig,
  getPollingConfig,
  getNewsletterConfig,
  getNewsletterConfigValue,
  getAppSettings,
  getRecentlyViewedConfig,
  getAnimationConfig,
  getHomepageConfigBundle,
} from '../config/static-configs.ts';

// Direct config exports from unified config
export {
  UI_ANIMATION,
  UI_TIMEOUTS,
  API_TIMEOUTS,
  CONFETTI_CONFIG,
  POLLING_CONFIG,
  NEWSLETTER_CTA,
  NEWSLETTER_BEHAVIOR,
  RECENTLY_VIEWED_CONFIG,
  HOMEPAGE_CONFIG,
  INFINITE_SCROLL_CONFIG,
} from '../config/unified-config.ts';

// Data Services (Server-Side)
export * from '../data/content-helpers.ts';
export * from '../data/content/similar.ts';
export * from '../data/tools/recommendations.ts';
export * from '../data/newsletter.ts';
export * from '../data/quiz.ts';
export * from '../data/companies.ts';
export * from '../data/jobs.ts';
export * from '../data/payments.ts';
export * from '../data/community.ts';
export * from '../data/account.ts';
export * from '../data/notifications.ts';
export * from '../data/announcements.ts';
export * from '../data/contact.ts';
export { logActionFailure } from '../errors.ts';
// REMOVED: export * from '../data/marketing.ts'; - Has module-level feature-flags import, but re-export specific functions
export { getPartnerPricing } from '../data/marketing.ts';
export * from '../data/marketing/site.ts';
export * from '../seo/generator.ts';
export * from '../data/seo/client.ts';
export * from '../data/content/index.ts';
export * from '../data/content/detail.ts';
export * from '../data/content/templates.ts';
export * from '../data/content/related.ts';
export * from '../data/content/paginated.ts';
export * from '../data/content/reviews.ts';
export * from '../data/content/homepage.ts';
export * from '../data/search/facets.ts';
export * from '../data/changelog.ts';
export * from '../data/forms/submission-form-fields.ts';
export * from '../data/layout.ts';
// Layout flags - exported separately since layout.ts no longer exports it (due to 'use server' restrictions)
export { getLayoutFlags, type LayoutFlags } from '../data/layout/flags.ts';
// REMOVED: export * from '../data/config/categories.ts'; - Has module-level feature-flags import, but re-export specific functions
export { getHomepageFeaturedCategories, getHomepageTabCategories } from '../data/config/categories.ts';
export * from '../data/config/category/index.ts';
export { STATIC_GENERATION_LIMITS } from '../data/config/constants.ts';

// Actions
export * from '../actions/pulse.ts';
export * from '../actions/newsletter.ts';
export { getQuizConfigurationAction } from '../actions/quiz.ts';
export * from '../actions/run-rpc-instance.ts';
export * from '../actions/companies.ts';
export * from '../actions/contact.ts';
export * from '../actions/submit-contact-form.generated.ts';
export * from '../actions/content.ts';
export * from '../actions/jobs.ts';
export * from '../actions/notifications.ts';
export * from '../actions/user.ts';
