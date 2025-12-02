import { emptyCard, marginBottom, marginTop, radius , padding , gap , minHeight , maxWidth, bgColor,
  justify,
  flexWrap,
  squareSize,
  skeletonSize,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton } from '@heyclaude/web-runtime/ui';

// Static skeleton IDs to avoid array index keys
const POPULAR_TAG_SKELETONS = ['pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pt-6', 'pt-7', 'pt-8', 'pt-9', 'pt-10'] as const;
const TAG_GRID_SKELETONS = ['tg-1', 'tg-2', 'tg-3', 'tg-4', 'tg-5', 'tg-6', 'tg-7', 'tg-8', 'tg-9', 'tg-10', 'tg-11', 'tg-12'] as const;

export default function TagsLoading() {
  return (
    <div className={`${minHeight.screen} ${bgColor.background}`} aria-busy="true" role="status">
      {/* Hero Skeleton */}
      <section className={emptyCard.default} aria-hidden="true">
        <div className={`container mx-auto ${padding.xDefault} py-20`}>
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex ${justify.center}`}>
              <Skeleton className={`${squareSize.avatarXl} ${radius.full}`} />
            </div>
            <Skeleton className={`${marginBottom.default} mx-auto ${skeletonSize.heroBar}`} />
            <Skeleton className={`mx-auto ${skeletonSize.barLgMaxWide} ${maxWidth.full}`} />
            <div className={`${marginTop.comfortable} flex ${justify.center} ${gap.compact}`}>
              <Skeleton className={skeletonSize.barLgComfortable} />
              <Skeleton className={skeletonSize.barLgLarge} />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
        {/* Popular Tags Skeleton */}
        <div className={`${marginBottom.relaxed} ${radius.lg} border ${padding.comfortable}`}>
          <Skeleton className={`${marginBottom.default} ${skeletonSize.barLgLarge}`} />
          <div className={`flex ${flexWrap.wrap} ${gap.compact}`}>
            {POPULAR_TAG_SKELETONS.map((id) => (
              <Skeleton key={id} className={skeletonSize.barXlDefault} />
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <Skeleton className={`${marginBottom.default} ${skeletonSize.barLgComfortable}`} />
        <div className={`grid grid-cols-1 ${gap.comfortable} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}>
          {TAG_GRID_SKELETONS.map((id) => (
            <div key={id} className={`${radius.lg} border ${padding.default}`}>
              <Skeleton className={`${marginBottom.tight} ${skeletonSize.barMdLarge}`} />
              <Skeleton className={`${marginBottom.compact} ${skeletonSize.barCompact}`} />
              <div className={`flex ${gap.tight}`}>
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
