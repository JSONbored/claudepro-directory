import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { FolderOpen, Globe, MessageSquare, Users } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface UserProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { slug } = await params;

  // Use generator with smart defaults for user profiles
  return generatePageMetadata('/u/:slug', {
    params: { slug },
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { slug } = await params;
  const supabase = await createAdminClient();

  // Get current user (if logged in)
  const currentUserClient = await createClient();
  const {
    data: { user: currentUser },
  } = await currentUserClient.auth.getUser();

  // Get profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('slug', slug)
    .eq('public', true) // Only show public profiles
    .single();

  if (!profile) {
    notFound();
  }

  // Get follower/following counts
  const { count: followerCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const { count: followingCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // Get user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user's public collections
  const { data: collections } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6);

  // Check if current user is following
  let isFollowing = false;
  if (currentUser) {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single();

    isFollowing = !!data;
  }

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero/Profile Header */}
      <section className="relative">
        {profile.hero && (
          <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
            <Image src={profile.hero} alt="Profile banner" fill className="object-cover" />
          </div>
        )}

        <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4}`}>
          <div className={`flex items-start justify-between ${profile.hero ? '-mt-16' : 'pt-12'}`}>
            <div className="flex items-start gap-4">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || slug}
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
                {profile.work && <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{profile.work}</p>}
                {profile.bio && (
                  <p className={`${UI_CLASSES.TEXT_SM} mt-2 max-w-2xl`}>{profile.bio}</p>
                )}

                <div className={`flex items-center gap-4 mt-3 ${UI_CLASSES.TEXT_SM}`}>
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
                    <div className="flex flex-wrap gap-2 mt-4">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {currentUser && currentUser.id !== profile.id && (
              <Button variant={isFollowing ? 'outline' : 'default'} disabled>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4} py-12`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats sidebar */}
          <div className={UI_CLASSES.SPACE_Y_4}>
            <Card>
              <CardHeader>
                <CardTitle className={UI_CLASSES.TEXT_SM}>Activity</CardTitle>
              </CardHeader>
              <CardContent className={UI_CLASSES.SPACE_Y_3}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Reputation</span>
                  <Badge variant="secondary">{profile.reputation_score || 0}</Badge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Posts</span>
                  <Badge variant="secondary">{posts?.length || 0}</Badge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Tier</span>
                  <Badge variant={profile.tier === 'pro' ? 'default' : 'secondary'}>
                    {profile.tier
                      ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                      : 'Free'}
                  </Badge>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Member since</span>
                  <span className={UI_CLASSES.TEXT_SM}>
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
                  <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>No posts yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className={UI_CLASSES.SPACE_Y_4}>
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <CardTitle className={UI_CLASSES.TEXT_LG}>
                          {post.url ? (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={UI_CLASSES.HOVER_TEXT_ACCENT}
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
                        <div
                          className={`flex items-center gap-3 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}
                        >
                          <Badge variant="secondary">{post.vote_count || 0} votes</Badge>
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
                  <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>No public collections yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {collections.map((collection) => (
                    <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                      <a href={`/u/${slug}/collections/${collection.slug}`}>
                        <CardHeader>
                          <CardTitle className={UI_CLASSES.TEXT_LG}>{collection.name}</CardTitle>
                          {collection.description && (
                            <CardDescription className="line-clamp-2">
                              {collection.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                              {collection.item_count}{' '}
                              {collection.item_count === 1 ? 'item' : 'items'}
                            </span>
                            <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
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
          </div>
        </div>
      </section>
    </div>
  );
}
