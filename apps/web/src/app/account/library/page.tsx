/**
 * Library Page - User-scoped library view with edge caching
 * Uses getUserLibrary data function for fetching bookmarks and collections
 */

import type { GetUserLibraryReturns } from '@heyclaude/database-types/postgres-types';
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
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  NavLink,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import Loading from './loading';
import { between, cluster, grid, size, weight, truncate, spaceY, marginBottom, marginTop } from "@heyclaude/web-runtime/design-system";

// Extract collections category value to avoid fragile enum index access
const COLLECTIONS_TAB_VALUE = 'collections' as const;

// MIGRATED: Added Suspense boundary for dynamic getAuthenticatedUser access (Cache Components requirement)

/**
 * Dynamic Rendering Required
 * Authenticated user library
 */

/**
 * Generate metadata for the account Library page and establish a request-time boundary for non-deterministic operations.
 *
 * This function awaits a request-scoped connection to ensure non-deterministic operations (for example, `Date.now()` used
 * by downstream metadata generation) occur at request time as required by Next.js Cache Components, then returns the
 * metadata produced for the "/account/library" route.
 *
 * @returns The Next.js `Metadata` object for the "/account/library" route.
 *
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/library');
}

/**
 * Renders the authenticated user's Library page with bookmarks and collections, using server-side data fetching and request-scoped logging.
 *
 * If the request is unauthenticated, renders a sign-in prompt. If library data cannot be loaded, renders an error card; otherwise renders tabs for bookmarks and collections with counts and item cards.
 *
 * @returns The page's React element representing the user's library view.
 *
 * @see getAuthenticatedUser - obtains the current user for this request
 * @see getUserLibrary - fetches bookmarks, collections, and stats for the user
 * @see normalizeError - used to normalize fetch errors for logging
 */
export default async function LibraryPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/library',
    operation: 'LibraryPage',
    route: '/account/library',
  });

  return (
    <Suspense fallback={<Loading />}>
      <LibraryPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the user-scoped Library page content: verifies authentication, loads the user's
 * library (bookmarks, collections, and stats), and returns the UI for bookmarks and collections
 * with counts, creation actions, and appropriate empty/error states.
 *
 * Attempts to retrieve the authenticated user; if no user is present, renders a sign-in prompt.
 * Loads library data for the authenticated user, logs fetch results, and renders:
 * - Header with "My Library" and numeric counts
 * - Tabs for Bookmarks and Collections with list and empty-state cards
 * - Actions to create a new collection and links to items/collections
 *
 * @param reqLogger - Request-scoped logger (a child of the incoming request logger). A child
 *   logger with user context is created for user-scoped log entries; userId fields are redacted.
 * @param reqLogger.reqLogger
 * @returns The React element tree for the library page content (cards, tabs, lists, and actions).
 *
 * @see getAuthenticatedUser
 * @see getUserLibrary
 * @see ROUTES
 */
async function LibraryPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'LibraryPage' });

  if (!user) {
    reqLogger.warn(
      { section: 'data-fetch' },
      'LibraryPage: unauthenticated access attempt detected'
    );
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

  userLogger.info({ section: 'data-fetch' }, 'LibraryPage: authentication successful');

  // Section: Library Data Fetch
  let data: GetUserLibraryReturns | null = null;
  try {
    data = await getUserLibrary(user.id);
    if (data === null) {
      userLogger.warn({ section: 'data-fetch' }, 'LibraryPage: getUserLibrary returned null');
    } else {
      userLogger.info(
        { hasData: Boolean(data), section: 'data-fetch' },
        'LibraryPage: library data loaded'
      );
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user library');
    userLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'LibraryPage: getUserLibrary threw'
    );
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
  if (bookmarks.length <= 0 && collections.length <= 0) {
    userLogger.info(
      { section: 'data-fetch' },
      'LibraryPage: library returned no bookmarks or collections'
    );
  }

  // Final summary log
  userLogger.info(
    {
      bookmarksCount: bookmarks.length,
      collectionsCount: collections.length,
      section: 'data-fetch',
    },
    'LibraryPage: page render completed'
  );

  return (
    <div className={spaceY.relaxed}>
      <div className={between.center}>
        <div>
          <h1 className={`${marginBottom.compact} ${size['3xl']} ${weight.bold}`}>My Library</h1>
          <p className="text-muted-foreground">
            {bookmarkCount} bookmarks • {collectionCount} collections
          </p>
        </div>
        <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
          <Button className={cluster.compact}>
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      <Tabs className="w-full" defaultValue="bookmarks">
        <TabsList className={`grid w-full max-w-md ${grid.cols2}`}>
          <TabsTrigger className={cluster.compact} value="bookmarks">
            <BookmarkIcon className="h-4 w-4" />
            Bookmarks ({bookmarkCount})
          </TabsTrigger>
          <TabsTrigger className={cluster.compact} value={COLLECTIONS_TAB_VALUE}>
            <FolderOpen className="h-4 w-4" />
            Collections ({collectionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent className={spaceY.default} value="bookmarks">
          {bookmarks.length === 0 ? (
            <Card>
              <CardContent className={`flex flex-col items-center py-12`}>
                <BookmarkIcon className={`text-muted-foreground ${marginBottom.default} h-12 w-12`} />
                <h3 className={`${marginBottom.compact} ${size.xl} ${weight.semibold}`}>No bookmarks yet</h3>
                <p className="text-muted-foreground max-w-md text-center">
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <NavLink className={marginTop.default} href="/">
                  Browse Directory →
                </NavLink>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4`}>
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader>
                    <div className={between.start}>
                      <div className={`flex-1`}>
                        <div className={cluster.compact}>
                          <UnifiedBadge className={`capitalize`} style="outline" variant="base">
                            {bookmark.content_type}
                          </UnifiedBadge>
                          <CardTitle className={`${size.lg}`}>{bookmark.content_slug}</CardTitle>
                        </div>
                        {bookmark.notes ? (
                          <CardDescription className={marginTop.compact}>{bookmark.notes}</CardDescription>
                        ) : null}
                      </div>
                      <NavLink
                        className="hover:text-primary/80"
                        href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </NavLink>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-muted-foreground ${size.xs}`}>
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

        <TabsContent className={spaceY.default} value={COLLECTIONS_TAB_VALUE}>
          {collections.length === 0 ? (
            <Card>
              <CardContent className={`flex flex-col items-center py-12`}>
                <FolderOpen className={`text-muted-foreground ${marginBottom.default} h-12 w-12`} />
                <h3 className={`${marginBottom.compact} ${size.xl} ${weight.semibold}`}>No collections yet</h3>
                <p className={`text-muted-foreground ${marginBottom.default} max-w-md text-center`}>
                  Organize your bookmarks into custom collections! Group related configurations
                  together and share them with others.
                </p>
                <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
                  <Button className={cluster.compact}>
                    <Plus className="h-4 w-4" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 sm:${grid.cols2}`}>
              {collections.map((collection) => (
                <Card className="card-gradient transition-smooth group cursor-pointer border-border/50" key={collection.id}>
                  <Link href={`/account/library/${collection.slug}`}>
                    <CardHeader>
                      <div className={between.start}>
                        <div className={`flex-1`}>
                          <div className={`${cluster.compact} ${marginBottom.compact}`}>
                            <Layers className="text-primary h-4 w-4" />
                            {collection.is_public ? (
                              <UnifiedBadge className={`${size.xs}`} style="outline" variant="base">
                                Public
                              </UnifiedBadge>
                            ) : null}
                          </div>
                          <CardTitle className={`${size.lg}`}>{collection.name}</CardTitle>
                          {collection.description ? (
                            <CardDescription className={`${marginTop.compact} ${truncate.lines2}`}>
                              {collection.description}
                            </CardDescription>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={between.center}>
                        <p className={`text-muted-foreground ${size.xs}`}>
                          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                        </p>
                        <p className={`text-muted-foreground ${size.xs}`}>
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
