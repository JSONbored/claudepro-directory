import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserSponsorships,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, cluster, muted, spaceY, marginBottom, marginTop, iconLeading, iconSize, weight ,size , gap } from '@heyclaude/web-runtime/design-system';
import { BarChart, Eye, MousePointer, TrendingUp } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';


/**
 * Dynamic Rendering Required
 * Authenticated user sponsorships
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/sponsorships');
}

/**
 * Determine whether a sponsorship is currently active.
 *
 * @param sponsorship - Sponsorship record containing `active` and ISO date strings `start_date` and `end_date`
 * @param now - Reference time to evaluate activity against
 * @returns `true` if the sponsorship's `active` flag is `true` and `now` is between `start_date` and `end_date` (inclusive), `false` otherwise
 *
 * @see SponsorshipsPage
 */
function isSponsorshipActive(
  sponsorship: { active: boolean | null; end_date: string; start_date: string; },
  now: Date
): boolean {
  return (
    sponsorship.active === true &&
    new Date(sponsorship.start_date) <= now &&
    new Date(sponsorship.end_date) >= now
  );
}

/**
 * Render the account sponsorships overview page for the authenticated user.
 *
 * Displays one of: a sign-in prompt when unauthenticated, an error message on fetch failure, an empty-state when no sponsorships exist, or a grid of sponsorship cards showing status badges, impressions, clicks, CTR, progress toward limits, and links to analytics.
 *
 * Performs server-side fetching of the current user's sponsorships and emits structured request- and user-scoped logs for auditing and diagnostics.
 *
 * @returns The React element for the sponsorships page or the appropriate alternative state (sign-in, error, or empty state).
 *
 * @see getAuthenticatedUser
 * @see getUserSponsorships
 * @see isSponsorshipActive
 */
export default async function SponsorshipsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SponsorshipsPage',
    route: '/account/sponsorships',
    module: 'apps/web/src/app/account/sponsorships',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SponsorshipsPage' });

  if (!user) {
    reqLogger.warn('SponsorshipsPage: unauthenticated access attempt', {
      section: 'authentication',
      timestamp: new Date().toISOString(),
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your sponsorship campaigns.</CardDescription>
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

  // Section: Sponsorships Data Fetch
  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>>;
  try {
    sponsorships = await getUserSponsorships(user.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships');
    userLogger.error('SponsorshipsPage: getUserSponsorships threw', normalized, {
      section: 'sponsorships-data-fetch',
    });
    return (
      <div className={spaceY.relaxed}>
        <div className="text-destructive">Failed to load sponsorships. Please try again later.</div>
      </div>
    );
  }

  if (sponsorships.length === 0) {
    userLogger.info('SponsorshipsPage: user has no sponsorships');
    return (
      <div className={spaceY.relaxed}>
        <div className={between.center}>
          <div>
            <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Sponsorships</h1>
            <p className={muted.default}>No active campaigns yet</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={ROUTES.PARTNER}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Become a Sponsor
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className={`py-12 text-center ${muted.default}`}>
            You haven't launched any sponsorship campaigns yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderedSponsorships = [...sponsorships].toSorted(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Compute active count once using consistent logic
  const now = new Date();
  const activeCount = orderedSponsorships.filter((s) => isSponsorshipActive(s, now)).length;

  return (
    <div className={spaceY.relaxed}>
      <div className={between.center}>
        <div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Sponsorships</h1>
          <p className={muted.default}>
            {activeCount} active {activeCount === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={ROUTES.PARTNER}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Become a Sponsor
          </Link>
        </Button>
      </div>

      <div className={`grid ${gap.comfortable}`}>
        {orderedSponsorships.map((sponsorship) => {
          const isActive = isSponsorshipActive(sponsorship, now);

          const impressionCount = sponsorship.impression_count ?? 0;
          const clickCount = sponsorship.click_count ?? 0;

          const hasHitLimit =
            sponsorship.impression_limit != undefined && impressionCount >= sponsorship.impression_limit;

          const ctr =
            impressionCount > 0 ? ((clickCount / impressionCount) * 100).toFixed(2) : '0.00';

          // Use generated ENUM type directly - no validation needed
          const safeTier = sponsorship.tier;

          return (
            <Card key={sponsorship.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={cluster.compact}>
                      <UnifiedBadge variant="sponsored" tier={safeTier} showIcon />
                      {isActive ? (
                        <UnifiedBadge variant="base" className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                          Active
                        </UnifiedBadge>
                      ) : (
                        <UnifiedBadge variant="base" style="outline">
                          Inactive
                        </UnifiedBadge>
                      )}
                      {hasHitLimit ? <UnifiedBadge variant="base" className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
                          Limit Reached
                        </UnifiedBadge> : null}
                    </div>
                    <CardTitle className={marginTop.compact}>
                      {sponsorship.content_type} - ID: {sponsorship.content_id}
                    </CardTitle>
                    <CardDescription>
                      {new Date(sponsorship.start_date).toLocaleDateString()} -{' '}
                      {new Date(sponsorship.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/sponsorships/${sponsorship.id}/analytics`}>
                      <BarChart className={iconLeading.xs} />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick stats */}
                <div className={`${marginBottom.default} grid grid-cols-3 ${gap.comfortable}`}>
                  <div>
                    <div
                      className={`${cluster.tight} mb-1 ${muted.xs}`}
                    >
                      <Eye className={iconSize.xs} />
                      Impressions
                    </div>
                    <div className={`${weight.bold} ${size['2xl']}`}>{impressionCount.toLocaleString()}</div>
                    {sponsorship.impression_limit ? <div className={`${muted.default} ${size.xs}`}>
                        of {sponsorship.impression_limit.toLocaleString()}
                      </div> : null}
                  </div>

                  <div>
                    <div
                      className={`${cluster.tight} mb-1 ${muted.xs}`}
                    >
                      <MousePointer className={iconSize.xs} />
                      Clicks
                    </div>
                    <div className={`${weight.bold} ${size['2xl']}`}>{clickCount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div
                      className={`${cluster.tight} mb-1 ${muted.xs}`}
                    >
                      <BarChart className={iconSize.xs} />
                      CTR
                    </div>
                    <div className={`${weight.bold} ${size['2xl']}`}>{ctr}%</div>
                  </div>
                </div>

                {/* Progress bar if has limit */}
                {sponsorship.impression_limit ? <div
                    className="h-2 w-full rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={impressionCount}
                    aria-valuemin={0}
                    aria-valuemax={sponsorship.impression_limit}
                    aria-label={`Impressions: ${impressionCount} of ${sponsorship.impression_limit}`}
                  >
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (impressionCount / sponsorship.impression_limit) * 100)}%`,
                      }}
                      aria-hidden="true"
                    />
                  </div> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}