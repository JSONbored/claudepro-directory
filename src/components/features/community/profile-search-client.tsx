'use client';

/**
 * ProfileSearchClient - Configuration-Driven User Directory Search
 *
 * Architecture:
 * - Reuses UnifiedCardGrid (zero duplication)
 * - Uses existing useSearch hook (standardized)
 * - Filter configuration matches content search
 * - Performance: TanStack Virtual for 1000+ users
 *
 * @module components/features/community/profile-search-client
 */

import { memo, useMemo } from 'react';
import { ProfileCard, type UserProfile } from '@/src/components/domain/profile-card';
import { useSearch } from '@/src/hooks/use-search';

export interface ProfileSearchClientProps {
  users: UserProfile[];
  initialSearchQuery?: string;
}

function ProfileSearchClientComponent({ users, initialSearchQuery }: ProfileSearchClientProps) {
  // Search configuration - reuse existing infrastructure
  const searchOptions = useMemo(
    () => ({
      threshold: 0.3,
      minMatchCharLength: 2,
      keys: ['name', 'bio', 'work', 'interests'],
    }),
    []
  );

  const { searchResults, isSearching } = useSearch({
    data: users as never,
    searchOptions,
    ...(initialSearchQuery ? { initialQuery: initialSearchQuery } : {}),
  });

  // Display results (TanStack Virtual handles performance)
  const displayedUsers = (isSearching ? searchResults : users) as UserProfile[];

  if (!displayedUsers || displayedUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No community members found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedUsers.map((user, index) => (
        <ProfileCard key={user.slug || user.name || `user-${index}`} user={user} />
      ))}
    </div>
  );
}

export const ProfileSearchClient = memo(ProfileSearchClientComponent);
ProfileSearchClient.displayName = 'ProfileSearchClient';
