import { emptyCard, marginBottom, marginTop, spaceY, radius, padding, gap, grid, minHeight, maxWidth, bgColor,
  justify,
  flexWrap,
  squareSize,
  skeletonSize,
  skeleton,
  display,
  container,
  marginX,
  textAlign,
  border,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton } from '@heyclaude/web-runtime/ui';

// Static skeleton IDs to avoid array index keys
const CONTENT_GRID_SKELETONS = ['cg-1', 'cg-2', 'cg-3', 'cg-4', 'cg-5', 'cg-6', 'cg-7', 'cg-8', 'cg-9'] as const;
const RELATED_TAG_SKELETONS = ['rt-1', 'rt-2', 'rt-3', 'rt-4', 'rt-5', 'rt-6', 'rt-7', 'rt-8'] as const;

/**
 * Renders the full-page loading skeleton for the tag detail page.
 *
 * @returns A JSX element containing hero, main content grid, and sidebar skeleton placeholders.
 *
 * @see Skeleton
 * @see CONTENT_GRID_SKELETONS
 * @see RELATED_TAG_SKELETONS
 */
export default function TagDetailLoading() {
  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero Skeleton */}
      <section className={emptyCard.default}>
        <div className={`${container.default} ${padding.xDefault} ${padding.yHero}`}>
          <Skeleton className={`${marginBottom.comfortable} ${skeletonSize.barMdDefault}`} />

          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <Skeleton className={`${squareSize.avatarXl} ${radius.full}`} />
            </div>
            <Skeleton className={`${marginBottom.default} ${marginX.auto} ${skeletonSize.heroBar}`} />
            <Skeleton className={`${marginX.auto} ${skeletonSize.barLgMax}`} />
            <div className={`${marginTop.default} ${display.flex} ${justify.center} ${gap.compact}`}>
              <Skeleton className={skeletonSize.barLgDefault} />
              <Skeleton className={skeletonSize.barLgCompact} />
              <Skeleton className={skeletonSize.barLgComfortable} />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className={`${container.default} ${padding.xDefault} ${padding.yRelaxed}`}>
        <div className={grid.sidebar}>
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Filter tabs skeleton */}
            <div className={`${marginBottom.comfortable} ${display.flex} ${gap.compact}`}>
              <Skeleton className={skeletonSize.buttonCompact} />
              <Skeleton className={skeletonSize.buttonComfortable} />
              <Skeleton className={skeletonSize.buttonDefault} />
              <Skeleton className={skeletonSize.buttonLarge} />
            </div>

            {/* Grid skeleton */}
            <div className={grid.responsive123}>
              {CONTENT_GRID_SKELETONS.map((id) => (
                <div key={id} className={`${radius.lg} ${border.default} ${padding.default}`}>
                  <Skeleton className={`${marginBottom.compact} ${skeletonSize.barLgThreeQuarters}`} />
                  <Skeleton className={`${marginBottom.tight} ${skeleton.height.text} ${skeleton.width.full}`} />
                  <Skeleton className={`${marginBottom.default} ${skeletonSize.barResponsive}`} />
                  <div className={`${display.flex} ${gap.compact}`}>
                    <Skeleton className={skeletonSize.barMdCompact} />
                    <Skeleton className={skeletonSize.barMdDefault} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className={spaceY.comfortable}>
            <div className={`${radius.lg} ${border.default} ${padding.default}`}>
              <Skeleton className={`${marginBottom.compact} ${skeletonSize.barMdComfortable}`} />
              <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
                {RELATED_TAG_SKELETONS.map((id) => (
                  <Skeleton key={id} className={skeletonSize.barLgDefault} />
                ))}
              </div>
            </div>
            <div className={`${radius.lg} ${border.default} ${padding.default} ${textAlign.center}`}>
              <Skeleton className={`${marginX.auto} ${marginBottom.tight} ${skeletonSize.barComfortable}`} />
              <Skeleton className={`${marginX.auto} ${skeleton.height.button} ${skeleton.width.full}`} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}