/**
 * User Collection Detail Page - Database-First RPC Architecture
 * Single RPC call to get_user_collection_detail() replaces 3 separate queries
 */

import { Constants } from '@heyclaude/database-types';
import  { type CollectionDetailData } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPublicCollectionDetail,
} from '@heyclaude/web-runtime/data';
import {
  between,
  bgColor,
  cluster,
  flexDir,
  gap,
  iconSize,
  alignItems,
  marginBottom,
  marginTop,
  minHeight,
  muted,
  padding,
  row,
  size,
  spaceY,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, ExternalLink } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, Separator    } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
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

// Slug must be alphanumeric/dash/underscore, no slashes, no protocol
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

function getSafeContentLink(item: { content_slug: string; content_type: string; }): null | string {
  if (isValidContentType(item.content_type) && isValidSlug(item.content_slug)) {
    return `/${item.content_type}/${item.content_slug}`;
  }
  return null;
}

interface PublicCollectionPageProperties {
  params: Promise<{ collectionSlug: string; slug: string; }>;
}

export async function generateMetadata({ params }: PublicCollectionPageProperties): Promise<Metadata> {
  const { slug, collectionSlug } = await params;

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
 * Renders the public collection detail page for a given user and collection slug.
 *
 * This server component performs a per-request server-side fetch of collection detail
 * (including profile, collection metadata, items, and ownership) and returns the
 * fully rendered page. If the collection is not found it triggers a 404 response.
 *
 * Data fetching is performed each request (no ISR); the component also records a non-blocking
 * "view" pulse for analytics and conditions UI (owner controls, item links) on the fetched data.
 *
 * @param params - Route parameters object containing `slug` (user slug) and `collectionSlug` (collection slug).
 * @returns The React element that renders the public collection detail page.
 *
 * @see getPublicCollectionDetail
 * @see getAuthenticatedUser
 * @see getSafeContentLink
 * @see Pulse
 */
export default async function PublicCollectionPage({ params }: PublicCollectionPageProperties) {
  const { slug, collectionSlug } = await params;

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
  const viewerLogger = currentUser?.id 
    ? reqLogger.child({ viewerId: currentUser.id })
    : reqLogger;

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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
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
      <div className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <div className={spaceY.relaxed}>
          {/* Navigation */}
          <Link href={`/u/${slug}`}>
            <Button variant="ghost" className={cluster.compact}>
              <ArrowLeft className={iconSize.sm} />
              Back to {profileUser?.name ?? slug}'s Profile
            </Button>
          </Link>

          {/* Header */}
          <div>
            <div className={`${between.center} ${marginBottom.tight}`}>
              <div className={cluster.compact}>
                <h1 className={`${weight.bold} ${size['3xl']}`}>{collection?.name ?? 'Untitled Collection'}</h1>
                <UnifiedBadge variant="base" style="outline">
                  Public
                </UnifiedBadge>
              </div>
              {is_owner ? <Link href={`/account/library/${collection?.slug}`}>
                  <Button variant="outline" size="sm">
                    Manage Collection
                  </Button>
                </Link> : null}
            </div>

            {collection?.description ? <p className={`max-w-3xl ${muted.default}`}>{collection.description}</p> : null}

            <div className={`${marginTop.compact} ${muted.sm}`}>
              Created by <NavLink href={`/u/${slug}`}>{profileUser?.name ?? slug}</NavLink> •{' '}
              {collection?.item_count ?? 0} {(collection?.item_count ?? 0) === 1 ? 'item' : 'items'}{' '}
              • {collection?.view_count ?? 0} views
            </div>
          </div>

          {/* Collection Items */}
          <div>
            <h2 className={`${marginBottom.default} ${weight.semibold} ${size.xl}`}>Items in this Collection</h2>

            {!items || items.length === 0 ? (
              <Card>
                <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
                  <p className={muted.default}>This collection is empty</p>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid ${gap.comfortable}`}>
                {items
                  .filter(
                    (
                      item
                    ): item is typeof item & {
                      content_slug: string;
                      content_type: string;
                      id: string;
                    } =>
                      item.id !== null &&
                      item.content_type !== null &&
                      item.content_slug !== null
                  )
                  .map((item, index) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className={`${row.comfortable}`}>
                          <div className={`w-8 ${weight.bold} ${size['2xl']} text-muted-foreground/50`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={cluster.compact}>
                              <UnifiedBadge variant="base" style="outline" className="capitalize">
                                {item.content_type}
                              </UnifiedBadge>
                              <CardTitle className={size.lg}>{item.content_slug}</CardTitle>
                            </div>
                            {item.notes ? <CardDescription className={marginTop.compact}>{item.notes}</CardDescription> : null}
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
                                  className={cluster.compact}
                                >
                                  <ExternalLink className={iconSize.sm} />
                                  View
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cluster.compact}
                                disabled
                              >
                                <ExternalLink className={iconSize.sm} />
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
          <div className={`grid ${gap.comfortable} sm:grid-cols-3`}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className={`${weight.medium} ${size.sm}`}>Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${weight.bold} ${size['2xl']}`}>{collection?.item_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className={`${weight.medium} ${size.sm}`}>Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${weight.bold} ${size['2xl']}`}>{collection?.view_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className={`${weight.medium} ${size.sm}`}>Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${weight.medium} ${size.base}`}>
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