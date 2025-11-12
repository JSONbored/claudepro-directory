/**
 * User Profile Page - Database-First RPC Architecture
 * Single RPC call to get_user_profile() replaces 6+ separate queries
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/badge';
import { NavLink } from '@/src/components/core/navigation/nav-link';
import { FollowButton } from '@/src/components/features/social/follow-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { FolderOpen, Globe, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { GetUserProfileReturn } from '@/src/types/database-overrides';

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
  const supabase = createAnonClient();

  // Get current user (if logged in)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Consolidated RPC: 4 calls → 1 (75% reduction)
  // get_user_profile() includes: profile + stats + posts + collections + contributions
  const { data: profileData, error } = await supabase.rpc('get_user_profile', {
    p_user_slug: slug,
    ...(currentUser?.id && { p_viewer_id: currentUser.id }),
  });

  if (error) {
    logger.error('Failed to load user profile', error);
  }

  if (!profileData) {
    logger.warn('User profile not found', { slug });
    notFound();
  }

  // Type-safe RPC return using centralized type definition
  const data = profileData as GetUserProfileReturn;
  const { profile, stats, collections, contributions, isFollowing } = data;

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
                  priority
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-accent font-bold text-2xl">
                  {(profile.name || slug).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="mt-4">
                <h1 className="font-bold text-3xl">{profile.name || slug}</h1>
                {profile.bio && <p className={'mt-2 max-w-2xl text-sm'}>{profile.bio}</p>}

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
                        external
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
                  {collections.map((collection) => (
                    <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                      <a href={`/u/${slug}/collections/${collection.slug}`}>
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
                  ))}
                </div>
              )}
            </div>

            {/* Content Contributions */}
            {contributions && contributions.length > 0 && (
              <div>
                <h2 className="mb-4 font-bold text-2xl">Contributions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contributions.map((item) => (
                    <Card key={item.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                      <a href={`/${item.content_type}/${item.slug}`}>
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
                          <div className={'flex items-center gap-2 text-muted-foreground text-xs'}>
                            <span>{item.view_count || 0} views</span>
                            <span>•</span>
                            <span>{item.download_count || 0} downloads</span>
                          </div>
                        </CardContent>
                      </a>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
