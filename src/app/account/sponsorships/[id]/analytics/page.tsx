import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { BarChart, Eye, MousePointer, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/sponsorships/:id/analytics');

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorshipAnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Consolidated RPC: 3 queries + TypeScript loops → 1 (75% reduction)
  const { data: analyticsData } = await supabase.rpc('get_sponsorship_analytics', {
    p_user_id: user.id,
    p_sponsorship_id: id,
  });

  if (!analyticsData) {
    notFound();
  }

  // Type assertion to database-generated Json type
  type AnalyticsResponse = {
    sponsorship: Tables<'sponsored_content'>;
    daily_stats: Array<{
      date: string;
      impressions: number;
      clicks: number;
    }>;
    computed_metrics: {
      ctr: number;
      days_active: number;
      avg_impressions_per_day: number;
    };
  };

  const { sponsorship, daily_stats, computed_metrics } =
    analyticsData as unknown as AnalyticsResponse;

  const impressionCount = sponsorship.impression_count ?? 0;
  const clickCount = sponsorship.click_count ?? 0;
  const ctr = computed_metrics.ctr.toFixed(2);
  const daysActive = computed_metrics.days_active;
  const avgImpressionsPerDay = computed_metrics.avg_impressions_per_day.toFixed(0);

  // Convert daily_stats array to Maps for chart rendering
  const impressionsMap = new Map<string, number>();
  const clicksMap = new Map<string, number>();

  for (const stat of daily_stats) {
    const day = stat.date.substring(0, 10);
    impressionsMap.set(day, stat.impressions);
    clicksMap.set(day, stat.clicks);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <UnifiedBadge
            variant="sponsored"
            tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'}
            showIcon
          />
          <h1 className="font-bold text-3xl">Sponsorship Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Detailed performance metrics for your sponsored content
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{impressionCount.toLocaleString()}</span>
            </div>
            {sponsorship.impression_limit && (
              <p className={'mt-2 text-muted-foreground text-xs'}>
                of {sponsorship.impression_limit.toLocaleString()} limit
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <MousePointer className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{clickCount.toLocaleString()}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>User engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Click-Through Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <BarChart className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{ctr}%</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Clicks / Impressions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg. Daily Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{avgImpressionsPerDay}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Over {daysActive} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Current sponsorship configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={'font-medium text-sm'}>Content Type</p>
              <p className="text-muted-foreground">{sponsorship.content_type}</p>
            </div>

            <div>
              <p className={'font-medium text-sm'}>Content ID</p>
              <p className={'font-mono text-muted-foreground text-xs'}>{sponsorship.content_id}</p>
            </div>

            <div>
              <p className={'font-medium text-sm'}>Start Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.start_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className={'font-medium text-sm'}>End Date</p>
              <p className="text-muted-foreground">
                {new Date(sponsorship.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className={'font-medium text-sm'}>Status</p>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <UnifiedBadge variant="base" style={sponsorship.active ? 'default' : 'outline'}>
                  {sponsorship.active ? 'Active' : 'Inactive'}
                </UnifiedBadge>
              </div>
            </div>

            <div>
              <p className={'font-medium text-sm'}>Tier</p>
              <div>
                <UnifiedBadge
                  variant="sponsored"
                  tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'}
                  showIcon
                />
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
                        className="${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} h-full bg-primary/30 transition-all"
                        style={{ width: `${(impressions / maxImpressions) * 100}%` }}
                      />
                      <div className="${POSITION_PATTERNS.ABSOLUTE_INSET} flex items-center px-2 text-xs">
                        {impressions > 0 && `${impressions} views`}
                      </div>
                    </div>
                    {/* Clicks bar */}
                    <div className="relative h-8 overflow-hidden rounded bg-muted">
                      <div
                        className="${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} h-full bg-accent/50 transition-all"
                        style={{ width: `${impressions > 0 ? (clicks / impressions) * 100 : 0}%` }}
                      />
                      <div className="${POSITION_PATTERNS.ABSOLUTE_INSET} flex items-center px-2 text-xs">
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
          <ul className={'space-y-2 text-sm'}>
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
