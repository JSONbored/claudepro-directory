'use client';

/**
 * Engagement Statistics Component
 * Displays user engagement metrics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';

interface EngagementStatsProps {
  userData: GetUserCompleteDataReturns | null;
  userId: string;
}

export function EngagementStats({ userData }: EngagementStatsProps) {
  const activity = userData?.user_activity_summary;

  // For now, show placeholder stats
  // In production, this would calculate from activity data
  const stats = [
    {
      description: 'All-time activity count',
      label: 'Total Activity',
      value: activity?.total_activities ?? 0,
    },
    {
      description: 'Activity in the last 30 days',
      label: 'This Month',
      value: activity?.recent_activities ?? 0,
    },
    {
      description: 'Average weekly activity',
      label: 'Average per Week',
      value: activity?.total_activities ? Math.round(activity.total_activities / 52) : 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card className="p-4" key={stat.label}>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">{stat.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
