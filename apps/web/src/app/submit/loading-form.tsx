/**
 * Submit Form Loading Skeleton
 *
 * Loading skeleton for the submit form section.
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { spaceY, padding } from "@heyclaude/web-runtime/design-system";

export default function SubmitFormLoading() {
  return (
    <div className={`bg-muted/20 ${spaceY.relaxed} rounded-lg ${padding.comfortable}`}>
      <div className={`${spaceY.comfortable}`}>
        <Skeleton size="lg" width="md" />
        <Skeleton size="sm" width="3xl" />
      </div>
      <div className={`${spaceY.comfortable}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <div className={`${spaceY.compact}`} key={`field-${i}`}>
            <Skeleton size="sm" width="xs" />
            <Skeleton size="lg" width="3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
