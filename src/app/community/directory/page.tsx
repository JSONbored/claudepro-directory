import { Suspense } from 'react';
import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Tables } from '@/src/types/database.types';

export const metadata = generatePageMetadata('/community/directory');

export const revalidate = false;

async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  // Consolidated RPC: 3 queries + TypeScript deduplication → 1 (67% reduction)
  type DirectoryResponse = {
    all_users: Array<Tables<'users'>>;
    top_contributors: Array<Tables<'users'>>;
    new_members: Array<Tables<'users'>>;
  };

  const rpcParams = searchQuery ? { p_search_query: searchQuery, p_limit: 100 } : { p_limit: 100 };

  let directoryData: DirectoryResponse | null = null;
  try {
    directoryData = await cachedRPCWithDedupe<DirectoryResponse>(
      'get_community_directory',
      rpcParams,
      {
        tags: ['community', 'users'],
        ttlConfigKey: 'cache.community.ttl_seconds',
        keySuffix: searchQuery || 'all',
        useAuthClient: true,
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load community directory');
    logger.error('CommunityDirectoryContent: get_community_directory RPC failed', normalized, {
      hasQuery: Boolean(searchQuery),
    });
    throw normalized;
  }

  if (!directoryData) {
    logger.warn('CommunityDirectoryContent: directory data response is empty', {
      hasQuery: Boolean(searchQuery),
    });
  }

  const { all_users, top_contributors, new_members } = directoryData || {
    all_users: [],
    top_contributors: [],
    new_members: [],
  };

  const allUsers = all_users;
  const topContributors = top_contributors;
  const newMembers = new_members;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="mb-4 font-bold text-4xl">Community Directory</h1>
        <p className="text-lg text-muted-foreground">
          Connect with Claude Code contributors, power users, and community experts
        </p>
      </div>

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
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
