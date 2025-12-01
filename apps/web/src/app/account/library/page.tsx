/**
 * Library Page - User-scoped library view with edge caching
 * Uses getUserLibrary data function for fetching bookmarks and collections
 */

import { Constants, type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserLibrary,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, cluster, iconSize, hoverBg, transition, spaceY, muted, marginBottom, marginTop, weight ,size  , gap , padding , maxWidth } from '@heyclaude/web-runtime/design-system';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  FolderOpen,
  Layers,
  Plus,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, Tabs, TabsContent, TabsList, TabsTrigger    } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';


/**
 * Dynamic Rendering Required
 * Authenticated user library
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/library');
}

/**
 * Renders the account "My Library" page: verifies the authenticated user, loads the user's
 * bookmarks and collections, and returns the appropriate UI for authenticated, unauthenticated,
 * empty-state, or error conditions.
 *
 * Performs server-side authentication and data fetching, emits request- and user-scoped logs,
 * and maps backend library statistics to the rendered counts.
 *
 * @returns A React element representing the library page UI (bookmarks and collections) or an
 *          authentication/error fallback UI.
 *
 * @see getAuthenticatedUser
 * @see getUserLibrary
 * @see ROUTES
 */
export default async function LibraryPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'LibraryPage',
    route: '/account/library',
    module: 'apps/web/src/app/account/library',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'LibraryPage' });

  if (!user) {
    reqLogger.warn('LibraryPage: unauthenticated access attempt detected', {
      section: 'authentication',
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
            <CardDescription>Please sign in to view your library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('LibraryPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Library Data Fetch
  let data: Database['public']['Functions']['get_user_library']['Returns'] | null = null;
  try {
    data = await getUserLibrary(user.id);
    if (data === null) {
      userLogger.warn('LibraryPage: getUserLibrary returned null', {
        section: 'library-data-fetch',
      });
    } else {
      userLogger.info('LibraryPage: library data loaded', {
        section: 'library-data-fetch',
        hasData: Boolean(data),
      });
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user library');
    userLogger.error('LibraryPage: getUserLibrary threw', normalized, {
      section: 'library-data-fetch',
    });
  }

  if (!data) {
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>My Library</CardTitle>
            <CardDescription>
              Unable to load your library right now. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
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
  if (!(bookmarks.length > 0 || collections.length > 0)) {
    userLogger.info('LibraryPage: library returned no bookmarks or collections', {
      section: 'library-data-fetch',
    });
  }

  // Final summary log
  userLogger.info('LibraryPage: page render completed', {
    section: 'page-render',
    bookmarksCount: bookmarks.length,
    collectionsCount: collections.length,
  });

  return (
    <div className={spaceY.relaxed}>
      <div className={between.center}>
        <div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>My Library</h1>
          <p className={muted.default}>
            {bookmarkCount} bookmarks • {collectionCount} collections
          </p>
        </div>
        <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
          <Button className={cluster.compact}>
            <Plus className={iconSize.sm} />
            New Collection
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList className={`grid w-full ${maxWidth.md} grid-cols-2`}>
          <TabsTrigger value="bookmarks" className={cluster.compact}>
            <BookmarkIcon className={iconSize.sm} />
            Bookmarks ({bookmarkCount})
          </TabsTrigger>
          <TabsTrigger
            value={Constants.public.Enums.content_category[8]} // 'collections'
            className={cluster.compact}
          >
            <FolderOpen className={iconSize.sm} />
            Collections ({collectionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className={spaceY.comfortable}>
          {bookmarks.length === 0 ? (
            <Card>
              <CardContent className={`flex flex-col items-center ${padding.ySection}`}>
                <BookmarkIcon className={`${marginBottom.default} h-12 w-12 ${muted.default}`} />
                <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No bookmarks yet</h3>
                <p className={`max-w-md text-center ${muted.default}`}>
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <NavLink href="/" className={marginTop.default}>
                  Browse Directory →
                </NavLink>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid ${gap.comfortable}`}>
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={cluster.compact}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {bookmark.content_type}
                          </UnifiedBadge>
                          <CardTitle className="text-lg">{bookmark.content_slug}</CardTitle>
                        </div>
                        {bookmark.notes ? <CardDescription className={marginTop.compact}>{bookmark.notes}</CardDescription> : null}
                      </div>
                      <NavLink
                        href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                        className="hover:text-primary/80"
                      >
                        <ExternalLink className={iconSize.sm} />
                      </NavLink>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`${muted.default} ${size.xs}`}>
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

        <TabsContent
          value={Constants.public.Enums.content_category[8]} // 'collections'
          className={spaceY.comfortable}
        >
          {collections.length === 0 ? (
            <Card>
              <CardContent className={`flex flex-col items-center ${padding.ySection}`}>
                <FolderOpen className={`${marginBottom.default} h-12 w-12 ${muted.default}`} />
                <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No collections yet</h3>
                <p className={`${marginBottom.default} ${maxWidth.md} text-center ${muted.default}`}>
                  Organize your bookmarks into custom collections! Group related configurations
                  together and share them with others.
                </p>
                <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
                  <Button className={cluster.compact}>
                    <Plus className={iconSize.sm} />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid ${gap.comfortable} sm:grid-cols-2`}>
              {collections.map((collection) => (
                <Card key={collection.id} className={`cursor-pointer ${transition.default} ${hoverBg.muted} hover:shadow-md`}>
                  <Link href={`/account/library/${collection.slug}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className={`${cluster.compact} mb-2`}>
                            <Layers className="h-4 w-4 text-primary" />
                            {collection.is_public ? <UnifiedBadge variant="base" style="outline" className="text-xs">
                                Public
                              </UnifiedBadge> : null}
                          </div>
                          <CardTitle className="text-lg">{collection.name}</CardTitle>
                          {collection.description ? <CardDescription className={`${marginTop.compact} line-clamp-2`}>
                              {collection.description}
                            </CardDescription> : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={between.center}>
                        <p className={`${muted.default} ${size.xs}`}>
                          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                        </p>
                        <p className={`${muted.default} ${size.xs}`}>
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