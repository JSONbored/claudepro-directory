/**
 * Guide Detail Loading State
 * Matches structure of guide pages (text-heavy)
 */

import { Skeleton } from '@/src/components/primitives/loading-skeleton';

const tagIds = Array.from({ length: 5 }, () => crypto.randomUUID());
const textLineIds = Array.from({ length: 12 }, () => crypto.randomUUID());
const sidebarIds = Array.from({ length: 3 }, () => crypto.randomUUID());

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
              {tagIds.map((id) => (
                <Skeleton key={id} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              {textLineIds.map((id, i) => (
                <Skeleton key={id} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="md" width="sm" />
              {sidebarIds.map((id) => (
                <Skeleton key={id} size="sm" width="3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
