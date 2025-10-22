/**
 * Changelog List Loading State
 * Matches changelog list page structure
 */

import {
  ContentListSkeleton,
  PageHeaderSkeleton,
} from '@/src/components/primitives/loading-skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <ContentListSkeleton count={8} />
    </div>
  );
}
