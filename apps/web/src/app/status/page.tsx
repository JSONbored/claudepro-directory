/**
 * Status Page
 *
 * Displays system status and API health information.
 * Uses the Status component for visual status indicators.
 */

import { Suspense } from 'react';

import { StatusPageContent } from './status-page-content';
import { StatusPageSkeleton } from './status-page-skeleton';

export const metadata = {
  description: 'Real-time system status and API health information',
  title: 'System Status | Claude Pro Directory',
};

export default function StatusPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">System Status</h1>
        <p className="text-muted-foreground">Real-time status of our API and services</p>
      </div>

      <Suspense fallback={<StatusPageSkeleton />}>
        <StatusPageContent />
      </Suspense>
    </div>
  );
}
