import Link from 'next/link';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { REVALIDATION_TIMES } from '@/src/lib/config/rate-limits.config';
import { ROUTES } from '@/src/lib/constants';
import { MessageSquare, Plus, TrendingUp, User as UserIcon } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';

export const metadata = generatePageMetadata('/board');

export const revalidate = 60;

// Use the actual return type from the database function
type PopularPost = {
  body: string;
  comment_count: number;
  content_slug: string;
  content_type: string;
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
  user_id: string;
  vote_count: number;
};

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
              <Link href={ROUTES.BOARD_NEW}>
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
                <Link href={ROUTES.BOARD_NEW}>
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
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex-1">
                      <CardTitle className={UI_CLASSES.TEXT_LG}>
                        <span>{post.title}</span>
                      </CardTitle>

                      {post.body && (
                        <CardDescription className="mt-2 whitespace-pre-wrap">
                          {post.body.length > 200 ? `${post.body.slice(0, 200)}...` : post.body}
                        </CardDescription>
                      )}

                      <div
                        className={`flex items-center gap-3 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-3`}
                      >
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                          <Avatar className="w-4 h-4">
                            <AvatarFallback>
                              <UserIcon className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span>User</span>
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

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="board-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
