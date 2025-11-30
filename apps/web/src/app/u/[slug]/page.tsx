/**
 * User Profile Page - Database-First RPC Architecture
 * Single RPC call to get_user_profile() replaces 6+ separate queries
 */

import  { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPublicUserProfile,
} from '@heyclaude/web-runtime/data';
import { between, card, cluster, muted } from '@heyclaude/web-runtime/design-system';
import { FolderOpen, Globe, Users } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle   } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { FollowButton } from '@/src/components/core/buttons/social/follow-button';

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isContentCategory(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

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
function getSafeContentUrl(type: string, slug: string): null | string {
  // Validate content type using centralized constant
  if (!isContentCategory(type)) return null;
  // Sanitize slug first, then validate the sanitized result
  // sanitizeSlug preserves already-valid slugs, so this catches any issues
  const sanitizedSlug = sanitizeSlug(slug);
  if (!isValidSlug(sanitizedSlug)) return null;
  return `/${type}/${sanitizedSlug}`;
}

/**
 * Get safe collection URL from user slug and collection slug
 * Returns null if either is invalid
 */
function getSafeCollectionUrl(userSlug: string, collectionSlug: string): null | string {
  // Sanitize slugs first, then validate the sanitized results
  // sanitizeSlug preserves already-valid slugs, so this catches any issues
  const sanitizedUserSlug = sanitizeSlug(userSlug);
  const sanitizedCollectionSlug = sanitizeSlug(collectionSlug);
  if (!(isValidSlug(sanitizedUserSlug) && isValidSlug(sanitizedCollectionSlug))) return null;
  return `/u/${sanitizedUserSlug}/collections/${sanitizedCollectionSlug}`;
}

/**
 * Sanitize display text for safe use in text content
 * Removes HTML tags, script content, and dangerous characters
 */
function sanitizeDisplayText(text: null | string | undefined, fallback: string): string {
  if (!text || typeof text !== 'string') return fallback;
  // Remove all angle brackets to prevent HTML/script injection (safest for plain text display)
  // This completely eliminates any possibility of HTML tag injection
  let sanitized = text.replaceAll(/[<>]/g, '');
  // Remove control characters and dangerous Unicode by filtering character codes
  const dangerousChars = new Set([
    0x20_2E,
    0x20_2D,
    0x20_2C,
    0x20_2B,
    0x20_2A, // RTL override marks
    0x20_0E,
    0x20_0F, // Left-to-right/right-to-left marks
    0x20_66,
    0x20_67,
    0x20_68,
    0x20_69, // Directional isolates
  ]);
  sanitized = [...sanitized]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      // Allow tab (0x09), newline (0x0a), and printable characters outside control ranges
      const isControl = code < 0x20 || (code >= 0x7F && code <= 0x9F);
      const isPrintable = code === 0x09 || code === 0x0A || !isControl;
      return isPrintable && !dangerousChars.has(code);
    })
    .join('');
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 200);
  return sanitized.length > 0 ? sanitized : fallback;
}

interface UserProfilePageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Cache forever - fully static generation without revalidation
 */
export const revalidate = false;

export async function generateMetadata({ params }: UserProfilePageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/u/:slug', {
    params: { slug },
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProperties) {
  const { slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'UserProfilePage',
    route: `/u/${slug}`,
    module: 'apps/web/src/app/u/[slug]',
  });

  // Section: Slug Validation
  if (!isValidSlug(slug)) {
    reqLogger.warn('UserProfilePage: invalid user slug', {
      section: 'slug-validation',
    });
    notFound();
  }

  const { user: currentUser } = await getAuthenticatedUser({
    requireUser: false,
    context: 'UserProfilePage',
  });

  // Create child logger with viewer context if available
  const viewerLogger = currentUser?.id 
    ? reqLogger.child({ viewerId: currentUser.id })
    : reqLogger;

  // Section: User Profile Fetch
  let profileData: Database['public']['Functions']['get_user_profile']['Returns'] | null = null;
  try {
    profileData = await getPublicUserProfile({
      slug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
    viewerLogger.info('UserProfilePage: user profile loaded', {
      section: 'user-profile-fetch',
      hasProfile: !!profileData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user profile detail');
    viewerLogger.error('UserProfilePage: get_user_profile threw', normalized, {
      section: 'user-profile-fetch',
    });
    throw normalized;
  }

  if (!profileData) {
    viewerLogger.warn('UserProfilePage: user profile not found', {
      section: 'user-profile-fetch',
    });
    notFound();
  }

  // Type-safe RPC return using centralized type definition
  const { profile, stats, collections, contributions, is_following } = profileData;

  const { follower_count, following_count } = stats ?? {};

  return (
    <div className="min-h-screen bg-background">
      {/* Hero/Profile Header */}
      <section className="relative">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between pt-12">
            <div className="flex items-start gap-4">
              {profile?.image ? (
                <Image
                  src={profile.image}
                  alt={`${sanitizeDisplayText(profile.name ?? slug, slug)}'s profile picture`}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full border-4 border-background object-cover"
                  priority
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-accent font-bold text-2xl">
                  {(profile?.name ?? slug).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="mt-4">
                <h1 className="font-bold text-3xl">
                  {sanitizeDisplayText(profile?.name ?? slug, slug)}
                </h1>
                {(() => {
                  const sanitizedBio = profile?.bio ? sanitizeDisplayText(profile.bio, '') : '';
                  return sanitizedBio ? (
                    <p className="mt-2 max-w-2xl text-sm">{sanitizedBio}</p>
                  ) : null;
                })()}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className={cluster.tight}>
                    <Users className="h-4 w-4" />
                    {follower_count ?? 0} followers
                  </div>
                  <span>•</span>
                  <div>{following_count ?? 0} following</div>

                  {profile?.website ? <>
                      <span>•</span>
                      <NavLink
                        href={profile.website}
                        external
                        className={cluster.tight}
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </NavLink>
                    </> : null}
                </div>
              </div>
            </div>

            {currentUser && profile && currentUser.id !== profile.id && profile.id && profile.slug ? <FollowButton
                userId={profile.id}
                userSlug={profile.slug}
                initialIsFollowing={is_following ?? false}
              /> : null}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={between.center}>
                  <span className={`${muted.default} text-sm`}>Contributions</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {contributions?.length ?? 0}
                  </UnifiedBadge>
                </div>
                <div className={between.center}>
                  <span className={`${muted.default} text-sm`}>Collections</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {collections?.length ?? 0}
                  </UnifiedBadge>
                </div>
                <div className={between.center}>
                  <span className={`${muted.default} text-sm`}>Member since</span>
                  <span className="text-sm">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
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
                  <CardContent className="flex flex-col items-center py-12">
                    <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No public collections yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {collections
                    .filter(
                      (
                        collection
                      ): collection is typeof collection & {
                        id: string;
                        name: null | string;
                        slug: string;
                      } =>
                        collection.id !== null &&
                        collection.slug !== null &&
                        collection.name !== null
                    )
                    .map((collection) => {
                      const safeCollectionUrl = getSafeCollectionUrl(slug, collection.slug);
                      if (!safeCollectionUrl) {
                        viewerLogger.warn('UserProfilePage: skipping collection with invalid slug', {
                          collectionId: collection.id,
                          collectionName: collection.name ?? 'Unknown',
                          collectionSlug: collection.slug,
                        });
                        return null;
                      }
                      return (
                        <Card key={collection.id} className={card.interactive}>
                          <NavLink href={safeCollectionUrl}>
                            <CardHeader>
                              <CardTitle className="text-lg">{collection.name}</CardTitle>
                              {collection.description ? <CardDescription className="line-clamp-2">
                                  {collection.description}
                                </CardDescription> : null}
                            </CardHeader>
                            <CardContent>
                              <div
                                className={`${between.center} text-sm`}
                              >
                                <span className="text-muted-foreground">
                                  {collection.item_count ?? 0}{' '}
                                  {(collection.item_count ?? 0) === 1 ? 'item' : 'items'}
                                </span>
                                <span className="text-muted-foreground">
                                  {collection.view_count ?? 0} views
                                </span>
                              </div>
                            </CardContent>
                          </NavLink>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Content Contributions */}
            {contributions && contributions.length > 0 ? <div>
                <h2 className="mb-4 font-bold text-2xl">Contributions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contributions
                    .filter(
                      (
                        item
                      ): item is typeof item & {
                        content_type: Database['public']['Enums']['content_category'];
                        id: string;
                        name: null | string;
                        slug: string;
                      } =>
                        item.id !== null &&
                        item.content_type !== null &&
                        item.slug !== null &&
                        item.name !== null
                    )
                    .map((item) => {
                      const safeContentUrl = getSafeContentUrl(item.content_type, item.slug);
                      if (!safeContentUrl) {
                        viewerLogger.warn('UserProfilePage: skipping contribution with invalid type or slug', {
                          contentId: item.id,
                          contentType: item.content_type,
                          contentSlug: item.slug,
                        });
                        return null;
                      }
                      return (
                        <Card key={item.id} className={card.interactive}>
                          <NavLink href={safeContentUrl}>
                            <CardHeader>
                              <div className="mb-2 flex items-center justify-between">
                                <UnifiedBadge variant="base" style="secondary" className="text-xs">
                                  {item.content_type}
                                </UnifiedBadge>
                                {item.featured ? <UnifiedBadge variant="base" style="default" className="text-xs">
                                    Featured
                                  </UnifiedBadge> : null}
                              </div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <CardDescription className="line-clamp-2 text-xs">
                                {item.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div
                                className="flex items-center gap-2 text-muted-foreground text-xs"
                              >
                                <span>{item.view_count ?? 0} views</span>
                                <span>•</span>
                                <span>{item.download_count ?? 0} downloads</span>
                              </div>
                            </CardContent>
                          </NavLink>
                        </Card>
                      );
                    })}
                </div>
              </div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
