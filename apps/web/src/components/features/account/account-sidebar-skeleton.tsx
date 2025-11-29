/**
 * Account Sidebar Loading Skeleton
 * Displayed while AccountSidebar Server Component is streaming
 */

import { Card, Skeleton } from '@heyclaude/web-runtime/ui';

export function AccountSidebarSkeleton() {
  return (
    <Card className="h-fit p-4 md:col-span-1">
      {/* User profile header skeleton */}
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Navigation items skeleton */}
      <nav className="space-y-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </nav>
    </Card>
  );
}
