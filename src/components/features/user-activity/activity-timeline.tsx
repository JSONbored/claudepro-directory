/**
 * Activity Timeline Component - Database-First
 * Uses Activity type from user.actions (based on get_user_activity_timeline RPC)
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/src/components/primitives/ui/card';
import type { Activity } from '@/src/lib/actions/user.actions';
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

export const ActivityTimeline = memo(function ActivityTimeline({
  activities,
  limit,
}: ActivityTimelineProps) {
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
        const config = ACTIVITY_CONFIG[activity.type];

        // Guard against unknown activity types
        if (!config) {
          logger.warn('Unknown activity type', { type: activity.type });
          return null;
        }

        const Icon = config.icon;

        // Determine title based on activity type
        let title = '';
        if (activity.type === 'post') {
          title = activity.title;
        } else if (activity.type === 'comment') {
          title = activity.body.substring(0, 100) + (activity.body.length > 100 ? '...' : '');
        } else if (activity.type === 'submission') {
          title = activity.title;
        } else if (activity.type === 'vote') {
          title = `${activity.vote_type} vote`;
        } else {
          // Fallback for unknown types
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
});
