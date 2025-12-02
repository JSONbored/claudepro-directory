/**
 * Changelog Detail Loading State
 *
 * Loading skeleton for individual changelog entry page.
 * Shows placeholder content matching the layout of the detail page.
 */

import { spaceY, cluster, marginBottom , padding , gap , radius , maxWidth, flexWrap,
} from '@heyclaude/web-runtime/design-system';
import { Skeleton, Separator  } from '@heyclaude/web-runtime/ui';


/**
 * Renders a skeleton UI for a changelog entry detail page.
 *
 * The component outputs static placeholder markup (multiple `Skeleton` elements and a `Separator`)
 * that imitates the layout of a changelog entry while the real content loads.
 *
 * @returns The loading skeleton for the changelog entry page as a JSX element.
 *
 * @see {@link @heyclaude/web-runtime/ui#Skeleton}
 * @see {@link @heyclaude/web-runtime/ui#Separator}
 */
export default function ChangelogEntryLoading() {
  return (
    <article className={`container ${maxWidth['4xl']} ${spaceY.loose} ${padding.yRelaxed}`}>
      {/* Back Navigation Skeleton */}
      <Skeleton size="sm" width="xs" />

      {/* Header Skeleton */}
      <header className={`${spaceY.comfortable} pb-6`}>
        {/* Date */}
        <div className={cluster.default}>
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="sm" />
        </div>

        {/* Title */}
        <Skeleton size="xl" width="3/4" />

        {/* Canonical URL */}
        <div className={cluster.compact}>
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="2xl" />
        </div>
      </header>

      <Separator className="my-6" />

      {/* Content Skeleton */}
      <div className={spaceY.relaxed}>
        {/* TL;DR Box */}
        <div className={`${radius.lg} border ${padding.default}`}>
          <Skeleton size="sm" width="xs" className={marginBottom.tight} />
          <Skeleton size="sm" width="3xl" />
        </div>

        {/* Category Badges */}
        <div className={`flex ${flexWrap.wrap} ${gap.compact}`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`category-${index + 1}`} size="sm" width="xs" rounded="full" />
          ))}
        </div>

        {/* Content Paragraphs */}
        <div className={spaceY.comfortable}>
          <Skeleton size="md" width="3xl" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="5/6" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="2/3" />
        </div>

        {/* Section Headers */}
        <div className={spaceY.relaxed}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`section-${index + 1}`} className={spaceY.default}>
              <Skeleton size="lg" width="sm" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="5/6" />
              <Skeleton size="sm" width="3xl" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}