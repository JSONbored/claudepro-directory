import { getActivitySummary, getActivityTimeline } from '@heyclaude/web-runtime';
import { hashUserId, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityTimeline } from '@/src/components/features/user-activity/activity-timeline';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

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
  const { user } = await getAuthenticatedUser({ context: 'ActivityPage' });

  if (!user) {
    logger.warn('ActivityPage: unauthenticated access attempt detected', undefined, {
      requestId: generateRequestId(),
      operation: 'ActivityPage',
      route: '/account/activity',
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
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      return result.value?.data ?? null;
    }
    // result.status === 'rejected' at this point
    const reason = result.reason;
    const normalized = normalizeError(reason, `Failed to load ${name}`);
    if (user) {
      logger.error(`ActivityPage: ${name} failed`, normalized, {
        requestId: generateRequestId(),
        operation: 'ActivityPage',
        route: '/account/activity',
        userId: hashUserId(user.id),
      });
    }
    return null;
  }

  const summary = handleActionResult('activity summary', summaryResult);
  const timeline = handleActionResult('activity timeline', timelineResult);

  if (!(summary && timeline)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Activity unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your activity summary. Please refresh or try again later.
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

  const activities = timeline.activities || [];
  if (activities.length === 0) {
    logger.warn('ActivityPage: activity timeline returned no activities', undefined, {
      requestId: generateRequestId(),
      operation: 'ActivityPage',
      route: '/account/activity',
      userId: hashUserId(user.id),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 font-bold text-3xl">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview */}
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

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Your recent contributions and interactions ({summary.total_activity} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
