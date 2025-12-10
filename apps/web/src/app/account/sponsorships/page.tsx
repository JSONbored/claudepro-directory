import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserSponsorships,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { BarChart, Eye, MousePointer, TrendingUp } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
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
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';

import Loading from './loading';

/**
 * Dynamic Rendering Required
 * Authenticated user sponsorships
 */

/**
 * Provide the page metadata for the /account/sponsorships route.
 *
 * @returns The Metadata object used by Next.js for the /account/sponsorships page
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/sponsorships');
}

/**
 * Determine whether a sponsorship is active at a given time.
 *
 * A sponsorship is considered active when its `active` flag is `true` and the
 * provided time falls between `start_date` and `end_date` (inclusive).
 *
 * @param sponsorship - Object containing sponsorship state and date range:
 *   - `active`: boolean or null indicating whether the sponsorship is enabled
 *   - `start_date`: ISO date string for the start of the sponsorship period
 *   - `end_date`: ISO date string for the end of the sponsorship period
 * @param sponsorship.start_date
 * @param sponsorship.end_date
 * @param sponsorship.active
 * @param now - Reference Date used to evaluate whether the sponsorship is within its active range
 * @returns `true` if the sponsorship's `active` flag is `true` and `now` is between `start_date` and `end_date` (inclusive), `false` otherwise.
 *
 * @see SponsorshipsPage
 */
function isSponsorshipActive(
  sponsorship: { active: boolean | null; end_date: string; start_date: string },
  now: Date
): boolean {
  return (
    sponsorship.active === true &&
    new Date(sponsorship.start_date) <= now &&
    new Date(sponsorship.end_date) >= now
  );
}

/**
 * Render the account Sponsorships page and display the user's sponsorship campaigns with controls and statistics.
 *
 * Authenticates the current request, loads the authenticated user's sponsorships, and renders one of:
 * - a sign-in prompt when the request is unauthenticated,
 * - an error message when sponsorships cannot be loaded,
 * - an empty-state CTA when the user has no sponsorships,
 * - or a grid of sponsorship cards (newest-first) showing status badges, impressions, clicks, CTR, and an impressions progress bar when applicable.
 *
 * This is a server component that performs per-request data fetching and request-scoped logging.
 *
 * @returns The JSX for the Sponsorships page (heading, CTAs, and either a sign-in prompt, error message, empty-state CTA, or a grid of sponsorship cards).
 *
 * @see getAuthenticatedUser
 * @see getUserSponsorships
 * @see isSponsorshipActive
 */
export default async function SponsorshipsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'SponsorshipsPage',
    route: '/account/sponsorships',
    module: 'apps/web/src/app/account/sponsorships',
  });

  return (
    <Suspense fallback={<Loading />}>
      <SponsorshipsPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the account sponsorships UI for the current authenticated user.
 *
 * Fetches the authenticated user and that user's sponsorships, then renders one of:
 * - a sign-in prompt when there is no authenticated user,
 * - an error message when loading sponsorships fails,
 * - an empty-state UI when the user has no sponsorships,
 * - or a list of sponsorship cards (with status, metrics, progress, and analytics links) when sponsorships exist.
 *
 * @param reqLogger - A request-scoped logger (used to create a user-scoped child logger for per-request telemetry).
 * @returns The server-rendered React element for the sponsorships page content.
 *
 * @see getAuthenticatedUser
 * @see getUserSponsorships
 * @see isSponsorshipActive
 */
async function SponsorshipsPageContent({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SponsorshipsPage' });

  if (!user) {
    reqLogger.warn(
      {
        section: 'data-fetch',
      },
      'SponsorshipsPage: unauthenticated access attempt'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your sponsorship campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton valueProposition="Sign in to manage your sponsorship campaigns" redirectTo="/account/sponsorships">
              Go to login
            </SignInButton>
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
    userLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'SponsorshipsPage: getUserSponsorships threw'
    );
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load sponsorships. Please try again later.</div>
      </div>
    );
  }

  if (sponsorships.length === 0) {
    userLogger.info({ section: 'data-fetch' }, 'SponsorshipsPage: user has no sponsorships');
    return (
      <div className="space-y-6">
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div>
            <h1 className="mb-2 text-3xl font-bold">Sponsorships</h1>
            <p className="text-muted-foreground">No active campaigns yet</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={ROUTES.PARTNER}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Become a Sponsor
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            You haven&apos;t launched any sponsorship campaigns yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderedSponsorships = [...sponsorships].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Compute active count once using consistent logic
  const now = new Date();
  const activeCount = orderedSponsorships.filter((s) => isSponsorshipActive(s, now)).length;

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">Sponsorships</h1>
          <p className="text-muted-foreground">
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

      <div className="grid gap-4">
        {orderedSponsorships.map((sponsorship) => {
          const isActive = isSponsorshipActive(sponsorship, now);

          const impressionCount = sponsorship.impression_count ?? 0;
          const clickCount = sponsorship.click_count ?? 0;

          const hasHitLimit =
            sponsorship.impression_limit != undefined &&
            impressionCount >= sponsorship.impression_limit;

          const ctr =
            impressionCount > 0 ? ((clickCount / impressionCount) * 100).toFixed(2) : '0.00';

          // Use generated ENUM type directly - no validation needed
          const safeTier = sponsorship.tier;

          return (
            <Card key={sponsorship.id}>
              <CardHeader>
                <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                  <div className="flex-1">
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <UnifiedBadge variant="sponsored" tier={safeTier} showIcon />
                      {isActive ? (
                        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_APPROVED}>
                          Active
                        </UnifiedBadge>
                      ) : (
                        <UnifiedBadge variant="base" style="outline">
                          Inactive
                        </UnifiedBadge>
                      )}
                      {hasHitLimit ? (
                        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_WARNING}>
                          Limit Reached
                        </UnifiedBadge>
                      ) : null}
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
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} text-muted-foreground mb-1 text-xs`}
                    >
                      <Eye className="h-3 w-3" />
                      Impressions
                    </div>
                    <div className="text-2xl font-bold">{impressionCount.toLocaleString()}</div>
                    {sponsorship.impression_limit == null ? null : (
                      <div className={UI_CLASSES.TEXT_XS_MUTED}>
                        of {sponsorship.impression_limit.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} text-muted-foreground mb-1 text-xs`}
                    >
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                    <div className="text-2xl font-bold">{clickCount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} text-muted-foreground mb-1 text-xs`}
                    >
                      <BarChart className="h-3 w-3" />
                      CTR
                    </div>
                    <div className="text-2xl font-bold">{ctr}%</div>
                  </div>
                </div>

                {/* Progress bar if has limit */}
                {sponsorship.impression_limit == null ? null : (
                  <div
                    className="bg-muted h-2 w-full rounded-full"
                    role="progressbar"
                    aria-valuenow={Math.min(impressionCount, sponsorship.impression_limit)}
                    aria-valuemin={0}
                    aria-valuemax={sponsorship.impression_limit}
                    aria-label={`Impressions: ${impressionCount} of ${sponsorship.impression_limit}`}
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (impressionCount / sponsorship.impression_limit) * 100)}%`,
                      }}
                      aria-hidden="true"
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
