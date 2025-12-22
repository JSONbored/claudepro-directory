/**
 * Newsletter Management Skeleton
 *
 * Loading skeleton for newsletter management page
 */

export function NewsletterManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Subscription Status Skeleton */}
      <div className="border-border bg-card rounded-lg border p-6">
        <div className="space-y-4">
          <div className="bg-muted h-6 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
        </div>
      </div>

      {/* Topics Skeleton */}
      <div className="border-border bg-card rounded-lg border p-6">
        <div className="space-y-4">
          <div className="bg-muted h-6 w-40 animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-full animate-pulse rounded" />
                </div>
                <div className="bg-muted h-6 w-12 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

