import type {
  GetUserCompleteDataReturns,
  GetUserActivityTimelineReturns,
} from '@heyclaude/data-layer';
type UserActivityTimelineItem = GetUserActivityTimelineReturns['activities'][number];
import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';
import { ActivityTimeline } from '@/src/components/features/user-activity/activity-timeline';

import Loading from './loading';

/**
 * Produce the Metadata for the account Activity route.
 *
 * Waits for a Next.js server connection to satisfy cache-component nondeterminism requirements,
 * then delegates to `generatePageMetadata('/account/activity')` to build the route metadata.
 *
 * @returns The `Metadata` for the "/account/activity" route
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  // Account route - metadata rarely changes, use long cache
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire
  cacheTag('seo-metadata-account');
  cacheTag('seo-metadata-account-activity');

  return generatePageMetadata('/account/activity');
}

/**
 * Renders the Account Activity page for the authenticated user.
 *
 * Awaits a server connection to defer non-deterministic operations, creates a request-scoped logger,
 * and renders ActivityPageContent inside a Suspense boundary. Displays the user's activity summary
 * and timeline when available; if one data source fails the page shows available data with a localized
 * fallback for the failed section, and if both fail a global "Activity unavailable" fallback is shown.
 *
 * @returns The React element tree for the Account Activity page.
 *
 * @see getAuthenticatedUser
 * @see getUserCompleteData
 * @see ActivityTimeline
 */
export default async function ActivityPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  const operation = 'ActivityPage';
  const route = '/account/activity';
  const modulePath = 'apps/web/src/app/account/activity/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: modulePath,
    operation,
    route,
  });

  return (
    <Suspense fallback={<Loading />}>
      <ActivityPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the authenticated user's Account Activity page content, including a stats overview and activity timeline, and provides appropriate fallbacks for unauthenticated access or unavailable activity data.
 *
 * This server component fetches the user's activity summary and timeline concurrently and tolerates partial failures: it will render available data when one source succeeds, show a global fallback when both fail, or prompt for sign-in when no user is authenticated.
 *
 * @param reqLogger - A request-scoped logger (created via `logger.child`) used for structured, request-scoped logging and error reporting.
 * @param reqLogger.reqLogger
 * @returns The JSX content for the Account Activity page.
 *
 * @see getAuthenticatedUser
 * @see getUserCompleteData
 * @see ActivityTimeline
 */
async function ActivityPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'ActivityPage' });

  if (!user) {
    reqLogger.warn(
      {
        section: 'data-fetch',
      },
      'ActivityPage: unauthenticated access attempt detected'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>
              Please sign in to view your contribution history and activity metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton
              redirectTo="/account/activity"
              valueProposition="Sign in to view your contribution history and activity metrics"
            >
              Go to login
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  // Using userId directly - redaction will automatically hash it
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction automatically hashes this via hashUserIdCensor
  });

  userLogger.info({ section: 'data-fetch' }, 'ActivityPage: authentication successful');

  // Section: Activity Data Fetch
  // Fetch activity data - use Promise.allSettled for partial success handling
  // CRITICAL: Call data functions directly instead of actions to avoid cookies() access issues in Cache Components
  // OPTIMIZATION: Use getUserCompleteData directly - single database call instead of two
  const [completeDataResult] = await Promise.allSettled([
    getUserCompleteData(user.id, { activityLimit: 50, activityOffset: 0 }),
  ]);

  // Extract activity data from complete data
  // GetUserCompleteDataReturns is UserCompleteDataResult which has activity_summary and activity_timeline as direct properties
  let summary: GetUserCompleteDataReturns['activity_summary'] | null = null;
  let timeline: GetUserCompleteDataReturns['activity_timeline'] | null = null;

  if (completeDataResult.status === 'fulfilled' && completeDataResult.value) {
    summary = completeDataResult.value.activity_summary ?? null;
    timeline = completeDataResult.value.activity_timeline ?? null;
  } else if (completeDataResult.status === 'rejected') {
    const normalized = normalizeError(completeDataResult.reason, 'Failed to load activity data');
    userLogger.error(
      { err: normalized, section: 'data-fetch' },
      'ActivityPage: getUserCompleteData fetch failed'
    );
  }

  const hasSummary = !!summary;
  const hasTimeline = !!timeline;

  // Only show global fallback when both fail
  if (!hasSummary && !hasTimeline) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Activity unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your activity data. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activities = timeline?.activities ?? [];
  if (hasTimeline && activities.length === 0) {
    userLogger.warn(
      { section: 'data-fetch' },
      'ActivityPage: activity timeline returned no activities'
    );
  }

  // Final summary log
  userLogger.info(
    {
      activitiesCount: activities.length,
      hasSummary,
      hasTimeline,
      section: 'data-fetch',
    },
    'ActivityPage: page render completed'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview - only render if summary is available */}
      {summary == null ? null : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-2xl font-bold">
                  {summary.merged_submissions}/{summary.total_submissions}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Merged</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline - only render if timeline is available */}
      {hasTimeline ? (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Your recent contributions and interactions
              {summary == null ? '' : ` (${summary.total_activity} total)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              activities={activities.filter(
                (
                  a: UserActivityTimelineItem
                ): a is UserActivityTimelineItem & {
                  body: string;
                  id: string;
                  title: string;
                  type: string;
                  user_id: string;
                } => Boolean(a.id && a.type && a.title && a.body && a.user_id)
              )}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Unable to load activity timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              There was an error loading your activity timeline. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
