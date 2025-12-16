'use client';

/**
 * TopContributors - Horizontal showcase of new community members
 *
 * Architecture:
 * - Reuses ProfileCard component (composition over duplication)
 * - Performance: React.memo + TanStack Virtual for 60fps
 * - Configuration-driven display logic
 * - Mobile-responsive with horizontal scroll
 *
 * @module components/features/community/top-contributors
 */

import { Users } from '@heyclaude/web-runtime/icons';
import { memo } from 'react';

import {
  ProfileCard,
  type UserProfile,
} from '@/src/components/core/domain/cards/user-profile-card';
import { iconSize, paddingX, paddingY, marginX, marginBottom, gap, size, weight } from "@heyclaude/web-runtime/design-system";

export interface TopContributorsProps {
  contributors: UserProfile[];
  showCount?: number;
  title?: string;
}

function TopContributorsComponent({
  contributors,
  title = 'New Community Members',
  showCount = 6,
}: TopContributorsProps) {
  const displayedContributors = contributors.slice(0, showCount);

  if (displayedContributors.length === 0) {
    return null;
  }

  return (
    <section className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
      <div className={`${marginBottom.comfortable} flex items-center ${gap.compact}`}>
        <Users className={`${iconSize.lg} text-accent`} />
        <h2 className={`${size['2xl']} ${weight.bold}`}>{title}</h2>
      </div>

      <div className={`grid grid-cols-1 ${gap.default} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}>
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
