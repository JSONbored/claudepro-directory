import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserBookmarksForCollections,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CollectionForm } from '@/src/components/core/forms/collection-form';

import Loading from './loading';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

/**
 * Generate metadata for the account library "Create Collection" page.
 *
 * This function ensures the request-scoped server connection is established before
 * creating non-deterministic metadata (e.g., timestamps) and then builds metadata
 * for the '/account/library/new' route.
 *
 * @returns Metadata for the '/account/library/new' page
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/library/new');
}

/**
 * Page component that renders the "Create Collection" UI for authenticated users.
 *
 * This server component enforces authentication, redirects unauthenticated requests to /login,
 * loads the current user's bookmarks for use in the collection form (ensuring each bookmark
 * has a `notes` field), and renders the collection creation form with navigation and layout.
 *
 * @returns The page's React elements: a header with back navigation and a card containing the collection form.
 *
 * @see getAuthenticatedUser
 * @see getUserBookmarksForCollections
 * @see CollectionForm
 * @see ROUTES.ACCOUNT_LIBRARY
 */
export default async function NewCollectionPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'NewCollectionPage',
    route: '/account/library/new',
    module: 'apps/web/src/app/account/library/new',
  });

  return (
    <Suspense fallback={<Loading />}>
      <NewCollectionPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the "Create Collection" page content after ensuring the request is authenticated and user bookmarks are loaded.
 *
 * This server component enforces authentication (redirecting to /login for unauthenticated requests), loads the current user's bookmarks for use by the collection form, and returns the page UI including back navigation, page title, and a CollectionForm prepopulated with the user's bookmarks.
 *
 * @param reqLogger - A request-scoped logger instance used to emit structured logs for authentication, data loading, and page render events.
 * @param reqLogger.reqLogger
 * @returns The page React element for creating a new collection.
 *
 * @see getAuthenticatedUser
 * @see getUserBookmarksForCollections
 * @see CollectionForm
 * @see ROUTES.ACCOUNT_LIBRARY
 */
async function NewCollectionPageContent({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
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
    <div className="space-y-6">
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="mb-2 text-3xl font-bold">Create Collection</h1>
        <p className="text-muted-foreground">Organize your bookmarks into a custom collection</p>
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
