/**
 * Account Sidebar Loading Skeleton
 * Displayed while AccountSidebar Server Component is streaming
 */

import { spaceY, marginBottom  , cluster , padding } from '@heyclaude/web-runtime/design-system';
import { Card, Skeleton } from '@heyclaude/web-runtime/ui';

export function AccountSidebarSkeleton() {
  return (
    <Card className={`h-fit ${padding.default} md:col-span-1`}>
      {/* User profile header skeleton */}
      <div className={`${marginBottom.comfortable} ${cluster.default} border-b pb-4`}>
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className={`flex-1 ${spaceY.compact}`}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Navigation items skeleton */}
      <nav className={spaceY.compact}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </nav>
    </Card>
  );
}
