import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { Avatar, AvatarFallback } from '@/src/components/primitives/avatar';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
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
    <div className={'min-h-screen bg-background'}>
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'text-center max-w-3xl mx-auto'}>
            <div className={'flex justify-center mb-6'}>
              <div className={'p-3 bg-accent/10 rounded-full'}>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Community Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Share your Claude discoveries, ask questions, and connect with the community
            </p>

            <div className={'flex justify-center gap-2 mb-8'}>
              <UnifiedBadge variant="base" style="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending Discussions
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Community Driven
              </UnifiedBadge>
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
      <section className={'container mx-auto px-4 py-12'}>
        {!posts || posts.length === 0 ? (
          <Card>
            <CardContent className={'flex flex-col items-center py-12'}>
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className={'text-muted-foreground text-center max-w-md mb-4'}>
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
          <div className="space-y-4">
            {posts.map((post: PopularPost) => (
              <Card key={post.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <span>{post.title}</span>
                      </CardTitle>

                      {post.body && (
                        <CardDescription className="mt-2 whitespace-pre-wrap">
                          {post.body.length > 200 ? `${post.body.slice(0, 200)}...` : post.body}
                        </CardDescription>
                      )}

                      <div className={'flex items-center gap-3 text-xs text-muted-foreground mt-3'}>
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
                            <UnifiedBadge variant="base" style="secondary" className="text-xs">
                              {post.vote_count} {post.vote_count === 1 ? 'vote' : 'votes'}
                            </UnifiedBadge>
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
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture
          source="content_page"
          variant="hero"
          context="board-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
