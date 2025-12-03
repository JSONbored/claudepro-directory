/**
 * Library Page - User-scoped library view with edge caching
 * Uses getUserLibrary data function for fetching bookmarks and collections
 */

import  { type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserLibrary,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, cluster, iconSize, hoverBg, transition, spaceY, muted, marginBottom, marginTop, weight, size, gap, grid, padding, maxWidth, textColor,
  alignItems,
  justify,
  flexDir,
  display,
  flexGrow,
  width,
  textAlign,
  truncate,
  shadow,
  cursor,
} from '@heyclaude/web-runtime/design-system';
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

/**
 * Generate metadata for the /account/library page.
 *
 * @returns Metadata for the /account/library route
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/library');
}

/**
 * Render the account "My Library" page that displays the authenticated user's bookmarks and collections.
 *
 * Performs server-side authentication, fetches the user's library data, emits request- and user-scoped
 * logs, and renders the appropriate UI for authenticated, unauthenticated, empty-state, or error conditions.
 *
 * @returns A React element representing the library UI or an authentication/error fallback UI.
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

      <Tabs defaultValue="bookmarks" className={width.full}>
        <TabsList className={`${grid.cols2} ${width.full} ${maxWidth.md}`}>
          <TabsTrigger value="bookmarks" className={cluster.compact}>
            <BookmarkIcon className={iconSize.sm} />
            Bookmarks ({bookmarkCount})
          </TabsTrigger>
          <TabsTrigger
            value="collections"
            className={cluster.compact}
          >
            <FolderOpen className={iconSize.sm} />
            Collections ({collectionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className={spaceY.comfortable}>
          {bookmarks.length === 0 ? (
            <Card>
              <CardContent className={`${display.flex} ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
                <BookmarkIcon className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
                <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No bookmarks yet</h3>
                <p className={`${maxWidth.md} ${textAlign.center} ${muted.default}`}>
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <NavLink href="/" className={marginTop.default}>
                  Browse Directory →
                </NavLink>
              </CardContent>
            </Card>
          ) : (
            <div className={`${grid.base} ${gap.comfortable}`}>
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader>
                    <div className={`${display.flex} ${alignItems.start} ${justify.between}`}>
                      <div className={flexGrow['1']}>
                        <div className={cluster.compact}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {bookmark.content_type}
                          </UnifiedBadge>
                          <CardTitle className={size.lg}>{bookmark.content_slug}</CardTitle>
                        </div>
                        {bookmark.notes ? <CardDescription className={marginTop.compact}>{bookmark.notes}</CardDescription> : null}
                      </div>
                      <NavLink
                        href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                        className={`hover:${textColor.primary}/80`}
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
          value="collections"
          className={spaceY.comfortable}
        >
          {collections.length === 0 ? (
            <Card>
              <CardContent className={`${display.flex} ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
                <FolderOpen className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
                <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No collections yet</h3>
                <p className={`${marginBottom.default} ${maxWidth.md} ${textAlign.center} ${muted.default}`}>
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
            <div className={grid.responsive2}>
              {collections.map((collection) => (
                <Card key={collection.id} className={`${cursor.pointer} ${transition.default} ${hoverBg.muted} hover:${shadow.md}`}>
                  <Link href={`/account/library/${collection.slug}`}>
                    <CardHeader>
                      <div className={`${display.flex} ${alignItems.start} ${justify.between}`}>
                        <div className={flexGrow['1']}>
                          <div className={`${cluster.compact} ${marginBottom.tight}`}>
                            <Layers className={`${iconSize.sm} ${textColor.primary}`} />
                            {collection.is_public ? <UnifiedBadge variant="base" style="outline" className={size.xs}>
                                Public
                              </UnifiedBadge> : null}
                          </div>
                          <CardTitle className={size.lg}>{collection.name}</CardTitle>
                          {collection.description ? <CardDescription className={`${marginTop.compact} ${truncate.lines2}`}>
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