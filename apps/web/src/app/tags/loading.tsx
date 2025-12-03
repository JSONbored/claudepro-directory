import {
  emptyCard,
  marginBottom,
  marginTop,
  radius,
  padding,
  gap,
  minHeight,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton } from '@heyclaude/web-runtime/ui';

// Static skeleton IDs to avoid array index keys
const POPULAR_TAG_SKELETONS = [
  'pt-1',
  'pt-2',
  'pt-3',
  'pt-4',
  'pt-5',
  'pt-6',
  'pt-7',
  'pt-8',
  'pt-9',
  'pt-10',
] as const;
const TAG_GRID_SKELETONS = [
  'tg-1',
  'tg-2',
  'tg-3',
  'tg-4',
  'tg-5',
  'tg-6',
  'tg-7',
  'tg-8',
  'tg-9',
  'tg-10',
  'tg-11',
  'tg-12',
] as const;

/**
 * Render a full-page skeleton loading state for the Tags page.
 *
 * Renders a non-interactive placeholder UI consisting of a hero skeleton, a "Popular Tags" row, and a responsive grid of tag-item skeletons; the root element is marked with accessibility attributes (`aria-busy="true"` and `role="status"`) and the decorative hero section is `aria-hidden`.
 *
 * @returns A JSX element containing skeleton placeholders for the Tags page (hero, popular tags, and responsive tag grid).
 *
 * @see Skeleton
 */
export default function TagsLoading() {
  return (
    <div className={`${minHeight.screen} bg-background`} aria-busy="true" role="status">
      {/* Hero Skeleton */}
      <section className={emptyCard.default} aria-hidden="true">
        <div className={`container mx-auto ${padding.xDefault} py-20`}>
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex justify-center`}>
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className={`${marginBottom.default} mx-auto h-12 w-64`} />
            <Skeleton className={`mx-auto h-6 w-96 ${maxWidth.full}`} />
            <div className={`${marginTop.comfortable} flex justify-center ${gap.compact}`}>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
        {/* Popular Tags Skeleton */}
        <div className={`mb-8 ${radius.lg} border ${padding.comfortable}`}>
          <Skeleton className="mb-4 h-6 w-32" />
          <div className={`flex flex-wrap ${gap.compact}`}>
            {POPULAR_TAG_SKELETONS.map((id) => (
              <Skeleton key={id} className="h-8 w-24" />
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <Skeleton className="mb-4 h-6 w-24" />
        <div
          className={`grid grid-cols-1 ${gap.comfortable} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}
        >
          {TAG_GRID_SKELETONS.map((id) => (
            <div key={id} className={`${radius.lg} border ${padding.default}`}>
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="mb-3 h-4 w-16" />
              <div className={`flex ${gap.tight}`}>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}