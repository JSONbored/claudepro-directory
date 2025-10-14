import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { trackView } from '@/src/lib/actions/track-view';
import { ArrowLeft, ExternalLink } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface PublicCollectionPageProps {
  params: Promise<{ slug: string; collectionSlug: string }>;
}

/**
 * Fetch public user collection data
 *
 * Shared data loader for both metadata generation and page rendering.
 * Next.js 15 automatically deduplicates this during the same render cycle.
 *
 * @param slug - User profile slug
 * @param collectionSlug - Collection slug
 * @returns Collection data or null if not found
 */
async function getPublicCollection(slug: string, collectionSlug: string) {
  const supabase = await createAdminClient();

  // Fetch profile user
  const { data: profileUser } = await supabase.from('users').select('*').eq('slug', slug).single();

  if (!profileUser) {
    return null;
  }

  // Fetch public collection
  const { data: collection } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', profileUser.id)
    .eq('slug', collectionSlug)
    .eq('is_public', true)
    .single();

  return collection;
}

export async function generateMetadata({ params }: PublicCollectionPageProps): Promise<Metadata> {
  const { slug, collectionSlug } = await params;

  // Load collection data (automatically deduplicated by Next.js)
  const collection = await getPublicCollection(slug, collectionSlug);

  // Transform to metadata context item
  // Converts null to undefined for TypeScript compatibility
  const collectionItem = collection
    ? {
        name: collection.name,
        description: collection.description ?? undefined,
        dateAdded: collection.created_at,
        lastModified: collection.updated_at,
      }
    : undefined;

  return generatePageMetadata('/u/:slug/collections/:collectionSlug', {
    params: { slug, collectionSlug },
    item: collectionItem,
    slug,
    collectionSlug,
  });
}

export default async function PublicCollectionPage({ params }: PublicCollectionPageProps) {
  const { slug, collectionSlug } = await params;

  // Get current user (if logged in) for ownership check
  const currentUserClient = await createClient();
  const {
    data: { user: currentUser },
  } = await currentUserClient.auth.getUser();

  // Load collection data (automatically deduplicated by Next.js with generateMetadata call)
  const collection = await getPublicCollection(slug, collectionSlug);

  if (!collection) {
    notFound();
  }

  // Get profile owner for display
  const supabase = await createAdminClient();
  const { data: profileUser } = await supabase.from('users').select('*').eq('slug', slug).single();

  if (!profileUser) {
    notFound();
  }

  // Get collection items
  const { data: items } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collection.id)
    .order('order', { ascending: true });

  // Track view (async, non-blocking)
  // Note: Using 'guides' category as a placeholder since trackView expects specific content types
  trackView({
    category: 'guides',
    slug: `user-collection-${slug}-${collectionSlug}`,
  }).catch(() => {
    // Ignore tracking errors
  });

  const isOwner = currentUser?.id === profileUser.id;

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4} py-12`}>
        <div className={UI_CLASSES.SPACE_Y_6}>
          {/* Navigation */}
          <Link href={`/u/${slug}`}>
            <Button variant="ghost" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <ArrowLeft className="h-4 w-4" />
              Back to {profileUser.name || slug}'s Profile
            </Button>
          </Link>

          {/* Header */}
          <div>
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_2}`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                <Badge variant="outline">Public</Badge>
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
              <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} max-w-3xl`}>
                {collection.description}
              </p>
            )}

            <div className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Created by{' '}
              <Link href={`/u/${slug}`} className="text-primary hover:underline">
                {profileUser.name || slug}
              </Link>{' '}
              • {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'} •{' '}
              {collection.view_count} views
            </div>
          </div>

          {/* Collection Items */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Items in this Collection</h2>

            {!items || items.length === 0 ? (
              <Card>
                <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
                  <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>This collection is empty</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {items.map((item, index) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_4}>
                        <div className="text-2xl font-bold text-muted-foreground/50 w-8">
                          {index + 1}
                        </div>
                        <div className={UI_CLASSES.FLEX_1}>
                          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                            <Badge variant="outline" className="capitalize">
                              {item.content_type}
                            </Badge>
                            <CardTitle className={UI_CLASSES.TEXT_LG}>
                              {item.content_slug}
                            </CardTitle>
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
                <CardTitle className="text-sm font-medium">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base font-medium">
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
