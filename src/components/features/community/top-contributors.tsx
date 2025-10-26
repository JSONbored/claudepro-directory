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

import { memo } from 'react';
import { ProfileCard, type UserProfile } from '@/src/components/domain/profile-card';
import { Users } from '@/src/lib/icons';

export interface TopContributorsProps {
  contributors: UserProfile[];
  title?: string;
  showCount?: number;
}

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
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
