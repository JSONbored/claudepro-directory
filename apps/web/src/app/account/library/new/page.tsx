import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  withDuration,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserBookmarksForCollections,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { Button, Card, CardContent, CardHeader, CardTitle  } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
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

export default async function NewCollectionPage() {
  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    '/account/library/new',
    'NewCollectionPage'
  );

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'NewCollectionPage' });

  if (!user) {
    logger.warn(
      'NewCollectionPage: unauthenticated access attempt',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'authentication',
          timestamp: new Date().toISOString(),
        },
        authSectionStart
      )
    );
    redirect('/login');
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };
  logger.info(
    'NewCollectionPage: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Bookmarks Data Fetch
  const bookmarksSectionStart = Date.now();
  const bookmarks = await getUserBookmarksForCollections(user.id);
  logger.info(
    'NewCollectionPage: bookmarks data loaded',
    withDuration(
      {
        ...logContext,
        section: 'bookmarks-data-fetch',
        bookmarksCount: bookmarks.length,
      },
      bookmarksSectionStart
    )
  );

  // Final summary log
  logger.info(
    'NewCollectionPage: page render completed',
    withDuration(
      {
        ...logContext,
        section: 'page-render',
      },
      startTime
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="mb-2 font-bold text-3xl">Create Collection</h1>
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
