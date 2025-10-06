import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { MessageSquare, Plus, TrendingUp, User as UserIcon } from '@/src/lib/icons';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/date-utils';

export const metadata: Metadata = {
  title: 'Community Board - ClaudePro Directory',
  description: 'Share and discuss Claude configurations, tips, and news',
};

export const revalidate = 60; // Revalidate every minute

interface PopularPost {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  url: string | null;
  vote_count: number;
  comment_count: number;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
  user_slug: string | null;
}

export default async function BoardPage() {
  const supabase = await createAdminClient();

  // Get popular posts using database function
  const { data: posts } = await supabase.rpc('get_popular_posts');

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4} py-20`}>
          <div className={`text-center ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}>
            <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.MB_6}`}>
              <div className={`p-3 ${UI_CLASSES.BG_ACCENT_10} ${UI_CLASSES.ROUNDED_FULL}`}>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Community Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Share your Claude discoveries, ask questions, and connect with the community
            </p>

            <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} gap-2 ${UI_CLASSES.MB_8}`}>
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending Discussions
              </Badge>
              <Badge variant="outline">Community Driven</Badge>
            </div>

            <Button asChild>
              <Link href="/board/new">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        {!posts || posts.length === 0 ? (
          <Card>
            <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
                Be the first to share something with the community!
              </p>
              <Button asChild>
                <Link href="/board/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={UI_CLASSES.SPACE_Y_4}>
            {posts.map((post: PopularPost) => (
              <Card key={post.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                          <span>{post.title}</span>
                        )}
                      </CardTitle>

                      {post.content && (
                        <CardDescription className="mt-2 whitespace-pre-wrap">
                          {post.content.length > 200
                            ? `${post.content.slice(0, 200)}...`
                            : post.content}
                        </CardDescription>
                      )}

                      <div
                        className={`flex items-center gap-3 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-3`}
                      >
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                          {post.user_avatar ? (
                            <img
                              src={post.user_avatar}
                              alt={post.user_name || 'User'}
                              className="w-4 h-4 rounded-full"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                          <Link href={`/u/${post.user_slug}`} className="hover:underline">
                            {post.user_name || 'Anonymous'}
                          </Link>
                        </div>
                        <span>•</span>
                        <span>{formatRelativeDate(post.created_at)}</span>
                        {post.vote_count > 0 && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {post.vote_count} {post.vote_count === 1 ? 'vote' : 'votes'}
                            </Badge>
                          </>
                        )}
                        {post.comment_count > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {post.comment_count}{' '}
                              {post.comment_count === 1 ? 'comment' : 'comments'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
