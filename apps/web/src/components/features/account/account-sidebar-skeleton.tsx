/**
 * Account Sidebar Loading Skeleton
 * Displayed while AccountSidebar Server Component is streaming
 */

import {
  borderBottom,
  cluster,
  flexGrow,
  height,
  marginBottom,
  padding,
  paddingBottom,
  radius,
  skeletonSize,
  spaceY,
  squareSize,
  width,
} from '@heyclaude/web-runtime/design-system';
import { Card, Skeleton } from '@heyclaude/web-runtime/ui';

export function AccountSidebarSkeleton() {
  return (
    <Card className={`${height.fit} ${padding.default} md:col-span-1`}>
      {/* User profile header skeleton */}
      <div className={`${marginBottom.comfortable} ${cluster.default} ${borderBottom.default} ${paddingBottom.comfortable}`}>
        <Skeleton className={`${squareSize.avatarLg} ${radius.full}`} />
        <div className={`${flexGrow['1']} ${spaceY.compact}`}>
          <Skeleton className={skeletonSize.barDefault} />
          <Skeleton className={skeletonSize.barSm} />
        </div>
      </div>

      {/* Navigation items skeleton */}
      <nav className={spaceY.compact}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className={`${height.input} ${width.full}`} />
        ))}
      </nav>
    </Card>
  );
}
