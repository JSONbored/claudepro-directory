import  { type Database } from '@heyclaude/database-types';
import { ensureStringArray } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAccountDashboardBundle,
  getAuthenticatedUser,
  getContentDetailCore,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  alignItems,
  bgColor,
  border,
  borderColor,
  cluster,
  flexDir,
  gap,
  grid,
  iconSize,
  justify,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  size,
  spaceY,
  textColor,
  weight,
  display,
  truncate,
  textAlign,
  hoverText,
} from '@heyclaude/web-runtime/design-system';
import { Bookmark, Calendar } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import  { type HomepageContentItem } from '@heyclaude/web-runtime/types/component.types';
import { NavLink, UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle   } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';

import { RecentlySavedGrid } from '@/src/components/features/account/recently-saved-grid';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account');
}

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because it displays user-specific account data.
 * Runtime: Node.js (required for authenticated user data and Supabase server client)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Render the authenticated user's account dashboard with stats, quick actions, recently saved items, and personalized recommendations.
 *
 * Performs server-side authentication and loads the account dashboard bundle (dashboard, library, homepage) to assemble recent bookmarks and candidate recommendations. If the request is unauthenticated this component returns a sign-in prompt; if dashboard data cannot be loaded it returns an error card.
 *
 * @returns The rendered dashboard page as JSX. When unauthenticated, a sign-in prompt is returned; when dashboard data is unavailable, an error card is returned.
 *
 * @see getAuthenticatedUser
 * @see getAccountDashboardBundle
 * @see getContentDetailCore
 * @see RecentlySavedGrid
 */
export default async function AccountDashboard() {
  // Generate single requestId for this page request
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
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
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

  // Section: Dashboard Bundle
  let bundleData: Awaited<ReturnType<typeof getAccountDashboardBundle>> | null = null;
  try {
    bundleData = await getAccountDashboardBundle(user.id);
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

  // bundleData is guaranteed to be non-null after successful await
  // (getAccountDashboardBundle returns Promise<AccountDashboardBundle>, not Promise<AccountDashboardBundle | null>)
  const dashboardData = bundleData.dashboard;
  const libraryData = bundleData.library;
  const homepageData = bundleData.homepage;

  if (!dashboardData) {
    const normalized = normalizeError(
      new Error('Dashboard data is null'),
      'AccountDashboard: dashboard data is null'
    );
    userLogger.error('AccountDashboard: dashboard data is null', normalized, {
      section: 'dashboard-bundle',
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Dashboard unavailable</CardTitle>
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
      </div>
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

  const bookmarkedSlugs = new Set(
    bookmarks.map((bookmark) => `${bookmark.content_type ?? ''}/${bookmark.content_slug ?? ''}`)
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

  // Helper to safely extract categoryData
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

  const latestBookmark = recentBookmarks[0];
  const resumeBookmarkHref =
    latestBookmark?.content_slug && latestBookmark.content_type
      ? `/${latestBookmark.content_type}/${latestBookmark.content_slug}`
      : null;

  // Final summary log
  userLogger.info('AccountDashboard: page render completed', {
    section: 'page-render',
    bookmarkCount,
    recommendationsCount: recommendations.length,
    recentlySavedCount: recentlySavedContent.length,
  });

  return (
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Dashboard</h1>
        <p className={muted.default}>Welcome back, {profile?.name ?? 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className={grid.responsive13Gap4}>
        <Card>
          <CardHeader>
            <CardTitle className={size.sm}>Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cluster.compact}>
              <Bookmark className={`${iconSize.md} ${textColor.primary}`} />
              <span className={`${weight.bold} ${size['3xl']}`}>{bookmarkCount ?? 0}</span>
            </div>
            <p className={`${marginTop.compact} ${muted.xs}`}>Saved items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={size.sm}>Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedBadge
              variant="base"
              style={profile?.tier === 'pro' ? 'default' : 'secondary'}
              className={marginTop.compact}
            >
              {profile?.tier
                ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                : 'Free'}
            </UnifiedBadge>
            <p className={`${marginTop.compact} ${muted.xs}`}>Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={size.sm}>Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cluster.compact}>
              <Calendar className={`${iconSize.md} ${textColor.primary}`} />
              <span className={`${weight.bold} ${size['3xl']}`}>{accountAge}</span>
            </div>
            <p className={`${marginTop.compact} ${muted.xs}`}>Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.default}>
          {resumeBookmarkHref ? <QuickActionRow
              title="Resume latest bookmark"
              description="Continue where you left off"
              href={resumeBookmarkHref}
            /> : null}
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

      <div className={`${grid.twoThirdsOneThird} ${gap.relaxed}`}>
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

        <Card>
          <CardHeader>
            <CardTitle>Recommended next</CardTitle>
            <CardDescription>Suggestions based on your saved tags</CardDescription>
          </CardHeader>
          <CardContent className={spaceY.comfortable}>
            {recommendations.length > 0 ? (
              <ul className={spaceY.default}>
                {recommendations.map((item) => {
                  const firstTag = ensureStringArray(item.tags)[0];
                  const itemHref = `/${item.category}/${item.slug}`;
                  const similarHref = firstTag
                    ? `/search?tags=${encodeURIComponent(firstTag)}`
                    : null;
                  return (
                    <li
                      key={`${item.category}-${item.slug}`}
                      className={`${radius.xl} border ${borderColor['border/60']} ${bgColor['muted/20']} ${padding.compact}`}
                    >
                      <div className={`${display.flex} ${alignItems.start} ${justify.between} ${gap.default}`}>
                        <div>
                          <p className={weight.semibold}>{item.title}</p>
                          {item.description ? <p className={`${truncate.lines2} ${muted.sm}`}>
                              {item.description}
                            </p> : null}
                        </div>
                        <div className={`${display.flex} ${flexDir.col} ${alignItems.end} ${gap.compact}`}>
                          <NavLink href={itemHref} className={`${weight.medium} ${size.sm}`}>
                            Explore →
                          </NavLink>
                          {similarHref ? <NavLink
                              href={similarHref}
                              className={`${muted.default} ${size.xs} ${hoverText.foreground}`}
                            >
                              Explore similar →
                            </NavLink> : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={muted.sm}>
                Start bookmarking configs to receive personalized recommendations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Renders a compact action row with a title, supporting description, and a right-aligned "Open" link.
 *
 * Displays a two-column layout: the left column shows the title and description, and the right column shows a navigation link to `href`.
 *
 * @param title - The primary label for the action
 * @param description - A short explanatory line shown beneath the title
 * @param href - Destination URL for the "Open" link
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
    <div className={`${display.flex} ${alignItems.center} ${justify.between} ${gap.comfortable} ${radius.xl} border ${borderColor['border/50']} ${padding.compact}`}>
      <div>
        <p className={weight.medium}>{title}</p>
        <p className={muted.sm}>{description}</p>
      </div>
      <NavLink href={href} className={`${weight.semibold} ${size.sm}`}>
        Open →
      </NavLink>
    </div>
  );
}

/**
 * Renders an empty-state card shown when the user has no saved configurations.
 *
 * Displays a brief message, guidance to browse the directory, and a link to the home/explore page.
 *
 * @see RecentlySavedGrid
 * @see ROUTES.HOME
 */
function EmptyRecentlySavedState() {
  return (
    <div className={`${radius['2xl']} ${border.dashedVisible} ${padding.comfortable} ${textAlign.center}`}>
      <p className={weight.medium}>No saved configs yet</p>
      <p className={muted.sm}>
        Browse the directory and bookmark your favorite configurations to see them here.
      </p>
      <NavLink href={ROUTES.HOME} className={`${marginTop.default} ${display.inlineFlex} ${weight.semibold}`}>
        Explore directory →
      </NavLink>
    </div>
  );
}