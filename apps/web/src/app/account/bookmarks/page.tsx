import { createWebAppContextWithId, generateRequestId, logger } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

const SOURCE_ROUTE = '/account/bookmarks';
const TARGET_ROUTE = '/account/library';

/**
 * Dynamic Rendering Required
 * Authenticated route (legacy redirect)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  const logContext = createWebAppContextWithId(requestId, SOURCE_ROUTE, 'BookmarksPage', {
    sourceRoute: SOURCE_ROUTE,
    targetRoute: TARGET_ROUTE,
    redirectReason: 'legacy-route-compatibility',
  });

  logger.info(
    `BookmarksPage: redirecting legacy ${SOURCE_ROUTE} to ${TARGET_ROUTE}`,
    undefined,
    logContext
  );
  redirect(TARGET_ROUTE);
}
