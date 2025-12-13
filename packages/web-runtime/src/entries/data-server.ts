// Update entry point
// REMOVED: export * from '../actions/safe-action.ts'; - Actions should ONLY be exported from @heyclaude/web-runtime/actions to prevent Turbopack from creating 'actions/data' module IDs
// REMOVED: export { ParseStrategy, safeParse } from '../data.ts'; - This creates phantom module 'actions/data:217325' when both data.ts and actions.ts are in module graph
// If you need ParseStrategy/safeParse, import from @heyclaude/web-runtime/data/utils instead
// REMOVED: export * from '../actions/feature-flags.ts'; - Causes module-level evaluation during SSR, use lazy imports
export * from '../storage/image-storage.ts';
export * from '../storage/image-utils.ts';
export * from '../supabase/server.ts'; // Export server client
export * from '../edge/call-edge-function.ts';
export * from '../edge/transform.ts';
// Removed search-client.ts export - all search functions migrated to /api/search route
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
// REMOVED: export * from '../data/config/category/index.ts'; - This creates phantom module 'actions/data:217325' when both data.ts and actions.ts are in module graph
// Client components should import from @heyclaude/web-runtime/data/config/category instead
// But server components need these exports, so export them here
export { 
  getCategoryConfigs,
  getCategoryConfig,
  getCategoryStatsConfig,
  getHomepageCategoryIds,
} from '../data/config/category/index.ts';
export { STATIC_GENERATION_LIMITS } from '../data/config/constants.ts';

// REMOVED: All action exports - Actions should ONLY be exported from @heyclaude/web-runtime/actions to prevent Turbopack from creating 'actions/data' module IDs
// If you need actions, import from @heyclaude/web-runtime/actions instead
