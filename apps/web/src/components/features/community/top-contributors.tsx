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

import { Users } from '@heyclaude/web-runtime/icons';
import { iconSize } from '@heyclaude/web-runtime/design-system';
import { memo } from 'react';
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
    <section className="container mx-auto px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Users className={`${iconSize.lg} text-accent`} />
        <h2 className="font-bold text-2xl">{title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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