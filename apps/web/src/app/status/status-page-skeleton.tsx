/**
 * Status Page Skeleton
 *
 * Loading skeleton for the status page.
 */

import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';
import { spaceY, marginTop, gap } from "@heyclaude/web-runtime/design-system";

export function StatusPageSkeleton() {
  return (
    <div className={`${spaceY.relaxed}`}>
      <Card>
        <CardHeader>
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className={`bg-muted ${marginTop.compact} h-4 w-48 animate-pulse rounded`} />
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
        </CardContent>
      </Card>

      <div className={`grid ${gap.default} md:grid-cols-2`}>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
