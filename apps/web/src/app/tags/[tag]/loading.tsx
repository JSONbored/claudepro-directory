import {
  emptyCard,
  marginBottom,
  marginTop,
  spaceY,
  radius,
  padding,
  gap,
  minHeight,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton } from '@heyclaude/web-runtime/ui';

// Static skeleton IDs to avoid array index keys
const CONTENT_GRID_SKELETONS = [
  'cg-1',
  'cg-2',
  'cg-3',
  'cg-4',
  'cg-5',
  'cg-6',
  'cg-7',
  'cg-8',
  'cg-9',
] as const;
const RELATED_TAG_SKELETONS = [
  'rt-1',
  'rt-2',
  'rt-3',
  'rt-4',
  'rt-5',
  'rt-6',
  'rt-7',
  'rt-8',
] as const;

/**
 * Render a full-page skeleton UI for the tag detail view.
 *
 * Displays a hero skeleton (avatar and title placeholders), a main content area with
 * filter/tab placeholders and a responsive grid of content-card skeletons, and a
 * right sidebar with related-tag and action placeholders.
 *
 * @returns A JSX element containing the loading skeleton for the tag detail page.
 *
 * @see Skeleton
 * @see CONTENT_GRID_SKELETONS
 * @see RELATED_TAG_SKELETONS
 */
export default function TagDetailLoading() {
  return (
    <div className={`${minHeight.screen} bg-background`}>
      {/* Hero Skeleton */}
      <section className={emptyCard.default}>
        <div className={`container mx-auto ${padding.xDefault} ${padding.yHero}`}>
          <Skeleton className={`${marginBottom.comfortable} h-5 w-24`} />

          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex justify-center`}>
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className={`${marginBottom.default} mx-auto h-12 w-64`} />
            <Skeleton className="mx-auto h-6 w-80" />
            <div className={`${marginTop.default} flex justify-center ${gap.compact}`}>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
        <div className={`grid grid-cols-1 ${gap.loose} lg:grid-cols-4`}>
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Filter tabs skeleton */}
            <div className={`mb-6 flex ${gap.compact}`}>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>

            {/* Grid skeleton */}
            <div className={`grid grid-cols-1 ${gap.comfortable} sm:grid-cols-2 lg:grid-cols-3`}>
              {CONTENT_GRID_SKELETONS.map((id) => (
                <div key={id} className={`${radius.lg} border ${padding.default}`}>
                  <Skeleton className="mb-3 h-6 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="mb-4 h-4 w-2/3" />
                  <div className={`flex ${gap.compact}`}>
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className={spaceY.comfortable}>
            <div className={`${radius.lg} border ${padding.default}`}>
              <Skeleton className="mb-3 h-5 w-28" />
              <div className={`flex flex-wrap ${gap.compact}`}>
                {RELATED_TAG_SKELETONS.map((id) => (
                  <Skeleton key={id} className="h-6 w-20" />
                ))}
              </div>
            </div>
            <div className={`${radius.lg} border ${padding.default} text-center`}>
              <Skeleton className="mx-auto mb-2 h-4 w-32" />
              <Skeleton className="mx-auto h-9 w-full" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}