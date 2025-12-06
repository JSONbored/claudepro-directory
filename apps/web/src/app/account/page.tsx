import { type Database } from '@heyclaude/database-types';
import { ensureStringArray } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAccountDashboardBundle,
  getAuthenticatedUser,
  getContentDetailCore,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Bookmark, Calendar } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type HomepageContentItem } from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  NavLink,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { RecentlySavedGrid } from '@/src/components/features/account/recently-saved-grid';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// MIGRATED: Removed export const runtime = 'nodejs' (default, not needed with Cache Components)
// TODO: Will add Suspense boundaries or "use cache" after analyzing build errors

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because it displays user-specific account data.
 * Runtime: Node.js (required for authenticated user data and Supabase server client)
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account');
}

/**
 * Render the account dashboard page for the authenticated user.
 *
 * This server component verifies authentication, loads the user's dashboard bundle
 * (dashboard, library, homepage), computes metrics and recent bookmarks, resolves
 * content details for recent bookmarks, and builds personalized recommendations
 * before returning the dashboard UI.
 *
 * The component returns a complete JSX page that includes stats, quick actions,
 * a recently saved grid, and recommended items. If the user is not authenticated
 * or required dashboard data cannot be loaded, it renders an appropriate fallback UI.
 *
 * @returns A JSX element representing the account dashboard page.
 *
 * @see getAuthenticatedUser
 * @see getAccountDashboardBundle
 * @see RecentlySavedGrid
 */
export default async function AccountDashboard() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'AccountDashboard',
    route: '/account',
    module: 'apps/web/src/app/account',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'AccountDashboard' });

  if (!user) {
    reqLogger.warn('AccountDashboard: unauthenticated access attempt detected', {
      section: 'authentication',
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view your dashboard.</CardDescription>
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

  userLogger.info('AccountDashboard: authentication successful', {
    section: 'authentication',
  });

  return (
    <div className="space-y-6">
      {/* Dashboard header and stats - bundle data in Suspense for streaming */}
      <Suspense fallback={<div className="space-y-6">Loading dashboard...</div>}>
        <DashboardHeaderAndStats userId={user.id} userLogger={userLogger} />
      </Suspense>

      {/* Quick actions and content sections - in separate Suspense for streaming */}
      <Suspense fallback={<div className="space-y-6">Loading content...</div>}>
        <DashboardContent userId={user.id} userLogger={userLogger} />
      </Suspense>
    </div>
  );
}

/**
 * Server component that fetches dashboard bundle and renders header with stats.
 * Wrapped in Suspense to allow streaming.
 */
async function DashboardHeaderAndStats({
  userId,
  userLogger,
}: {
  userId: string;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Section: Dashboard Bundle
  let bundleData: Awaited<ReturnType<typeof getAccountDashboardBundle>> | null = null;
  try {
    bundleData = await getAccountDashboardBundle(userId);
    userLogger.info('AccountDashboard: dashboard bundle loaded', {
      section: 'dashboard-bundle',
      hasDashboard: !!bundleData.dashboard,
      hasLibrary: !!bundleData.library,
      hasHomepage: !!bundleData.homepage,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load account dashboard bundle');
    userLogger.error('AccountDashboard: getAccountDashboardBundle threw', normalized, {
      section: 'dashboard-bundle',
    });
    throw normalized;
  }

  const dashboardData = bundleData.dashboard;
  const libraryData = bundleData.library;

  if (!dashboardData) {
    const normalized = normalizeError(
      new Error('Dashboard data is null'),
      'AccountDashboard: dashboard data is null'
    );
    userLogger.error('AccountDashboard: dashboard data is null', normalized, {
      section: 'dashboard-bundle',
    });
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard unavailable</CardTitle>
          <CardDescription>
            We couldn&apos;t load your account data. Please refresh the page or try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={ROUTES.HOME}>Go to home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { bookmark_count, profile } = dashboardData;
  const bookmarkCount = bookmark_count;
  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const bookmarks = (libraryData?.bookmarks ?? []).filter(
    (bookmark) => bookmark.content_slug !== null && bookmark.content_type !== null
  );
  const recentBookmarks = bookmarks.slice(0, 3);
  const latestBookmark = recentBookmarks[0];
  const resumeBookmarkHref =
    latestBookmark?.content_slug && latestBookmark.content_type
      ? `/${latestBookmark.content_type}/${latestBookmark.content_slug}`
      : null;

  return (
    <>
      <div>
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name ?? 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bookmark className="text-primary h-5 w-5" />
              <span className="text-3xl font-bold">{bookmarkCount ?? 0}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">Saved items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedBadge
              variant="base"
              style={profile?.tier === 'pro' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {profile?.tier
                ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                : 'Free'}
            </UnifiedBadge>
            <p className="text-muted-foreground mt-2 text-xs">Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="text-primary h-5 w-5" />
              <span className="text-3xl font-bold">{accountAge}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumeBookmarkHref ? (
            <QuickActionRow
              title="Resume latest bookmark"
              description="Continue where you left off"
              href={resumeBookmarkHref}
            />
          ) : null}
          <QuickActionRow
            title="View all bookmarks"
            description={`You have ${bookmarkCount ?? 0} saved configurations`}
            href={ROUTES.ACCOUNT_LIBRARY}
          />
          <QuickActionRow
            title="Manage profile"
            description="Update your settings and preferences"
            href={ROUTES.ACCOUNT_SETTINGS}
          />
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Server component that fetches dashboard content (recent bookmarks, recommendations).
 * Wrapped in Suspense to allow streaming.
 */
async function DashboardContent({
  userId,
  userLogger,
}: {
  userId: string;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Fetch dashboard bundle for library and homepage data
  let bundleData: Awaited<ReturnType<typeof getAccountDashboardBundle>> | null = null;
  try {
    bundleData = await getAccountDashboardBundle(userId);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load account dashboard bundle');
    userLogger.error(
      'AccountDashboard: getAccountDashboardBundle threw in DashboardContent',
      normalized,
      {
        section: 'dashboard-content',
      }
    );
    throw normalized;
  }

  const libraryData = bundleData.library;
  const homepageData = bundleData.homepage;

  const bookmarks = (libraryData?.bookmarks ?? []).filter(
    (bookmark) => bookmark.content_slug !== null && bookmark.content_type !== null
  );
  const recentBookmarks = bookmarks.slice(0, 3);
  const bookmarkedSlugs = new Set(
    bookmarks.map((bookmark) => `${bookmark.content_type ?? ''}/${bookmark.content_slug ?? ''}`)
  );

  // Section: Recent Bookmarks - in separate Suspense for streaming
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12">
              <div className="h-48 animate-pulse" />
            </CardContent>
          </Card>
        }
      >
        <RecentlySavedSection recentBookmarks={recentBookmarks} userLogger={userLogger} />
      </Suspense>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12">
              <div className="h-48 animate-pulse" />
            </CardContent>
          </Card>
        }
      >
        <RecommendationsSection
          homepageData={homepageData}
          bookmarkedSlugs={bookmarkedSlugs}
          recentBookmarks={recentBookmarks}
          userLogger={userLogger}
        />
      </Suspense>
    </div>
  );
}

/**
 * Server component that fetches recent bookmark content details and renders the grid.
 * Wrapped in Suspense to allow streaming.
 */
async function RecentlySavedSection({
  recentBookmarks,
  userLogger,
}: {
  recentBookmarks: Array<{
    content_slug: null | string;
    content_type: null | string;
  }>;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Section: Recent Bookmarks
  const recentlySavedContentResults = await Promise.all(
    recentBookmarks.map(async (bookmark) => {
      try {
        const category = bookmark.content_type as Database['public']['Enums']['content_category'];
        const slug = bookmark.content_slug as string;
        const detail = await getContentDetailCore({ category, slug });
        return detail?.content ?? null;
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load bookmark content');
        userLogger.warn('AccountDashboard: getContentDetailCore failed for bookmark', {
          err: normalized,
          section: 'recent-bookmarks',
          slug: bookmark.content_slug,
          category: bookmark.content_type,
        });
        return null;
      }
    })
  );
  userLogger.info('AccountDashboard: recent bookmarks loaded', {
    section: 'recent-bookmarks',
    bookmarkCount: recentBookmarks.length,
    loadedCount: recentlySavedContentResults.filter(Boolean).length,
  });
  const recentlySavedContent = recentlySavedContentResults.filter(
    (item): item is Database['public']['Tables']['content']['Row'] =>
      item !== null && typeof item === 'object'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Saved</CardTitle>
        <CardDescription>Your latest bookmarks at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        {recentlySavedContent.length > 0 ? (
          <RecentlySavedGrid items={recentlySavedContent} />
        ) : (
          <EmptyRecentlySavedState />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Server component that computes and renders recommendations.
 * Wrapped in Suspense to allow streaming.
 */
async function RecommendationsSection({
  homepageData,
  bookmarkedSlugs,
  recentBookmarks,
  userLogger,
}: {
  bookmarkedSlugs: Set<string>;
  homepageData: Awaited<ReturnType<typeof getAccountDashboardBundle>>['homepage'];
  recentBookmarks: Array<{
    content_slug: null | string;
    content_type: null | string;
  }>;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Fetch recent bookmark content to extract saved tags
  const recentlySavedContentResults = await Promise.all(
    recentBookmarks.map(async (bookmark) => {
      try {
        const category = bookmark.content_type as Database['public']['Enums']['content_category'];
        const slug = bookmark.content_slug as string;
        const detail = await getContentDetailCore({ category, slug });
        return detail?.content ?? null;
      } catch {
        return null;
      }
    })
  );
  const recentlySavedContent = recentlySavedContentResults.filter(
    (item): item is Database['public']['Tables']['content']['Row'] =>
      item !== null && typeof item === 'object'
  );

  const savedTags = new Set<string>();
  for (const contentItem of recentlySavedContent) {
    const tagList = ensureStringArray((contentItem as { tags?: string[] }).tags);
    for (const tag of tagList) {
      if (tag) {
        savedTags.add(tag.trim().toLowerCase());
      }
    }
  }

  /**
   * Safely extracts the `categoryData` map from account dashboard homepage data, returning an empty object if the structure is missing or invalid.
   */
  function extractHomepageCategoryData(
    homepageData: Awaited<ReturnType<typeof getAccountDashboardBundle>>['homepage']
  ): Record<string, HomepageContentItem[]> {
    if (
      homepageData?.content === null ||
      homepageData?.content === undefined ||
      typeof homepageData.content !== 'object'
    ) {
      return {};
    }
    const content = homepageData.content as {
      categoryData?: Record<string, HomepageContentItem[]>;
    };
    return content.categoryData ?? {};
  }

  const homepageCategoryData = extractHomepageCategoryData(homepageData);
  const homepageItems = Object.values(homepageCategoryData).flatMap((bucket) =>
    Array.isArray(bucket) ? bucket : []
  );

  const candidateRecommendations =
    savedTags.size > 0
      ? homepageItems.filter((item) =>
          ensureStringArray(item.tags).some((tag) => savedTags.has(tag.toLowerCase()))
        )
      : homepageItems;

  // Section: Recommendations
  const recommendations = candidateRecommendations
    .filter(
      (item) =>
        typeof item.slug === 'string' &&
        item.slug !== '' &&
        !bookmarkedSlugs.has(`${item.category}/${item.slug}`) &&
        typeof item.title === 'string' &&
        item.title !== ''
    )
    .slice(0, 3);
  userLogger.info('AccountDashboard: recommendations generated', {
    section: 'recommendations',
    candidateCount: candidateRecommendations.length,
    finalCount: recommendations.length,
    savedTagsCount: savedTags.size,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended next</CardTitle>
        <CardDescription>Suggestions based on your saved tags</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length > 0 ? (
          <ul className="space-y-3">
            {recommendations.map((item) => {
              const firstTag = ensureStringArray(item.tags)[0];
              const itemHref = `/${item.category}/${item.slug}`;
              const similarHref = firstTag ? `/search?tags=${encodeURIComponent(firstTag)}` : null;
              return (
                <li
                  key={`${item.category}-${item.slug}`}
                  className="border-border/60 bg-muted/20 rounded-xl border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      {item.description ? (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <NavLink href={itemHref} className="text-sm font-medium">
                        Explore →
                      </NavLink>
                      {similarHref ? (
                        <NavLink
                          href={similarHref}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          Explore similar →
                        </NavLink>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Start bookmarking configs to receive personalized recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Renders a compact action row with a title, description, and a right-aligned "Open" link.
 *
 * @param title - Short label for the action
 * @param description - One-line explanation of what the action does
 * @param href - Destination URL for the "Open" link
 * @returns A JSX element representing the quick action row
 *
 * @see NavLink
 * @see RecentlySavedGrid
 */
function QuickActionRow({
  title,
  description,
  href,
}: {
  description: string;
  href: string;
  title: string;
}) {
  return (
    <div className="border-border/50 flex items-center justify-between gap-4 rounded-xl border p-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <NavLink href={href} className="text-sm font-semibold">
        Open →
      </NavLink>
    </div>
  );
}

/**
 * Displays an empty state shown when the user has no saved configs.
 *
 * Renders a brief message and a link to the directory so users can explore and bookmark configurations.
 *
 * @returns A React element containing the empty-state message and a directory link.
 *
 * @see RecentlySavedGrid
 * @see NavLink
 * @see ROUTES.HOME
 */
function EmptyRecentlySavedState() {
  return (
    <div className="border-border/70 rounded-2xl border border-dashed p-6 text-center">
      <p className="font-medium">No saved configs yet</p>
      <p className="text-muted-foreground text-sm">
        Browse the directory and bookmark your favorite configurations to see them here.
      </p>
      <NavLink href={ROUTES.HOME} className="mt-4 inline-flex font-semibold">
        Explore directory →
      </NavLink>
    </div>
  );
}
