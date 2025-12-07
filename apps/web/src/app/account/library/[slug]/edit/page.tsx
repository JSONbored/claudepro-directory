import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CollectionForm } from '@/src/components/core/forms/collection-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

interface EditCollectionPageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Generate page metadata for the Edit Collection route using the route slug.
 *
 * @param params - Promise resolving to route parameters containing `slug`
 * @returns The Next.js `Metadata` for the `/account/library/:slug/edit` route with the provided `slug`
 *
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata
 */
export async function generateMetadata({
  params,
}: EditCollectionPageProperties): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug/edit', { params: { slug } });
}

/**
 * Render the edit-collection page for the specified collection slug.
 *
 * Fetches the authenticated user and collection details, then renders the edit form
 * populated with collection and bookmark data. May redirect to the login page,
 * trigger a 404 via `notFound()`, or rethrow a normalized error when data fetching fails.
 *
 * @param params - An object whose `slug` identifies the collection to edit.
 * @returns The page element containing navigation, collection details header, and the edit `CollectionForm`.
 *
 * @see CollectionForm
 * @see getCollectionDetail
 * @see getAuthenticatedUser
 */
export default async function EditCollectionPage({ params }: EditCollectionPageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'EditCollectionPage',
    route: '/account/library/[slug]/edit',
    module: 'apps/web/src/app/account/library/[slug]/edit',
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading collection editor...</div>}>
      <EditCollectionPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

async function EditCollectionPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ slug: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { slug } = await params;

  // Update logger with actual slug
  const routeLogger = reqLogger.child({
    route: `/account/library/${slug}/edit`,
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'EditCollectionPage' });

  if (!user) {
    routeLogger.warn('EditCollectionPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = routeLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('EditCollectionPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Collection Data Fetch
  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
    userLogger.info('EditCollectionPage: collection data loaded', {
      section: 'collection-data-fetch',
      hasData: !!collectionData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail');
    userLogger.error('EditCollectionPage: getCollectionDetail threw', normalized, {
      section: 'collection-data-fetch',
    });
    throw error;
  }

  if (!collectionData) {
    userLogger.warn('EditCollectionPage: collection not found or inaccessible', {
      section: 'collection-data-fetch',
    });
    notFound();
  }

  const { collection, bookmarks } = collectionData;

  if (!collection) {
    userLogger.warn('EditCollectionPage: collection is null in response', {
      section: 'collection-data-fetch',
    });
    notFound();
  }

  // Final summary log
  userLogger.info('EditCollectionPage: page render completed', {
    section: 'page-render',
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/account/library/${slug}`}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Collection
          </Button>
        </Link>
        <h1 className="mb-2 text-3xl font-bold">Edit Collection</h1>
        <p className="text-muted-foreground">Update your collection details and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionForm
            bookmarks={(bookmarks ?? []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
            mode="edit"
            collection={{ ...collection, description: collection.description ?? '' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
