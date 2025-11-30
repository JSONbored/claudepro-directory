import { getActivitySummary, getActivityTimeline } from '@heyclaude/web-runtime';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';

import { ActivityTimeline } from '@/src/components/features/user-activity/activity-timeline';

/**
 * Dynamic Rendering Required
 * Authenticated user activity
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/activity');
}

/**
 * Renders the Account Activity page: authenticates the user, fetches activity summary and timeline,
 * and returns a UI that adapts to authentication state and partial data availability.
 *
 * Fetch behavior:
 * - Authenticates the request-scoped user.
 * - Loads activity summary and timeline in parallel and tolerates partial failures (renders available sections).
 * - Logs authentication, data-fetch outcomes, and render completion with request-scoped and user-scoped context.
 *
 * @returns The rendered Activity page as a React element.
 *
 * @see getAuthenticatedUser
 * @see getActivitySummary
 * @see getActivityTimeline
 * @see ActivityTimeline
 * @see generatePageMetadata
 */
export default async function ActivityPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'ActivityPage';
  const route = '/account/activity';
  const module = 'apps/web/src/app/account/activity/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

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
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('ActivityPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Activity Data Fetch
  // Fetch activity data - use Promise.allSettled for partial success handling
  const [summaryResult, timelineResult] = await Promise.allSettled([
    getActivitySummary(),
    getActivityTimeline({ limit: 50, offset: 0 }),
  ]);

  function handleActionResult<T>(
    name: string,
    result: PromiseSettledResult<null | { data?: null | T; serverError?: unknown }>
  ): null | T {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value && typeof value === 'object' && 'data' in value) {
        return (value.data as null | T | undefined) ?? null;
      }
      return null;
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

  const summary = handleActionResult('activity summary', summaryResult);
  const timeline = handleActionResult('activity timeline', timelineResult);

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
        <h1 className="mb-2 font-bold text-3xl">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview - only render if summary is available */}
      {hasSummary ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cluster.compact}>
                <GitPullRequest className={`${iconSize.md} text-blue-600`} />
                <span className="font-bold text-2xl">
                  {summary.merged_submissions}/{summary.total_submissions}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">Merged</p>
            </CardContent>
          </Card>
        </div> : null}

      {/* Timeline - only render if timeline is available */}
      {hasTimeline ? (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Your recent contributions and interactions
              {hasSummary ? ` (${summary.total_activity} total)` : ''}
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