import { type Database } from '@heyclaude/database-types';
import { generatePageMetadata, getCommunityDirectory } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search';

/**
 * Provide metadata for the Community Directory page.
 *
 * This is invoked by Next.js to supply page-level metadata for the `/community/directory` route.
 *
 * @returns The `Metadata` object describing title, description, and other SEO/social fields for the community directory page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community/directory');
}

/**
 * Static Generation: Community directory is statically generated at build time
 * No automatic revalidation - page is fully static
 */

const DEFAULT_DIRECTORY_LIMIT = 100;

/**
 * Renders the Community Directory page content: fetches directory data filtered by `searchQuery`
 * and renders the main profile search grid with a contributors sidebar.
 *
 * @param searchQuery - Text used to filter directory results; empty string returns unfiltered results
 * @returns The React element tree for the community directory section
 * @throws If fetching the community directory fails, the error is normalized and rethrown
 * @see getCommunityDirectory
 * @see ProfileSearchClient
 * @see ContributorsSidebar
 */
async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this component
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CommunityDirectoryContent',
    route: '/community/directory',
    module: 'apps/web/src/app/community/directory',
  });

  let directoryData: Database['public']['Functions']['get_community_directory']['Returns'] | null =
    null;
  try {
    directoryData = await getCommunityDirectory({ searchQuery, limit: DEFAULT_DIRECTORY_LIMIT });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load community directory');
    reqLogger.error('CommunityDirectoryContent: getCommunityDirectory failed', normalized);
    throw normalized;
  }

  if (!directoryData) {
    reqLogger.warn('CommunityDirectoryContent: directory data response is empty');
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
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
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
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
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
        created_at: string;
        id: string;
        name: string;
        slug: string;
        tier: NonNullable<typeof u.tier>;
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
        <h1 className="mb-4 text-4xl font-bold">Community Directory</h1>
        <p className="text-muted-foreground text-lg">
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

/**
 * Render the Community Directory page wrapped in a Suspense boundary that displays a full-screen Skeleton while the page content resolves.
 *
 * The component delegates resolution of `searchParams` to CommunityDirectoryPageContent and keeps the UI responsive with a fallback.
 *
 * @param props.searchParams - A promise that resolves to an object containing optional query parameters (e.g., `{ q?: string }`); forwarded to CommunityDirectoryPageContent.
 *
 * @see CommunityDirectoryPageContent
 * @see generateMetadata
 * @see Skeleton
 */
export default function CommunityDirectoryPage({ searchParams }: CommunityDirectoryPageProperties) {
  return (
    <Suspense fallback={<Skeleton size="xl" className="h-screen w-full" />}>
      <CommunityDirectoryPageContent searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Resolves incoming route search parameters and renders the CommunityDirectoryContent for the extracted query.
 *
 * @param props.searchParams - A promise resolving to an object possibly containing `q` (the search query).
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
  const resolvedParameters = await searchParams;
  const searchQuery = resolvedParameters.q ?? '';

  return <CommunityDirectoryContent searchQuery={searchQuery} />;
}