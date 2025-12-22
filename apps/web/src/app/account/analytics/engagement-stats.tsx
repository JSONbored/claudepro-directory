'use client';

/**
 * Engagement Statistics Component
 * Displays user engagement metrics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';

interface EngagementStatsProps {
  userId: string;
  userData: GetUserCompleteDataReturns | null;
}

export function EngagementStats({ userData }: EngagementStatsProps) {
  const activity = userData?.user_activity_summary;

  // For now, show placeholder stats
  // In production, this would calculate from activity data
  const stats = [
    {
      label: 'Total Activity',
      value: activity?.total_activities ?? 0,
      description: 'All-time activity count',
    },
    {
      label: 'This Month',
      value: activity?.recent_activities ?? 0,
      description: 'Activity in the last 30 days',
    },
    {
      label: 'Average per Week',
      value: activity?.total_activities ? Math.round(activity.total_activities / 52) : 0,
      description: 'Average weekly activity',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
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

