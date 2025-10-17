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

import { redirect } from 'next/navigation';
import { InlineEmailCTA } from '@/src/components/growth/inline-email-cta';
import { ForYouFeedClient } from '@/src/components/personalization/for-you-feed-client';
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
        <InlineEmailCTA
          variant="hero"
          context="for-you-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
