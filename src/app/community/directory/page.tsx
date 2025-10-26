import { Suspense } from 'react';
import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search-client';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

export const metadata = generatePageMetadata('/community/directory');

export const revalidate = 3600; // 1 hour ISR

async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  const supabase = await createClient();

  // Performance optimization: Use server-side full-text search when query provided
  // Otherwise fetch all users for client-side browsing
  const [publicUsersResult, topContributorsResult, newMembersResult] = await Promise.all([
    // Search users OR find public users
    searchQuery
      ? supabase.rpc('search_users', {
          search_query: searchQuery,
          result_limit: 100,
        })
      : supabase
          .from('users')
          .select('*')
          .eq('public', true)
          .order('created_at', { ascending: false })
          .limit(100),

    // Top contributors by reputation
    supabase
      .from('users')
      .select('*')
      .order('reputation_score', { ascending: false })
      .limit(10),

    // New members
    supabase
      .from('users')
      .select('*')
      .eq('public', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Extract data from query results
  const publicUsers = publicUsersResult.data || [];
  const topContributors = topContributorsResult.data || [];
  const newMembers = newMembersResult.data || [];

  // Combine and deduplicate
  // When searching, use search results directly (already ranked by relevance)
  const allUsers = searchQuery
    ? publicUsers
    : [
        ...topContributors,
        ...publicUsers.filter((u) => !topContributors.some((tc) => tc.slug === u.slug)),
      ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Community Directory</h1>
        <p className="text-lg text-muted-foreground">
          Connect with Claude Code contributors, power users, and community experts
        </p>
      </div>

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content - User Grid */}
        <div className="lg:col-span-3">
          <ProfileSearchClient users={allUsers} />
        </div>

        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <ContributorsSidebar topContributors={topContributors} newMembers={newMembers} />
        </div>
      </div>
    </div>
  );
}

interface CommunityDirectoryPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CommunityDirectoryPage({
  searchParams,
}: CommunityDirectoryPageProps) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q || '';

  return (
    <Suspense fallback={<Skeleton size="xl" className="h-screen w-full" />}>
      <CommunityDirectoryContent searchQuery={searchQuery} />
    </Suspense>
  );
}
