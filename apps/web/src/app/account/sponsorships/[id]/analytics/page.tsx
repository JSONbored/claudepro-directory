import { Constants, type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getSponsorshipAnalytics,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  POSITION_PATTERNS,
  UI_CLASSES,
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
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { MetricsDisplay } from '@/src/components/features/analytics/metrics-display';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// MIGRATED: Removed export const runtime = 'nodejs' (default, not needed with Cache Components)
// TODO: Will add Suspense boundaries or "use cache" after analyzing build errors

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

type SponsorshipAnalytics = Database['public']['Functions']['get_sponsorship_analytics']['Returns'];

interface AnalyticsPageProperties {
  params: Promise<{ id: string }>;
}

/**
 * Generates metadata for the sponsorship analytics page for the given route `id`.
 *
 * @param params - A promise resolving to route parameters; must resolve to an object containing `id`
 * @returns Metadata for the sponsorship analytics page corresponding to `id`
 *
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({ params }: AnalyticsPageProperties): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  const { id } = await params;
  return generatePageMetadata('/account/sponsorships/:id/analytics', { params: { id } });
}

/**
 * Render the sponsorship analytics page for a given sponsorship id.
 *
 * Renders campaign overview metrics, campaign details, a 30-day daily performance chart,
 * and optimization tips. Enforces authentication (prompts sign-in if unauthenticated)
 * and fetches analytics data for the current user; if analytics are missing or invalid,
 * the page resolves to a not-found response.
 *
 * @param params - Route parameters object containing the `id` of the sponsorship to display.
 * @returns A React element displaying campaign metrics, daily performance visualization, and tips.
 *
 * @see getSponsorshipAnalytics
 * @see getAuthenticatedUser
 * @see generateRequestId
 * @see notFound
 */
export default async function SponsorshipAnalyticsPage({ params }: AnalyticsPageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SponsorshipAnalyticsPage',
    module: 'apps/web/src/app/account/sponsorships/[id]/analytics',
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading sponsorship analytics...</div>}>
      <SponsorshipAnalyticsPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

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
    routeLogger.warn('SponsorshipAnalyticsPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view sponsorship analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to sign in</Link>
            </Button>
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
    userLogger.error('SponsorshipAnalyticsPage: getSponsorshipAnalytics threw', normalized, {
      section: 'analytics-data-fetch',
    });
    throw normalized;
  }

  if (!analyticsData) {
    userLogger.warn('SponsorshipAnalyticsPage: analytics not found or inaccessible');
    notFound();
  }

  // analyticsData is guaranteed to be non-null here (checked above)
  // Use generated types directly - handle nullability as defined in @heyclaude/database-types
  const sponsorship = analyticsData.sponsorship;
  const daily_stats = analyticsData.daily_stats;
  const computed_metrics = analyticsData.computed_metrics;

  // Handle nullability per generated types (composite types are nullable in generated types)
  if (!(sponsorship && daily_stats && computed_metrics)) {
    userLogger.error(
      'SponsorshipAnalyticsPage: unexpected null fields in analytics data',
      new Error('Null fields in analytics data')
    );
    notFound();
  }

  // After null check, TypeScript narrows types - use generated types directly
  // Validate tier value at runtime using database enum constants
  const rawTier = sponsorship.tier as string; // Widen to string for validation
  const validTiers = Constants.public.Enums.sponsorship_tier;

  // Type guard to check if tier is a valid enum value
  // Uses database enum constants directly - leverages readonly array includes
  function isValidTier(tier: string): tier is Database['public']['Enums']['sponsorship_tier'] {
    // TypeScript knows validTiers contains all enum values, so this is type-safe
    return (validTiers as readonly string[]).includes(tier);
  }

  const isTierValid = isValidTier(rawTier);

  const safeTier: Database['public']['Enums']['sponsorship_tier'] = isTierValid
    ? rawTier
    : 'sponsored'; // Safe default for invalid values

  if (!isTierValid) {
    userLogger.warn('SponsorshipAnalyticsPage: invalid tier value, using safe default', {
      invalidTier: rawTier,
      expectedTiers: validTiers, // Now supports arrays directly - better for log querying
      fallbackTier: 'sponsored',
    });
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
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <UnifiedBadge variant="sponsored" tier={safeTier} showIcon />
          <h1 className="text-3xl font-bold">Sponsorship Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Detailed performance metrics for your sponsored content
        </p>
      </div>

      {/* Overview Stats */}
      <MetricsDisplay
        title="Campaign Performance"
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
            label: 'Total Clicks',
            value: clickCount.toLocaleString(),
            change: 'User engagements',
            trend: clickCount > 0 ? 'up' : 'unchanged',
          },
          {
            label: 'Click-Through Rate',
            value: `${ctr}%`,
            change: 'Clicks / Impressions',
            trend:
              Number.parseFloat(ctr) > 2 ? 'up' : Number.parseFloat(ctr) > 0 ? 'unchanged' : 'down',
          },
          {
            label: 'Avg. Daily Views',
            value: avgImpressionsPerDay,
            change: `Over ${daysActive} days`,
            trend: Number.parseFloat(avgImpressionsPerDay) > 0 ? 'up' : 'unchanged',
          },
        ]}
      />

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Current sponsorship configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Content Type</p>
              <p className="text-muted-foreground">{sponsorship.content_type}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Content ID</p>
              <p className="text-muted-foreground font-mono text-xs">{sponsorship.content_id}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.start_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Status</p>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <UnifiedBadge variant="base" style={sponsorship.active ? 'default' : 'outline'}>
                  {sponsorship.active ? 'Active' : 'Inactive'}
                </UnifiedBadge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Tier</p>
              <div>
                <UnifiedBadge variant="sponsored" tier={safeTier} showIcon />
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
            {Array.from({ length: 30 }).map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - index));
              const dayKey = date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
              const impressions = impressionsMap.get(dayKey) ?? 0;
              const clicks = clicksMap.get(dayKey) ?? 0;
              const maxImpressions = Math.max(...impressionsMap.values(), 1);

              return (
                <div key={dayKey} className="grid grid-cols-12 items-center gap-2">
                  <div className="text-muted-foreground col-span-2 text-xs">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="col-span-10 grid grid-cols-2 gap-1">
                    {/* Impressions bar */}
                    <div className="bg-muted relative h-8 overflow-hidden rounded">
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} bg-primary/30 h-full transition-all`}
                        style={{ width: `${(impressions / maxImpressions) * 100}%` }}
                      />
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_INSET} flex items-center px-2 text-xs`}
                      >
                        {impressions > 0 && `${impressions} views`}
                      </div>
                    </div>
                    {/* Clicks bar */}
                    <div className="bg-muted relative h-8 overflow-hidden rounded">
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} bg-accent/50 h-full transition-all`}
                        style={{ width: `${impressions > 0 ? (clicks / impressions) * 100 : 0}%` }}
                      />
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_INSET} flex items-center px-2 text-xs`}
                      >
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
