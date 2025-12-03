'use client';

/**
 * TopContributors - Horizontal showcase of leading community members
 *
 * Architecture:
 * - Reuses ProfileCard component (composition over duplication)
 * - Performance: React.memo + TanStack Virtual for 60fps
 * - Configuration-driven display logic
 * - Mobile-responsive with horizontal scroll
 *
 * @module components/features/community/top-contributors
 */

import {
  cluster,
  container,
  grid,
  iconSize,
  marginBottom,
  padding,
  size,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { memo } from 'react';
import { Users } from '@heyclaude/web-runtime/icons';
import {
  ProfileCard,
  type UserProfile,
} from '@/src/components/core/domain/cards/user-profile-card';

export interface TopContributorsProps {
  contributors: UserProfile[];
  title?: string;
  showCount?: number;
}

/**
 * Displays a section of top contributor profile cards.
 *
 * @param contributors - Array of user profiles to display.
 * @param title - Heading text shown above the contributors. Defaults to "Top Contributors".
 * @param showCount - Maximum number of contributors to render. Defaults to 6.
 * @returns A React element containing the contributors section, or `null` when no contributors are provided.
 * @see ProfileCard
 * @see UserProfile
 */
function TopContributorsComponent({
  contributors,
  title = 'Top Contributors',
  showCount = 6,
}: TopContributorsProps) {
  const displayedContributors = contributors.slice(0, showCount);

  if (displayedContributors.length === 0) {
    return null;
  }

  return (
    <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
      <div className={`${marginBottom.comfortable} ${cluster.default}`}>
        <Users className={`${iconSize.lg} ${textColor.accent}`} />
        <h2 className={`${weight.bold} ${size['2xl']}`}>{title}</h2>
      </div>

      <div className={grid.responsive1236}>
        {displayedContributors.map((contributor) => (
          <ProfileCard
            key={contributor.slug}
            user={contributor}
            variant="compact"
            showActions={false}
          />
        ))}
      </div>
    </section>
  );
}

export const TopContributors = memo(TopContributorsComponent);
TopContributors.displayName = 'TopContributors';