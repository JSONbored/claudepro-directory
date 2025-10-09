import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SponsoredBadge } from '@/src/components/ui/sponsored-badge';
import { BarChart, Eye, MousePointer, TrendingUp } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Sponsorship Analytics - ClaudePro Directory',
  description: 'Detailed analytics for your sponsored content',
};

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

  // Get sponsorship
  const { data: sponsorship } = await supabase
    .from('sponsored_content')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!sponsorship) {
    notFound();
  }

  // Get daily impression/click data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: impressionsByDay } = await supabase
    .from('sponsored_impressions')
    .select('created_at')
    .eq('sponsored_id', id)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: clicksByDay } = await supabase
    .from('sponsored_clicks')
    .select('created_at')
    .eq('sponsored_id', id)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Group by day
  const impressionsMap = new Map<string, number>();
  const clicksMap = new Map<string, number>();

  impressionsByDay?.forEach((imp) => {
    const isoDate = new Date(imp.created_at).toISOString();
    const day = isoDate.substring(0, 10); // Extract YYYY-MM-DD
    impressionsMap.set(day, (impressionsMap.get(day) || 0) + 1);
  });

  clicksByDay?.forEach((click) => {
    const isoDate = new Date(click.created_at).toISOString();
    const day = isoDate.substring(0, 10); // Extract YYYY-MM-DD
    clicksMap.set(day, (clicksMap.get(day) || 0) + 1);
  });

  const impressionCount = sponsorship.impression_count ?? 0;
  const clickCount = sponsorship.click_count ?? 0;

  const ctr = impressionCount > 0 ? ((clickCount / impressionCount) * 100).toFixed(2) : '0.00';

  const daysActive = Math.floor(
    (Date.now() - new Date(sponsorship.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const avgImpressionsPerDay = daysActive > 0 ? (impressionCount / daysActive).toFixed(0) : '0';

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Header */}
      <div>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <SponsoredBadge tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'} />
          <h1 className="text-3xl font-bold">Sponsorship Analytics</h1>
        </div>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Detailed performance metrics for your sponsored content
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Eye className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{impressionCount.toLocaleString()}</span>
            </div>
            {sponsorship.impression_limit && (
              <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
                of {sponsorship.impression_limit.toLocaleString()} limit
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <MousePointer className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{clickCount.toLocaleString()}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              User engagements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Click-Through Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <BarChart className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{ctr}%</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Clicks / Impressions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Avg. Daily Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{avgImpressionsPerDay}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Over {daysActive} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Current sponsorship configuration</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Content Type</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{sponsorship.content_type}</p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Content ID</p>
              <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} font-mono ${UI_CLASSES.TEXT_XS}`}>
                {sponsorship.content_id}
              </p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Start Date</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                {new Date(sponsorship.start_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>End Date</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                {new Date(sponsorship.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Status</p>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Badge variant={sponsorship.active ? 'default' : 'outline'}>
                  {sponsorship.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Tier</p>
              <div>
                <SponsoredBadge tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'} />
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
          <div className={UI_CLASSES.SPACE_Y_2}>
            {Array.from({ length: 30 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              const dayKey = date.toISOString().substring(0, 10); // Extract YYYY-MM-DD
              const impressions = impressionsMap.get(dayKey) || 0;
              const clicks = clicksMap.get(dayKey) || 0;
              const maxImpressions = Math.max(...Array.from(impressionsMap.values()), 1);

              return (
                <div key={dayKey} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="col-span-10 grid grid-cols-2 gap-1">
                    {/* Impressions bar */}
                    <div className="relative h-8 bg-muted rounded overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary/30 transition-all"
                        style={{ width: `${(impressions / maxImpressions) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs">
                        {impressions > 0 && `${impressions} views`}
                      </div>
                    </div>
                    {/* Clicks bar */}
                    <div className="relative h-8 bg-muted rounded overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-accent/50 transition-all"
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
          <ul className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.SPACE_Y_2}`}>
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
