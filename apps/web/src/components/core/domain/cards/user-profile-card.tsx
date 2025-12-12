'use client';

/**
 * ProfileCard Component - User-Focused Profile Display
 *
 * Architecture:
 * - Reuses BaseCard for composition (zero duplication)
 * - Avatar-first design with user image display
 * - Configuration-driven badge/metadata rendering
 * - Performance optimized with React.memo
 * - SEO-friendly with proper ARIA labels
 * - Secure with validated data
 *
 * @module components/domain/profile-card
 */

import { type Database } from '@heyclaude/database-types';
import { Award, Users } from '@heyclaude/web-runtime/icons';
import {
  BADGE_COLORS,
  UI_CLASSES,
  UnifiedBadge,
  BaseCard,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@heyclaude/web-runtime/ui';
import { memo } from 'react';

import { ExternalLinkButton } from './external-link-button';

/**
 * User profile data with runtime-added stats from materialized views
 * Supports both full user records and simplified user objects from RPCs
 */
export type UserProfile = {
  // Optional company data (from get_user_profile RPC)
  company?: null | {
    logo: null | string;
    name: string;
  };
  followers_count?: number;
  following_count?: number;
  // Optional fields that may be missing from simplified user objects
  interests?: null | string[];
  social_x_link?: null | string;
  // Runtime-added stats (from materialized view)
  total_contributions?: number;
  website?: null | string;
} & (
  | Database['public']['Tables']['users']['Row']
  | {
      bio: null | string;
      created_at: string;
      id: string;
      image: null | string;
      interests?: null | string[];
      name: string;
      slug: string;
      social_x_link?: null | string;
      tier: Database['public']['Enums']['user_tier'];
      website?: null | string;
      work: null | string;
    }
);

export interface ProfileCardProps {
  showActions?: boolean;
  user: UserProfile;
  variant?: 'compact' | 'default';
}

/**
 * Member type badge configuration based on user role/activity
 */
const getMemberBadge = (user: UserProfile) => {
  // Priority 1: Company owner (highest status)
  if (user.company) {
    return {
      label: 'Company Owner',
      className: BADGE_COLORS.memberType.owner,
    };
  }

  // Priority 2: Active contributor
  const contributionCount = user.total_contributions || 0;
  if (contributionCount >= 10) {
    return {
      label: 'Contributor',
      className: BADGE_COLORS.memberType.contributor,
    };
  }

  // Default: Member
  return {
    label: 'Member',
    className: BADGE_COLORS.memberType.member,
  };
};

/**
 * Render a profile card for a user with avatar, badges, metadata, and optional action buttons.
 *
 * Renders an avatar (image or fallback initials), display name and work title, top badges (member type and up to two interests),
 * metadata badges (contributions and followers), and optional action buttons for website, social link, and viewing the full profile.
 *
 * @param user - The user profile data to display; may include optional fields such as `image`, `slug`, `name`, `work`, `interests`, `website`, `social_x_link`, `total_contributions`, and `followers_count`.
 * @param variant - Layout variant; `'compact'` reduces visual spacing, `'default'` uses the normal layout.
 * @param showActions - When true, renders action buttons (website, social link, view profile) when corresponding data is available.
 * @returns A React element representing the profile card for the given user.
 *
 * @see BaseCard
 * @see getSafeExternalUrl
 * @see getMemberBadge
 */
function ProfileCardComponent({ user, variant = 'default', showActions = true }: ProfileCardProps) {
  const memberBadge = getMemberBadge(user);
  const slug = user.slug;
  const username = slug ? `@${slug}` : 'User';
  const displayName = user.name || username;
  const profileUrl = slug ? `/u/${slug}` : null;

  // Generate initials for avatar fallback
  const initials =
    (user.name || slug || 'User')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <BaseCard
      {...(profileUrl ? { targetPath: profileUrl } : {})}
      displayTitle=""
      showActions={showActions}
      ariaLabel={`${username} - ${user.work || 'Community member'}`}
      showAuthor={false}
      compactMode={variant === 'compact'}
      renderHeader={() => (
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar */}
          <Avatar className="ring-accent/20 ring-offset-background h-16 w-16 ring-2 ring-offset-2">
            {user.image ? (
              <AvatarImage src={user.image} alt={`${username}'s avatar`} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-accent/10 text-accent text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <div className="w-full min-w-0">
            <h3 className="truncate text-base font-semibold">{username}</h3>
            {user.work ? (
              <p className="text-muted-foreground mt-0.5 truncate text-sm">{user.work}</p>
            ) : null}
          </div>
        </div>
      )}
      renderTopBadges={() => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {/* Member type badge */}
          <UnifiedBadge
            variant="base"
            style="outline"
            className={`${UI_CLASSES.TEXT_BADGE} ${memberBadge.className}`}
          >
            {memberBadge.label}
          </UnifiedBadge>

          {/* Top interests (max 2) */}
          {user.interests?.slice(0, 2).map((interest) => (
            <UnifiedBadge
              key={interest}
              variant="base"
              style="secondary"
              className={`${UI_CLASSES.TEXT_BADGE} border-primary/20 text-primary`}
            >
              {interest}
            </UnifiedBadge>
          ))}
        </div>
      )}
      renderMetadataBadges={() => (
        <>
          {/* Contributions count */}
          {user.total_contributions !== undefined && user.total_contributions > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="border-primary/20 bg-primary/10 text-primary h-7 gap-1.5 font-medium"
            >
              <Award className={UI_CLASSES.ICON_XS} aria-hidden="true" />
              <span className={UI_CLASSES.TEXT_BADGE}>{user.total_contributions}</span>
            </UnifiedBadge>
          )}

          {/* Followers count */}
          {user.followers_count !== undefined && user.followers_count > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="border-border bg-muted/50 text-foreground h-7 gap-1.5 font-medium"
            >
              <Users className={UI_CLASSES.ICON_XS} aria-hidden="true" />
              <span className={UI_CLASSES.TEXT_BADGE}>{user.followers_count}</span>
            </UnifiedBadge>
          )}
        </>
      )}
      renderActions={() => (
        <>
          {/* Website link */}
          {user.website && slug ? (
            <ExternalLinkButton
              url={user.website}
              linkType="website"
              ariaLabel={`Visit ${displayName}'s website`}
              userSlug={slug}
            />
          ) : null}

          {/* Twitter/X link */}
          {user.social_x_link && slug ? (
            <ExternalLinkButton
              url={user.social_x_link}
              linkType="social"
              ariaLabel={`Visit ${displayName} on ${user.social_x_link.includes('twitter') ? 'Twitter' : 'X'}`}
              userSlug={slug}
            />
          ) : null}

          {/* View profile button - only show if slug exists */}
          {(() => {
            // Validate profile URL is safe (should be /u/{slug})
            if (!profileUrl) return null;
            const safeProfileUrl =
              profileUrl.startsWith('/u/') && /^\/u\/[a-zA-Z0-9-_]+$/.test(profileUrl)
                ? profileUrl
                : null;
            if (!safeProfileUrl) return null;
            return (
              <Button
                variant="ghost"
                size="sm"
                className={`${UI_CLASSES.BUTTON_ICON_TEXT_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                onClick={(e) => {
                  e.stopPropagation();
                  globalThis.location.href = safeProfileUrl;
                }}
                aria-label={`View ${displayName}'s profile`}
              >
                View
              </Button>
            );
          })()}
        </>
      )}
      customMetadataText={null}
    />
  );
}

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';