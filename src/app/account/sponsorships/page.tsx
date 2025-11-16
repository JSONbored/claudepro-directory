import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserSponsorships } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { BarChart, Eye, MousePointer, TrendingUp } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/sponsorships');

export default async function SponsorshipsPage() {
  const { user } = await getAuthenticatedUser({ context: 'SponsorshipsPage' });

  if (!user) {
    logger.warn('SponsorshipsPage: unauthenticated access attempt');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your sponsorship campaigns.</CardDescription>
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

  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>> | null = null;
  let fetchError = false;
  try {
    sponsorships = await getUserSponsorships(user.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships');
    logger.error('SponsorshipsPage: getUserSponsorships threw', normalized, { userId: user.id });
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load sponsorships. Please try again later.</div>
      </div>
    );
  }

  if (!sponsorships || sponsorships.length === 0) {
    logger.info('SponsorshipsPage: user has no sponsorships', { userId: user.id });
    return (
      <div className="space-y-6">
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div>
            <h1 className="mb-2 font-bold text-3xl">Sponsorships</h1>
            <p className="text-muted-foreground">No active campaigns yet</p>
          </div>
          <Button variant="outline" asChild={true}>
            <Link href={ROUTES.PARTNER}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Become a Sponsor
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You haven't launched any sponsorship campaigns yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderedSponsorships = [...sponsorships].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">Sponsorships</h1>
          <p className="text-muted-foreground">
            {sponsorships?.length || 0} active{' '}
            {sponsorships?.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button variant="outline" asChild={true}>
          <Link href={ROUTES.PARTNER}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Become a Sponsor
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {orderedSponsorships.map((sponsorship) => {
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
                      <UnifiedBadge
                        variant="sponsored"
                        tier={sponsorship.tier as 'featured' | 'promoted' | 'spotlight'}
                        showIcon={true}
                      />
                      {isActive ? (
                        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_APPROVED}>
                          Active
                        </UnifiedBadge>
                      ) : (
                        <UnifiedBadge variant="base" style="outline">
                          Inactive
                        </UnifiedBadge>
                      )}
                      {hasHitLimit && (
                        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_WARNING}>
                          Limit Reached
                        </UnifiedBadge>
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
                  <Button variant="outline" size="sm" asChild={true}>
                    <Link href={`/account/sponsorships/${sponsorship.id}/analytics`}>
                      <BarChart className="mr-1 h-3 w-3" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick stats */}
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} mb-1 text-muted-foreground text-xs`}
                    >
                      <Eye className="h-3 w-3" />
                      Impressions
                    </div>
                    <div className="font-bold text-2xl">{impressionCount.toLocaleString()}</div>
                    {sponsorship.impression_limit && (
                      <div className={UI_CLASSES.TEXT_XS_MUTED}>
                        of {sponsorship.impression_limit.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} mb-1 text-muted-foreground text-xs`}
                    >
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                    <div className="font-bold text-2xl">{clickCount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} mb-1 text-muted-foreground text-xs`}
                    >
                      <BarChart className="h-3 w-3" />
                      CTR
                    </div>
                    <div className="font-bold text-2xl">{ctr}%</div>
                  </div>
                </div>

                {/* Progress bar if has limit */}
                {sponsorship.impression_limit && (
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
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
