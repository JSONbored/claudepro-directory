import { getActivitySummary, getActivityTimeline } from '@heyclaude/web-runtime';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
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

export default async function ActivityPage() {
  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/account/activity', 'ActivityPage');

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'ActivityPage' });

  if (!user) {
    logger.warn(
      'ActivityPage: unauthenticated access attempt detected',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'authentication',
        },
        authSectionStart
      )
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
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };
  logger.info(
    'ActivityPage: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Activity Data Fetch
  const activitySectionStart = Date.now();
  // Fetch activity data - use Promise.allSettled for partial success handling
  const [summaryResult, timelineResult] = await Promise.allSettled([
    getActivitySummary(),
    getActivityTimeline({ limit: 50, offset: 0 }),
  ]);

  function handleActionResult<T>(
    name: string,
    result: PromiseSettledResult<{ data?: T | null; serverError?: unknown } | null>
  ): T | null {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value && typeof value === 'object' && 'data' in value) {
        return (value.data as T | null | undefined) ?? null;
      }
      return null;
    }
    // result.status === 'rejected' at this point
    const reason = result.reason as unknown;
    const normalized = normalizeError(reason, `Failed to load ${name}`);
    if (user) {
      logger.error(
        `ActivityPage: ${name} failed`,
        normalized,
        withDuration(
          {
            ...logContext,
            section: 'activity-data-fetch',
            sectionDuration_ms: Date.now() - activitySectionStart,
          },
          startTime
        )
      );
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
            <Button asChild={true}>
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activities = timeline?.activities ?? [];
  if (hasTimeline && activities.length === 0) {
    logger.warn(
      'ActivityPage: activity timeline returned no activities',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'activity-data-fetch',
        },
        activitySectionStart
      )
    );
  }

  // Final summary log
  logger.info(
    'ActivityPage: page render completed',
    withDuration(
      {
        ...logContext,
        section: 'page-render',
        activitiesCount: activities.length,
        hasSummary,
        hasTimeline,
      },
      startTime
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 font-bold text-3xl">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview - only render if summary is available */}
      {hasSummary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <GitPullRequest className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_INFO}`} />
                <span className="font-bold text-2xl">
                  {summary.merged_submissions}/{summary.total_submissions}
                </span>
              </div>
              <p className={'mt-1 text-muted-foreground text-xs'}>Merged</p>
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
