import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CollectionForm } from '@/src/components/core/forms/collection-form';

import Loading from './loading';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

interface EditCollectionPageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Generates page metadata for the Edit Collection route using the route `slug`.
 *
 * @param params - Route parameters containing `slug`
 * @param params.params
 * @returns Metadata for the `/account/library/:slug/edit` route populated with the provided `slug`
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
 * @param params.params
 * @returns The page element containing navigation, collection details header, and the edit `CollectionForm`.
 *
 * @see CollectionForm
 * @see getCollectionDetail
 * @see getAuthenticatedUser
 */
export default async function EditCollectionPage({ params }: EditCollectionPageProperties) {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'EditCollectionPage',
    route: '/account/library/[slug]/edit',
    module: 'apps/web/src/app/account/library/[slug]/edit',
  });

  return (
    <Suspense fallback={<Loading />}>
      <EditCollectionPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Server component that renders the edit-collection UI for a specific collection slug.
 *
 * This component authenticates the current user, loads the collection and its bookmarks,
 * and returns the pre-populated edit form and surrounding layout. If the user is not
 * authenticated the request is redirected to `/login`. If the collection is missing or
 * inaccessible, Next.js `notFound()` is invoked to render a 404. Errors thrown by the
 * data layer while fetching collection details are logged and rethrown.
 *
 * @param params - A promise that resolves to an object containing the route `slug`.
 * @param params.params
 * @param reqLogger - A request-scoped logger; this function creates route- and user-scoped children for structured logs.
 * @param params.reqLogger
 * @returns The JSX element tree for the edit-collection page content.
 * @throws Rethrows any error thrown by `getCollectionDetail`.
 *
 * @see getAuthenticatedUser
 * @see getCollectionDetail
 * @see CollectionForm
 * @see notFound
 * @see redirect
 * @see logger
 */
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
    throw normalized;
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
