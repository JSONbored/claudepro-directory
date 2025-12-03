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
import { muted, grid, padding, textAlign } from '@heyclaude/web-runtime/design-system';
import {
  ProfileCard,
  type UserProfile,
} from '@/src/components/core/domain/cards/user-profile-card';

export interface ProfileSearchClientProps {
  users: UserProfile[];
}

function ProfileSearchClientComponent({ users }: ProfileSearchClientProps) {
  if (!users || users.length === 0) {
    return (
      <div className={`${padding.ySection} ${textAlign.center}`}>
        <p className={muted.default}>No community members found</p>
      </div>
    );
  }

  return (
    <div className={grid.responsive123}>
      {users.map((user, index) => (
        <ProfileCard key={user.slug || user.name || `user-${index}`} user={user} />
      ))}
    </div>
  );
}

export const ProfileSearchClient = memo(ProfileSearchClientComponent);
ProfileSearchClient.displayName = 'ProfileSearchClient';
