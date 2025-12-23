'use client';

/**
 * Usage Statistics Component
 * Displays user account usage statistics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';

interface UsageStatsProps {
  userData: GetUserCompleteDataReturns | null;
  userId: string;
}

export function UsageStats({ userData }: UsageStatsProps) {
  const dashboard = userData?.account_dashboard;
  const stats = dashboard?.profile;

  const usageData = [
    {
      label: 'Bookmarks',
      limit: 'Unlimited',
      percentage: 0,
      value: stats?.bookmark_count ?? 0,
    },
    {
      label: 'Submissions',
      limit: 'Unlimited',
      percentage: 0,
      value: stats?.submission_count ?? 0,
    },
    {
      label: 'Jobs Posted',
      limit: 'Unlimited',
      percentage: 0,
      value: stats?.job_count ?? 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {usageData.map((item) => (
        <Card className="p-4" key={item.label}>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-muted-foreground text-sm">/ {item.limit}</p>
            </div>
            {item.percentage > 0 && (
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
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
