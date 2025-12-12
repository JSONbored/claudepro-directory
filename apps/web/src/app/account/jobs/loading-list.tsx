/**
 * Jobs List Loading Skeleton
 *
 * Loading skeleton for the jobs list with billing section.
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';

export default function JobsListLoading() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div className="space-y-4 rounded-lg border p-6" key={`job-${i}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton size="md" width="md" />
              <Skeleton size="sm" width="sm" />
            </div>
            <Skeleton rounded="md" size="sm" width="xs" />
          </div>
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="2xl" />
        </div>
      ))}
    </div>
  );
}
