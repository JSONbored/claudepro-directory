'use client';

/**
 * ProfileSearchClient - User Directory Display Component
 *
 * Architecture:
 * - Server-side search via PostgreSQL full-text search (search_users RPC)
 * - Client component only handles display (no filtering)
 * - Receives pre-filtered results from server component
 *
 * Performance:
 * - Server filters 1000+ users in 5-20ms (PostgreSQL GIN index)
 * - Client receives only relevant results (10-100x less data)
 * - No client-side search overhead
 *
 * @module components/features/community/profile-search-client
 */

import { memo } from 'react';
import { ProfileCard, type UserProfile } from '@/src/components/domain/profile-card';

export interface ProfileSearchClientProps {
  users: UserProfile[];
}

function ProfileSearchClientComponent({ users }: ProfileSearchClientProps) {
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No community members found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user, index) => (
        <ProfileCard key={user.slug || user.name || `user-${index}`} user={user} />
      ))}
    </div>
  );
}

export const ProfileSearchClient = memo(ProfileSearchClientComponent);
ProfileSearchClient.displayName = 'ProfileSearchClient';
