import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserBookmarksForCollections,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { iconSize, cluster, spaceY, muted, marginBottom, weight , size } from '@heyclaude/web-runtime/design-system';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { Button, Card, CardContent, CardHeader, CardTitle  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CollectionForm } from '@/src/components/core/forms/collection-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/library/new');
}

/**
 * Renders the "Create Collection" page for an authenticated user, including the collection form populated with the user's bookmarks.
 *
 * Performs server-side authentication and redirects the client to `/login` if no user is authenticated. When authenticated, fetches the user's bookmarks for use by the CollectionForm.
 *
 * @returns The page's React element tree containing navigation, page header, and a card with the CollectionForm preloaded with the user's bookmarks.
 *
 * @see getAuthenticatedUser
 * @see getUserBookmarksForCollections
 * @see CollectionForm
 * @see ROUTES.ACCOUNT_LIBRARY
 */
export default async function NewCollectionPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'NewCollectionPage',
    route: '/account/library/new',
    module: 'apps/web/src/app/account/library/new',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'NewCollectionPage' });

  if (!user) {
    reqLogger.warn('NewCollectionPage: unauthenticated access attempt', {
      section: 'authentication',
      timestamp: new Date().toISOString(),
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('NewCollectionPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Bookmarks Data Fetch
  const bookmarks = await getUserBookmarksForCollections(user.id);
  userLogger.info('NewCollectionPage: bookmarks data loaded', {
    section: 'bookmarks-data-fetch',
    bookmarksCount: bookmarks.length,
  });

  // Final summary log
  userLogger.info('NewCollectionPage: page render completed', {
    section: 'page-render',
  });

  return (
    <div className={spaceY.relaxed}>
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className={`${marginBottom.default} ${cluster.compact}`}>
            <ArrowLeft className={iconSize.sm} />
            Back to Library
          </Button>
        </Link>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Create Collection</h1>
        <p className={muted.default}>Organize your bookmarks into a custom collection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionForm
            bookmarks={bookmarks.map((b) => ({ ...b, notes: b.notes ?? '' }))}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}