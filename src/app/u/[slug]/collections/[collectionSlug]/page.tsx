/**
 * User Collection Detail Page - Database-First RPC Architecture
 * Single RPC call to get_user_collection_detail() replaces 3 separate queries
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/unified-badge';
import { NavLink } from '@/src/components/core/shared/nav-link';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { Separator } from '@/src/components/primitives/separator';
import { trackInteraction } from '@/src/lib/edge/client';
import { ArrowLeft, ExternalLink } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

// Collection pages may have private content
export const dynamic = 'force-dynamic';

interface PublicCollectionPageProps {
  params: Promise<{ slug: string; collectionSlug: string }>;
}

type CollectionDetailData = {
  user: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    tier: string;
  };
  collection: {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    view_count: number;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    id: string;
    collection_id: string;
    content_type: string;
    content_slug: string;
    notes: string | null;
    order: number;
    added_at: string;
  }>;
  isOwner: boolean;
};

/**
 * Fetch collection detail using optimized RPC
 */
async function getCollectionDetail(
  slug: string,
  collectionSlug: string,
  viewerId?: string
): Promise<CollectionDetailData | null> {
  const supabase = createAnonClient();

  const { data, error } = await supabase.rpc('get_user_collection_detail', {
    p_user_slug: slug,
    p_collection_slug: collectionSlug,
    ...(viewerId && { p_viewer_id: viewerId }),
  });

  if (error) {
    logger.error('Failed to load collection detail', error, { slug, collectionSlug });
    return null;
  }

  return data as CollectionDetailData | null;
}

export async function generateMetadata({ params }: PublicCollectionPageProps): Promise<Metadata> {
  const { slug, collectionSlug } = await params;

  const collectionData = await getCollectionDetail(slug, collectionSlug);

  return generatePageMetadata('/u/:slug/collections/:collectionSlug', {
    params: { slug, collectionSlug },
    item: collectionData?.collection as Tables<'user_collections'> | undefined,
    slug,
    collectionSlug,
  });
}

export default async function PublicCollectionPage({ params }: PublicCollectionPageProps) {
  const { slug, collectionSlug } = await params;

  // Get current user (if logged in) for ownership check
  const supabase = createAnonClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Single RPC call replaces 3 separate queries (user, collection, items)
  const collectionData = await getCollectionDetail(slug, collectionSlug, currentUser?.id);

  if (!collectionData) {
    notFound();
  }

  const { user: profileUser, collection, items, isOwner } = collectionData;

  // Track view (async, non-blocking)
  trackInteraction({
    interaction_type: 'view',
    content_type: 'guides',
    content_slug: `user-collection-${slug}-${collectionSlug}`,
  }).catch(() => {
    // Ignore tracking errors
  });

  return (
    <div className={'min-h-screen bg-background'}>
      <div className={'container mx-auto px-4 py-12'}>
        <div className="space-y-6">
          {/* Navigation */}
          <Link href={`/u/${slug}`}>
            <Button variant="ghost" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <ArrowLeft className="h-4 w-4" />
              Back to {profileUser.name || slug}'s Profile
            </Button>
          </Link>

          {/* Header */}
          <div>
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-2`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <h1 className="font-bold text-3xl">{collection.name}</h1>
                <UnifiedBadge variant="base" style="outline">
                  Public
                </UnifiedBadge>
              </div>
              {isOwner && (
                <Link href={`/account/library/${collection.slug}`}>
                  <Button variant="outline" size="sm">
                    Manage Collection
                  </Button>
                </Link>
              )}
            </div>

            {collection.description && (
              <p className={'max-w-3xl text-muted-foreground'}>{collection.description}</p>
            )}

            <div className={'mt-2 text-muted-foreground text-sm'}>
              Created by <NavLink href={`/u/${slug}`}>{profileUser.name || slug}</NavLink> •{' '}
              {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'} •{' '}
              {collection.view_count} views
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
                {items.map((item, index) => (
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
                        <Link
                          href={`/${item.content_type}/${item.content_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
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
                <div className="font-bold text-2xl">{collection.item_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-medium text-sm">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{collection.view_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-medium text-sm">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium text-base">
                  {new Date(collection.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
