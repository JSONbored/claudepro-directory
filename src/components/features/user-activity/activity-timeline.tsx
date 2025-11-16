/**
 * Activity Timeline Component - Database-First (Server Component)
 * Uses Activity type from user.actions (based on get_user_activity_timeline RPC)
 */
import { Card, CardContent } from '@/src/components/primitives/ui/card';
import type { GetGetUserActivityTimelineReturn } from '@/src/types/database-overrides';

type Activity = GetGetUserActivityTimelineReturn['activities'][number];

import { FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
}

const ACTIVITY_CONFIG = {
  post: { icon: FileText, label: 'Posted' },
  comment: { icon: MessageSquare, label: 'Commented on' },
  vote: { icon: ThumbsUp, label: 'Voted on' },
  submission: { icon: GitPullRequest, label: 'Submitted' },
} as const;

export function ActivityTimeline({ activities, limit }: ActivityTimelineProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No activity yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => {
        // Type guard for activity.type to ensure it's a valid key
        const activityType = activity.type as keyof typeof ACTIVITY_CONFIG;
        const config = ACTIVITY_CONFIG[activityType];

        // Guard against unknown activity types
        if (!config) {
          logger.warn('Unknown activity type', { type: activity.type });
          return null;
        }

        const Icon = config.icon;

        // Determine title based on activity type
        let title = '';
        if (activity.type === 'post' && activity.title && typeof activity.title === 'string') {
          title = activity.title;
        } else if (
          activity.type === 'comment' &&
          activity.body &&
          typeof activity.body === 'string'
        ) {
          const bodyLength = activity.body.length;
          title = activity.body.substring(0, 100) + (bodyLength > 100 ? '...' : '');
        } else if (
          activity.type === 'submission' &&
          activity.title &&
          typeof activity.title === 'string'
        ) {
          title = activity.title;
        } else if (activity.type === 'vote' && activity.vote_type) {
          title = `${activity.vote_type} vote`;
        } else {
          // Fallback for unknown types or missing fields
          title = 'Unknown activity';
        }

        return (
          <Card key={activity.id} className="transition-colors hover:bg-accent/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">{config.label}</span>{' '}
                  <span className="font-medium">{title}</span>
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
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
