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
  // Using userId directly - redaction will automatically hash it
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction automatically hashes this via hashUserIdCensor
  });

  userLogger.info('ActivityPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Activity Data Fetch
  // Fetch activity data - use Promise.allSettled for partial success handling
  // CRITICAL: Call data functions directly instead of actions to avoid cookies() in unstable_cache() error
  const [summaryResult, timelineResult] = await Promise.allSettled([
    getUserActivitySummary(user.id),
    getUserActivityTimeline({ userId: user.id, limit: 50, offset: 0 }),
  ]);

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
