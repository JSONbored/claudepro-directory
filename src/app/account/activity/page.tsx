import { ActivityTimeline } from '@/src/components/features/user-activity/activity-timeline';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getActivitySummary, getActivityTimeline } from '@/src/lib/actions/user.actions';
import { FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/activity');

export default async function ActivityPage() {
  // Fetch activity data - use Promise.allSettled for partial success handling
  const [summaryResult, timelineResult] = await Promise.allSettled([
    getActivitySummary(),
    getActivityTimeline({ limit: 50, offset: 0 }),
  ]);

  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value?.data : undefined;
  const timeline = timelineResult.status === 'fulfilled' ? timelineResult.value?.data : undefined;

  if (!(summary && timeline)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 font-bold text-3xl">Activity</h1>
          <p className="text-muted-foreground">
            {summaryResult.status === 'rejected' || timelineResult.status === 'rejected'
              ? 'Failed to load activity data. Please try again later.'
              : 'Sign in to view your contribution history'}
          </p>
        </div>
      </div>
    );
  }

  const { activities } = timeline;

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
