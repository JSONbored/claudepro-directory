import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { APP_CONFIG, ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft, Edit } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  UnifiedBadge,
  SimpleCopyButton,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CollectionItemManager } from '@/src/components/core/domain/collection-items-editor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

interface CollectionPageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the collection page at the '/account/library/:slug' route.
 *
 * @param params - Object providing route parameters; the resolved value includes `slug`
 * @returns Metadata for the collection page
 *
 * @see generatePageMetadata
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/generate-metadata | Next.js generateMetadata}
 */
export async function generateMetadata({ params }: CollectionPageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug', { params: { slug } });
}

/**
 * Renders the collection detail page for a given collection slug, including header, share/edit controls, item manager, and stats.
 *
 * This server component authenticates the user, loads the collection data for the authenticated user, and renders user-facing fallbacks:
 * - Redirects to `/login` if the request is unauthenticated.
 * - Calls `notFound()` when the specified collection is not accessible or missing.
 * - Displays an error Card if fetching collection data fails.
 *
 * @param params - An object whose `slug` property identifies the collection to display.
 * @returns The page JSX that shows collection metadata, controls (share/edit), a collection item manager, and summary statistics.
 *
 * @see getAuthenticatedUser
 * @see getCollectionDetail
 * @see generatePageMetadata
 */
export default async function CollectionDetailPage({ params }: CollectionPageProperties) {
  const { slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CollectionDetailPage',
    route: `/account/library/${slug}`,
    module: 'apps/web/src/app/account/library/[slug]',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'CollectionDetailPage' });

  if (!user) {
    reqLogger.warn('CollectionDetailPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('CollectionDetailPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Collection Data Fetch
  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  let hasError = false;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
    userLogger.info('CollectionDetailPage: collection data loaded', {
      section: 'collection-data-fetch',
      hasData: !!collectionData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for account view');
    userLogger.error('CollectionDetailPage: getCollectionDetail threw', normalized, {
      section: 'collection-data-fetch',
    });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Collection unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load this collection. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT_LIBRARY}>Back to library</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!collectionData) {
    userLogger.warn('CollectionDetailPage: collection not found or inaccessible');
    notFound();
  }

  const { collection, items, bookmarks } = collectionData;

  if (!collection) {
    userLogger.warn('CollectionDetailPage: collection is null in response', {
      section: 'collection-data-fetch',
    });
    notFound();
  }

  // Final summary log
  userLogger.info('CollectionDetailPage: page render completed', {
    section: 'page-render',
  });

  const shareUrl = collection.is_public
    ? `${APP_CONFIG.url}/u/${user.id}/collections/${collection.slug}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className={`mb-4 ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>

        <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
          <div className="flex-1">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mb-2`}>
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              {collection.is_public ? (
                <UnifiedBadge variant="base" style="outline" className="text-xs">
                  Public
                </UnifiedBadge>
              ) : null}
            </div>
            {collection.description ? (
              <p className="text-muted-foreground">{collection.description}</p>
            ) : null}
            <div className="text-muted-foreground mt-2 text-sm">
              {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'} •{' '}
              {collection.view_count} views
            </div>
          </div>

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {shareUrl ? (
              <SimpleCopyButton
                content={shareUrl}
                label="Share"
                successMessage="Link copied to clipboard!"
                variant="outline"
                size="sm"
                className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
                iconClassName="h-4 w-4"
              />
            ) : null}
            <Link href={`/account/library/${slug}/edit`}>
              <Button variant="outline" size="sm" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Collection Items */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Items</CardTitle>
          <CardDescription>
            Manage the bookmarks in this collection. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CollectionItemManager
            collectionId={collection.id}
            items={(items ?? []).map((item) => ({ ...item, notes: item.notes ?? '' }))}
            availableBookmarks={(bookmarks ?? []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.item_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.view_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.is_public ? 'Public' : 'Private'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
