import { emptyCard, marginBottom, marginTop, radius , padding , gap , grid, minHeight , maxWidth, bgColor,
  justify,
  flexWrap,
  squareSize,
  skeletonSize,
  display,
  container,
  marginX,
  border,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton } from '@heyclaude/web-runtime/ui';

// Static skeleton IDs to avoid array index keys
const POPULAR_TAG_SKELETONS = ['pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pt-6', 'pt-7', 'pt-8', 'pt-9', 'pt-10'] as const;
const TAG_GRID_SKELETONS = ['tg-1', 'tg-2', 'tg-3', 'tg-4', 'tg-5', 'tg-6', 'tg-7', 'tg-8', 'tg-9', 'tg-10', 'tg-11', 'tg-12'] as const;

/**
 * Render a full-page skeleton loading state for the Tags page.
 *
 * Displays a hero skeleton (avatar, title, subtitle, CTAs), a "Popular Tags" row of pill
 * skeletons, and a responsive grid of tag-item skeleton cards to indicate content loading.
 *
 * @returns A JSX element containing the skeleton UI for the tags page loading state.
 *
 * @see Skeleton - design-system skeleton component used to render placeholders
 * @see POPULAR_TAG_SKELETONS
 * @see TAG_GRID_SKELETONS
 */
export default function TagsLoading() {
  return (
    <div
      className={`${minHeight.screen} ${bgColor.background}`}
      aria-busy="true"
      role="status"
      aria-label="Loading tags"
    >
      {/* Hero Skeleton */}
      <section className={emptyCard.default} aria-hidden="true">
        <div className={`${container.default} ${padding.xDefault} ${padding.yLarge}`}>
          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <Skeleton className={`${squareSize.avatarXl} ${radius.full}`} />
            </div>
            <Skeleton className={`${marginBottom.default} ${marginX.auto} ${skeletonSize.heroBar}`} />
            <Skeleton className={`${marginX.auto} ${skeletonSize.barLgMaxWide} ${maxWidth.full}`} />
            <div className={`${marginTop.comfortable} ${display.flex} ${justify.center} ${gap.compact}`}>
              <Skeleton className={skeletonSize.barLgComfortable} />
              <Skeleton className={skeletonSize.barLgLarge} />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className={`${container.default} ${padding.xDefault} ${padding.yRelaxed}`} aria-hidden="true">
        {/* Popular Tags Skeleton */}
          <div className={`${marginBottom.relaxed} ${radius.lg} ${border.default} ${padding.comfortable}`}>
          <Skeleton className={`${marginBottom.default} ${skeletonSize.barLgLarge}`} />
          <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
            {POPULAR_TAG_SKELETONS.map((id) => (
              <Skeleton key={id} className={skeletonSize.barXlDefault} />
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <Skeleton className={`${marginBottom.default} ${skeletonSize.barLgComfortable}`} />
        <div className={grid.responsive4}>
          {TAG_GRID_SKELETONS.map((id) => (
            <div key={id} className={`${radius.lg} ${border.default} ${padding.default}`}>
              <Skeleton className={`${marginBottom.tight} ${skeletonSize.barMdLarge}`} />
              <Skeleton className={`${marginBottom.compact} ${skeletonSize.barCompact}`} />
              <div className={`${display.flex} ${gap.tight}`}>
                <Skeleton className={skeletonSize.barMdCompact} />
                <Skeleton className={skeletonSize.barMdDefault} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}