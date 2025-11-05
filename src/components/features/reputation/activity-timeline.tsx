'use client';

/**
 * Activity Timeline Component
 * Displays user's activity history with filtering
 */

import { useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent } from '@/src/components/primitives/card';
import type { Activity } from '@/src/lib/actions/user.actions';
import { ExternalLink, FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Activity type imported from user.actions (database-validated with Zod)
type ActivityType = 'post' | 'comment' | 'vote' | 'submission';

interface ActivityTimelineProps {
  initialActivities: Activity[];
  summary: {
    total_posts: number;
    total_comments: number;
    total_votes: number;
    total_submissions: number;
  };
}

export function ActivityTimeline({ initialActivities, summary }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [activities] = useState<Activity[]>(initialActivities);

  // Filter activities based on selected type
  const filteredActivities =
    filter === 'all' ? activities : activities.filter((a) => a.type === filter);

  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'post':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'vote':
        return <ThumbsUp className="h-5 w-5 text-orange-500" />;
      case 'submission':
        return <GitPullRequest className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get status badge for submissions
  const getStatusBadge = (status: string) => {
    const variants = {
      merged: 'default' as const,
      pending: 'secondary' as const,
      approved: 'secondary' as const,
      rejected: 'destructive' as const,
    };
    return (
      <UnifiedBadge variant="base" style={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </UnifiedBadge>
    );
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All (
          {summary.total_posts +
            summary.total_comments +
            summary.total_votes +
            summary.total_submissions}
          )
        </Button>
        <Button
          variant={filter === 'post' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('post')}
        >
          <FileText className="mr-1 h-4 w-4" />
          Posts ({summary.total_posts})
        </Button>
        <Button
          variant={filter === 'comment' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('comment')}
        >
          <MessageSquare className="mr-1 h-4 w-4" />
          Comments ({summary.total_comments})
        </Button>
        <Button
          variant={filter === 'vote' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('vote')}
        >
          <ThumbsUp className="mr-1 h-4 w-4" />
          Votes ({summary.total_votes})
        </Button>
        <Button
          variant={filter === 'submission' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('submission')}
        >
          <GitPullRequest className="mr-1 h-4 w-4" />
          Submissions ({summary.total_submissions})
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No {filter === 'all' ? '' : filter} activity yet
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card
              key={`${activity.type}-${activity.id}`}
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="mt-1">{getActivityIcon(activity.type)}</div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {activity.type === 'post' && (
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_2}>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 font-medium text-base">{activity.title}</h3>
                          <p className="line-clamp-2 text-muted-foreground text-sm">
                            {activity.body}
                          </p>
                          {activity.content_type && activity.content_slug && (
                            <p className="mt-1 text-muted-foreground text-xs">
                              Posted in {activity.content_type}/{activity.content_slug}
                            </p>
                          )}
                        </div>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="whitespace-nowrap text-xs"
                        >
                          Posted
                        </UnifiedBadge>
                      </div>
                    )}

                    {activity.type === 'comment' && (
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_2}>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-muted-foreground text-sm">Commented on a post</p>
                          <p className="line-clamp-2 text-sm">{activity.body}</p>
                          {activity.parent_id && (
                            <p className="mt-1 text-muted-foreground text-xs">Reply to comment</p>
                          )}
                        </div>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="whitespace-nowrap text-xs"
                        >
                          Comment
                        </UnifiedBadge>
                      </div>
                    )}

                    {activity.type === 'vote' && (
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_2}>
                        <p className="text-sm">Upvoted a post</p>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="whitespace-nowrap text-xs"
                        >
                          Voted
                        </UnifiedBadge>
                      </div>
                    )}

                    {activity.type === 'submission' && (
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_2}>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 font-medium text-base">{activity.title}</h3>
                          {activity.description && (
                            <p className="line-clamp-2 text-muted-foreground text-sm">
                              {activity.description}
                            </p>
                          )}
                          <div
                            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mt-2 text-muted-foreground text-sm`}
                          >
                            <UnifiedBadge variant="base" style="secondary" className="text-xs">
                              {activity.content_type}
                            </UnifiedBadge>
                            {getStatusBadge(activity.status)}
                            {activity.submission_url && (
                              <a
                                href={activity.submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={'inline-flex items-center gap-1 hover:text-primary'}
                              >
                                View submission
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="mt-2 text-muted-foreground text-xs">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
