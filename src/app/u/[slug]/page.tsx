/**
 * User Profile Page - Database-First RPC Architecture
 * Single RPC call to get_user_profile() replaces 6+ separate queries
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FollowButton } from '@/src/components/core/buttons/social/follow-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getPublicUserProfile } from '@/src/lib/data/community/profile';
import { FolderOpen, Globe, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { sanitizeSlug } from '@/src/lib/utils/content.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetGetUserProfileReturn } from '@/src/types/database-overrides';
import { isContentCategory } from '@/src/types/database-overrides';

/**
 * Validate slug is safe for use in URLs
 * Only allows alphanumeric characters, hyphens, and underscores
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Get safe content URL from type and slug
 * Returns null if either is invalid
 * Uses centralized CONTENT_CATEGORY_VALUES to ensure consistency
 */
function getSafeContentUrl(type: string, slug: string): string | null {
  // Validate content type using centralized constant
  if (!isContentCategory(type)) return null;
  // Validate slug format
  if (!isValidSlug(slug)) return null;
  // sanitizeSlug preserves already-valid slugs, so no need to re-validate
  const sanitizedSlug = sanitizeSlug(slug);
  return `/${type}/${sanitizedSlug}`;
}

/**
 * Get safe collection URL from user slug and collection slug
 * Returns null if either is invalid
 */
function getSafeCollectionUrl(userSlug: string, collectionSlug: string): string | null {
  // Validate both slugs
  if (!(isValidSlug(userSlug) && isValidSlug(collectionSlug))) return null;
  // sanitizeSlug preserves already-valid slugs, so no need to re-validate
  const sanitizedUserSlug = sanitizeSlug(userSlug);
  const sanitizedCollectionSlug = sanitizeSlug(collectionSlug);
  return `/u/${sanitizedUserSlug}/collections/${sanitizedCollectionSlug}`;
}

/**
 * Sanitize display text for safe use in text content
 * Removes HTML tags, script content, and dangerous characters
 */
function sanitizeDisplayText(text: string | null | undefined, fallback: string): string {
  if (!text || typeof text !== 'string') return fallback;
  // Remove all angle brackets to prevent HTML/script injection (safest for plain text display)
  // This completely eliminates any possibility of HTML tag injection
  let sanitized = text.replace(/[<>]/g, '');
  // Remove control characters and dangerous Unicode by filtering character codes
  const dangerousChars = [
    0x202e,
    0x202d,
    0x202c,
    0x202b,
    0x202a, // RTL override marks
    0x200e,
    0x200f, // Left-to-right/right-to-left marks
    0x2066,
    0x2067,
    0x2068,
    0x2069, // Directional isolates
  ];
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow tab (0x09), newline (0x0a), and printable characters outside control ranges
      const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f);
      const isPrintable = code === 0x09 || code === 0x0a || !isControl;
      return isPrintable && !dangerousChars.includes(code);
    })
    .join('');
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 200);
  return sanitized.length > 0 ? sanitized : fallback;
}

interface UserProfilePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * ISR revalidation interval for user profile pages
 */
export const revalidate = false;

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/u/:slug', {
    params: { slug },
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { slug } = await params;

  // Validate route slug before hitting the data layer
  if (!isValidSlug(slug)) {
    logger.warn('UserProfilePage: invalid user slug', { slug });
    notFound();
  }

  const { user: currentUser } = await getAuthenticatedUser({
    requireUser: false,
    context: 'UserProfilePage',
  });

  let profileData: GetGetUserProfileReturn | null = null;
  try {
    profileData = await getPublicUserProfile({
      slug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user profile detail');
    logger.error('UserProfilePage: get_user_profile threw', normalized, {
      slug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
    throw normalized;
  }

  if (!profileData) {
    logger.warn('UserProfilePage: user profile not found', { slug });
    notFound();
  }

  // Type-safe RPC return using centralized type definition
  const { profile, stats, collections, contributions, isFollowing } = profileData;

  const { followerCount, followingCount } = stats;

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero/Profile Header */}
      <section className="relative">
        <div className={'container mx-auto px-4'}>
          <div className="flex items-start justify-between pt-12">
            <div className="flex items-start gap-4">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={`${profile.name || slug}'s profile picture`}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full border-4 border-background object-cover"
                  priority={true}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-accent font-bold text-2xl">
                  {(profile.name || slug).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="mt-4">
                <h1 className="font-bold text-3xl">{sanitizeDisplayText(profile.name, slug)}</h1>
                {(() => {
                  const sanitizedBio = profile.bio ? sanitizeDisplayText(profile.bio, '') : '';
                  return sanitizedBio ? (
                    <p className={'mt-2 max-w-2xl text-sm'}>{sanitizedBio}</p>
                  ) : null;
                })()}

                <div className={'mt-3 flex items-center gap-4 text-sm'}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Users className="h-4 w-4" />
                    {followerCount || 0} followers
                  </div>
                  <span>•</span>
                  <div>{followingCount || 0} following</div>

                  {profile.website && (
                    <>
                      <span>•</span>
                      <NavLink
                        href={profile.website}
                        external={true}
                        className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </NavLink>
                    </>
                  )}
                </div>
              </div>
            </div>

            {currentUser && currentUser.id !== profile.id && profile.slug && (
              <FollowButton
                userId={profile.id}
                userSlug={profile.slug}
                initialIsFollowing={isFollowing}
              />
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={'container mx-auto px-4 py-12'}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Contributions</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {contributions?.length || 0}
                  </UnifiedBadge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Collections</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {collections?.length || 0}
                  </UnifiedBadge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Member since</span>
                  <span className="text-sm">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="space-y-6 md:col-span-2">
            {/* Public Collections */}
            <div>
              <h2 className="mb-4 font-bold text-2xl">Public Collections</h2>

              {!collections || collections.length === 0 ? (
                <Card>
                  <CardContent className={'flex flex-col items-center py-12'}>
                    <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No public collections yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {collections.map((collection) => {
                    const safeCollectionUrl = getSafeCollectionUrl(slug, collection.slug);
                    if (!safeCollectionUrl) return null;
                    return (
                      <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                        <a href={safeCollectionUrl}>
                          <CardHeader>
                            <CardTitle className="text-lg">{collection.name}</CardTitle>
                            {collection.description && (
                              <CardDescription className="line-clamp-2">
                                {collection.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div
                              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-sm`}
                            >
                              <span className="text-muted-foreground">
                                {collection.item_count}{' '}
                                {collection.item_count === 1 ? 'item' : 'items'}
                              </span>
                              <span className="text-muted-foreground">
                                {collection.view_count} views
                              </span>
                            </div>
                          </CardContent>
                        </a>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Contributions */}
            {contributions && contributions.length > 0 && (
              <div>
                <h2 className="mb-4 font-bold text-2xl">Contributions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contributions.map((item) => {
                    const safeContentUrl = getSafeContentUrl(item.content_type, item.slug);
                    if (!safeContentUrl) return null;
                    return (
                      <Card key={item.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                        <a href={safeContentUrl}>
                          <CardHeader>
                            <div className={'mb-2 flex items-center justify-between'}>
                              <UnifiedBadge variant="base" style="secondary" className="text-xs">
                                {item.content_type}
                              </UnifiedBadge>
                              {item.featured && (
                                <UnifiedBadge variant="base" style="default" className="text-xs">
                                  Featured
                                </UnifiedBadge>
                              )}
                            </div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div
                              className={'flex items-center gap-2 text-muted-foreground text-xs'}
                            >
                              <span>{item.view_count || 0} views</span>
                              <span>•</span>
                              <span>{item.download_count || 0} downloads</span>
                            </div>
                          </CardContent>
                        </a>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
