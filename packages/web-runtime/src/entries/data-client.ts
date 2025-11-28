/**
 * Client-Safe Data Entry Point
 * 
 * Exports ONLY code that is safe to import in Client Components.
 * 
 * IMPORTANT: This file must NOT export:
 * - Server actions that call feature flags
 * - Functions that import 'server-only' packages
 * - Functions that use Node.js APIs
 * 
 * For dynamic configs, use client-safe defaults from config/client-defaults.ts
 */

// Client-Safe Config Defaults (no server actions)
export * from '../config/client-defaults.ts';

// Safe Utils
export * from '../storage/image-utils.ts';
export * from '../edge/call-edge-function.ts';
export * from '../edge/transform.ts';
export { searchUnifiedClient } from '../edge/search-client.ts';
export type {
  UnifiedSearchOptions,
  UnifiedSearchResponse,
  UnifiedSearchFilters,
  SearchEntity,
} from '../edge/search-client.ts';
export * from '../seo/og.ts';

// Shared Data Utils (No fetchers, no server-only imports)
export * from '../data/changelog.shared.ts';
// NOTE: content-helpers.ts is server-only - do not export from client entry point
// export * from '../data/content-helpers.ts';
export * from '../data/forms/submission-form-fields.ts';

// Layout Flags - Static defaults (client-safe)
export { getLayoutFlags, type LayoutFlags } from '../data/layout/flags.ts';

// Static Category Config - RAW CONSTANTS ONLY
// Do NOT export getCategoryConfig (uses cache()) or other server functions
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

// Server Actions (Safe to import in client - they're RPC endpoints)
// These are treated as RPC calls by Next.js, safe for client import
export * from '../actions/pulse.ts';
export * from '../actions/newsletter.ts';
export * from '../actions/companies.ts';
export * from '../actions/contact.ts';
export * from '../actions/submit-contact-form.generated.ts';
export * from '../actions/content.ts';
export * from '../actions/jobs.ts';
export * from '../actions/notifications.ts';
export * from '../actions/user.ts';
