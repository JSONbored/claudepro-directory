/**
 * Library Page - User-scoped library view with edge caching
 * Uses getUserLibrary data function for fetching bookmarks and collections
 */

import type { Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserLibrary,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  FolderOpen,
  Layers,
  Plus,
} from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';

/**
 * Dynamic Rendering Required
 * Authenticated user library
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/library');
}

export default async function LibraryPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/account/library', 'LibraryPage');

  const { user } = await getAuthenticatedUser({ context: 'LibraryPage' });

  if (!user) {
    logger.warn('LibraryPage: unauthenticated access attempt detected', undefined, {
      ...baseLogContext,
      timestamp: new Date().toISOString(),
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view your library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hash user ID for privacy-compliant logging (GDPR/CCPA)
  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };

  let data: Database['public']['Functions']['get_user_library']['Returns'] | null = null;
  try {
    data = await getUserLibrary(user.id);
    if (!data) {
      logger.warn('LibraryPage: getUserLibrary returned null', undefined, logContext);
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user library');
    logger.error('LibraryPage: getUserLibrary threw', normalized, logContext);
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My Library</CardTitle>
            <CardDescription>
              Unable to load your library right now. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookmarks = data.bookmarks ?? [];
  const collections = data.collections ?? [];
  const stats = data.stats ?? {
    bookmark_count: bookmarks.length,
    collection_count: collections.length,
    total_collection_items: 0,
    total_collection_views: 0,
  };
  // Map snake_case to camelCase for compatibility
  const bookmarkCount = stats.bookmark_count ?? 0;
  const collectionCount = stats.collection_count ?? 0;
  if (!(bookmarks.length || collections.length)) {
    logger.info('LibraryPage: library returned no bookmarks or collections', logContext);
  }

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Library</h1>
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
                <BookmarkIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-xl">No bookmarks yet</h3>
                <p className={'max-w-md text-center text-muted-foreground'}>
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <NavLink href="/" className="mt-4">
                  Browse Directory →
                </NavLink>
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
                      <NavLink
                        href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                        className="hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </NavLink>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={'text-muted-foreground text-xs'}>
                      Saved{' '}
                      {bookmark.created_at
                        ? new Date(bookmark.created_at).toLocaleDateString()
                        : 'Unknown date'}
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
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-xl">No collections yet</h3>
                <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
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
                        <p className={'text-muted-foreground text-xs'}>
                          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                        </p>
                        <p className={'text-muted-foreground text-xs'}>
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
