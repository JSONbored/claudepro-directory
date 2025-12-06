import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// MIGRATED: Removed export const runtime = 'nodejs' (default, not needed with Cache Components)
// TODO: Will add Suspense boundaries or "use cache" after analyzing build errors

/**
 * Dynamic Rendering Required
 * Authenticated route (legacy redirect)
 */

const SOURCE_ROUTE = '/account/bookmarks';
const TARGET_ROUTE = '/account/library';

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  // Use target route metadata since this redirects there
  return generatePageMetadata(TARGET_ROUTE);
}

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default async function BookmarksPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'BookmarksPage';
  const route = SOURCE_ROUTE;
  const modulePath = 'apps/web/src/app/account/bookmarks/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
  });

  reqLogger.info(`BookmarksPage: redirecting legacy ${SOURCE_ROUTE} to ${TARGET_ROUTE}`, {
    sourceRoute: SOURCE_ROUTE,
    targetRoute: TARGET_ROUTE,
    redirectReason: 'legacy-route-compatibility',
  });
  redirect(TARGET_ROUTE);
}
