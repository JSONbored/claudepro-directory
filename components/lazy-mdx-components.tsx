/**
 * Lazy-Loaded MDX Components with Suspense Boundaries
 *
 * Heavy interactive MDX components are lazy-loaded to reduce initial bundle size.
 * Each component wrapped in Suspense with appropriate loading skeletons.
 *
 * React 19 Pattern: Separate Suspense boundaries for parallel loading
 *
 * @see components/mdx-renderer.tsx - Consumer
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ConfigCardSkeleton, Skeleton, TableSkeleton } from './ui/loading-skeleton';

// Loading Skeletons using centralized skeleton components
const RelatedContentSkeleton = () => (
  <div className="space-y-4 my-8">
    <Skeleton size="md" width="lg" />
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <ConfigCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const MetricsSkeleton = () => (
  <div className="space-y-3 my-6">
    <Skeleton size="md" width="sm" />
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card/50 rounded-lg p-4 space-y-2 animate-pulse">
          <Skeleton size="lg" width="1/2" />
          <Skeleton size="sm" width="3xl" />
        </div>
      ))}
    </div>
  </div>
);

const ComparisonTableSkeleton = () => (
  <div className="space-y-3 my-6">
    <Skeleton size="md" width="lg" />
    <TableSkeleton rows={3} columns={2} />
  </div>
);

const DiagnosticFlowSkeleton = () => (
  <div className="space-y-4 my-6">
    <Skeleton size="md" width="sm" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <ConfigCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Lazy-loaded components with SSR support
const LazySmartRelatedContentWithMetadata = dynamic(
  () =>
    import('./smart-related-content/with-metadata').then((m) => ({
      default: m.SmartRelatedContentWithMetadata,
    })),
  {
    loading: () => <RelatedContentSkeleton />,
    ssr: true, // Render on server for SEO
  }
);

const LazyMetricsDisplay = dynamic(
  () => import('./analytics').then((m) => ({ default: m.MetricsDisplay })),
  {
    loading: () => <MetricsSkeleton />,
    ssr: true,
  }
);

const LazyComparisonTable = dynamic(
  () => import('./template').then((m) => ({ default: m.ComparisonTable })),
  {
    loading: () => <ComparisonTableSkeleton />,
    ssr: true,
  }
);

const LazyDiagnosticFlow = dynamic(
  () => import('./troubleshooting').then((m) => ({ default: m.DiagnosticFlow })),
  {
    loading: () => <DiagnosticFlowSkeleton />,
    ssr: true,
  }
);

const LazyStepByStepGuide = dynamic(
  () => import('./template').then((m) => ({ default: m.StepByStepGuide })),
  {
    loading: () => <ComparisonTableSkeleton />,
    ssr: true,
  }
);

const LazyErrorTable = dynamic(
  () => import('./troubleshooting').then((m) => ({ default: m.ErrorTable })),
  {
    loading: () => <ComparisonTableSkeleton />,
    ssr: true,
  }
);

// Exported wrapped components with Suspense boundaries
// React 19: Each component gets its own boundary for parallel loading

export const SmartRelatedContent = (
  props: React.ComponentProps<typeof LazySmartRelatedContentWithMetadata>
) => (
  <Suspense fallback={<RelatedContentSkeleton />}>
    <LazySmartRelatedContentWithMetadata {...props} />
  </Suspense>
);

export const MetricsDisplay = (props: React.ComponentProps<typeof LazyMetricsDisplay>) => (
  <Suspense fallback={<MetricsSkeleton />}>
    <LazyMetricsDisplay {...props} />
  </Suspense>
);

export const ComparisonTable = (props: React.ComponentProps<typeof LazyComparisonTable>) => (
  <Suspense fallback={<ComparisonTableSkeleton />}>
    <LazyComparisonTable {...props} />
  </Suspense>
);

export const DiagnosticFlow = (props: React.ComponentProps<typeof LazyDiagnosticFlow>) => (
  <Suspense fallback={<DiagnosticFlowSkeleton />}>
    <LazyDiagnosticFlow {...props} />
  </Suspense>
);

export const StepByStepGuide = (props: React.ComponentProps<typeof LazyStepByStepGuide>) => (
  <Suspense fallback={<ComparisonTableSkeleton />}>
    <LazyStepByStepGuide {...props} />
  </Suspense>
);

export const ErrorTable = (props: React.ComponentProps<typeof LazyErrorTable>) => (
  <Suspense fallback={<ComparisonTableSkeleton />}>
    <LazyErrorTable {...props} />
  </Suspense>
);
