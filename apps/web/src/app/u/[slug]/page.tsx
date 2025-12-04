/**
 * User Profile Page - Database-First RPC Architecture
 * Single RPC call to get_user_profile() replaces 6+ separate queries
 */

import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPublicUserProfile,
} from '@heyclaude/web-runtime/data';
import { FolderOpen, Globe, Users } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  NavLink,
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
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
 * Constructs a safe collection URL for a user if both slugs are valid after sanitization.
 *
 * @param userSlug - The user-facing slug for the profile (sanitized before validation)
 * @param collectionSlug - The collection's slug (sanitized before validation)
 * @returns The path `/u/{sanitizedUserSlug}/collections/{sanitizedCollectionSlug}` or `null` if either slug is invalid
 * @see sanitizeSlug
 * @see isValidSlug
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
 * Produce a plain-text-safe display string from arbitrary input.
 *
 * Sanitizes the input by stripping dangerous/control characters, trimming whitespace,
 * and truncating to 200 characters; if the input is missing or yields no content after
 * sanitization, the provided `fallback` is returned.
 *
 * @param text - The input text to sanitize.
 * @param fallback - Value to return when `text` is missing or sanitization produces no content.
 * @returns The sanitized display string, or `fallback` if no safe content remains.
 *
 * @see sanitizeSlug
 * @see getSafeContentUrl
 * @see getSafeCollectionUrl
 */
function sanitizeDisplayText(text: null | string | undefined, fallback: string): string {
  if (!text || typeof text !== 'string') return fallback;
  // Remove all angle brackets to prevent HTML/script injection (safest for plain text display)
  // This completely eliminates any possibility of HTML tag injection
  let sanitized = text.replaceAll(/[<>]/g, '');
  // Remove control characters and dangerous Unicode by filtering character codes
  const dangerousChars = new Set([
    0x20_2e,
    0x20_2d,
    0x20_2c,
    0x20_2b,
    0x20_2a, // RTL override marks
    0x20_0e,
    0x20_0f, // Left-to-right/right-to-left marks
    0x20_66,
    0x20_67,
    0x20_68,
    0x20_69, // Directional isolates
  ]);
  sanitized = [...sanitized]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      // Allow tab (0x09), newline (0x0a), and printable characters outside control ranges
      const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f);
      const isPrintable = code === 0x09 || code === 0x0a || !isControl;
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
 * ISR revalidation interval for user profile pages
 */
export const revalidate = false;

/**
 * Produce page metadata for a user profile route using the provided slug.
 *
 * @param params - A promise resolving to an object with `slug`, the user identifier used to populate the route parameter.
 * @returns The Next.js `Metadata` for the /u/:slug user profile page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({ params }: UserProfilePageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/u/:slug', {
    params: { slug },
  });
}

/**
 * Render the user profile page for the provided route parameters.
 *
 * Loads the public user profile and renders the hero header, activity stats,
 * public collections, and contributions. If the slug is invalid or the profile
 * is not found, the page will trigger Next.js not-found handling.
 *
 * @param params - Route parameters containing the `slug` of the user to display.
 * @returns The React element for the user's profile page.
 *
 * @see getPublicUserProfile
 * @see getSafeCollectionUrl
 * @see getSafeContentUrl
 * @see sanitizeDisplayText
 */
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
  const viewerLogger = currentUser?.id ? reqLogger.child({ viewerId: currentUser.id }) : reqLogger;

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
    <div className="bg-background min-h-screen">
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
                  className="border-background h-24 w-24 rounded-full border-4 object-cover"
                  priority
                />
              ) : (
                <div className="border-background bg-accent flex h-24 w-24 items-center justify-center rounded-full border-4 text-2xl font-bold">
                  {(profile?.name ?? slug).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="mt-4">
                <h1 className="text-3xl font-bold">
                  {sanitizeDisplayText(profile?.name ?? slug, slug)}
                </h1>
                {(() => {
                  const sanitizedBio = profile?.bio ? sanitizeDisplayText(profile.bio, '') : '';
                  return sanitizedBio ? (
                    <p className="mt-2 max-w-2xl text-sm">{sanitizedBio}</p>
                  ) : null;
                })()}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Users className="h-4 w-4" />
                    {follower_count ?? 0} followers
                  </div>
                  <span>•</span>
                  <div>{following_count ?? 0} following</div>

                  {profile?.website ? (
                    <>
                      <span>•</span>
                      <NavLink
                        href={profile.website}
                        external
                        className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </NavLink>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {currentUser &&
            profile &&
            currentUser.id !== profile.id &&
            profile.id &&
            profile.slug ? (
              <FollowButton
                userId={profile.id}
                userSlug={profile.slug}
                initialIsFollowing={is_following ?? false}
              />
            ) : null}
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
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Contributions</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {contributions?.length ?? 0}
                  </UnifiedBadge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Collections</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {collections?.length ?? 0}
                  </UnifiedBadge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Member since</span>
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
              <h2 className="mb-4 text-2xl font-bold">Public Collections</h2>

              {!collections || collections.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <FolderOpen className="text-muted-foreground mb-4 h-12 w-12" />
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
                        viewerLogger.warn(
                          'UserProfilePage: skipping collection with invalid slug',
                          {
                            collectionId: collection.id,
                            collectionName: collection.name ?? 'Unknown',
                            collectionSlug: collection.slug,
                          }
                        );
                        return null;
                      }
                      return (
                        <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                          <NavLink href={safeCollectionUrl}>
                            <CardHeader>
                              <CardTitle className="text-lg">{collection.name}</CardTitle>
                              {collection.description ? (
                                <CardDescription className="line-clamp-2">
                                  {collection.description}
                                </CardDescription>
                              ) : null}
                            </CardHeader>
                            <CardContent>
                              <div
                                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-sm`}
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
            {contributions && contributions.length > 0 ? (
              <div>
                <h2 className="mb-4 text-2xl font-bold">Contributions</h2>
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
                        viewerLogger.warn(
                          'UserProfilePage: skipping contribution with invalid type or slug',
                          {
                            contentId: item.id,
                            contentType: item.content_type,
                            contentSlug: item.slug,
                          }
                        );
                        return null;
                      }
                      return (
                        <Card key={item.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                          <NavLink href={safeContentUrl}>
                            <CardHeader>
                              <div className="mb-2 flex items-center justify-between">
                                <UnifiedBadge variant="base" style="secondary" className="text-xs">
                                  {item.content_type}
                                </UnifiedBadge>
                                {item.featured ? (
                                  <UnifiedBadge variant="base" style="default" className="text-xs">
                                    Featured
                                  </UnifiedBadge>
                                ) : null}
                              </div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <CardDescription className="line-clamp-2 text-xs">
                                {item.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-muted-foreground flex items-center gap-2 text-xs">
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
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}