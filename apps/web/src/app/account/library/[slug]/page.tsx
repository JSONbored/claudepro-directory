import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { APP_CONFIG, ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  size,
  spaceY,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, Edit } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, SimpleCopyButton,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle   } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CollectionItemManager } from '@/src/components/core/domain/collection-items-editor';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CollectionPageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Generate page metadata for the collection detail route using the route `slug`.
 *
 * @param params - An object resolving to route parameters; `slug` is used to build the metadata.
 * @returns The Next.js `Metadata` for the collection detail page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({ params }: CollectionPageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug', { params: { slug } });
}

/**
 * Render the collection detail page for a user's library collection.
 *
 * This server component ensures the request is authenticated (redirecting to /login when not),
 * loads the collection details for the authenticated user, and handles load errors or missing
 * collections by showing an error card or triggering a 404. When successful, it renders the
 * collection header (including an optional share link for public collections), an interactive
 * CollectionItemManager for managing items and bookmarks, and summary statistics.
 *
 * @param params - Route params (resolves to an object containing `slug`) identifying the collection
 * @returns The rendered collection detail page as a React element
 *
 * @see getCollectionDetail
 * @see CollectionItemManager
 * @see ROUTES.ACCOUNT_LIBRARY
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
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Collection unavailable</CardTitle>
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
    <div className={spaceY.relaxed}>
      {/* Header */}
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className={`${marginBottom.default} ${cluster.compact}`}>
            <ArrowLeft className={iconSize.sm} />
            Back to Library
          </Button>
        </Link>

        <div className={`flex ${alignItems.start} ${justify.between}`}>
          <div className="flex-1">
            <div className={`${cluster.compact} ${marginBottom.tight}`}>
              <h1 className={`${weight.bold} ${size['3xl']}`}>{collection.name}</h1>
              {collection.is_public ? <UnifiedBadge variant="base" style="outline" className={size.xs}>
                  Public
                </UnifiedBadge> : null}
            </div>
            {collection.description ? <p className={muted.default}>{collection.description}</p> : null}
            <div className={`${marginTop.compact} ${muted.sm}`}>
              {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'} •{' '}
              {collection.view_count} views
            </div>
          </div>

          <div className={cluster.compact}>
            {shareUrl ? <SimpleCopyButton
                content={shareUrl}
                label="Share"
                successMessage="Link copied to clipboard!"
                variant="outline"
                size="sm"
                className={cluster.compact}
                iconClassName={iconSize.sm}
              /> : null}
            <Link href={`/account/library/${slug}/edit`}>
              <Button variant="outline" size="sm" className={cluster.compact}>
                <Edit className={iconSize.sm} />
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
      <div className={`grid ${gap.comfortable} sm:grid-cols-3`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={`${weight.medium} ${size.sm}`}>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${weight.bold} ${size['2xl']}`}>{collection.item_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={`${weight.medium} ${size.sm}`}>Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${weight.bold} ${size['2xl']}`}>{collection.view_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={`${weight.medium} ${size.sm}`}>Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${weight.bold} ${size['2xl']}`}>{collection.is_public ? 'Public' : 'Private'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}