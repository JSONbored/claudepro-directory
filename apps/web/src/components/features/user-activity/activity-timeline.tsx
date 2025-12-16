/**
 * Activity Timeline Component - Database-First (Server Component)
 * Uses Activity type from user.actions (based on get_user_activity_timeline RPC)
 */

import type { UserActivityTimelineItem } from '@heyclaude/database-types/postgres-types';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';
import { paddingY, spaceY, padding, gap, marginTop } from "@heyclaude/web-runtime/design-system";

type Activity = UserActivityTimelineItem;

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
}

const ACTIVITY_CONFIG = {
  submission: { icon: GitPullRequest, label: 'Submitted' },
} as const;

export function ActivityTimeline({ activities, limit }: ActivityTimelineProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <Card>
        <CardContent className={`text-muted-foreground ${paddingY.section} text-center`}>
          No activity yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${spaceY.default}`}>
      {displayActivities
        .filter(
          (
            activity
          ): activity is Activity & {
            created_at: string;
            id: string;
            type: string;
          } =>
            activity !== null &&
            activity.id !== null &&
            activity.type !== null &&
            activity.created_at !== null
        )
        .map((activity) => {
          // Type guard for activity.type to ensure it's a valid key
          const activityType = activity.type as keyof typeof ACTIVITY_CONFIG;
          const config = ACTIVITY_CONFIG[activityType];

          // Guard against unknown activity types
          if (!config) {
            logger.warn({ type: activity.type }, 'Unknown activity type');
            return null;
          }

          const Icon = config.icon;

          // Determine title based on activity type (only submissions exist)
          let title = '';
          if (activity.type === 'submission' && activity.title) {
            title = activity.title;
          } else {
            // Fallback for missing fields
            title = 'Unknown activity';
          }

          return (
            <Card key={activity.id} className="hover:bg-accent/5 transition-colors">
              <CardContent className={`flex items-start ${gap.compact} ${padding.default}`}>
                <Icon className={`text-muted-foreground ${marginTop.tight} h-5 w-5 shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">{config.label}</span>{' '}
                    <span className="font-medium">{title}</span>
                  </p>
                  <p className={`text-muted-foreground ${marginTop.tight} text-xs`}>
                    {new Date(activity.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
