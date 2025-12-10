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
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
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
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';
import { RecentlySavedGrid } from '@/src/components/features/account/recently-saved-grid';

import Loading from './loading';

/**
 * Generate metadata for the account page at request time.
 *
 * Awaits a server connection to ensure non-deterministic operations run at request time,
 * then delegates to generatePageMetadata('/account') to produce the final Metadata.
 *
 * @returns Metadata for the account page.
 *
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account');
}

/**
 * Render the account dashboard for the authenticated user.
 *
 * Verifies authentication, loads the user's dashboard bundle (dashboard, library, homepage),
 * computes metrics and recent bookmarks, resolves content details for recently saved items,
 * and builds personalized recommendations before rendering the dashboard UI. Renders an
 * authentication prompt when no user is signed in and a dashboard-unavailable fallback if
 * required dashboard data cannot be loaded.
 *
 * @returns A JSX element representing the account dashboard page or an authentication/fallback UI.
 *
 * @see getAuthenticatedUser
 * @see getAccountDashboardBundle
 * @see RecentlySavedGrid
 */
export default async function AccountDashboard() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'AccountDashboard',
    route: '/account',
    module: 'apps/web/src/app/account',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'AccountDashboard' });

  if (!user) {
    reqLogger.warn(
      { section: 'data-fetch' },
      'AccountDashboard: unauthenticated access attempt detected'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton valueProposition="Sign in to view your dashboard" redirectTo="/account">
              Go to login
            </SignInButton>
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

  userLogger.info({ section: 'data-fetch' }, 'AccountDashboard: authentication successful');

  // Fetch bundle once at the top level to avoid duplicate fetches
  // This ensures consistency and eliminates fetch waterfalls
  let bundleData: Awaited<ReturnType<typeof getAccountDashboardBundle>> | null = null;
  try {
    bundleData = await getAccountDashboardBundle(user.id);
    userLogger.info({ section: 'data-fetch', hasDashboard: !!bundleData.dashboard,
      hasLibrary: !!bundleData.library,
      hasHomepage: !!bundleData.homepage }, 'AccountDashboard: dashboard bundle loaded');
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load account dashboard bundle');
    userLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'AccountDashboard: getAccountDashboardBundle failed'
    );
    throw normalized;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard header and stats - streams in Suspense */}
      <Suspense fallback={<Loading />}>
        <DashboardHeaderAndStats bundleData={bundleData} userLogger={userLogger} />
      </Suspense>

      {/* Quick actions and content sections - data already fetched in DashboardContent */}
      <DashboardContent bundleData={bundleData} userLogger={userLogger} />
    </div>
  );
}

/**
 * Render the dashboard header, account statistics, and quick actions for a user.
 *
 * This server component receives the account dashboard bundle as a prop (fetched once in parent)
 * and renders a header with a welcome message, stats cards (bookmarks, tier, member-since),
 * and a quick actions card (resume latest bookmark, view all bookmarks, manage profile).
 * When the dashboard data is missing it renders a fallback Card indicating the dashboard is unavailable.
 *
 * @param props.bundleData - The account dashboard bundle data (fetched once in parent component).
 * @param root0
 * @param root0.bundleData
 * @param props.userLogger - A request-scoped logger child used for structured logging.
 * @param root0.userLogger
 * @returns The dashboard UI as JSX to be streamed to the client.
 *
 * @see QuickActionRow
 */
function DashboardHeaderAndStats({
  bundleData,
  userLogger,
}: {
  bundleData: NonNullable<Awaited<ReturnType<typeof getAccountDashboardBundle>>>;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Calculate timestamp - safe to use Date.now() here because parent function uses 'use cache: private'
  // which ensures this runs at request time, not during prerendering
  const currentTimestamp = Date.now();

  const dashboardData = bundleData.dashboard;
  const libraryData = bundleData.library;

  if (!dashboardData) {
    const normalized = normalizeError(
      new Error('Dashboard data is null'),
      'AccountDashboard: dashboard data is null'
    );
    userLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'AccountDashboard: dashboard data is null'
    );
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
  // Calculate account age in days - use timestamp calculated at request time (after connection())
  // to ensure purity
  const accountAge = profile?.created_at
    ? Math.floor(
        (currentTimestamp - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
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
 * Render the account dashboard content area with recent bookmarks and personalized recommendations.
 *
 * Receives the account dashboard bundle as a prop (fetched once in parent) and renders two sections:
 * a recently saved/bookmarks section and a recommendations section.
 *
 * @param bundleData - The account dashboard bundle data (fetched once in parent component).
 * @param bundleData.bundleData
 * @param userLogger - Request-scoped logger preconfigured for the current user/session
 * @param bundleData.userLogger
 * @returns The dashboard content element containing recent bookmarks and recommendations
 *
 * @see RecentlySavedSection
 * @see RecommendationsSection
 */
async function DashboardContent({
  bundleData,
  userLogger,
}: {
  bundleData: NonNullable<Awaited<ReturnType<typeof getAccountDashboardBundle>>>;
  userLogger: ReturnType<typeof logger.child>;
}) {
  const libraryData = bundleData.library;
  const homepageData = bundleData.homepage;

  const bookmarks = (libraryData?.bookmarks ?? []).filter(
    (bookmark) => bookmark.content_slug !== null && bookmark.content_type !== null
  );
  const recentBookmarks = bookmarks.slice(0, 3);
  const bookmarkedSlugs = new Set(
    bookmarks.map((bookmark) => `${bookmark.content_type ?? ''}/${bookmark.content_slug ?? ''}`)
  );

  // Fetch content details once for both sections to avoid duplicate API calls
  const recentlySavedContentResults = await Promise.all(
    recentBookmarks.map(async (bookmark) => {
      try {
        const category = bookmark.content_type as Database['public']['Enums']['content_category'];
        const slug = bookmark.content_slug as string;
        const detail = await getContentDetailCore({ category, slug });
        return detail?.content ?? null;
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load bookmark content');
        userLogger.warn({ section: 'data-fetch', err: normalized,
            slug: bookmark.content_slug,
            category: bookmark.content_type }, 'AccountDashboard: getContentDetailCore failed for bookmark');
        return null;
      }
    })
  );
  const recentlySavedContent = recentlySavedContentResults.filter(
    (item): item is Database['public']['Tables']['content']['Row'] =>
      item !== null && typeof item === 'object'
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
        <RecentlySavedSection recentlySavedContent={recentlySavedContent} userLogger={userLogger} />
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
          recentlySavedContent={recentlySavedContent}
          userLogger={userLogger}
        />
      </Suspense>
    </div>
  );
}

/**
 * Renders a "Recently Saved" card by displaying the provided resolved content items.
 *
 * Displays a RecentlySavedGrid when items are available or an empty-state when none are provided.
 *
 * @param recentlySavedContent - Array of resolved content items to display.
 * @param recentlySavedContent.recentlySavedContent
 * @param userLogger - Request-scoped logger already configured for the current user; used to record display metrics.
 * @param recentlySavedContent.userLogger
 * @returns A card element containing either a grid of resolved content items or an empty state message.
 *
 * @see RecentlySavedGrid
 */
function RecentlySavedSection({
  recentlySavedContent,
  userLogger,
}: {
  recentlySavedContent: Database['public']['Tables']['content']['Row'][];
  userLogger: ReturnType<typeof logger.child>;
}) {
  userLogger.info({ section: 'data-fetch', itemCount: recentlySavedContent.length }, 'AccountDashboard: recent bookmarks displayed');

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
 * Render a recommendations section suggesting next items based on the user's saved tags and homepage content.
 *
 * This server component selects up to three homepage items that match tags extracted from the user's recent saved content,
 * excludes items that are already bookmarked, and renders a Card with links to explore each recommendation or explore similar items.
 *
 * @param homepageData.bookmarkedSlugs
 * @param homepageData - The `homepage` payload from the account dashboard bundle; used to derive candidate recommendation items.
 * @param bookmarkedSlugs - A set of strings in the form `"{category}/{slug}"` representing the user's already-bookmarked items to exclude.
 * @param homepageData.homepageData
 * @param recentlySavedContent - Resolved content items from recent bookmarks used to extract tags for recommendations.
 * @param homepageData.recentlySavedContent
 * @param userLogger - A request-scoped logger used to record recommendation-generation metrics.
 * @param homepageData.userLogger
 * @returns A Card element containing up to three recommended items (each with "Explore" and optional "Explore similar" links), or a fallback prompt encouraging the user to bookmark content.
 *
 * @see getAccountDashboardBundle
 */
function RecommendationsSection({
  homepageData,
  bookmarkedSlugs,
  recentlySavedContent,
  userLogger,
}: {
  bookmarkedSlugs: Set<string>;
  homepageData: Awaited<ReturnType<typeof getAccountDashboardBundle>>['homepage'];
  recentlySavedContent: Database['public']['Tables']['content']['Row'][];
  userLogger: ReturnType<typeof logger.child>;
}) {
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
   * Extracts the `categoryData` map from dashboard homepage data, returning an empty map when the homepage structure is missing or invalid.
   *
   * @param homepageData - The `homepage` slice returned by `getAccountDashboardBundle`
   * @returns The `categoryData` map keyed by category name, or an empty object if none is present
   *
   * @see getAccountDashboardBundle
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
  userLogger.info({ section: 'data-fetch', candidateCount: candidateRecommendations.length,
    finalCount: recommendations.length,
    savedTagsCount: savedTags.size }, 'AccountDashboard: recommendations generated');

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
 * @param title.description
 * @param title.href
 * @param title - Short label for the action
 * @param description - One-line explanation of what the action does
 * @param href - Destination URL for the "Open" link
 * @param title.title
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
