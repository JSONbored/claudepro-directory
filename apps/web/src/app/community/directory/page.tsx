import type { Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getCommunityDirectory } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community/directory');
}

export const revalidate = false;

const DEFAULT_DIRECTORY_LIMIT = 100;

async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  // Generate single requestId for this component
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
    '/community/directory',
    'CommunityDirectoryContent',
    {
      hasQuery: Boolean(searchQuery),
    }
  );

  let directoryData: Database['public']['Functions']['get_community_directory']['Returns'] | null =
    null;
  try {
    directoryData = await getCommunityDirectory({ searchQuery, limit: DEFAULT_DIRECTORY_LIMIT });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load community directory');
    logger.error('CommunityDirectoryContent: getCommunityDirectory failed', normalized, logContext);
    throw normalized;
  }

  if (!directoryData) {
    logger.warn(
      'CommunityDirectoryContent: directory data response is empty',
      undefined,
      logContext
    );
  }

  const {
    all_users: allUsersRaw,
    top_contributors: topContributorsRaw,
    new_members: newMembersRaw,
  } = directoryData ?? {
    all_users: null,
    top_contributors: null,
    new_members: null,
  };

  // Filter out items with null required fields and ensure types match UserProfile
  const allUsers = (allUsersRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        id: string;
        slug: string;
        name: string;
        tier: NonNullable<typeof u.tier>;
        created_at: string;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      image: u.image,
      bio: u.bio,
      work: u.work,
      tier: u.tier,
      created_at: u.created_at,
    }));

  const topContributors = (topContributorsRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        id: string;
        slug: string;
        name: string;
        tier: NonNullable<typeof u.tier>;
        created_at: string;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      image: u.image,
      bio: u.bio,
      work: u.work,
      tier: u.tier,
      created_at: u.created_at,
    }));

  const newMembers = (newMembersRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        id: string;
        slug: string;
        name: string;
        tier: NonNullable<typeof u.tier>;
        created_at: string;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      image: u.image,
      bio: u.bio,
      work: u.work,
      tier: u.tier,
      created_at: u.created_at,
    }));

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

interface CommunityDirectoryPageProperties {
  searchParams: Promise<{ q?: string }>;
}

export default async function CommunityDirectoryPage({
  searchParams,
}: CommunityDirectoryPageProperties) {
  const resolvedParameters = await searchParams;
  const searchQuery = resolvedParameters.q ?? '';

  return (
    <Suspense fallback={<Skeleton size="xl" className="h-screen w-full" />}>
      <CommunityDirectoryContent searchQuery={searchQuery} />
    </Suspense>
  );
}
