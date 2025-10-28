/**
 * User Profile Page - Database-First User Profiles
 * All data from Supabase with parallel batch fetching, reputation from PostgreSQL RPC.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { BadgeGrid } from '@/src/components/features/badges/badge-grid';
import { ReputationBreakdown } from '@/src/components/features/reputation/reputation-breakdown';
import { FollowButton } from '@/src/components/features/social/follow-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { getPublicUserBadges } from '@/src/lib/actions/badges.actions';
import { getUserReputation } from '@/src/lib/actions/reputation.actions';
import { FolderOpen, Globe, MessageSquare, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchFetch } from '@/src/lib/utils/batch.utils';

interface UserProfilePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * ISR revalidation interval for user profile pages
 *
 * @constant {number}
 * @description Pages revalidate every 30 minutes for fresher user data while maintaining edge caching benefits.
 */
export const revalidate = 1800; // 30 minutes

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { slug } = await params;

  // Use generator with smart defaults for user profiles
  return generatePageMetadata('/u/:slug', {
    params: { slug },
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user (if logged in)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch profile by slug
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !profile || !profile.public) {
    notFound();
  }

  // Batch fetch all profile data in parallel
  const [
    followerCountResult,
    followingCountResult,
    postsResult,
    collectionsResult,
    contributionsResult,
    isFollowingResult,
    reputationResult,
    badgesResult,
    tierConfigsResult,
  ] = await batchFetch([
    // Follower count
    (async () => {
      const res = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);
      return res.count || 0;
    })(),

    // Following count
    (async () => {
      const res = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);
      return res.count || 0;
    })(),

    // User's posts
    (async () => {
      const res = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return res.data || [];
    })(),

    // User's public collections
    (async () => {
      const res = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);
      return res.data || [];
    })(),

    // User's content contributions
    (async () => {
      const res = await supabase
        .from('user_content')
        .select('*')
        .eq('user_id', profile.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(12);
      return res.data || [];
    })(),

    // Is following check
    currentUser
      ? (async () => {
          const res = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
            .single();
          return !!res.data;
        })()
      : Promise.resolve(false),

    // Reputation data
    getUserReputation(profile.id).catch((error) => {
      logger.error(
        'Failed to fetch reputation for profile',
        error instanceof Error ? error : new Error(String(error)),
        { profileId: profile.id }
      );
      return null;
    }),

    // User badges
    getPublicUserBadges(profile.id, { featuredOnly: false }).catch((error) => {
      logger.error(
        'Failed to fetch badges for profile',
        error instanceof Error ? error : new Error(String(error)),
        { profileId: profile.id }
      );
      return [];
    }),

    // Tier display configs
    (async () => {
      const res = await supabase.from('tier_display_config').select('*').eq('active', true);
      return res.data || [];
    })(),
  ]);

  const followerCount = followerCountResult;
  const followingCount = followingCountResult;
  const posts = postsResult;
  const collections = collectionsResult;
  const contributions = contributionsResult;
  const isFollowing = isFollowingResult;
  const reputationData = reputationResult;
  const userBadges = badgesResult;
  const tierConfigs = Object.fromEntries(
    tierConfigsResult.map((t) => [t.tier, { label: t.label, className: t.css_classes }])
  );

  // Check if current user is the profile owner
  const isOwner = currentUser?.id === profile.id;

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero/Profile Header */}
      <section className="relative">
        {profile.hero && (
          <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
            <Image
              src={profile.hero}
              alt={`${profile.name || slug}'s profile banner`}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className={'container mx-auto px-4'}>
          <div className={`flex items-start justify-between ${profile.hero ? '-mt-16' : 'pt-12'}`}>
            <div className="flex items-start gap-4">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={`${profile.name || slug}'s profile picture`}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-4 border-background object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-background bg-accent flex items-center justify-center text-2xl font-bold">
                  {(profile.name || slug).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="mt-4">
                <h1 className="text-3xl font-bold">{profile.name || slug}</h1>
                {profile.work && <p className="text-muted-foreground">{profile.work}</p>}
                {profile.bio && <p className={'text-sm mt-2 max-w-2xl'}>{profile.bio}</p>}

                <div className={'flex items-center gap-4 mt-3 text-sm'}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Users className="h-4 w-4" />
                    {followerCount || 0} followers
                  </div>
                  <span>•</span>
                  <div>{followingCount || 0} following</div>

                  {profile.website && (
                    <>
                      <span>•</span>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} text-primary hover:underline`}
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    </>
                  )}
                </div>

                {/* Interests/Skills Tags */}
                {profile.interests &&
                  Array.isArray(profile.interests) &&
                  profile.interests.length > 0 &&
                  profile.interests.every((item): item is string => typeof item === 'string') && (
                    <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-4`}>
                      {profile.interests.map((interest) => (
                        <UnifiedBadge key={interest} variant="base" style="secondary">
                          {interest}
                        </UnifiedBadge>
                      ))}
                    </div>
                  )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats sidebar */}
          <div className="space-y-4">
            {reputationData &&
              typeof reputationData === 'object' &&
              'breakdown' in reputationData && (
                <ReputationBreakdown
                  breakdown={reputationData.breakdown as any}
                  showDetails={true}
                  showProgress={true}
                />
              )}

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
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Posts</span>
                  <UnifiedBadge variant="base" style="secondary">
                    {posts?.length || 0}
                  </UnifiedBadge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Account Tier</span>
                  {(() => {
                    const tier = profile.tier || 'free';
                    const tierConfig = tierConfigs[tier] || { label: 'Free', className: 'border-muted-foreground/20 text-muted-foreground' };
                    return (
                      <UnifiedBadge variant="base" style="outline" className={tierConfig.className}>
                        {tierConfig.label}
                      </UnifiedBadge>
                    );
                  })()}
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
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>

              {!posts || posts.length === 0 ? (
                <Card>
                  <CardContent className={'flex flex-col items-center py-12'}>
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No posts yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {post.url ? (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group-hover:text-accent transition-colors-smooth"
                            >
                              {post.title}
                            </a>
                          ) : (
                            post.title
                          )}
                        </CardTitle>
                        {post.content && (
                          <CardDescription className="mt-2 whitespace-pre-wrap">
                            {post.content.length > 150
                              ? `${post.content.slice(0, 150)}...`
                              : post.content}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className={'flex items-center gap-3 text-xs text-muted-foreground'}>
                          <UnifiedBadge variant="base" style="secondary">
                            {post.vote_count || 0} votes
                          </UnifiedBadge>
                          <span>{post.comment_count || 0} comments</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Public Collections */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Public Collections</h2>

              {!collections || collections.length === 0 ? (
                <Card>
                  <CardContent className={'flex flex-col items-center py-12'}>
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
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
                <h2 className="text-2xl font-bold mb-4">Contributions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contributions.map((item) => (
                    <Card key={item.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                      <a href={`/${item.content_type}/${item.slug}`}>
                        <CardHeader>
                          <div className={'flex items-center justify-between mb-2'}>
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
                          <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
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

            {/* Badges Section */}
            {userBadges.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Badges</h2>
                <BadgeGrid badges={userBadges} canEdit={isOwner} featuredOnly={false} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
