/**
 * For You Feed Page
 * Personalized recommendations based on user's interaction history
 *
 * Features:
 * - Hybrid recommendation algorithm
 * - Category filtering
 * - Infinite scroll
 * - Analytics tracking
 */

import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { ForYouFeedClient } from '@/src/components/features/personalization/for-you-feed-client';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { getForYouFeed } from '@/src/lib/actions/analytics.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

export const metadata = generatePageMetadata('/for-you');

export default async function ForYouPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect('/login?redirect=/for-you');
  }

  // Fetch initial recommendations
  const result = await getForYouFeed({ limit: 12, offset: 0, exclude_bookmarked: false });

  if (!result?.data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">For You</h1>
        <p className="text-muted-foreground">
          Unable to load recommendations. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">For You</h1>
        <p className="text-lg text-muted-foreground">
          {result.data.user_has_history
            ? 'Personalized recommendations based on your activity'
            : 'Popular configurations to get you started'}
        </p>
      </div>

      <ForYouFeedClient initialData={result.data} />

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="for-you-page" />
      </section>
    </div>
  );
}
