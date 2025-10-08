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

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ForYouFeedClient } from '@/src/components/personalization/for-you-feed-client';
import { getForYouFeed } from '@/src/lib/actions/personalization-actions';
import { createClient } from '@/src/lib/supabase/server';

export const metadata: Metadata = {
  title: 'For You | ClaudePro Directory',
  description: 'Personalized Claude configurations recommended just for you based on your interests and activity.',
  openGraph: {
    title: 'For You | ClaudePro Directory',
    description: 'Discover Claude configurations tailored to your interests',
  },
};

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
    </div>
  );
}
