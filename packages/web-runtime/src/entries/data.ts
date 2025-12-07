// Update entry point
// REMOVED: export * from '../actions/safe-action.ts'; - Actions should ONLY be exported from @heyclaude/web-runtime/actions to prevent Turbopack from creating 'actions/data' module IDs
// REMOVED: export * from '../actions/feature-flags.ts'; - Server-only, use lazy imports or import from @heyclaude/web-runtime/actions
// REMOVED: export * from '../storage/image-storage.ts'; - Server-only, use @heyclaude/web-runtime/server or @heyclaude/web-runtime/data-server
export * from '../storage/image-utils.ts';
export * from '../edge/call-edge-function.ts';
export * from '../edge/transform.ts';
export * from '../edge/search-client.ts';
export * from '../seo/og.ts';

// Data Services
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
// REMOVED: export * from '../data/marketing.ts'; - Has module-level feature-flags import
export * from '../data/marketing/site.ts';
export * from '../data/seo/client.ts';
export * from '../data/content/index.ts';
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
// REMOVED: export * from '../data/config/categories.ts'; - Has module-level feature-flags import
export * from '../data/config/category/index.ts';

// Actions are exported from @heyclaude/web-runtime/actions, not from data entry point
// This prevents Next.js from creating internal 'actions/data' module IDs that cause bundler errors
// Import actions from '@heyclaude/web-runtime/actions' instead
