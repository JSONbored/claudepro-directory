/**
 * Server-only entry point for web-runtime
 *
 * This entry point exports modules that:
 * 1. Import 'server-only'
 * 2. Use Node.js APIs
 * 3. Use server-side Supabase clients
 *
 * These exports MUST NOT be reachable from Client Components.
 */

// Feature flags removed - all configs now use static defaults from feature-flags/defaults.ts
export * from './supabase/server.ts';
export * from './supabase/server-anon.ts';
export * from './supabase/admin.ts';
export * from './supabase/middleware.ts';
export * from './pulse.ts';
export * from './auth/get-authenticated-user.ts';
export * from './server/api-helpers.ts';
export * from './server/storage-proxy.ts';
export * from './server/fetch-helpers.ts';
export * from './rpc/run-rpc.ts';
export * from './seo/generator.ts';
export * from './data/seo/client.ts';
export * from './data/content/detail.ts'; // 'use server' but often used in server contexts directly
export * from './cache-config.ts';
export * from './cache-tags.ts';
export * from './proxy/next.ts';

// Data Loaders (Server-Side)
export * from './data/content-helpers.ts';
export * from './data/content/similar.ts';
export * from './data/tools/recommendations.ts';
export * from './data/newsletter.ts';
export * from './data/quiz.ts';
export * from './data/companies.ts';
export * from './data/jobs.ts';
export * from './data/payments.ts';
export * from './data/community.ts';
export * from './data/account.ts';
export { getActiveNotifications } from './data/notifications.ts';
export * from './data/announcements.ts';
export * from './data/contact.ts';
export * from './data/marketing.ts';
export * from './data/marketing/contact.ts';
export * from './data/marketing/site.ts';
export * from './data/content/index.ts';
export * from './data/content/templates.ts';
export * from './data/content/related.ts';
export * from './data/content/paginated.ts';
export * from './data/content/reviews.ts';
export * from './data/content/homepage.ts';
export * from './data/changelog.ts';
export * from './data/forms/submission-form-fields.ts';
export * from './data/layout.ts';
export { getLayoutData } from './data/layout.ts'; // Explicit export for build resolution
export * from './data/config/categories.ts';
export * from './data/config/category/index.ts';
export * from './data/search/facets.ts';
