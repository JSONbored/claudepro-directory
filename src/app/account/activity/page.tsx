import { ActivityTimeline } from '@/src/components/features/profile/activity-timeline';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getActivitySummary, getActivityTimeline } from '@/src/lib/actions/user.actions';
import { FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchFetch } from '@/src/lib/utils/batch.utils';

export const metadata = await generatePageMetadata('/account/activity');

export default async function ActivityPage() {
  // Fetch activity data
  const [summaryResult, timelineResult] = await batchFetch([
    getActivitySummary(),
    getActivityTimeline({ limit: 50, offset: 0 }),
  ]);

  const summary = summaryResult?.data;
  const timeline = timelineResult?.data;

  if (!(summary && timeline)) {
    return (
      <div className={UI_CLASSES.SPACE_Y_6}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Activity</h1>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            Sign in to view your contribution history
          </p>
        </div>
      </div>
    );
  }

  const { activities } = timeline;

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Activity</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Your contribution history and community activity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{summary.total_posts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <MessageSquare className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{summary.total_comments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <ThumbsUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{summary.total_votes}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={UI_CLASSES.TEXT_SM}>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <GitPullRequest className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {summary.merged_submissions}/{summary.total_submissions}
              </span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
              Merged
            </p>
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
          <ActivityTimeline initialActivities={activities} summary={summary} />
        </CardContent>
      </Card>
    </div>
  );
}
