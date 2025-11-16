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
import { getActivitySummary, getActivityTimeline } from '@/src/lib/actions/user.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { ROUTES } from '@/src/lib/data/config/constants';
import { FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/activity');

export default async function ActivityPage() {
  const { user } = await getAuthenticatedUser({ context: 'ActivityPage' });

  if (!user) {
    logger.warn('ActivityPage: unauthenticated access attempt detected');
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
      logger.error(`ActivityPage: ${name} failed`, normalized, { userId: user.id });
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
    logger.warn('ActivityPage: activity timeline returned no activities', { userId: user.id });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 font-bold text-3xl">Activity</h1>
        <p className="text-muted-foreground">Your contribution history and community activity</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <FileText className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_INFO}`} />
              <span className="font-bold text-2xl">{summary.total_posts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <MessageSquare className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_SUCCESS}`} />
              <span className="font-bold text-2xl">{summary.total_comments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <ThumbsUp className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_WARNING}`} />
              <span className="font-bold text-2xl">{summary.total_votes}</span>
            </div>
          </CardContent>
        </Card>

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
