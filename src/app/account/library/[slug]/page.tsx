import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SimpleCopyButton } from '@/src/components/core/buttons/shared/simple-copy-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { CollectionItemManager } from '@/src/components/core/domain/collection-items-editor';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { APP_CONFIG, ROUTES } from '@/src/lib/constants';
import { ArrowLeft, Edit } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug', { params: { slug } });
}

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Consolidated RPC: 3 queries → 1 (67% reduction)
  const { data: collectionData } = await supabase.rpc('get_collection_detail_with_items', {
    p_user_id: user.id,
    p_slug: slug,
  });

  if (!collectionData) {
    notFound();
  }

  // Type assertion to database-generated Json type
  type CollectionResponse = {
    collection: Tables<'user_collections'>;
    items: Array<Tables<'collection_items'>>;
    bookmarks: Array<Tables<'bookmarks'>>;
  };

  const { collection, items, bookmarks } = collectionData as unknown as CollectionResponse;

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
              <h1 className="font-bold text-3xl">{collection.name}</h1>
              {collection.is_public && (
                <UnifiedBadge variant="base" style="outline" className="text-xs">
                  Public
                </UnifiedBadge>
              )}
            </div>
            {collection.description && (
              <p className="text-muted-foreground">{collection.description}</p>
            )}
            <div className={'mt-2 text-muted-foreground text-sm'}>
              {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'} •{' '}
              {collection.view_count} views
            </div>
          </div>

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {shareUrl && (
              <SimpleCopyButton
                content={shareUrl}
                label="Share"
                successMessage="Link copied to clipboard!"
                variant="outline"
                size="sm"
                className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
                iconClassName="h-4 w-4"
              />
            )}
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
            items={(items || []).map((item) => ({ ...item, notes: item.notes ?? '' }))}
            availableBookmarks={(bookmarks || []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
          />
        </CardContent>
      </Card>

      {/* Stats */}
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
            <CardTitle className="font-medium text-sm">Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{collection.is_public ? 'Public' : 'Private'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
