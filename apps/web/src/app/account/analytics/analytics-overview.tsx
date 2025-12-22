'use client';

/**
 * Analytics Overview Component
 * Displays key analytics metrics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';
import { Bookmark, Send, Briefcase, TrendingUp } from '@heyclaude/web-runtime/icons';

interface AnalyticsOverviewProps {
  userId: string;
  userData: GetUserCompleteDataReturns | null;
}

export function AnalyticsOverview({ userData }: AnalyticsOverviewProps) {
  const dashboard = userData?.account_dashboard;
  const stats = dashboard?.profile;

  const metrics = [
    {
      label: 'Total Bookmarks',
      value: stats?.bookmark_count ?? 0,
      icon: Bookmark,
      trend: null,
    },
    {
      label: 'Submissions',
      value: stats?.submission_count ?? 0,
      icon: Send,
      trend: null,
    },
    {
      label: 'Jobs Posted',
      value: stats?.job_count ?? 0,
      icon: Briefcase,
      trend: null,
    },
    {
      label: 'Profile Views',
      value: 0, // TODO: Add profile views tracking
      icon: TrendingUp,
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs sm:text-sm truncate">{metric.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{metric.value.toLocaleString()}</p>
              </div>
              <Icon className="h-6 w-6 shrink-0 text-muted-foreground sm:h-8 sm:w-8" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

