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
import { Globe } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { FollowButton } from '@/src/components/core/buttons/social/follow-button';
import { ProfileCollectionsSection } from '@/src/components/features/account/profile-collections-section';
import { ProfileContributionsSection } from '@/src/components/features/account/profile-contributions-section';
import { ProfileSocialStats } from '@/src/components/features/account/profile-social-stats';
import { ProfileStatsCard } from '@/src/components/features/account/profile-stats-card';
import { ProfileTabs } from '@/src/components/features/account/profile-tabs';

import Loading from './loading';

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

/***
 * Validate slug is safe for use in URLs
 * Only allows alphanumeric characters, hyphens, and underscores
 * @param {string} slug
 
 * @returns {unknown} Description of return value*/
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/****
 * Build a validated, sanitized URL path for a content item.
 *
 * Validates that `type` is a recognized content category and that `slug`
 * can be sanitized into a valid path segment; returns `null` if validation fails.
 *
 * @param {string} type - Content category (must be a valid content category string)
 * @param {string} slug - Candidate slug to sanitize and validate for use in the path
 * @returns The path in the form `/{type}/{sanitizedSlug}` when valid, `null` otherwise
 *
 * @see sanitizeSlug
 * @see isValidSlug
 * @see isContentCategory
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

/****
 * Constructs a safe collection URL for a user if both slugs are valid after sanitization.
 *
 * @param {string} userSlug - The user-facing slug for the profile (sanitized before validation)
 * @param {string} collectionSlug - The collection's slug (sanitized before validation)
 * @returns The path `/u/{sanitizedUserSlug}/collections/{sanitizedCollectionSlug}` or `null` if either slug is invalid
 * @see sanitizeSlug
 * @see isValidSlug
 */
function getSafeCollectionUrl(userSlug: string, collectionSlug: string): null | string {
  // Sanitize slugs first, then validate the sanitized results
  // sanitizeSlug preserves already-valid slugs, so this catches any issues
  const sanitizedUserSlug = sanitizeSlug(userSlug);
  const sanitizedCollectionSlug = sanitizeSlug(collectionSlug);
  if (!isValidSlug(sanitizedUserSlug) || !isValidSlug(sanitizedCollectionSlug)) return null;
  return `/u/${sanitizedUserSlug}/collections/${sanitizedCollectionSlug}`;
}

/****
 * Produce a plain-text-safe display string from arbitrary input.
 *
 * Sanitizes the input by stripping dangerous/control characters, trimming whitespace,
 * and truncating to 200 characters; if the input is missing or yields no content after
 * sanitization, the provided `fallback` is returned.
 *
 * @param {null | string | undefined} text - The input text to sanitize.
 * @param {string} fallback - Value to return when `text` is missing or sanitization produces no content.
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
 * Produce page metadata for a user profile route using the provided slug.
 *
 * @param params - A promise resolving to an object with `slug`, the user identifier used to populate the route parameter.
 * @param params.params
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
 * @param params.params
 * @returns The React element for the user's profile page.
 *
 * @see getPublicUserProfile
 * @see getSafeCollectionUrl
 * @see getSafeContentUrl
 * @see sanitizeDisplayText
 */
export default async function UserProfilePage({ params }: UserProfilePageProperties) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/u/[slug]',
    operation: 'UserProfilePage',
  });

  return (
    <Suspense fallback={<Loading />}>
      <UserProfilePageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the user profile page content for a given route slug, including profile header, activity stats, public collections, and contributions.
 *
 * @param params - Promise resolving to an object containing the route `slug`
 * @param params.params
 * @param reqLogger - Request-scoped logger used for route and fetch logging
 *
 * @param params.reqLogger
 * @returns The server-rendered React element for the user profile page content
 *
 * @remarks
 * - Performs server-side data fetching: authenticates the viewer (optional) and loads the public user profile.
 * - Will invoke Next.js `notFound()` for invalid slugs or when the profile cannot be found.
 * - Logs fetch results and errors; rethrows fetch errors after logging.
 *
 * @see getPublicUserProfile
 * @see getAuthenticatedUser
 * @see sanitizeDisplayText
 * @see getSafeCollectionUrl
 * @see getSafeContentUrl
 */
async function UserProfilePageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ slug: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { slug } = await params;
  const route = `/u/${slug}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Section: Slug Validation
  if (!isValidSlug(slug)) {
    routeLogger.warn({ section: 'data-fetch' }, 'UserProfilePage: invalid user slug');
    notFound();
  }

  const { user: currentUser } = await getAuthenticatedUser({
    context: 'UserProfilePage',
    requireUser: false,
  });

  // Create child logger with viewer context if available
  const viewerLogger = currentUser?.id
    ? routeLogger.child({ viewerId: currentUser.id })
    : routeLogger;

  // Section: User Profile Fetch
  let profileData: Database['public']['Functions']['get_user_profile']['Returns'] | null = null;
  try {
    profileData = await getPublicUserProfile({
      slug,
      ...(currentUser?.id ? { viewerId: currentUser.id } : {}),
    });
    viewerLogger.info(
      {
        hasProfile: !!profileData,
        section: 'user-profile-fetch',
      },
      'UserProfilePage: user profile loaded'
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user profile');
    viewerLogger.error(
      {
        err: normalized,
        section: 'user-profile-fetch',
      },
      'UserProfilePage: get_user_profile threw'
    );
    throw normalized;
  }

  if (!profileData) {
    viewerLogger.warn({ section: 'user-profile-fetch' }, 'UserProfilePage: user profile not found');
    notFound();
  }

  // Type-safe RPC return using centralized type definition
  const { collections, contributions, is_following, profile, stats } = profileData;

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
                  alt={`${sanitizeDisplayText(profile.name ?? slug, slug)}'s profile picture`}
                  className="border-background h-24 w-24 rounded-full border-4 object-cover"
                  height={96}
                  priority
                  src={profile.image}
                  width={96}
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

                <ProfileSocialStats
                  followerCount={follower_count ?? 0}
                  followingCount={following_count ?? 0}
                />
                {profile?.website ? (
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span>•</span>
                    <NavLink
                      className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}
                      external
                      href={profile.website}
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </NavLink>
                  </div>
                ) : null}
              </div>
            </div>

            {currentUser &&
            profile &&
            currentUser.id !== profile.id &&
            profile.id &&
            profile.slug ? (
              <FollowButton
                initialIsFollowing={is_following ?? false}
                userId={profile.id}
                userSlug={profile.slug}
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
            <ProfileStatsCard
              stats={[
                {
                  animated: true,
                  label: 'Contributions',
                  value: contributions?.length ?? 0,
                },
                {
                  animated: true,
                  label: 'Collections',
                  value: collections?.length ?? 0,
                },
                {
                  animated: false,
                  label: 'Member since',
                  value: profile?.created_at
                    ? (() => {
                        // Use UTC-based formatting for deterministic output (prevents hydration mismatches)
                        const date = new Date(profile.created_at);
                        const year = date.getUTCFullYear();
                        const month = date.getUTCMonth();
                        const monthNames = [
                          'Jan',
                          'Feb',
                          'Mar',
                          'Apr',
                          'May',
                          'Jun',
                          'Jul',
                          'Aug',
                          'Sep',
                          'Oct',
                          'Nov',
                          'Dec',
                        ];
                        return `${monthNames[month]} ${year}`;
                      })()
                    : 'N/A',
                },
              ]}
              title="Activity Stats"
            />
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            <ProfileTabs
              collections={
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Public Collections</h2>
                  <ProfileCollectionsSection
                    collections={collections}
                    getSafeCollectionUrl={getSafeCollectionUrl}
                    slug={slug}
                  />
                </div>
              }
              contributions={
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Contributions</h2>
                  <ProfileContributionsSection
                    contributions={contributions}
                    getSafeContentUrl={getSafeContentUrl}
                  />
                </div>
              }
              overview={
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-4 text-2xl font-bold">Public Collections</h2>
                    <ProfileCollectionsSection
                      collections={collections}
                      getSafeCollectionUrl={getSafeCollectionUrl}
                      slug={slug}
                    />
                  </div>
                  {contributions && contributions.length > 0 ? (
                    <div>
                      <h2 className="mb-4 text-2xl font-bold">Contributions</h2>
                      <ProfileContributionsSection
                        contributions={contributions}
                        getSafeContentUrl={getSafeContentUrl}
                      />
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
