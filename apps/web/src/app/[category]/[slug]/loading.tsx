import { getSkeletonKeys, Skeleton } from '@heyclaude/web-runtime/ui';

const CODE_LINE_KEYS = getSkeletonKeys(8);

/**
 * Full-page skeleton UI placeholder for the category/[slug] page shown while content loads.
 *
 * Renders header placeholders (back button, title, metadata), a responsive two-column layout with
 * a content card and a multi-line code-block skeleton, and a right-hand sidebar skeleton to
 * mimic the final page layout during loading.
 *
 * @returns A React element containing skeleton placeholders for the header, main content, code block, and sidebar.
 *
 * @see getSkeletonKeys from @heyclaude/web-runtime/ui
 * @see Skeleton from @heyclaude/web-runtime/ui
 */
export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-border/50 bg-card/30 border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Skeleton size="sm" width="sm" className="mb-6" />

          {/* Title section */}
          <div className="mb-6 flex items-start gap-4">
            <Skeleton size="xl" width="xs" className="shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Content card */}
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="sm" width="sm" />
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, index) => {
                  const width: '2/3' | '3xl' = index % 3 === 0 ? '2/3' : '3xl';
                  return <Skeleton key={CODE_LINE_KEYS[index]} size="sm" width={width} />;
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton size="md" width="sm" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}