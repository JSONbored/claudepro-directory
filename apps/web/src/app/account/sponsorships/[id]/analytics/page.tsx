import { type GetSponsorshipAnalyticsReturns } from '@heyclaude/data-layer';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getSponsorshipAnalytics } from '@heyclaude/web-runtime/data/account';
import { formatDate } from '@heyclaude/web-runtime/data/utils';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type sponsorship_tier } from '@prisma/client';
import { sponsorship_tier as SponsorshipTierEnum } from '@prisma/client';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';
import { MetricsDisplay } from '@/src/components/features/analytics/metrics-display';

import Loading from './loading';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

type SponsorshipAnalytics = GetSponsorshipAnalyticsReturns;

interface AnalyticsPageProperties {
  params: Promise<{ id: string }>;
}

/**
 * Generate page metadata for the sponsorship analytics route identified by `id`.
 *
 * This metadata generation defers non-deterministic operations to request time by awaiting the database
 * `connection()`, ensuring compatibility with Next.js Cache Components.
 *
 * @param params - A promise that resolves to route parameters; must resolve to an object containing `id`
 * @param params.params
 * @returns The Metadata object for the sponsorship analytics page for `id`
 *
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({ params }: AnalyticsPageProperties): Promise<Metadata> {
  'use cache';
  const { id } = await params;
  return generatePageMetadata('/account/sponsorships/:id/analytics', { params: { id } });
}

/**
 * Render the sponsorship analytics page for a given sponsorship id.
 *
 * Displays campaign overview metrics, campaign details, a 30-day daily performance chart,
 * and optimization tips. Enforces authentication and resolves to a not-found response when
 * analytics data is missing or invalid.
 *
 * @param params - Route parameters object containing the `id` of the sponsorship to display.
 * @param params.params
 * @returns A React element showing campaign metrics, daily performance visualization, and optimization tips.
 *
 * @see getSponsorshipAnalytics
 * @see getAuthenticatedUser
 * @see notFound
 */
export default async function SponsorshipAnalyticsPage({ params }: AnalyticsPageProperties) {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/sponsorships/[id]/analytics',
    operation: 'SponsorshipAnalyticsPage',
  });

  return (
    <Suspense fallback={<Loading />}>
      <SponsorshipAnalyticsPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the sponsorship analytics page content for a given sponsorship id by fetching analytics, enforcing authentication, and displaying overview, campaign details, and a 30-day performance chart.
 *
 * Renders a sign-in prompt when no authenticated user is present and triggers Next.js `notFound()` when analytics or required fields are missing.
 *
 * @param params - Promise resolving to route parameters with an `id` property
 * @param params.params
 * @param reqLogger - Request-scoped logger (used to create route- and user-scoped child loggers)
 * @param params.reqLogger
 * @returns The React elements comprising the sponsorship analytics UI
 * @throws Normalized error when fetching sponsorship analytics fails
 * @see getSponsorshipAnalytics
 * @see getAuthenticatedUser
 * @see notFound
 */
async function SponsorshipAnalyticsPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ id: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { id } = await params;
  const route = `/account/sponsorships/${id}/analytics`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SponsorshipAnalyticsPage' });

  if (!user) {
    routeLogger.warn(
      { section: 'data-fetch' },
      'SponsorshipAnalyticsPage: unauthenticated access attempt'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view sponsorship analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton valueProposition="Sign in to view sponsorship analytics">
              Go to sign in
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = routeLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  // Section: Analytics Data Fetch
  let analyticsData: null | SponsorshipAnalytics = null;
  try {
    analyticsData = await getSponsorshipAnalytics(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load sponsorship analytics');
    userLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'SponsorshipAnalyticsPage: getSponsorshipAnalytics threw'
    );
    throw normalized;
  }

  if (!analyticsData) {
    userLogger.warn(
      { section: 'data-fetch' },
      'SponsorshipAnalyticsPage: analytics not found or inaccessible'
    );
    notFound();
  }

  // analyticsData is guaranteed to be non-null here (checked above)
  // Use generated types directly - handle nullability as defined in @heyclaude/database-types
  const sponsorship = analyticsData.sponsorship;
  const daily_stats = analyticsData.daily_stats;
  const computed_metrics = analyticsData.computed_metrics;

  // Handle nullability per generated types (composite types are nullable in generated types)
  if (!sponsorship || !daily_stats || !computed_metrics) {
    userLogger.error(
      {
        err: new Error('Null fields in analytics data'),
        section: 'data-fetch',
      },
      'SponsorshipAnalyticsPage: unexpected null fields in analytics data'
    );
    notFound();
  }

  // After null check, TypeScript narrows types - use generated types directly
  // Validate tier value at runtime using Prisma enum object
  const rawTier = sponsorship.tier; // Widen to string for validation
  const validTiers = Object.values(SponsorshipTierEnum) as readonly sponsorship_tier[];

  // Type guard to check if tier is a valid enum value
  // Uses database enum constants directly - leverages readonly array includes
  function isValidTier(tier: string): tier is sponsorship_tier {
    // TypeScript knows validTiers contains all enum values, so this is type-safe
    return (validTiers as readonly string[]).includes(tier);
  }

  const isTierValid = isValidTier(rawTier);

  const safeTier: sponsorship_tier = isTierValid ? rawTier : 'sponsored'; // Safe default for invalid values

  if (!isTierValid) {
    userLogger.warn(
      {
        expectedTiers: validTiers, // Now supports arrays directly - better for log querying
        fallbackTier: 'sponsored',
        invalidTier: rawTier,
        section: 'data-fetch',
      },
      'SponsorshipAnalyticsPage: invalid tier value, using safe default'
    );
  }

  const impressionCount = sponsorship.impression_count ?? 0;
  const clickCount = sponsorship.click_count ?? 0;
  const ctr = (computed_metrics.ctr ?? 0).toFixed(2);
  const daysActive = computed_metrics.days_active ?? 0;
  const avgImpressionsPerDay = (computed_metrics.avg_impressions_per_day ?? 0).toFixed(0);

  // Convert daily_stats array to Maps for chart rendering
  // Handle nullability per generated types
  const impressionsMap = new Map<string, number>();
  const clicksMap = new Map<string, number>();

  for (const stat of daily_stats) {
    if (stat.date && stat.impressions !== null && stat.clicks !== null) {
      const day = stat.date.slice(0, 10);
      impressionsMap.set(day, stat.impressions);
      clicksMap.set(day, stat.clicks);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UnifiedBadge showIcon tier={safeTier} variant="sponsored" />
          <h1 className="text-3xl font-bold">Sponsorship Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Detailed performance metrics for your sponsored content
        </p>
      </div>

      {/* Overview Stats */}
      <MetricsDisplay
        description="Key metrics for your sponsored content"
        metrics={[
          {
            label: 'Total Impressions',
            value: impressionCount.toLocaleString(),
            ...(sponsorship.impression_limit
              ? { change: `of ${sponsorship.impression_limit.toLocaleString()} limit` }
              : {}),
            trend: impressionCount > 0 ? 'up' : 'unchanged',
          },
          {
            change: 'User engagements',
            label: 'Total Clicks',
            trend: clickCount > 0 ? 'up' : 'unchanged',
            value: clickCount.toLocaleString(),
          },
          {
            change: 'Clicks / Impressions',
            label: 'Click-Through Rate',
            trend:
              Number.parseFloat(ctr) > 2 ? 'up' : Number.parseFloat(ctr) > 0 ? 'unchanged' : 'down',
            value: `${ctr}%`,
          },
          {
            change: `Over ${daysActive} days`,
            label: 'Avg. Daily Views',
            trend: Number.parseFloat(avgImpressionsPerDay) > 0 ? 'up' : 'unchanged',
            value: avgImpressionsPerDay,
          },
        ]}
        title="Campaign Performance"
      />

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Current sponsorship configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm-medium">Content Type</p>
              <p className="text-muted-foreground">{sponsorship.content_type}</p>
            </div>

            <div>
              <p className="text-sm-medium">Content ID</p>
              <p className="text-muted-foreground font-mono text-xs">{sponsorship.content_id}</p>
            </div>

            <div>
              <p className="text-sm-medium">Start Date</p>
              <p className="text-muted-foreground">{formatDate(sponsorship.start_date)}</p>
            </div>

            <div>
              <p className="text-sm-medium">End Date</p>
              <p className="text-muted-foreground">{formatDate(sponsorship.end_date)}</p>
            </div>

            <div>
              <p className="text-sm-medium">Status</p>
              <div className="flex items-center gap-2">
                <UnifiedBadge style={sponsorship.active ? 'default' : 'outline'} variant="base">
                  {sponsorship.active ? 'Active' : 'Inactive'}
                </UnifiedBadge>
              </div>
            </div>

            <div>
              <p className="text-sm-medium">Tier</p>
              <div>
                <UnifiedBadge showIcon tier={safeTier} variant="sponsored" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance Chart (Simple CSS-based) */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 30 }, (_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - index));
              const dayKey = date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
              const impressions = impressionsMap.get(dayKey) ?? 0;
              const clicks = clicksMap.get(dayKey) ?? 0;
              const maxImpressions = Math.max(...impressionsMap.values(), 1);

              return (
                <div className="grid grid-cols-12 items-center gap-1" key={dayKey}>
                  <div className="text-muted-foreground col-span-2 text-xs">
                    {(() => {
                      const monthNames = [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'Jun',
                        'Jul',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec',
                      ];
                      return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`;
                    })()}
                  </div>
                  <div className="col-span-10 grid grid-cols-2 gap-0.5">
                    {/* Impressions bar */}
                    <div className="bg-muted relative h-8 overflow-hidden rounded">
                      <div
                        className="bg-primary/30 absolute top-0 left-0 h-full transition-all"
                        style={{ width: `${(impressions / maxImpressions) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs">
                        {impressions > 0 && `${impressions} views`}
                      </div>
                    </div>
                    {/* Clicks bar */}
                    <div className="bg-muted relative h-8 overflow-hidden rounded">
                      <div
                        className="bg-accent/50 absolute top-0 left-0 h-full transition-all"
                        style={{ width: `${impressions > 0 ? (clicks / impressions) * 100 : 0}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs">
                        {clicks > 0 && `${clicks} clicks`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Tips</CardTitle>
          <CardDescription>Improve your campaign performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• CTR above 2% is excellent for sponsored content</li>
            <li>• Featured tier gets 3x more impressions than promoted</li>
            <li>• Premium tier includes newsletter promotion for extra reach</li>
            <li>• Consider extending your campaign if CTR is high</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
