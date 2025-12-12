import { type Database } from '@heyclaude/database-types';
import { generatePageMetadata, getCommunityDirectory } from '@heyclaude/web-runtime/data';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { DirectoryTabs } from '@/src/components/features/community/directory-tabs';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search';

/**
 * Provide metadata for the Community Directory page.
 *
 * This is invoked by Next.js to supply page-level metadata for the `/community/directory` route.
 *
 * @returns The `Metadata` object describing title, description, and other SEO/social fields for the community directory page.
 *
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community/directory');
}

/**
 * Dynamic Rendering: Community directory is rendered dynamically to support search query parameters.
 * Wrapped in Suspense for streaming and Cache Components compatibility.
 */

const DEFAULT_DIRECTORY_LIMIT = 100;

/**
 * Renders the Community Directory page content: fetches directory data filtered by `searchQuery`
 * and renders the main profile search grid with a contributors sidebar.
 *
 * @param searchQuery - Text used to filter directory results; empty string returns unfiltered results
 * @param searchQuery.searchQuery
 * @returns The React element tree for the community directory section
 * @throws If fetching the community directory fails, the error is normalized and rethrown
 * @see getCommunityDirectory
 * @see ProfileSearchClient
 * @see ContributorsSidebar
 */
async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/community/directory',
    operation: 'CommunityDirectoryContent',
    route: '/community/directory',
  });

  let directoryData: Database['public']['Functions']['get_community_directory']['Returns'] | null =
    null;
  try {
    directoryData = await getCommunityDirectory({ limit: DEFAULT_DIRECTORY_LIMIT, searchQuery });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load community directory');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'CommunityDirectoryContent: getCommunityDirectory failed'
    );
    throw normalized;
  }

  if (!directoryData) {
    reqLogger.warn(
      { section: 'data-fetch' },
      'CommunityDirectoryContent: directory data response is empty'
    );
  }

  const {
    all_users: allUsersRaw,
    new_members: newMembersRaw,
    top_contributors: topContributorsRaw,
  } = directoryData ?? {
    all_users: null,
    new_members: null,
    top_contributors: null,
  };

  // Filter out items with null required fields and ensure types match UserProfile
  const allUsers = (allUsersRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      bio: u.bio,
      created_at: u.created_at,
      id: u.id,
      image: u.image,
      name: u.name,
      slug: u.slug,
      tier: u.tier,
      work: u.work,
    }));

  const topContributors = (topContributorsRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      bio: u.bio,
      created_at: u.created_at,
      id: u.id,
      image: u.image,
      name: u.name,
      slug: u.slug,
      tier: u.tier,
      work: u.work,
    }));

  const newMembers = (newMembersRaw ?? [])
    .filter(
      (
        u
      ): u is typeof u & {
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
      } => Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      bio: u.bio,
      created_at: u.created_at,
      id: u.id,
      image: u.image,
      name: u.name,
      slug: u.slug,
      tier: u.tier,
      work: u.work,
    }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-bold">Community Directory</h1>
        <p className="text-muted-foreground text-lg">
          Connect with Claude Code contributors, power users, and community experts
        </p>
      </div>

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main Content - Tabbed User Grid */}
        <div className="lg:col-span-3">
          <DirectoryTabs
            allMembers={<ProfileSearchClient users={allUsers} />}
            contributors={<ProfileSearchClient users={topContributors} />}
            newMembers={<ProfileSearchClient users={newMembers} />}
          />
        </div>

        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <ContributorsSidebar newMembers={newMembers} topContributors={topContributors} />
        </div>
      </div>
    </div>
  );
}

interface CommunityDirectoryPageProperties {
  searchParams: Promise<{ q?: string }>;
}

/**
 * Render the Community Directory page wrapped in a Suspense boundary that displays a full-screen Skeleton while the page content resolves.
 *
 * The component delegates resolution of `searchParams` to CommunityDirectoryPageContent and keeps the UI responsive with a fallback.
 *
 * @param props.searchParams - A promise that resolves to an object containing optional query parameters (e.g., `{ q?: string }`); forwarded to CommunityDirectoryPageContent.
 *
 * @param root0
 * @param root0.searchParams
 * @see CommunityDirectoryPageContent
 * @see generateMetadata
 * @see Skeleton
 */
export default function CommunityDirectoryPage({ searchParams }: CommunityDirectoryPageProperties) {
  // Note: Cannot use 'use cache' on pages with searchParams - they're dynamic
  // Data layer caching is already in place for optimal performance

  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" size="xl" />}>
      <CommunityDirectoryPageContent searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Resolves incoming route search parameters and renders the CommunityDirectoryContent for the extracted query.
 *
 * @param props.searchParams - A promise resolving to an object possibly containing `q` (the search query).
 * @param root0
 * @param root0.searchParams
 * @returns A React element rendering CommunityDirectoryContent for the resolved `q` (defaults to an empty string when absent).
 *
 * @see CommunityDirectoryContent
 * @see CommunityDirectoryPage
 */
async function CommunityDirectoryPageContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Await searchParams outside of any cache scope
  const resolvedParameters = await searchParams;
  const searchQuery = resolvedParameters.q ?? '';

  return <CommunityDirectoryContent searchQuery={searchQuery} />;
}
