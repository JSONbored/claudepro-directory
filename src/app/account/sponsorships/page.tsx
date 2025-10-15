import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SponsoredBadge } from '@/src/components/ui/sponsored-badge';
import { ROUTES } from '@/src/lib/constants';
import { BarChart, Eye, MousePointer, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/account/sponsorships');

export default async function SponsorshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's sponsored content (they can only see their own campaigns)
  const { data: sponsorships } = await supabase
    .from('sponsored_content')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // If user has no sponsorships, don't show this page
  // (Admin manually adds campaigns after payment, then user can access)
  if (!sponsorships || sponsorships.length === 0) {
    return null; // Or redirect to /partner page
  }

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Sponsorships</h1>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            {sponsorships?.length || 0} active{' '}
            {sponsorships?.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={ROUTES.PARTNER}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Become a Sponsor
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {sponsorships.map((sponsorship) => {
          const isActive =
            sponsorship.active &&
            new Date(sponsorship.start_date) <= new Date() &&
            new Date(sponsorship.end_date) >= new Date();

          const impressionCount = sponsorship.impression_count ?? 0;
          const clickCount = sponsorship.click_count ?? 0;

          const hasHitLimit =
            sponsorship.impression_limit && impressionCount >= sponsorship.impression_limit;

          const ctr =
            impressionCount > 0 ? ((clickCount / impressionCount) * 100).toFixed(2) : '0.00';

          return (
            <Card key={sponsorship.id}>
              <CardHeader>
                <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                  <div className="flex-1">
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <SponsoredBadge
                        tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'}
                      />
                      {isActive ? (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {hasHitLimit && (
                        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                          Limit Reached
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2">
                      {sponsorship.content_type} - ID: {sponsorship.content_id}
                    </CardTitle>
                    <CardDescription>
                      {new Date(sponsorship.start_date).toLocaleDateString()} -{' '}
                      {new Date(sponsorship.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/sponsorships/${sponsorship.id}/analytics`}>
                      <BarChart className="h-3 w-3 mr-1" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mb-1`}
                    >
                      <Eye className="h-3 w-3" />
                      Impressions
                    </div>
                    <div className="text-2xl font-bold">{impressionCount.toLocaleString()}</div>
                    {sponsorship.impression_limit && (
                      <div className={UI_CLASSES.TEXT_XS_MUTED}>
                        of {sponsorship.impression_limit.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mb-1`}
                    >
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                    <div className="text-2xl font-bold">{clickCount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mb-1`}
                    >
                      <BarChart className="h-3 w-3" />
                      CTR
                    </div>
                    <div className="text-2xl font-bold">{ctr}%</div>
                  </div>
                </div>

                {/* Progress bar if has limit */}
                {sponsorship.impression_limit && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (impressionCount / sponsorship.impression_limit) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
