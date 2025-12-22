'use client';

/**
 * Content Performance Component
 * Displays content performance metrics
 */

import { type GetUserCompleteDataReturns } from '@heyclaude/data-layer';
import { Card } from '@heyclaude/web-runtime/ui';

interface ContentPerformanceProps {
  userId: string;
  userData: GetUserCompleteDataReturns | null;
}

export function ContentPerformance({ userData }: ContentPerformanceProps) {
  const submissions = userData?.submissions ?? [];

  // For now, show placeholder
  // In production, this would show submission performance metrics
  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          <p>No content performance data available yet.</p>
          <p className="mt-2">
            Performance metrics will appear here once you have submissions with engagement data.
          </p>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          <p>Content performance tracking is coming soon.</p>
          <p className="mt-2">
            You have {submissions.length} submission{submissions.length !== 1 ? 's' : ''}. Performance metrics will be displayed here.
          </p>
        </div>
      )}
    </div>
  );
}

