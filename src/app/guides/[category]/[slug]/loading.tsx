import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

const TAG_KEYS = getSkeletonKeys(5);
const TEXT_KEYS = getSkeletonKeys(12);
const SIDEBAR_KEYS = getSkeletonKeys(3);

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <Skeleton size="sm" width="sm" className="mb-6" />
          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <Skeleton size="xl" width="xs" />
              <div className="flex-1 space-y-4">
                <Skeleton size="xl" width="3/4" />
                <Skeleton size="md" width="3xl" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={TAG_KEYS[i]} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={TEXT_KEYS[i]} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="md" width="sm" />
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={SIDEBAR_KEYS[i]} size="sm" width="3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
