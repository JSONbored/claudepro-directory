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
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getCollectionDetail } from '@/src/lib/data/account/user-data';
import { APP_CONFIG, ROUTES } from '@/src/lib/data/config/constants';
import { ArrowLeft, Edit } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug', { params: { slug } });
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const { user } = await getAuthenticatedUser({ context: 'CollectionDetailPage' });

  if (!user) {
    logger.warn('CollectionDetailPage: unauthenticated access attempt', { slug });
    redirect('/login');
  }

  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for account view');
    logger.error('CollectionDetailPage: getCollectionDetail threw', normalized, {
      userId: user.id,
      slug,
    });
    throw normalized;
  }

  if (!collectionData) {
    logger.warn('CollectionDetailPage: collection not found or inaccessible', {
      slug,
      userId: user.id,
    });
    notFound();
  }

  const { collection, items, bookmarks } = collectionData;

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
