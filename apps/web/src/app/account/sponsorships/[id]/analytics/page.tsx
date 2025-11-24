import { Constants, type Database } from '@heyclaude/database-types';
import { hashUserId, logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getSponsorshipAnalytics,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { POSITION_PATTERNS, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { MetricsDisplay } from '@/src/components/features/analytics/metrics-display';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

type SponsorshipAnalytics = Database['public']['Functions']['get_sponsorship_analytics']['Returns'];

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const { id } = await params;
  return generatePageMetadata('/account/sponsorships/:id/analytics', { params: { id } });
}

export default async function SponsorshipAnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser({ context: 'SponsorshipAnalyticsPage' });

  if (!user) {
    logger.warn('SponsorshipAnalyticsPage: unauthenticated access attempt', { sponsorshipId: id });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view sponsorship analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userIdHash = hashUserId(user.id);

  let analyticsData: SponsorshipAnalytics | null = null;
  try {
    analyticsData = await getSponsorshipAnalytics(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load sponsorship analytics');
    logger.error('SponsorshipAnalyticsPage: getSponsorshipAnalytics threw', normalized, {
      sponsorshipId: id,
      userIdHash,
    });
    throw normalized;
  }

  if (!analyticsData) {
    logger.warn('SponsorshipAnalyticsPage: analytics not found or inaccessible', {
      sponsorshipId: id,
      userIdHash,
    });
    notFound();
  }

  // analyticsData is guaranteed to be non-null here (checked above)
  // Use generated types directly - handle nullability as defined in @heyclaude/database-types
  const sponsorship = analyticsData.sponsorship;
  const daily_stats = analyticsData.daily_stats;
  const computed_metrics = analyticsData.computed_metrics;

  // Handle nullability per generated types (composite types are nullable in generated types)
  if (!(sponsorship && daily_stats && computed_metrics)) {
    logger.error(
      'SponsorshipAnalyticsPage: unexpected null fields in analytics data',
      new Error('Null fields in analytics data'),
      {
        sponsorshipId: id,
        userIdHash,
      }
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
    logger.warn('SponsorshipAnalyticsPage: invalid tier value, using safe default', {
      sponsorshipId: id,
      userIdHash,
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
    if (stat.date && stat.impressions != null && stat.clicks != null) {
      const day = stat.date.substring(0, 10);
      impressionsMap.set(day, stat.impressions);
      clicksMap.set(day, stat.clicks);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <UnifiedBadge variant="sponsored" tier={safeTier} showIcon={true} />
          <h1 className="font-bold text-3xl">Sponsorship Analytics</h1>
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
              <p className="font-medium text-sm">Content Type</p>
              <p className="text-muted-foreground">{sponsorship.content_type}</p>
            </div>

            <div>
              <p className="font-medium text-sm">Content ID</p>
              <p className="font-mono text-muted-foreground text-xs">{sponsorship.content_id}</p>
            </div>

            <div>
              <p className="font-medium text-sm">Start Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.start_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="font-medium text-sm">End Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="font-medium text-sm">Status</p>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <UnifiedBadge variant="base" style={sponsorship.active ? 'default' : 'outline'}>
                  {sponsorship.active ? 'Active' : 'Inactive'}
                </UnifiedBadge>
              </div>
            </div>

            <div>
              <p className="font-medium text-sm">Tier</p>
              <div>
                <UnifiedBadge variant="sponsored" tier={safeTier} showIcon={true} />
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
            {Array.from({ length: 30 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              const dayKey = date.toISOString().substring(0, 10); // Extract YYYY-MM-DD
              const impressions = impressionsMap.get(dayKey) || 0;
              const clicks = clicksMap.get(dayKey) || 0;
              const maxImpressions = Math.max(...Array.from(impressionsMap.values()), 1);

              return (
                <div key={dayKey} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-muted-foreground text-xs">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="col-span-10 grid grid-cols-2 gap-1">
                    {/* Impressions bar */}
                    <div className="relative h-8 overflow-hidden rounded bg-muted">
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} h-full bg-primary/30 transition-all`}
                        style={{ width: `${(impressions / maxImpressions) * 100}%` }}
                      />
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_INSET} flex items-center px-2 text-xs`}
                      >
                        {impressions > 0 && `${impressions} views`}
                      </div>
                    </div>
                    {/* Clicks bar */}
                    <div className="relative h-8 overflow-hidden rounded bg-muted">
                      <div
                        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} h-full bg-accent/50 transition-all`}
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
