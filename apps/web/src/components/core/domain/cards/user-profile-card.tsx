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

import type { Database } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { Award, ExternalLink, Users } from '@heyclaude/web-runtime/icons';
import { badge, buttonGhost, iconSize, iconWrapper } from '@heyclaude/web-runtime/design-system';
import { memberBadge } from '@heyclaude/web-runtime/design-system';
import { memo } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { BaseCard } from '@heyclaude/web-runtime/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';

/**
 * Validate and sanitize external URL for safe use in window.open
 * Only allows HTTPS/HTTP URLs, returns canonicalized URL or null if invalid
 */
function getSafeExternalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol (or HTTP for localhost/development)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove credentials
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * User profile data with runtime-added stats from materialized views
 * Supports both full user records and simplified user objects from RPCs
 */
export type UserProfile = (
  | Database['public']['Tables']['users']['Row']
  | {
      id: string;
      slug: string;
      name: string;
      image: string | null;
      bio: string | null;
      work: string | null;
      tier: Database['public']['Enums']['user_tier'];
      created_at: string;
      interests?: string[] | null;
      website?: string | null;
      social_x_link?: string | null;
    }
) & {
  // Runtime-added stats (from materialized view)
  total_contributions?: number;
  followers_count?: number;
  following_count?: number;
  // Optional company data (from get_user_profile RPC)
  company?: {
    name: string;
    logo: string | null;
  } | null;
  // Optional fields that may be missing from simplified user objects
  interests?: string[] | null;
  website?: string | null;
  social_x_link?: string | null;
};

export interface ProfileCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

/**
 * Member type badge configuration based on user role/activity
 */
const getMemberBadge = (user: UserProfile) => {
  // Priority 1: Company owner (highest status)
  if (user.company) {
    return {
      label: 'Company Owner',
      className: memberBadge.owner,
    };
  }

  // Priority 2: Active contributor
  const contributionCount = user.total_contributions || 0;
  if (contributionCount >= 10) {
    return {
      label: 'Contributor',
      className: memberBadge.contributor,
    };
  }

  // Default: Member
  return {
    label: 'Member',
    className: memberBadge.member,
  };
};

/**
 * Renders a user profile card with avatar, badges, metadata, and optional action buttons.
 *
 * @param props.user - The user profile to display; may include runtime stats and optional company info.
 * @param props.variant - Visual variant of the card; "compact" reduces layout density, "default" is standard.
 * @param props.showActions - If true, renders action buttons (website, social link, view profile) when available.
 *
 * @returns A JSX element representing the profile card for the provided user.
 *
 * @see getMemberBadge
 * @see getSafeExternalUrl
 * @see BaseCard
 */
function ProfileCardComponent({ user, variant = 'default', showActions = true }: ProfileCardProps) {
  const pulse = usePulse();
  const memberBadge = getMemberBadge(user);
  const slug = user.slug || 'unknown';
  const username = `@${slug}`;
  const displayName = user.name || username;
  const profileUrl = `/u/${slug}`;

  // Generate initials for avatar fallback
  const initials =
    (user.name || slug)
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <BaseCard
      targetPath={profileUrl}
      displayTitle=""
      showActions={showActions}
      ariaLabel={`${username} - ${user.work || 'Community member'}`}
      showAuthor={false}
      compactMode={variant === 'compact'}
      renderHeader={() => (
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-accent/20 ring-offset-2 ring-offset-background">
            {user.image && (
              <AvatarImage src={user.image} alt={`${username}'s avatar`} className="object-cover" />
            )}
            <AvatarFallback className="bg-accent/10 font-semibold text-accent text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <div className="w-full min-w-0">
            <h3 className="truncate font-semibold text-base">{username}</h3>
            {user.work && (
              <p className="mt-0.5 truncate text-muted-foreground text-sm">{user.work}</p>
            )}
          </div>
        </div>
      )}
      renderTopBadges={() => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {/* Member type badge */}
          <UnifiedBadge
            variant="base"
            style="outline"
            className={`${badge.default} ${memberBadge.className}`}
          >
            {memberBadge.label}
          </UnifiedBadge>

          {/* Top interests (max 2) */}
          {user.interests?.slice(0, 2).map((interest) => (
            <UnifiedBadge
              key={interest}
              variant="base"
              style="secondary"
              className={`${badge.default} border-primary/20 text-primary`}
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
              className="h-7 gap-1.5 border-primary/20 bg-primary/10 font-medium text-primary"
            >
              <Award className={iconSize.xs} aria-hidden="true" />
              <span className={badge.default}>{user.total_contributions}</span>
            </UnifiedBadge>
          )}

          {/* Followers count */}
          {user.followers_count !== undefined && user.followers_count > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 gap-1.5 border-border bg-muted/50 font-medium text-foreground"
            >
              <Users className={iconSize.xs} aria-hidden="true" />
              <span className={badge.default}>{user.followers_count}</span>
            </UnifiedBadge>
          )}
        </>
      )}
      renderActions={() => (
        <>
          {/* Website link */}
          {user.website &&
            (() => {
              const safeWebsiteUrl = getSafeExternalUrl(user.website);
              if (!safeWebsiteUrl) return null;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${iconWrapper.sm} ${buttonGhost.icon}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pulse
                      .click({
                        category: null,
                        slug: null,
                        metadata: {
                          action: 'external_link',
                          link_type: 'website',
                          target_url: safeWebsiteUrl,
                          user_slug: slug,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise(
                          'UserProfileCard: website link click pulse failed',
                          error,
                          {
                            user_slug: slug,
                          }
                        );
                      });
                    window.open(safeWebsiteUrl, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Visit ${displayName}'s website`}
                >
                  <ExternalLink className={iconSize.xs} aria-hidden="true" />
                </Button>
              );
            })()}

          {/* Twitter/X link */}
          {user.social_x_link &&
            (() => {
              const safeSocialUrl = getSafeExternalUrl(user.social_x_link);
              if (!safeSocialUrl) return null;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${iconWrapper.sm} ${buttonGhost.icon}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pulse
                      .click({
                        category: null,
                        slug: null,
                        metadata: {
                          action: 'external_link',
                          link_type: 'social',
                          target_url: safeSocialUrl,
                          user_slug: slug,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise(
                          'UserProfileCard: social link click pulse failed',
                          error,
                          {
                            user_slug: slug,
                          }
                        );
                      });
                    window.open(safeSocialUrl, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Visit ${displayName} on X/Twitter`}
                >
                  <ExternalLink className={iconSize.xs} aria-hidden="true" />
                </Button>
              );
            })()}

          {/* View profile button */}
          {(() => {
            // Validate profile URL is safe (should be /u/{slug})
            const safeProfileUrl =
              profileUrl.startsWith('/u/') && /^\/u\/[a-zA-Z0-9-_]+$/.test(profileUrl)
                ? profileUrl
                : null;
            if (!safeProfileUrl) return null;
            return (
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1.5 px-2 text-xs ${buttonGhost.icon}`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = safeProfileUrl;
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