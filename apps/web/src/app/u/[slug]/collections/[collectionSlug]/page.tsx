/**
 * User Collection Detail Page - Database-First RPC Architecture
 * Single RPC call to get_user_collection_detail() replaces 3 separate queries
 */

import { Constants } from '@heyclaude/database-types';
import { type CollectionDetailData } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPublicCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft, ExternalLink } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  NavLink,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Pulse } from '@/src/components/core/infra/pulse';

// Collection pages may have private content
export const dynamic = 'force-dynamic';

// Whitelisted content types for outgoing links - use Constants from database types
const ALLOWED_CONTENT_TYPES = Constants.public.Enums.content_category;

function isValidContentType(type: string): boolean {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);
}

/**
 * Checks whether a slug contains only letters, digits, hyphens, or underscores.
 *
 * @param slug - The candidate slug to validate (no slashes, no protocol).
 * @returns `true` if `slug` is a non-empty string composed only of ASCII letters, digits, `-`, or `_`; `false` otherwise.
 *
 * @see getSafeContentLink
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Produce a safe internal path to a content item when its type and slug are valid.
 *
 * @param item - Object containing `content_type` and `content_slug` for the content item
 * @returns The path string `/[content_type]/[content_slug]` when both values are valid, or `null` when not
 *
 * @see isValidContentType
 * @see isValidSlug
 */
function getSafeContentLink(item: { content_slug: string; content_type: string }): null | string {
  if (isValidContentType(item.content_type) && isValidSlug(item.content_slug)) {
    return `/${item.content_type}/${item.content_slug}`;
  }
  return null;
}

interface PublicCollectionPageProperties {
  params: { collectionSlug: string; slug: string };
}

/**
 * Generates metadata for a public collection detail page and warms the related data cache.
 *
 * Fetches collection detail data before the page renders to pre-populate the cache. Errors
 * during the fetch are logged but do not interrupt metadata generation.
 *
 * @param params - Route parameters containing the user slug and collection slug
 * @returns Page metadata for the public collection detail page
 */
export async function generateMetadata({
  params,
}: PublicCollectionPageProperties): Promise<Metadata> {
  const { slug, collectionSlug } = params;

  // Generate requestId for metadata generation (separate from page render)
  const metadataRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    requestId: metadataRequestId,
    operation: 'PublicCollectionPageMetadata',
    route: `/u/${slug}/collections/${collectionSlug}`,
    module: 'apps/web/src/app/u/[slug]/collections/[collectionSlug]',
  });

  try {
    // Warm cache for subsequent page render - this fetch in generateMetadata
    // ensures the data is cached when the page component fetches the same data
    await getPublicCollectionDetail({
      userSlug: slug,
      collectionSlug,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for metadata');
    metadataLogger.error('PublicCollectionPage: metadata fetch failed', normalized, {
      section: 'metadata-generation',
    });
  }

  return generatePageMetadata('/u/:slug/collections/:collectionSlug', {
    params: { slug, collectionSlug },
    slug,
    collectionSlug,
  });
}

/**
 * Renders the public collection detail page for a user's collection, including header, items list, and stats.
 *
 * Fetches the collection data for the given user and collection slugs, triggers a 404 when the collection is missing,
 * and conditionally shows owner controls and safe item links. Also emits a non-blocking view tracking pulse.
 *
 * @param params - Route parameters for the page.
 * @param params.slug - The user slug (profile owner) from the route.
 * @param params.collectionSlug - The collection slug from the route.
 * @returns The React element tree for the public collection page.
 *
 * @see getPublicCollectionDetail
 * @see getAuthenticatedUser
 * @see getSafeContentLink
 * @see generateRequestId
 */
export default async function PublicCollectionPage({ params }: PublicCollectionPageProperties) {
  const { slug, collectionSlug } = params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'PublicCollectionPage',
    route: `/u/${slug}/collections/${collectionSlug}`,
    module: 'apps/web/src/app/u/[slug]/collections/[collectionSlug]',
  });

  // Get current user (if logged in) for ownership check
  const { user: currentUser } = await getAuthenticatedUser({
    requireUser: false,
    context: 'PublicCollectionPage',
  });

  // Create child logger with viewer context if available
  const viewerLogger = currentUser?.id ? reqLogger.child({ viewerId: currentUser.id }) : reqLogger;

  // Section: Collection Detail Fetch
  let collectionData: CollectionDetailData | null = null;
  try {
    collectionData = await getPublicCollectionDetail({
      userSlug: slug,
      collectionSlug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
    viewerLogger.info('PublicCollectionPage: collection detail loaded', {
      section: 'collection-detail-fetch',
      hasData: !!collectionData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for page render');
    viewerLogger.error('PublicCollectionPage: getPublicCollectionDetail threw', normalized, {
      section: 'collection-detail-fetch',
    });
    throw normalized;
  }

  if (!collectionData) {
    viewerLogger.warn('PublicCollectionPage: collection detail not found', {
      section: 'collection-detail-fetch',
    });
    notFound();
  }

  const { user: profileUser, collection, items, is_owner } = collectionData;

  return (
    <div className="bg-background min-h-screen">
      {/* Track view - non-blocking */}
      <Pulse
        variant="view"
        category={Constants.public.Enums.content_category[8]} // 'collections'
        slug={collectionSlug}
        metadata={{
          user_slug: slug,
          collection_slug: collectionSlug,
        }}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-6">
          {/* Navigation */}
          <Link href={`/u/${slug}`}>
            <Button variant="ghost" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <ArrowLeft className="h-4 w-4" />
              Back to {profileUser?.name ?? slug}'s Profile
            </Button>
          </Link>

          {/* Header */}
          <div>
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-2`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <h1 className="text-3xl font-bold">{collection?.name ?? 'Untitled Collection'}</h1>
                <UnifiedBadge variant="base" style="outline">
                  Public
                </UnifiedBadge>
              </div>
              {is_owner ? (
                <Link href={`/account/library/${collection?.slug}`}>
                  <Button variant="outline" size="sm">
                    Manage Collection
                  </Button>
                </Link>
              ) : null}
            </div>

            {collection?.description ? (
              <p className="text-muted-foreground max-w-3xl">{collection.description}</p>
            ) : null}

            <div className="text-muted-foreground mt-2 text-sm">
              Created by <NavLink href={`/u/${slug}`}>{profileUser?.name ?? slug}</NavLink> •{' '}
              {collection?.item_count ?? 0} {(collection?.item_count ?? 0) === 1 ? 'item' : 'items'}{' '}
              • {collection?.view_count ?? 0} views
            </div>
          </div>

          {/* Collection Items */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Items in this Collection</h2>

            {!items || items.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <p className="text-muted-foreground">This collection is empty</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {items
                  .filter(
                    (
                      item
                    ): item is typeof item & {
                      content_slug: string;
                      content_type: string;
                      id: string;
                    } =>
                      item.id !== null && item.content_type !== null && item.content_slug !== null
                  )
                  .map((item, index) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="text-muted-foreground/50 w-8 text-2xl font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                              <UnifiedBadge variant="base" style="outline" className="capitalize">
                                {item.content_type}
                              </UnifiedBadge>
                              <CardTitle className="text-lg">{item.content_slug}</CardTitle>
                            </div>
                            {item.notes ? (
                              <CardDescription className="mt-2">{item.notes}</CardDescription>
                            ) : null}
                          </div>
                          {(() => {
                            const safeLink = getSafeContentLink({
                              content_type: item.content_type,
                              content_slug: item.content_slug,
                            });
                            return safeLink ? (
                              <Link href={safeLink}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
                                disabled
                              >
                                <ExternalLink className="h-4 w-4" />
                                View
                              </Button>
                            );
                          })()}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <Separator className="my-6" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collection?.item_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collection?.view_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base font-medium">
                  {collection?.created_at
                    ? new Date(collection.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}