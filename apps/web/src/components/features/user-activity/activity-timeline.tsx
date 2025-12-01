/**
 * Activity Timeline Component - Database-First (Server Component)
 * Uses Activity type from user.actions (based on get_user_activity_timeline RPC)
 */

import type { Database } from '@heyclaude/database-types';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';

type Activity = Database['public']['CompositeTypes']['user_activity_timeline_item'];

import { logger } from '@heyclaude/web-runtime/core';
import { spaceY, muted, marginTop, weight, iconSize  , padding , row } from '@heyclaude/web-runtime/design-system';
import { GitPullRequest } from '@heyclaude/web-runtime/icons';

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
        <CardContent className={`py-12 text-center ${muted.default}`}>
          No activity yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={spaceY.default}>
      {displayActivities
        .filter(
          (
            activity
          ): activity is Activity & {
            id: string;
            type: string;
            created_at: string;
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
            logger.warn('Unknown activity type', { type: activity.type });
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
            <Card key={activity.id} className="transition-colors hover:bg-accent/5">
              <CardContent className={`${row.default} ${padding.default}`}>
                <Icon className={`${marginTop.tight} ${iconSize.md} shrink-0 ${muted.default}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className={muted.default}>{config.label}</span>{' '}
                    <span className={weight.medium}>{title}</span>
                  </p>
                  <p className={`${marginTop.tight} ${muted.xs}`}>
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
