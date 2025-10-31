/**
 * Community Board - Real-time discussion board with database-first architecture
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { BoardListClient } from '@/src/components/features/board/board-list-client';
import { Button } from '@/src/components/primitives/button';
import { ROUTES } from '@/src/lib/constants/routes';
import { MessageSquare, Plus, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

export const metadata = generatePageMetadata('/board');

export default async function BoardPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase.rpc('get_popular_posts');

  return (
    <div className={'min-h-screen bg-background'}>
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

      <section className={'container mx-auto px-4 py-12'}>
        <BoardListClient initialPosts={posts || []} />
      </section>

      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="board-page" />
      </section>
    </div>
  );
}
