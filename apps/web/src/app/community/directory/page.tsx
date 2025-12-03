import  { type Database } from '@heyclaude/database-types';
import { generatePageMetadata, getCommunityDirectory } from '@heyclaude/web-runtime/data';
import { marginBottom, muted, weight , size  , grid, padding , maxWidth, display, container, marginX, textAlign, height, width, colSpan, displayResponsive } from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import { Suspense } from 'react';

import { ContributorsSidebar } from '@/src/components/features/community/contributors-sidebar';
import { ProfileSearchClient } from '@/src/components/features/community/profile-search';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community/directory');
}

export const revalidate = false;

const DEFAULT_DIRECTORY_LIMIT = 100;

/**
 * Renders the Community Directory page content: a searchable user grid and a contributors sidebar.
 *
 * This server component fetches community directory data (up to DEFAULT_DIRECTORY_LIMIT) using
 * getCommunityDirectory, normalizes and filters returned user records, and supplies them to the
 * client components used in the layout. If the fetch fails the error is normalized, logged via the
 * request-scoped logger, and rethrown. An empty directory response is recorded as a warning.
 *
 * @param props.searchQuery - Optional search query used to filter directory results.
 * @returns The page content JSX containing the header, a ProfileSearchClient populated with users,
 * and a desktop-only ContributorsSidebar populated with top contributors and new members.
 *
 * @see getCommunityDirectory
 * @see ProfileSearchClient
 * @see ContributorsSidebar
 * @see DEFAULT_DIRECTORY_LIMIT
 * @see generateRequestId
 * @see normalizeError
 * @see logger
 */
/**
 * Filter and normalize an array of user-like records, returning only entries that contain the required fields.
 *
 * The function enforces presence of `id`, `slug`, `name`, `tier`, and `created_at`, and maps optional fields (`image`, `bio`, `work`)
 * to `null` when absent.
 *
 * @param users - An array (or `null`) of user-like objects whose fields may be nullable or partially present.
 * @returns An array of normalized user objects each containing: `id`, `slug`, `name`, `image | null`, `bio | null`, `work | null`, `tier`, and `created_at`.
 *
 * @see getCommunityDirectory
 * @see CommunityDirectoryContent
 */
function normalizeUserList<T extends { bio?: null | string; created_at: null | string; id: null | string; image?: null | string; name: null | string; slug: null | string; tier: null | string; work?: null | string }>(
  users: null | T[]
) {
  return (users ?? [])
    .filter(
      (u): u is T & { created_at: string; id: string; name: string; slug: string; tier: NonNullable<T['tier']>; } =>
        Boolean(u.id && u.slug && u.name && u.tier && u.created_at)
    )
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      image: u.image ?? null,
      bio: u.bio ?? null,
      work: u.work ?? null,
      tier: u.tier,
      created_at: u.created_at,
    }));
}

/**
 * Renders the Community Directory page content: header, searchable user grid, and contributors sidebar.
 *
 * Fetches directory data for the provided search query, normalizes user records, and supplies them to
 * the ProfileSearchClient and ContributorsSidebar components. If the directory fetch returns no data,
 * the component continues and renders with empty lists.
 *
 * @param props.searchQuery - Query string used to filter directory results
 * @returns The page content JSX containing the header, main user grid, and desktop-only contributors sidebar
 *
 * @throws A normalized error when fetching the community directory fails
 *
 * @see getCommunityDirectory
 * @see normalizeUserList
 * @see ProfileSearchClient
 * @see ContributorsSidebar
 */
async function CommunityDirectoryContent({ searchQuery }: { searchQuery: string }) {
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
  const allUsers = normalizeUserList(allUsersRaw);
  const topContributors = normalizeUserList(topContributorsRaw);
  const newMembers = normalizeUserList(newMembersRaw);

  return (
    <div className={`${container.default} ${padding.xDefault} ${padding.yRelaxed}`}>
      {/* Header */}
      <div className={`${marginX.auto} ${marginBottom.section} ${maxWidth['3xl']} ${textAlign.center}`}>
        <h1 className={`${marginBottom.default} ${weight.bold} ${size['4xl']}`}>Community Directory</h1>
        <p className={muted.lg}>
          Connect with Claude Code contributors, power users, and community experts
        </p>
      </div>

      {/* Two-column layout: Main content + Sidebar */}
      <div className={grid.sidebar}>
        {/* Main Content - User Grid */}
        <div className={colSpan.lg3}>
          <ProfileSearchClient users={allUsers} />
        </div>

        {/* Sidebar - Desktop only */}
        <div className={`${display.none} ${displayResponsive.lgBlock}`}>
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
 * Renders the Community Directory page, resolving URL search parameters and mounting the directory content inside a Suspense boundary.
 *
 * Resolves the incoming `searchParams` promise, extracts the optional `q` query value as `searchQuery` (defaults to an empty string), and renders CommunityDirectoryContent with a Skeleton fallback while the content loads.
 *
 * @param props.searchParams - A promise resolving to the page's search parameters; may include `q` to prefill the directory search.
 * @returns The page's React element tree containing a Suspense boundary and the CommunityDirectoryContent component.
 *
 * @see CommunityDirectoryContent
 * @see Suspense
 * @see Skeleton
 */
export default async function CommunityDirectoryPage({
  searchParams,
}: CommunityDirectoryPageProperties) {
  const resolvedParameters = await searchParams;
  const searchQuery = resolvedParameters.q ?? '';

  return (
    <Suspense fallback={<Skeleton size="xl" className={`${height.screen} ${width.full}`} />}>
      <CommunityDirectoryContent searchQuery={searchQuery} />
    </Suspense>
  );
}