import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserActivitySummary,
  getUserActivityTimeline,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ActivityTimeline } from '@/src/components/features/user-activity/activity-timeline';

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
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
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
 * @see getUserActivitySummary
 * @see getUserActivityTimeline
 * @see ActivityTimeline
 */
export default async function ActivityPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'ActivityPage';
  const route = '/account/activity';
  const modulePath = 'apps/web/src/app/account/activity/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading activity...</div>}>
      <ActivityPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the authenticated user's Account Activity page content, including a stats overview and activity timeline, and provides appropriate fallbacks for unauthenticated access or unavailable activity data.
 *
 * This server component fetches the user's activity summary and timeline concurrently and tolerates partial failures: it will render available data when one source succeeds, show a global fallback when both fail, or prompt for sign-in when no user is authenticated.
 *
 * @param reqLogger - A request-scoped logger (created via `logger.child`) used for structured, request-scoped logging and error reporting. The logger should already include request identifiers.
 * @returns The JSX content for the Account Activity page.
 *
 * @see getAuthenticatedUser
 * @see getUserActivitySummary
 * @see getUserActivityTimeline
 * @see ActivityTimeline
 */
async function ActivityPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'ActivityPage' });

  if (!user) {
    reqLogger.warn('ActivityPage: unauthenticated access attempt detected', {
      section: 'authentication',
    });
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
  // Using userId directly - redaction will automatically hash it
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction automatically hashes this via hashUserIdCensor
  });

  userLogger.info('ActivityPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Activity Data Fetch
  // Fetch activity data - use Promise.allSettled for partial success handling
  // CRITICAL: Call data functions directly instead of actions to avoid cookies() access issues in Cache Components
  const [summaryResult, timelineResult] = await Promise.allSettled([
    getUserActivitySummary(user.id),
    getUserActivityTimeline({ userId: user.id, limit: 50, offset: 0 }),
  ]);

  /**
   * Normalize a settled activity-data result, log any rejection, and return the fulfilled value or `null`.
   *
   * @param name - Human-readable name of the data being loaded (used in error messages and logs)
   * @param result - The settled promise result to inspect
   * @returns The fulfilled value of type `T` if present, `null` if the promise was rejected
   *
   * @see normalizeError
   * @see ActivityPage
   */
  function handleDataResult<T>(name: string, result: PromiseSettledResult<null | T>): null | T {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // result.status === 'rejected' at this point
    const reason = result.reason as unknown;
    const normalized = normalizeError(reason, `Failed to load ${name}`);
    if (user) {
      userLogger.error(`ActivityPage: ${name} failed`, normalized, {
        section: 'activity-data-fetch',
      });
    }
    return null;
  }

  const summary = handleDataResult('activity summary', summaryResult);
  const timeline = handleDataResult('activity timeline', timelineResult);

  const hasSummary = !!summary;
  const hasTimeline = !!timeline;

  // Only show global fallback when both fail
  if (!(hasSummary || hasTimeline)) {
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
    userLogger.warn('ActivityPage: activity timeline returned no activities', {
      section: 'activity-data-fetch',
    });
  }

  // Final summary log
  userLogger.info('ActivityPage: page render completed', {
    section: 'page-render',
    activitiesCount: activities.length,
    hasSummary,
    hasTimeline,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview - only render if summary is available */}
      {summary == null ? null : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <GitPullRequest className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_INFO}`} />
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
            <ActivityTimeline activities={activities} />
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
