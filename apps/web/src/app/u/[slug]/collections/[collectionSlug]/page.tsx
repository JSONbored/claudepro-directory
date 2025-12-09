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
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
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
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { Pulse } from '@/src/components/core/infra/pulse';

import Loading from './loading';

// Whitelisted content types for outgoing links - use Constants from database types
const ALLOWED_CONTENT_TYPES = Constants.public.Enums.content_category;

/**
 * Checks whether a content category string is allowed for public collections.
 *
 * @param type - The content category identifier to validate (e.g., "article", "image")
 * @returns `true` if `type` is listed in the module's allowed content types, `false` otherwise.
 *
 * @see ALLOWED_CONTENT_TYPES
 */
function isValidContentType(type: string): boolean {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);
}

/**
 * Checks whether a slug contains only lowercase letters, digits, hyphens, or underscores.
 *
 * @param slug - The candidate slug to validate (no slashes, no protocol).
 * @returns `true` if `slug` is a non-empty string composed only of lowercase ASCII letters, digits, `-`, or `_`; `false` otherwise.
 *
 * @see getSafeContentLink
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // Allow uppercase to match standard pattern used across codebase
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Produces an internal path for a content item when its content type and slug are valid.
 *
 * @param item - Object with `content_type` and `content_slug` fields to validate
 * @param item.content_slug
 * @param item.content_type
 * @returns The path `/content_type/content_slug` if both values are valid, `null` otherwise
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
  params: Promise<{ collectionSlug: string; slug: string }>;
}

/**
 * Produce page metadata for the public collection detail route.
 *
 * Calls connection() to allow non-deterministic operations at request time, emits a metadata-generation log entry, and does not fetch collection details (data is fetched during page render).
 *
 * @param params - Promise resolving to route parameters containing `slug` (user slug) and `collectionSlug`
 * @param params.params
 * @returns Page metadata for the route `/u/:slug/collections/:collectionSlug`
 *
 * @see getPublicCollectionDetail
 * @see generatePageMetadata
 */
export async function generateMetadata({
  params,
}: PublicCollectionPageProperties): Promise<Metadata> {
  const { slug, collectionSlug } = await params;

  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    operation: 'PublicCollectionPageMetadata',
    route: `/u/${slug}/collections/${collectionSlug}`,
    module: 'apps/web/src/app/u/[slug]/collections/[collectionSlug]',
  });

  // Note: Removed getPublicCollectionDetail call from generateMetadata to avoid cookies() access during prerendering
  // The page component will fetch the data when needed
  metadataLogger.info('PublicCollectionPage: generating metadata', {
    section: 'metadata-generation',
  });

  return generatePageMetadata('/u/:slug/collections/:collectionSlug', {
    params: { slug, collectionSlug },
    slug,
    collectionSlug,
  });
}

/**
 * Render the public collection detail page for a user's collection.
 *
 * @param params - A promise that resolves to route parameters containing `slug` (profile owner) and `collectionSlug` (collection identifier).
 * @param params.params
 * @returns The React element tree for the public collection page.
 *
 * @see getPublicCollectionDetail
 * @see getAuthenticatedUser
 * @see getSafeContentLink
 */
export default async function PublicCollectionPage({ params }: PublicCollectionPageProperties) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Params is runtime data - cache key includes params, so different collections create different cache entries
  const { slug, collectionSlug } = await params;

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'PublicCollectionPage',
    route: `/u/${slug}/collections/${collectionSlug}`,
    module: 'apps/web/src/app/u/[slug]/collections/[collectionSlug]',
  });

  return (
    <Suspense fallback={<Loading />}>
      <PublicCollectionPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the public collection detail view for a given user and collection.
 *
 * Awaits route params and the current authenticated user (if any), fetches the collection detail,
 * and returns the server-rendered JSX for the public collection page including items, stats, and
 * view tracking. If no collection is found, calls `notFound()` to trigger a 404 response.
 *
 * @param params - A Promise that resolves to an object containing `collectionSlug` and `slug` (user slug).
 * @param params.params
 * @param reqLogger - A request-scoped logger; a child logger is created for the route and viewer.
 * @param params.reqLogger
 * @returns The React element for the public collection detail page.
 * @throws When `getPublicCollectionDetail` throws an error during fetch; the error is logged and rethrown.
 *
 * @see getPublicCollectionDetail
 * @see getAuthenticatedUser
 * @see Pulse
 * @see getSafeContentLink
 * @see notFound
 */
async function PublicCollectionPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ collectionSlug: string; slug: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { slug, collectionSlug } = await params;
  const route = `/u/${slug}/collections/${collectionSlug}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Get current user (if logged in) for ownership check
  const { user: currentUser } = await getAuthenticatedUser({
    requireUser: false,
    context: 'PublicCollectionPage',
  });

  // Create child logger with viewer context if available
  const viewerLogger = currentUser?.id
    ? routeLogger.child({ viewerId: currentUser.id })
    : routeLogger;

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
    const normalized = normalizeError(error, 'Failed to load collection detail');
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
        category="collections"
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
              Back to {profileUser?.name ?? slug}&apos;s Profile
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
