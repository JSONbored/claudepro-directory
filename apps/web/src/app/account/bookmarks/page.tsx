import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Dynamic Rendering Required
 * Authenticated route (legacy redirect)
 */

const SOURCE_ROUTE = '/account/bookmarks';
const TARGET_ROUTE = '/account/library';

export async function generateMetadata(): Promise<Metadata> {
  // Use target route metadata since this redirects there
  return generatePageMetadata(TARGET_ROUTE);
}

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  // Generate single requestId for this page request
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
