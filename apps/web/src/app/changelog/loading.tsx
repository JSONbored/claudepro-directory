/**
 * Changelog List Loading State
 *
 * Loading skeleton for changelog page while data is being fetched.
 * Shows placeholder cards matching the layout of ChangelogCard components.
 */

import {
  cluster,
  spaceY,
  marginBottom,
  padding,
  gap,
  radius,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { PageHeaderSkeleton, Skeleton } from '@heyclaude/web-runtime/ui';

/**
 * Render a loading skeleton for the changelog page.
 *
 * Renders placeholder UI for the changelog interface: a header skeleton (including a page header and small chips),
 * a responsive category filter row with seven tab placeholders, and six changelog card placeholders each showing
 * title, description, and tag skeletons.
 *
 * @returns A JSX element containing skeleton placeholders for the header, category filters, and changelog cards.
 *
 * @see PageHeaderSkeleton
 * @see Skeleton
 * @see cluster
 */
export default function ChangelogLoading() {
  return (
    <div className={`container ${maxWidth['6xl']} ${spaceY.loose} ${padding.yRelaxed}`}>
      {/* Header Skeleton */}
      <div className={spaceY.comfortable}>
        <Skeleton size="sm" width="xs" className={marginBottom.default} />
        <PageHeaderSkeleton />
        <div className={cluster.relaxed}>
          <Skeleton size="sm" width="lg" />
          <Skeleton size="sm" width="lg" />
        </div>
      </div>

      {/* Category Filter Skeleton */}
      <div className={`grid w-full ${gap.tight} lg:w-auto lg:grid-flow-col`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`tab-${index + 1}`} size="lg" width="lg" rounded="md" />
        ))}
      </div>

      {/* Changelog Cards Skeleton */}
      <div className={spaceY.relaxed}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`changelog-skeleton-${index + 1}`}
            className={`${radius.lg} bg-card border ${padding.comfortable}`}
          >
            <div className={`${marginBottom.compact} ${cluster.compact}`}>
              <Skeleton size="sm" width="xs" />
              <Skeleton size="sm" width="sm" />
            </div>
            <Skeleton size="lg" width="2/3" className={marginBottom.tight} />
            <Skeleton size="sm" width="3xl" className={marginBottom.default} />
            <div className={`flex flex-wrap ${gap.compact}`}>
              <Skeleton size="sm" width="xs" rounded="full" />
              <Skeleton size="sm" width="xs" rounded="full" />
              <Skeleton size="sm" width="xs" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
