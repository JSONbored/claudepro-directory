import { Suspense } from 'react';
import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search-client';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { UserRepository } from '@/src/lib/repositories/user.repository';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { batchFetch } from '@/src/lib/utils/batch.utils';

export const metadata = generatePageMetadata('/community/directory');

export const revalidate = 3600; // 1 hour ISR

async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  const userRepo = new UserRepository();

  // Fetch public users with stats (uses materialized view for performance)
  const [publicUsersResult, topContributorsResult, newMembersResult] = await batchFetch([
    userRepo.findPublicUsers({ limit: 100, sortBy: 'created_at', sortOrder: 'desc' }),
    userRepo.getTopByReputation(10),
    userRepo.findPublicUsers({ limit: 10, sortBy: 'created_at', sortOrder: 'desc' }),
  ]);

  // Extract data from repository results
  const publicUsers = publicUsersResult.success ? publicUsersResult.data || [] : [];
  const topContributors = topContributorsResult.success ? topContributorsResult.data || [] : [];
  const newMembers = newMembersResult.success ? newMembersResult.data || [] : [];

  // Combine and deduplicate
  const allUsers = [
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
          <ProfileSearchClient users={allUsers} initialSearchQuery={searchQuery} />
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
