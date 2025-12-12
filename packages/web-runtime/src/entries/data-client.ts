/**
 * Client-Safe Data Entry Point
 * 
 * Exports ONLY code that is safe to import in Client Components.
 * 
 * IMPORTANT: This file must NOT export:
 * - Server actions that call feature flags
 * - Functions that import 'server-only' packages
 * - Functions that use Node.js APIs
 */

// Static Config Getters (sync, client-safe)
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

// Direct config exports from unified config (client-safe)
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

// Safe Utils
export * from '../storage/image-utils.ts';
export * from '../edge/call-edge-function.ts';
export * from '../edge/transform.ts';
// Search functions removed - use /api/search route instead
// Follows architectural strategy: API route -> data layer -> database RPC -> DB
export * from '../seo/og.ts';

// Shared Data Utils (No fetchers, no server-only imports)
export * from '../data/changelog.shared.ts';
// NOTE: content-helpers.ts is server-only - do not export from client entry point
// export * from '../data/content-helpers.ts';
export * from '../data/forms/submission-form-fields.ts';

// Layout Flags - Static defaults (client-safe)
// Use flags-client.ts to avoid HMR issues with module resolution
export { getLayoutFlags, type LayoutFlags } from '../data/layout/flags-client.ts';

// Static Category Config - RAW CONSTANTS ONLY
// These are pure functions with no caching - safe to export
export { 
  ALL_CATEGORY_IDS,
  HOMEPAGE_CATEGORY_IDS,
  CACHEABLE_CATEGORY_IDS,
  isValidCategory,
  VALID_CATEGORIES,
  getCategoryConfigs,
  getCategoryConfig,
  getAllCategoryIds,
  getHomepageCategoryIds,
  getCacheableCategoryIds,
  getCategoryStatsConfig,
  getTotalResourceCount
} from '../data/config/category/index.ts';

// Server Actions are exported from @heyclaude/web-runtime/actions, not from data entry point
// This prevents Next.js from creating internal 'actions/data' module IDs that cause bundler errors
// Import actions from '@heyclaude/web-runtime/actions' instead
