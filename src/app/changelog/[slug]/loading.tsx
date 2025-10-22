/**
 * Changelog Detail Loading State
 * Matches changelog detail page structure
 */

import { Skeleton } from '@/src/components/primitives/loading-skeleton';

const tagIds = Array.from({ length: 3 }, () => crypto.randomUUID());
const textLineIds = Array.from({ length: 8 }, () => crypto.randomUUID());

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <Skeleton size="sm" width="sm" className="mb-6" />
          <div className="max-w-4xl">
            <div className="space-y-4 mb-6">
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            {textLineIds.map((id, i) => (
              <Skeleton key={id} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
