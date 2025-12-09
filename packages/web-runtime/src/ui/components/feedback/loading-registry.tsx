/**
 * Loading Component Registry
 *
 * Resolves routes to their loading skeleton components using the centralized configuration.
 * Supports exact route matching and pattern matching for dynamic routes.
 *
 * ## Architecture
 *
 * **Route Resolution:**
 * 1. Normalizes route (ensures leading slash, removes trailing slash)
 * 2. Tries exact match first (e.g., `/account/companies`)
 * 3. Falls back to pattern matching (e.g., `/account/companies/123/edit` → `/account/companies/[id]/edit`)
 * 4. Returns `DefaultLoading` if no match found
 *
 * **Pattern Matching:**
 * - Supports dynamic segments: `[id]`, `[slug]`, `[category]`
 * - Matches segment-by-segment (not regex-based)
 * - First matching pattern wins (order matters in config)
 *
 * ## Usage
 *
 * ### In loading.tsx files:
 * ```typescript
 * import { getLoadingComponent } from '@heyclaude/web-runtime/ui';
 *
 * export default getLoadingComponent('/account/companies/[id]/edit');
 * ```
 *
 * ### Route Resolution Examples:
 * ```typescript
 * // Exact match
 * getLoadingComponent('/account/companies') // → createListPageLoading
 *
 * // Pattern match
 * getLoadingComponent('/account/companies/123/edit') // → matches /account/companies/[id]/edit → createFormPageLoading
 *
 * // Category match
 * getLoadingComponent('/agents') // → CategoryLoading
 * getLoadingComponent('/mcp') // → CategoryLoading
 *
 * // Dynamic category
 * getLoadingComponent('/agents/my-config') // → matches /[category]/[slug] → DetailPageLoading
 * ```
 *
 * ## Factory Dispatch
 *
 * The registry automatically dispatches to the correct factory based on config:
 * - `factory: 'form'` → `createFormPageLoading(config)`
 * - `factory: 'list'` → `createListPageLoading(config)`
 * - `factory: 'detail'` → `createDetailPageLoading(config)`
 * - `factory: 'static'` → `createStaticPageLoading(config)`
 * - `factory: 'dashboard'` → `createDashboardPageLoading(config)`
 * - `factory: 'profile'` → `createProfilePageLoading(config)`
 * - `factory: 'contact'` → `createContactPageLoading(config)`
 * - `factory: 'custom'` → Looks up component in `CUSTOM_COMPONENTS` registry
 *
 * ## Custom Component Registry
 *
 * Custom components are registered in `CUSTOM_COMPONENTS` object:
 * - `CategoryLoading` - For all category list pages
 * - `DetailPageLoading` - For all content detail pages
 * - `ChangelogListLoading` - For changelog timeline view
 * - `SubmitPageLoading` - For submit page (hero + form + sidebar)
 * - `CompanyProfileLoading` - For company profile (header + jobs + stats)
 * - `DefaultLoading` - Fallback spinner
 *
 * **Placeholder Components:**
 * Some detail pages use `DetailPageLoading` as a placeholder until custom components are created:
 * - `ChangelogEntryLoading` → `DetailPageLoading`
 * - `JobDetailLoading` → `DetailPageLoading`
 * - `UserProfileLoading` → `DetailPageLoading`
 * - `CollectionDetailLoading` → `DetailPageLoading`
 * - `PublicCollectionLoading` → `DetailPageLoading`
 *
 * @see {@link ./loading-config.ts} - Route-to-configuration mapping
 * @see {@link ./loading-factory.tsx} - Factory function implementations
 * @see {@link getLoadingComponent} - Main route resolver function
 *
 * @todo Replace placeholder detail components with actual custom components when needed
 * @todo Add support for route priority (more specific patterns first)
 * @todo Add support for route groups (e.g., all `/account/*` routes)
 * @todo Add support for route aliases (e.g., `/bookmarks` → `/account/library`)
 *
 * @future Future Enhancements:
 * - Add route validation (warn if route doesn't exist)
 * - Add route suggestions (suggest similar routes if no match)
 * - Add route analytics (track which routes are accessed)
 * - Add route caching (cache resolved components for performance)
 * - Add route hot-reloading (update config without restart)
 *
 * @module loading-registry
 */

'use client';

import type { ComponentType } from 'react';
import {
  createFormPageLoading,
  createListPageLoading,
  createDetailPageLoading,
  createStaticPageLoading,
  createDashboardPageLoading,
  createProfilePageLoading,
  createContactPageLoading,
  CategoryLoading,
  DetailPageLoading,
  ChangelogListLoading,
  SubmitPageLoading,
  CompanyProfileLoading,
  DefaultLoading,
} from './loading-factory';
import { LOADING_CONFIGS, type LoadingConfig } from './loading-config';

/**
 * Custom component registry.
 *
 * Maps component names to their implementations.
 * Used when `factory: 'custom'` is specified in config.
 *
 * **Registered Components:**
 * - `CategoryLoading` - Category list pages (agents, mcp, commands, etc.)
 * - `DetailPageLoading` - Content detail pages ([category]/[slug])
 * - `ChangelogListLoading` - Changelog timeline view
 * - `SubmitPageLoading` - Submit page (hero + form + sidebar)
 * - `CompanyProfileLoading` - Company profile (header + jobs + stats)
 * - `DefaultLoading` - Fallback spinner
 *
 * **Placeholder Components:**
 * These use `DetailPageLoading` as a fallback until custom components are created:
 * - `ChangelogEntryLoading` → `DetailPageLoading`
 * - `JobDetailLoading` → `DetailPageLoading`
 * - `UserProfileLoading` → `DetailPageLoading`
 * - `CollectionDetailLoading` → `DetailPageLoading`
 * - `PublicCollectionLoading` → `DetailPageLoading`
 *
 * @see {@link ./loading-factory.tsx} - Component implementations
 */
const CUSTOM_COMPONENTS: Record<string, ComponentType> = {
  CategoryLoading,
  DetailPageLoading,
  ChangelogListLoading,
  SubmitPageLoading,
  CompanyProfileLoading,
  DefaultLoading,
  // Custom detail page components (use DetailPageLoading as fallback)
  ChangelogEntryLoading: DetailPageLoading, // @todo Create custom changelog entry component
  JobDetailLoading: DetailPageLoading, // @todo Create custom job detail component
  UserProfileLoading: DetailPageLoading, // @todo Create custom user profile component
  CollectionDetailLoading: DetailPageLoading, // @todo Create custom collection detail component
  PublicCollectionLoading: DetailPageLoading, // @todo Create custom public collection component
};

/**
 * Check if a route matches a pattern.
 *
 * Compares route segments with pattern segments, treating `[id]`, `[slug]`, `[category]`
 * as wildcards that match any segment.
 *
 * **Examples:**
 * - `matchesPattern('/account/companies/123/edit', '/account/companies/[id]/edit')` → `true`
 * - `matchesPattern('/account/companies/123/edit', '/account/companies/[slug]/edit')` → `true`
 * - `matchesPattern('/account/companies/123/edit', '/account/jobs/[id]/edit')` → `false`
 *
 * @param route - Actual route (e.g., '/account/companies/123/edit')
 * @param pattern - Route pattern (e.g., '/account/companies/[id]/edit')
 * @returns `true` if route matches pattern, `false` otherwise
 *
 * @internal
 */
function matchesPattern(route: string, pattern: string): boolean {
  const routeParts = route.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (routeParts.length !== patternParts.length) {
    return false;
  }

  for (let i = 0; i < routeParts.length; i++) {
    const patternPart = patternParts[i];
    const routePart = routeParts[i];

    // Dynamic segment matches anything
    if (patternPart?.startsWith('[') && patternPart?.endsWith(']')) {
      continue;
    }

    // Exact match required for non-dynamic segments
    if (patternPart !== routePart) {
      return false;
    }
  }

  return true;
}

/**
 * Find matching pattern for a route.
 *
 * Searches through all configured routes to find a matching pattern.
 * Tries exact match first, then pattern matching.
 *
 * **Matching Priority:**
 * 1. Exact match (e.g., `/account/companies` matches `/account/companies`)
 * 2. Pattern match (e.g., `/account/companies/123/edit` matches `/account/companies/[id]/edit`)
 *
 * @param route - Actual route to match
 * @returns Matching pattern string or `null` if no match found
 *
 * @internal
 */
function findMatchingPattern(route: string): string | null {
  const patterns = Object.keys(LOADING_CONFIGS);

  // Try exact match first
  if (LOADING_CONFIGS[route]) {
    return route;
  }

  // Try pattern matching
  for (const pattern of patterns) {
    if (matchesPattern(route, pattern)) {
      return pattern;
    }
  }

  return null;
}

/**
 * Get custom component by name.
 *
 * Looks up a component in the `CUSTOM_COMPONENTS` registry.
 * Returns `DefaultLoading` if component not found.
 *
 * @param name - Component name (e.g., 'CategoryLoading')
 * @returns Component implementation or `DefaultLoading` fallback
 *
 * @internal
 */
function getCustomComponent(name: string): ComponentType {
  return CUSTOM_COMPONENTS[name] || DefaultLoading;
}

/**
 * Get loading component for a route.
 *
 * Resolves a route to its loading skeleton component using the centralized configuration.
 * Supports exact routes and dynamic route patterns.
 *
 * **Route Resolution:**
 * 1. Normalizes route (leading slash, no trailing slash)
 * 2. Finds matching config (exact or pattern)
 * 3. Dispatches to appropriate factory or custom component
 * 4. Returns component ready to use
 *
 * **Pattern Matching:**
 * Supports dynamic segments in routes:
 * - `[id]` - Matches any segment (e.g., `/account/companies/123/edit`)
 * - `[slug]` - Matches any segment (e.g., `/companies/acme-corp`)
 * - `[category]` - Matches any category (e.g., `/agents`, `/mcp`)
 *
 * **Examples:**
 * ```typescript
 * // Exact route
 * getLoadingComponent('/account/companies')
 * // → createListPageLoading({ title: 'My Companies', ... })
 *
 * // Dynamic route (pattern match)
 * getLoadingComponent('/account/companies/123/edit')
 * // → matches /account/companies/[id]/edit
 * // → createFormPageLoading({ title: 'Edit Company', ... })
 *
 * // Category route
 * getLoadingComponent('/agents')
 * // → CategoryLoading
 *
 * // No match (fallback)
 * getLoadingComponent('/unknown/route')
 * // → DefaultLoading
 * ```
 *
 * **Factory Dispatch:**
 * Automatically calls the correct factory based on config:
 * - `factory: 'form'` → `createFormPageLoading(config.config)`
 * - `factory: 'list'` → `createListPageLoading(config.config)`
 * - `factory: 'detail'` → `createDetailPageLoading(config.config)`
 * - `factory: 'static'` → `createStaticPageLoading(config.config)`
 * - `factory: 'dashboard'` → `createDashboardPageLoading(config.config)`
 * - `factory: 'profile'` → `createProfilePageLoading(config.config)`
 * - `factory: 'contact'` → `createContactPageLoading(config.config)`
 * - `factory: 'custom'` → `getCustomComponent(config.customComponent)`
 *
 * @param route - Route path (can be exact or pattern)
 * @returns Loading component ready to use as default export
 *
 * @example
 * ```typescript
 * // In apps/web/src/app/account/companies/[id]/edit/loading.tsx
 * import { getLoadingComponent } from '@heyclaude/web-runtime/ui';
 *
 * export default getLoadingComponent('/account/companies/[id]/edit');
 * ```
 *
 * @see {@link ./loading-config.ts} - Route configurations
 * @see {@link ./loading-factory.tsx} - Factory implementations
 * @see {@link CUSTOM_COMPONENTS} - Custom component registry
 */
export function getLoadingComponent(route: string): ComponentType {
  // Normalize route (ensure leading slash, no trailing slash)
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const cleanRoute = normalizedRoute.endsWith('/') && normalizedRoute !== '/'
    ? normalizedRoute.slice(0, -1)
    : normalizedRoute;

  // Try to find matching config
  const pattern = findMatchingPattern(cleanRoute);
  const config: LoadingConfig | undefined = pattern ? LOADING_CONFIGS[pattern] : undefined;

  if (!config) {
    return DefaultLoading;
  }

  // Dispatch based on factory type
  switch (config.factory) {
    case 'form':
      return createFormPageLoading(config.config);
    case 'list':
      return createListPageLoading(config.config);
    case 'detail':
      return createDetailPageLoading(config.config);
    case 'static':
      return createStaticPageLoading(config.config);
    case 'dashboard':
      return createDashboardPageLoading(config.config);
    case 'profile':
      return createProfilePageLoading(config.config);
    case 'contact':
      return createContactPageLoading(config.config);
    case 'custom':
      return getCustomComponent(config.customComponent);
    default:
      return DefaultLoading;
  }
}
