import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Dynamic Rendering Required
 * Authenticated route (legacy redirect)
 */

const SOURCE_ROUTE = '/account/bookmarks';
const TARGET_ROUTE = '/account/library';

/**
 * Defers non-deterministic work to request time and provides the metadata for the target route.
 *
 * This function ensures request-time evaluation required by Cache Components before producing metadata,
 * then returns metadata for the route that this page redirects to.
 *
 * @returns Metadata for the target route (`TARGET_ROUTE`)
 *
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  // Use target route metadata since this redirects there
  return generatePageMetadata(TARGET_ROUTE);
}

/**
 * Redirects the legacy /account/bookmarks route to /account/library for backward compatibility.
 *
 * This server-side page runs at request time, awaiting a server connection before performing
 * non-deterministic operations. It creates a request-scoped logger,
 * logs an informational redirect event, and issues a hard redirect to the target route.
 *
 * @see SOURCE_ROUTE
 * @see TARGET_ROUTE
 * @see logger
 * @see connection
 * @see redirect
 */
export default async function BookmarksPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  const operation = 'BookmarksPage';
  const route = SOURCE_ROUTE;
  const modulePath = 'apps/web/src/app/account/bookmarks/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation,
    route,
    module: modulePath,
  });

  reqLogger.info(
    {
      section: 'data-fetch',
      sourceRoute: SOURCE_ROUTE,
      targetRoute: TARGET_ROUTE,
      redirectReason: 'legacy-route-compatibility',
    },
    `BookmarksPage: redirecting legacy ${SOURCE_ROUTE} to ${TARGET_ROUTE}`
  );
  redirect(TARGET_ROUTE);
}
