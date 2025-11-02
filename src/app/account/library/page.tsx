/**
 * Library Page - Database-First RPC Architecture
 * Single RPC call to get_user_library() replaces 2 separate queries
 */

import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import { ROUTES } from '@/src/lib/constants/routes';
import { Bookmark as BookmarkIcon, ExternalLink, FolderOpen, Layers, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/library');

type Bookmark = {
  id: string;
  user_id: string;
  content_type: string;
  content_slug: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type UserCollection = {
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

type LibraryData = {
  bookmarks: Bookmark[];
  collections: UserCollection[];
  stats: {
    bookmarkCount: number;
    collectionCount: number;
    totalCollectionItems: number;
    totalCollectionViews: number;
  };
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Single RPC call replaces 2 separate queries
  const { data, error } = await supabase.rpc('get_user_library', {
    p_user_id: user.id,
  });

  if (error) {
    logger.error('Failed to load user library', error, { userId: user.id });
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="text-muted-foreground">Unable to load library. Please try again later.</p>
      </div>
    );
  }

  const libraryData = data as LibraryData;
  const { bookmarks, collections, stats } = libraryData;
  const { bookmarkCount, collectionCount } = stats;

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            {bookmarkCount} bookmarks • {collectionCount} collections
          </p>
        </div>
        <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
          <Button className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookmarks" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <BookmarkIcon className="h-4 w-4" />
            Bookmarks ({bookmarkCount})
          </TabsTrigger>
          <TabsTrigger value="collections" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <FolderOpen className="h-4 w-4" />
            Collections ({collectionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className="space-y-4">
          {!bookmarks || bookmarks.length === 0 ? (
            <Card>
              <CardContent className={'flex flex-col items-center py-12'}>
                <BookmarkIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                <p className={'text-muted-foreground text-center max-w-md'}>
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <Link href="/" className="mt-4 text-primary hover:underline">
                  Browse Directory →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader>
                    <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                      <div className="flex-1">
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {bookmark.content_type}
                          </UnifiedBadge>
                          <CardTitle className="text-lg">{bookmark.content_slug}</CardTitle>
                        </div>
                        {bookmark.notes && (
                          <CardDescription className="mt-2">{bookmark.notes}</CardDescription>
                        )}
                      </div>
                      <Link
                        href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={'text-xs text-muted-foreground'}>
                      Saved {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          {!collections || collections.length === 0 ? (
            <Card>
              <CardContent className={'flex flex-col items-center py-12'}>
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
                <p className={'text-muted-foreground text-center max-w-md mb-4'}>
                  Organize your bookmarks into custom collections! Group related configurations
                  together and share them with others.
                </p>
                <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
                  <Button className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <Plus className="h-4 w-4" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {collections.map((collection) => (
                <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                  <Link href={`/account/library/${collection.slug}`}>
                    <CardHeader>
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                        <div className="flex-1">
                          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mb-2`}>
                            <Layers className="h-4 w-4 text-primary" />
                            {collection.is_public && (
                              <UnifiedBadge variant="base" style="outline" className="text-xs">
                                Public
                              </UnifiedBadge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{collection.name}</CardTitle>
                          {collection.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {collection.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                        <p className={'text-xs text-muted-foreground'}>
                          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                        </p>
                        <p className={'text-xs text-muted-foreground'}>
                          {collection.view_count} views
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
