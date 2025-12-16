/**
 * Status Page
 *
 * Displays system status and API health information.
 * Uses the Status component for visual status indicators.
 */

import { Suspense } from 'react';

import { StatusPageContent } from './status-page-content';
import { StatusPageSkeleton } from './status-page-skeleton';
import { paddingX, paddingY, marginX, marginBottom, muted } from "@heyclaude/web-runtime/design-system";

export const metadata = {
  description: 'Real-time system status and API health information',
  title: 'System Status | Claude Pro Directory',
};

export default function StatusPage() {
  return (
    <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
      <div className={`${marginBottom.relaxed}`}>
        <h1 className={`${marginBottom.compact} text-3xl font-bold`}>System Status</h1>
        <p className={`${muted.default}`}>Real-time status of our API and services</p>
      </div>

      <Suspense fallback={<StatusPageSkeleton />}>
        <StatusPageContent />
      </Suspense>
    </div>
  );
}
