/**
 * User Collection Detail Page - Database-First RPC Architecture
 * Single RPC call to get_user_collection_detail() replaces 3 separate queries
 */

import { Constants } from '@heyclaude/database-types';
import {
  type CollectionDetailData,
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPublicCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft, ExternalLink } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Pulse } from '@/src/components/core/infra/pulse';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Separator } from '@/src/components/primitives/ui/separator';

// Collection pages may have private content
export const dynamic = 'force-dynamic';

// Whitelisted content types for outgoing links - use Constants from database types
const ALLOWED_CONTENT_TYPES = Constants.public.Enums.content_category;

function isValidContentType(type: string): boolean {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);
}

// Slug must be alphanumeric/dash/underscore, no slashes, no protocol
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

function getSafeContentLink(item: { content_type: string; content_slug: string }): string | null {
  if (isValidContentType(item.content_type) && isValidSlug(item.content_slug)) {
    return `/${item.content_type}/${item.content_slug}`;
  }
  return null;
}

interface PublicCollectionPageProperties {
  params: Promise<{ slug: string; collectionSlug: string }>;
}

export async function generateMetadata({ params }: PublicCollectionPageProperties): Promise<Metadata> {
  const { slug, collectionSlug } = await params;

  // Generate requestId for metadata generation (separate from page render)
  const metadataRequestId = generateRequestId();
  const metadataLogContext = createWebAppContextWithId(
    metadataRequestId,
    `/u/${slug}/collections/${collectionSlug}`,
    'PublicCollectionPageMetadata',
    {
      slug,
      collectionSlug,
    }
  );

  try {
    // Warm cache for subsequent page render - this fetch in generateMetadata
    // ensures the data is cached when the page component fetches the same data
    await getPublicCollectionDetail({
      userSlug: slug,
      collectionSlug,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for metadata');
    logger.error('PublicCollectionPage: metadata fetch failed', normalized, metadataLogContext);
  }

  return generatePageMetadata('/u/:slug/collections/:collectionSlug', {
    params: { slug, collectionSlug },
    slug,
    collectionSlug,
  });
}

export default async function PublicCollectionPage({ params }: PublicCollectionPageProperties) {
  const startTime = Date.now();
  const { slug, collectionSlug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    `/u/${slug}/collections/${collectionSlug}`,
    'PublicCollectionPage',
    {
      slug,
      collectionSlug,
    }
  );

  // Get current user (if logged in) for ownership check
  const { user: currentUser } = await getAuthenticatedUser({
    requireUser: false,
    context: 'PublicCollectionPage',
  });

  const logContext = currentUser?.id
    ? { ...baseLogContext, viewerId: currentUser.id }
    : baseLogContext;

  // Section: Collection Detail Fetch
  const collectionSectionStart = Date.now();
  let collectionData: CollectionDetailData | null = null;
  try {
    collectionData = await getPublicCollectionDetail({
      userSlug: slug,
      collectionSlug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
    logger.info(
      'PublicCollectionPage: collection detail loaded',
      withDuration(
        {
          ...logContext,
          section: 'collection-detail-fetch',
          hasData: !!collectionData,
        },
        collectionSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for page render');
    logger.error(
      'PublicCollectionPage: getPublicCollectionDetail threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'collection-detail-fetch',
          sectionDuration_ms: Date.now() - collectionSectionStart,
        },
        startTime
      )
    );
    throw normalized;
  }

  if (!collectionData) {
    logger.warn(
      'PublicCollectionPage: collection detail not found',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'collection-detail-fetch',
          sectionDuration_ms: Date.now() - collectionSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  const { user: profileUser, collection, items, is_owner } = collectionData;

  return (
    <div className={'min-h-screen bg-background'}>
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
      <div className={'container mx-auto px-4 py-12'}>
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
                <h1 className="font-bold text-3xl">{collection?.name ?? 'Untitled Collection'}</h1>
                <UnifiedBadge variant="base" style="outline">
                  Public
                </UnifiedBadge>
              </div>
              {is_owner && (
                <Link href={`/account/library/${collection?.slug}`}>
                  <Button variant="outline" size="sm">
                    Manage Collection
                  </Button>
                </Link>
              )}
            </div>

            {collection?.description && (
              <p className={'max-w-3xl text-muted-foreground'}>{collection.description}</p>
            )}

            <div className={'mt-2 text-muted-foreground text-sm'}>
              Created by <NavLink href={`/u/${slug}`}>{profileUser?.name ?? slug}</NavLink> •{' '}
              {collection?.item_count ?? 0} {(collection?.item_count ?? 0) === 1 ? 'item' : 'items'}{' '}
              • {collection?.view_count ?? 0} views
            </div>
          </div>

          {/* Collection Items */}
          <div>
            <h2 className="mb-4 font-semibold text-xl">Items in this Collection</h2>

            {!items || items.length === 0 ? (
              <Card>
                <CardContent className={'flex flex-col items-center py-12'}>
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
                      id: string;
                      content_type: string;
                      content_slug: string;
                    } =>
                      item.id !== null &&
                      item.content_type !== null &&
                      item.content_slug !== null
                  )
                  .map((item, index) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-8 font-bold text-2xl text-muted-foreground/50">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                              <UnifiedBadge variant="base" style="outline" className="capitalize">
                                {item.content_type}
                              </UnifiedBadge>
                              <CardTitle className="text-lg">{item.content_slug}</CardTitle>
                            </div>
                            {item.notes && (
                              <CardDescription className="mt-2">{item.notes}</CardDescription>
                            )}
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
                                disabled={true}
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
                <CardTitle className="font-medium text-sm">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{collection?.item_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-medium text-sm">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{collection?.view_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-medium text-sm">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium text-base">
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
