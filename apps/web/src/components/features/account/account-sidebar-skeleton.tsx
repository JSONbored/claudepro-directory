/**
 * Account Sidebar Loading Skeleton
 * Displayed while AccountSidebar Server Component is streaming
 */

import { borderBottom, spaceY, marginBottom  , cluster , padding , radius, squareSize, skeletonSize } from '@heyclaude/web-runtime/design-system';
import { Card, Skeleton } from '@heyclaude/web-runtime/ui';

export function AccountSidebarSkeleton() {
  return (
    <Card className={`h-fit ${padding.default} md:col-span-1`}>
      {/* User profile header skeleton */}
      <div className={`${marginBottom.comfortable} ${cluster.default} ${borderBottom.default} pb-4`}>
        <Skeleton className={`${squareSize.avatarLg} ${radius.full}`} />
        <div className={`flex-1 ${spaceY.compact}`}>
          <Skeleton className={skeletonSize.barDefault} />
          <Skeleton className={skeletonSize.barSm} />
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
