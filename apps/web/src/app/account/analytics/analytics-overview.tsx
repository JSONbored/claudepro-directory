'use client';

/**
 * Analytics Overview Component
 * Displays key analytics metrics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Bookmark, Briefcase, Send, TrendingUp } from '@heyclaude/web-runtime/icons';
import { Card } from '@heyclaude/web-runtime/ui';

interface AnalyticsOverviewProps {
  userData: GetUserCompleteDataReturns | null;
  userId: string;
}

export function AnalyticsOverview({ userData }: AnalyticsOverviewProps) {
  const dashboard = userData?.account_dashboard;
  const stats = dashboard?.profile;

  const metrics = [
    {
      icon: Bookmark,
      label: 'Total Bookmarks',
      trend: null,
      value: stats?.bookmark_count ?? 0,
    },
    {
      icon: Send,
      label: 'Submissions',
      trend: null,
      value: stats?.submission_count ?? 0,
    },
    {
      icon: Briefcase,
      label: 'Jobs Posted',
      trend: null,
      value: stats?.job_count ?? 0,
    },
    {
      icon: TrendingUp,
      label: 'Profile Views',
      trend: null,
      value: 0, // TODO: Add profile views tracking
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card className="p-4 shadow-sm" key={metric.label}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs sm:text-sm">{metric.label}</p>
                <p className="text-xl font-bold sm:text-2xl">{metric.value.toLocaleString()}</p>
              </div>
              <Icon className="text-muted-foreground h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
