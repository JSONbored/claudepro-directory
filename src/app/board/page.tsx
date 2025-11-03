/**
 * Community Board - Real-time discussion board with database-first architecture
 */

import { unstable_cache } from 'next/cache';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { BoardListClient } from '@/src/components/features/board/board-list-client';
import { Button } from '@/src/components/primitives/button';
import { ROUTES } from '@/src/lib/constants/routes';
import { MessageSquare, Plus, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

export const revalidate = 300; // 5 minutes ISR

export const metadata = generatePageMetadata('/board');

export default async function BoardPage() {
  const supabase = createAnonClient();

  // Wrapped in unstable_cache for additional performance boost
  const { data: posts } = await unstable_cache(
    async () => {
      return supabase.rpc('get_popular_posts');
    },
    ['board-popular-posts'],
    {
      revalidate: 300, // 5 minutes (matches page ISR)
      tags: ['board', 'posts'],
    }
  )();

  return (
    <div className={'min-h-screen bg-background'}>
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'mx-auto max-w-3xl text-center'}>
            <div className={'mb-6 flex justify-center'}>
              <div className={'rounded-full bg-accent/10 p-3'}>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Community Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Share your Claude discoveries, ask questions, and connect with the community
            </p>

            <div className={'mb-8 flex justify-center gap-2'}>
              <UnifiedBadge variant="base" style="secondary">
                <TrendingUp className="mr-1 h-3 w-3" />
                Trending Discussions
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Community Driven
              </UnifiedBadge>
            </div>

            <Button asChild>
              <Link href={ROUTES.BOARD_NEW}>
                <Plus className="mr-2 h-4 w-4" />
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
