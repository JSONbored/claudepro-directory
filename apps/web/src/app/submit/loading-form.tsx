/**
 * Submit Form Loading Skeleton
 *
 * Loading skeleton for the submit form section.
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';

export default function SubmitFormLoading() {
  return (
    <div className="bg-muted/20 space-y-6 rounded-lg p-6">
      <div className="space-y-4">
        <Skeleton size="lg" width="md" />
        <Skeleton size="sm" width="3xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="space-y-2" key={`field-${i}`}>
            <Skeleton size="sm" width="xs" />
            <Skeleton size="lg" width="3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
