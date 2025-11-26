import type { Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  ensureStringArray,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAccountDashboardBundle,
  getAuthenticatedUser,
  getContentDetailCore,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Bookmark, Calendar } from '@heyclaude/web-runtime/icons';
import type { HomepageContentItem } from '@heyclaude/web-runtime/types/component.types';
import { UI_CLASSES, NavLink, UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle   } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
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

export default async function AccountDashboard() {
  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/account', 'AccountDashboard');

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'AccountDashboard' });

  if (!user) {
    const authLogContext = withDuration(baseLogContext, startTime);
    logger.warn('AccountDashboard: unauthenticated access attempt detected', undefined, {
      ...authLogContext,
      requestId,
      operation: 'AccountDashboard',
      section: 'authentication',
      sectionDuration_ms: Date.now() - authSectionStart,
      timestamp: new Date().toISOString(),
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view your dashboard.</CardDescription>
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
  logger.info(
    'AccountDashboard: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Dashboard Bundle
  const bundleSectionStart = Date.now();
  let bundleData: Awaited<ReturnType<typeof getAccountDashboardBundle>> | null = null;
  try {
    bundleData = await getAccountDashboardBundle(user.id);
    logger.info(
      'AccountDashboard: dashboard bundle loaded',
      withDuration(
        {
          ...logContext,
          section: 'dashboard-bundle',
          hasDashboard: !!bundleData.dashboard,
          hasLibrary: !!bundleData.library,
          hasHomepage: !!bundleData.homepage,
        },
        bundleSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load account dashboard bundle');
    logger.error(
      'AccountDashboard: getAccountDashboardBundle threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'dashboard-bundle',
          sectionDuration_ms: Date.now() - bundleSectionStart,
        },
        startTime
      )
    );
    throw normalized;
  }

  // bundleData is guaranteed to be non-null after successful await
  // (getAccountDashboardBundle returns Promise<AccountDashboardBundle>, not Promise<AccountDashboardBundle | null>)
  const dashboardData = bundleData.dashboard;
  const libraryData = bundleData.library;
  const homepageData = bundleData.homepage;

  if (!dashboardData) {
    const normalized = normalizeError(
      'Dashboard data is null',
      'AccountDashboard: dashboard data is null'
    );
    logger.error(
      'AccountDashboard: dashboard data is null',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'dashboard-bundle',
          sectionDuration_ms: Date.now() - bundleSectionStart,
        },
        startTime
      )
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your account data. Please refresh the page or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
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
  const bookmarksSectionStart = Date.now();
  const recentlySavedContentResults = await Promise.all(
    recentBookmarks.map(async (bookmark) => {
      try {
        const category = bookmark.content_type as Database['public']['Enums']['content_category'];
        const slug = bookmark.content_slug as string;
        const detail = await getContentDetailCore({ category, slug });
        return detail?.content ?? null;
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load bookmark content');
        logger.warn('AccountDashboard: getContentDetailCore failed for bookmark', undefined, {
          ...logContext,
          section: 'recent-bookmarks',
          slug: bookmark.content_slug,
          category: bookmark.content_type,
          error: normalized.message,
        });
        return null;
      }
    })
  );
  logger.info(
    'AccountDashboard: recent bookmarks loaded',
    withDuration(
      {
        ...logContext,
        section: 'recent-bookmarks',
        bookmarkCount: recentBookmarks.length,
        loadedCount: recentlySavedContentResults.filter(Boolean).length,
      },
      bookmarksSectionStart
    )
  );
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
    if (!homepageData?.content || typeof homepageData.content !== 'object') {
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
  const recommendationsSectionStart = Date.now();
  const recommendations = candidateRecommendations
    .filter(
      (item) => item.slug && !bookmarkedSlugs.has(`${item.category}/${item.slug}`) && item.title
    )
    .slice(0, 3);
  logger.info(
    'AccountDashboard: recommendations generated',
    withDuration(
      {
        ...logContext,
        section: 'recommendations',
        candidateCount: candidateRecommendations.length,
        finalCount: recommendations.length,
        savedTagsCount: savedTags.size,
      },
      recommendationsSectionStart
    )
  );

  const latestBookmark = recentBookmarks[0];
  const resumeBookmarkHref =
    latestBookmark?.content_slug && latestBookmark.content_type
      ? `/${latestBookmark.content_type}/${latestBookmark.content_slug}`
      : null;

  // Final summary log
  logger.info(
    'AccountDashboard: page render completed',
    withDuration(
      {
        ...logContext,
        section: 'page-render',
        bookmarkCount,
        recommendationsCount: recommendations.length,
        recentlySavedCount: recentlySavedContent.length,
      },
      startTime
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
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
              <Bookmark className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{bookmarkCount ?? 0}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Saved items</p>
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
            <p className={'mt-2 text-muted-foreground text-xs'}>Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{accountAge}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Days active</p>
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
          {resumeBookmarkHref && (
            <QuickActionRow
              title="Resume latest bookmark"
              description="Continue where you left off"
              href={resumeBookmarkHref}
            />
          )}
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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
          <CardContent className="space-y-4">
            {recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((item) => {
                  const firstTag = ensureStringArray(item.tags)[0];
                  const itemHref = `/${item.category}/${item.slug}`;
                  const similarHref = firstTag
                    ? `/search?tags=${encodeURIComponent(firstTag)}`
                    : null;
                  return (
                    <li
                      key={`${item.category}-${item.slug}`}
                      className="rounded-xl border border-border/60 bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          {item.description && (
                            <p className="line-clamp-2 text-muted-foreground text-sm">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <NavLink href={itemHref} className="font-medium text-sm">
                            Explore →
                          </NavLink>
                          {similarHref && (
                            <NavLink
                              href={similarHref}
                              className="text-muted-foreground text-xs hover:text-foreground"
                            >
                              Explore similar →
                            </NavLink>
                          )}
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
      </div>
    </div>
  );
}

function QuickActionRow({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <NavLink href={href} className="font-semibold text-sm">
        Open →
      </NavLink>
    </div>
  );
}

function EmptyRecentlySavedState() {
  return (
    <div className="rounded-2xl border border-border/70 border-dashed p-6 text-center">
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
