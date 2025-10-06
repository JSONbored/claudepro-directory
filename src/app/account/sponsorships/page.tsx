import type { Metadata } from 'next';
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
import { BarChart, Eye, MousePointer, TrendingUp } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Sponsorships - ClaudePro Directory',
  description: 'Manage your sponsored content and view analytics',
};

export default async function SponsorshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's sponsored content
  const { data: sponsorships } = await supabase
    .from('sponsored_content')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
          <Link href="/partner">
            <TrendingUp className="h-4 w-4 mr-2" />
            Become a Sponsor
          </Link>
        </Button>
      </div>

      {!sponsorships || sponsorships.length === 0 ? (
        <Card>
          <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sponsorships yet</h3>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
              Promote your content to thousands of Claude developers
            </p>
            <Button asChild>
              <Link href="/partner">Learn About Sponsorships</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sponsorships.map((sponsorship) => {
            const isActive =
              sponsorship.active &&
              new Date(sponsorship.start_date) <= new Date() &&
              new Date(sponsorship.end_date) >= new Date();

            const hasHitLimit =
              sponsorship.impression_limit &&
              sponsorship.impression_count >= sponsorship.impression_limit;

            const ctr =
              sponsorship.impression_count > 0
                ? ((sponsorship.click_count / sponsorship.impression_count) * 100).toFixed(2)
                : '0.00';

            return (
              <Card key={sponsorship.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
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
                      <div className="text-2xl font-bold">
                        {sponsorship.impression_count.toLocaleString()}
                      </div>
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
                      <div className="text-2xl font-bold">
                        {sponsorship.click_count.toLocaleString()}
                      </div>
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
                          width: `${Math.min(100, (sponsorship.impression_count / sponsorship.impression_limit) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
