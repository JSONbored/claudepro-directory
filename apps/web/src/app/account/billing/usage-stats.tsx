'use client';

/**
 * Usage Statistics Component
 * Displays user account usage statistics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';

interface UsageStatsProps {
  userId: string;
  userData: GetUserCompleteDataReturns | null;
}

export function UsageStats({ userData }: UsageStatsProps) {
  const dashboard = userData?.account_dashboard;
  const stats = dashboard?.profile;

  const usageData = [
    {
      label: 'Bookmarks',
      value: stats?.bookmark_count ?? 0,
      limit: 'Unlimited',
      percentage: 0,
    },
    {
      label: 'Submissions',
      value: stats?.submission_count ?? 0,
      limit: 'Unlimited',
      percentage: 0,
    },
    {
      label: 'Jobs Posted',
      value: stats?.job_count ?? 0,
      limit: 'Unlimited',
      percentage: 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {usageData.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-muted-foreground text-sm">/ {item.limit}</p>
            </div>
            {item.percentage > 0 && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

