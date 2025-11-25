import { createWebAppContextWithId, generateRequestId, logger } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * Dynamic Rendering Required
 * Authenticated route (legacy redirect)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  // Use /account/library metadata since this redirects there
  return generatePageMetadata('/account/library');
}

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, '/account/bookmarks', 'BookmarksPage', {
    sourceRoute: '/account/bookmarks',
    targetRoute: '/account/library',
    redirectReason: 'legacy-route-compatibility',
  });

  logger.info(
    'BookmarksPage: redirecting legacy /account/bookmarks to /account/library',
    undefined,
    logContext
  );
  redirect('/account/library');
}
