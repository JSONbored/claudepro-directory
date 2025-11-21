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

import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/primitives/ui/avatar';
import { Button } from '@/src/components/primitives/ui/button';
import { usePulse } from '@/src/hooks/use-pulse';
import { Award, ExternalLink, Users } from '@/src/lib/icons';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

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
      tier: 'free' | 'pro' | 'enterprise';
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
              className="h-7 gap-1.5 border-primary/20 bg-primary/10 font-medium text-primary"
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
              className="h-7 gap-1.5 border-border bg-muted/50 font-medium text-foreground"
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
          {user.website &&
            (() => {
              const safeWebsiteUrl = getSafeExternalUrl(user.website);
              if (!safeWebsiteUrl) return null;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
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
                    window.open(safeWebsiteUrl, '_blank');
                  }}
                  aria-label={`Visit ${displayName}'s website`}
                >
                  <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
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
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
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
                    window.open(safeSocialUrl, '_blank');
                  }}
                  aria-label={`Visit ${displayName} on X/Twitter`}
                >
                  <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
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
                className={`${UI_CLASSES.BUTTON_ICON_TEXT_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
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
