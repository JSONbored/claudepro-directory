import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserSponsorships,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  between,
  bgColor,
  cluster,
  gap,
  grid,
  iconLeading,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  radius,
  size,
  spaceY,
  textColor,
  transition,
  weight,
  padding,
  display,
  flexGrow,
  marginRight,
  textAlign,
  height,
  width,
} from '@heyclaude/web-runtime/design-system';
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

/**
 * Provide page metadata for the /account/sponsorships route.
 *
 * Used by Next.js to populate the page's head metadata (title, description, open graph, etc.).
 *
 * @returns Metadata for the Sponsorships page.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/sponsorships');
}

/**
 * Determines whether a sponsorship is active at a given time.
 *
 * Considers both the sponsorship's `active` flag and inclusive `start_date`/`end_date` bounds.
 *
 * @param sponsorship - Sponsorship record containing `active` and ISO date strings `start_date` and `end_date`
 * @param now - Reference time used to evaluate the sponsorship's date range
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
 * Render the account sponsorships overview page for the current authenticated user.
 *
 * Performs server-side fetching of the user's sponsorships, emits structured request- and user-scoped logs,
 * and renders one of: a sign-in prompt when unauthenticated, an error message on fetch failure, an empty-state
 * when no sponsorships exist, or a grid of sponsorship cards showing status badges, impressions, clicks,
 * CTR, progress toward limits, and links to analytics.
 *
 * @returns The React element for the sponsorships page or an alternative state UI (sign-in prompt, error message, or empty state).
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
        <div className={textColor.destructive}>Failed to load sponsorships. Please try again later.</div>
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
              <TrendingUp className={`${marginRight.compact} ${iconSize.sm}`} />
              Become a Sponsor
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className={`${padding.ySection} ${textAlign.center} ${muted.default}`}>
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
            <TrendingUp className={`${marginRight.compact} ${iconSize.sm}`} />
            Become a Sponsor
          </Link>
        </Button>
      </div>

      <div className={`${grid.base} ${gap.comfortable}`}>
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
                <div className={`${display.flex} ${alignItems.start} ${justify.between}`}>
                  <div className={flexGrow['1']}>
                    <div className={cluster.compact}>
                      <UnifiedBadge variant="sponsored" tier={safeTier} showIcon />
                      {isActive ? (
                        <UnifiedBadge variant="base" className={`${bgColor['green/10']} ${textColor.green} dark:${bgColor['green/20']} dark:${textColor.success400}`}>
                          Active
                        </UnifiedBadge>
                      ) : (
                        <UnifiedBadge variant="base" style="outline">
                          Inactive
                        </UnifiedBadge>
                      )}
                      {hasHitLimit ? <UnifiedBadge variant="base" className={`${bgColor.warning} ${textColor.warning400} dark:${bgColor['warning/20']} dark:${textColor.warning400}`}>
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
                <div className={`${marginBottom.default} ${grid.cols3}`}>
                  <div>
                    <div
                      className={`${cluster.tight} ${marginBottom.micro} ${muted.xs}`}
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
                      className={`${cluster.tight} ${marginBottom.micro} ${muted.xs}`}
                    >
                      <MousePointer className={iconSize.xs} />
                      Clicks
                    </div>
                    <div className={`${weight.bold} ${size['2xl']}`}>{clickCount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div
                      className={`${cluster.tight} ${marginBottom.micro} ${muted.xs}`}
                    >
                      <BarChart className={iconSize.xs} />
                      CTR
                    </div>
                    <div className={`${weight.bold} ${size['2xl']}`}>{ctr}%</div>
                  </div>
                </div>

                {/* Progress bar if has limit */}
                {sponsorship.impression_limit ? <div
                    className={`${height.slider} ${width.full} ${radius.full} ${bgColor.muted}`}
                    role="progressbar"
                    aria-valuenow={impressionCount}
                    aria-valuemin={0}
                    aria-valuemax={sponsorship.impression_limit}
                    aria-label={`Impressions: ${impressionCount} of ${sponsorship.impression_limit}`}
                  >
                    <div
                      className={`${height.slider} ${radius.full} ${bgColor.primary} ${transition.all}`}
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