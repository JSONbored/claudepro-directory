'use client';

/**
 * Activity Timeline Component
 * Displays user's activity history with filtering
 */

import { useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { ExternalLink, FileText, GitPullRequest, MessageSquare, ThumbsUp } from '@/src/lib/icons';
import type { Activity, ActivityType } from '@/src/lib/schemas/activity.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
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
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
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
          <FileText className="h-4 w-4 mr-1" />
          Posts ({summary.total_posts})
        </Button>
        <Button
          variant={filter === 'comment' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('comment')}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Comments ({summary.total_comments})
        </Button>
        <Button
          variant={filter === 'vote' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('vote')}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Votes ({summary.total_votes})
        </Button>
        <Button
          variant={filter === 'submission' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('submission')}
        >
          <GitPullRequest className="h-4 w-4 mr-1" />
          Submissions ({summary.total_submissions})
        </Button>
      </div>

      {/* Timeline */}
      <div className={UI_CLASSES.SPACE_Y_3}>
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                No {filter === 'all' ? '' : filter} activity yet
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card
              key={`${activity.type}-${activity.id}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="mt-1">{getActivityIcon(activity.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {activity.type === 'post' && (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base mb-1">
                            {activity.url ? (
                              <a
                                href={activity.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary inline-flex items-center gap-1"
                              >
                                {activity.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              activity.title
                            )}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{activity.vote_count} votes</span>
                            <span>•</span>
                            <span>{activity.comment_count} comments</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Posted
                        </Badge>
                      </div>
                    )}

                    {activity.type === 'comment' && (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-1">
                            Commented on{' '}
                            <span className="font-medium text-foreground">
                              {activity.post_title}
                            </span>
                          </p>
                          <p className="text-sm line-clamp-2">{activity.content}</p>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Comment
                        </Badge>
                      </div>
                    )}

                    {activity.type === 'vote' && (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">
                          Upvoted <span className="font-medium">{activity.post_title}</span>
                        </p>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Voted
                        </Badge>
                      </div>
                    )}

                    {activity.type === 'submission' && (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base mb-1">{activity.content_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {activity.content_type}
                            </Badge>
                            {getStatusBadge(activity.status)}
                            {activity.pr_url && (
                              <a
                                href={activity.pr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-primary"
                              >
                                View PR
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-2">
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
