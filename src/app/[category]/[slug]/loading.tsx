import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

const CODE_LINE_KEYS = getSkeletonKeys(8);

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-border/50 border-b bg-card/30">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Skeleton size="sm" width="sm" className="mb-6" />

          {/* Title section */}
          <div className="mb-6 flex items-start gap-4">
            <Skeleton size="xl" width="xs" className="shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Content card */}
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="sm" width="sm" />
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={CODE_LINE_KEYS[i]} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="md" width="sm" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
