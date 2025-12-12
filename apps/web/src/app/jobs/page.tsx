/**
 * Jobs Listing Page - Database-First Job Board
 * Single RPC call to filter_jobs() - all filtering in PostgreSQL
 */

import { Constants } from '@heyclaude/database-types';
import { isValidCategory, type JobsFilterResult } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getCategoryConfig,
  getFilteredJobs,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Briefcase,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import {
  Button,
  Card,
  CardContent,
  cn,
  Input,
  POSITION_PATTERNS,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UI_CLASSES,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { ContentSidebar } from '@/src/components/core/layout/content-sidebar';

/**
 * Hybrid Rendering Strategy:
 * - Base job list (no filters) uses Cache Components pattern for edge/CDN caching
 * - Filtered queries bypass cache (uncached SSR) for real-time results
 *
 * Note: Caching is handled via the Cache Components pattern. Filtered queries
 * are rendered uncached to ensure real-time results.
 */

/**
 * Renders a badge that displays the total number of jobs by fetching the count separately.
 *
 * This server component streams its own count data to avoid duplicating a count-only RPC in the main page render.
 * On success it shows the fetched total; on error it logs a normalized warning and renders the badge with `0` jobs.
 *
 * @returns A JSX element rendering a badge with the total job count.
 *
 * @see getFilteredJobs
 * @see normalizeError
 * @see UnifiedBadge
 */
async function JobsCountBadge() {
  let totalJobs = 0;
  try {
    const response = await getFilteredJobs({ limit: 1, offset: 0 }, false);
    totalJobs = response?.total_count ?? 0;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch jobs count for badge');
    logger.warn(
      { err: normalized, operation: 'JobsCountBadge', route: '/jobs', section: 'data-fetch' },
      'JobsCountBadge failed to fetch count'
    );
    // Badge will show 0 jobs
  }
  return (
    <UnifiedBadge style="secondary" variant="base">
      <Briefcase className="mr-1 h-3 w-3" />
      {totalJobs} Jobs Available
    </UnifiedBadge>
  );
}

/**
 * Produce page metadata for /jobs that reflects the current category and remote filters.
 *
 * Awaits a request-time connection for determinism, resolves `searchParams`, and captures
 * `category` (string) and `remote` (true when the value equals `"true"`) into the metadata's
 * filter context.
 *
 * @param searchParams - An object (or thenable resolving to an object) of URL query parameters; `category` is read as a string and `remote` is interpreted as `true` only when equal to `"true"`.
 * @param searchParams.searchParams
 * @returns Metadata for the `/jobs` page including a `filters` context with `category` and `remote`.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({
  searchParams,
}: PagePropsWithSearchParams): Promise<Metadata> {
  const rawParameters = await searchParams;
  return generatePageMetadata('/jobs', {
    filters: {
      category: rawParameters?.['category'] as string | undefined,
      remote: rawParameters?.['remote'] === 'true',
    },
  });
}

/**
 * Render the jobs listing section for the current filter and pagination state.
 *
 * Fetches matching jobs (uncached when any filter is active; ISR applies when no filters)
 * and renders either a total-empty state, a filtered-empty state, or a grid of JobCard entries.
 *
 * @param root0
 * @param root0.category
 * @param root0.employment
 * @param root0.experience
 * @param root0.limit
 * @param root0.offset
 * @param root0.remote
 * @param props.searchQuery - Full-text search string to filter job titles and descriptions.
 * @param props.category - Category filter (omit or `undefined` to ignore).
 * @param props.employment - Employment type filter (e.g., "full-time", "part-time"; omit or `undefined` to ignore).
 * @param props.experience - Experience level filter (e.g., "junior", "senior"; omit or `undefined` to ignore).
 * @param props.remote - If `true`, restrict to remote roles; if `false`, restrict to non-remote; omit to ignore.
 * @param root0.searchQuery
 * @param props.sort - Sort option applied after fetching (`'newest' | 'oldest' | 'salary'`).
 * @param props.limit - Maximum number of jobs requested for this page.
 * @param props.offset - Offset for pagination.
 * @param root0.sort
 * @returns A JSX element containing either the jobs list or an appropriate empty-state card.
 *
 * @see getFilteredJobs
 * @see applyJobSorting
 * @see extractSalaryValue
 */
async function JobsListSection({
  category,
  employment,
  experience,
  limit,
  offset,
  remote,
  searchQuery,
  sort,
}: {
  category?: string | undefined;
  employment?: string | undefined;
  experience?: string | undefined;
  limit: number;
  offset: number;
  remote?: boolean | undefined;
  searchQuery?: string | undefined;
  sort: SortOption;
}) {
  // Create request-scoped child logger for this component
  const sectionLogger = logger.child({
    module: 'apps/web/src/app/jobs',
    operation: 'JobsListSection',
    route: '/jobs',
  });

  const hasFilters = Boolean(
    (typeof searchQuery === 'string' && searchQuery !== '') ||
    (category !== undefined && category !== 'all') ||
    (employment !== undefined && employment !== 'any') ||
    (experience !== undefined && experience !== 'any') ||
    remote !== undefined
  );

  // Use noCache for filtered queries (uncached SSR per Phase 3)
  const noCache = hasFilters;

  let jobsResponse: JobsFilterResult | null = null;
  try {
    jobsResponse = await getFilteredJobs(
      {
        ...(searchQuery ? { searchQuery } : {}),
        ...(category ? { category } : {}),
        ...(employment ? { employment } : {}),
        ...(experience ? { experience } : {}),
        ...(remote === undefined ? {} : { remote }),
        limit,
        offset,
        sort,
      },
      noCache
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs list');
    sectionLogger.error(
      {
        category: category ?? 'all',
        employment: employment ?? 'any',
        err: normalized,
        experience: experience ?? 'any',
        hasSearch: Boolean(searchQuery),
        section: 'data-fetch',
      },
      'JobsPage: getFilteredJobs failed'
    );
  }

  const jobs = applyJobSorting(jobsResponse?.jobs ?? [], sort);
  const total_count = jobsResponse?.total_count ?? 0;

  if (total_count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24">
          <div className="bg-accent/10 mb-6 rounded-full p-4">
            <Briefcase className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-4 text-2xl font-bold">No Jobs Available Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md text-center leading-relaxed">
            We&apos;re building our jobs board! Soon you&apos;ll find amazing opportunities with
            companies working on the future of AI. Be the first to know when new positions are
            posted.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href={ROUTES.PARTNER}>
                <Plus className="mr-2 h-4 w-4" />
                Post the First Job
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.COMMUNITY}>Join Community</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Briefcase className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">No Jobs Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            No jobs match your current filters. Try adjusting your search criteria.
          </p>
          <Button asChild variant="outline">
            <Link href={ROUTES.JOBS}>Clear All Filters</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h2 className="text-2xl font-bold">
            {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
          </h2>
          <p className="text-muted-foreground">Showing all available positions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {jobs.map((job) => (
          <JobCard job={job} key={job.slug} />
        ))}
      </div>
    </>
  );
}

/**
 * Renders the Jobs listing page shell with static hero and filter UI while streaming dynamic counts and job results.
 *
 * The component defers to request time (calls connection()) before parsing query parameters and creating a request-scoped logger.
 * Filters, pagination, and sort are read from `props.searchParams`. When no filters are active, the job list and total count
 * use cached responses to enable efficient streaming; when filters are active, job queries are uncached for freshness.
 *
 * @param props.searchParams - Query parameters controlling filtering and pagination. Recognized keys:
 *   - `q`, `query`, `search`: full-text search string
 *   - `category`: job category (omit or use `all` for none)
 *   - `employment`: employment type (omit or use `any` for none)
 *   - `experience`: experience level (omit or use `any` for none)
 *   - `remote`: `"true"` to filter remote-only
 *   - `sort`: `"newest" | "oldest" | "salary"` (defaults to `"newest"`)
 *   - `page`: 1-based page number (clamped to 1–10000)
 *   - `limit`: items per page (defaults to 20, max 100)
 *
 * @param root0
 * @param root0.searchParams
 * @returns The page JSX containing the hero header, streaming JobsCountBadge, filter form with active-filter chips and Clear All action, the JobsListSection (server fetch + client sorting), and ContentSidebar (JobsPromo + RecentlyViewed).
 *
 * @see JobsCountBadge
 * @see JobsListSection
 * @see applyJobSorting
 */
export default async function JobsPage({ searchParams }: PagePropsWithSearchParams) {
  // Note: Cannot use 'use cache' on pages with searchParams - they're dynamic
  // Data layer caching is already in place for optimal performance

  // Section: Parameter Parsing
  const rawParameters = (await searchParams) ?? {};

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/jobs',
    operation: 'JobsPage',
    route: '/jobs',
  });

  const searchQuery =
    (rawParameters['q'] as string | undefined) ??
    (rawParameters['query'] as string | undefined) ??
    (rawParameters['search'] as string | undefined);
  const category = rawParameters['category'] as string | undefined;
  const employment = rawParameters['employment'] as string | undefined;
  const experience = rawParameters['experience'] as string | undefined;
  const remote = rawParameters['remote'] === 'true' ? true : undefined;
  const sortParameter = (rawParameters['sort'] as string | undefined)?.toLowerCase();
  const sort: SortOption = SORT_VALUES.has(sortParameter as SortOption)
    ? (sortParameter as SortOption)
    : 'newest';
  const pageParameter = rawParameters['page'];
  const limitParameter = rawParameters['limit'];
  const page = Math.max(1, Math.min(Number(pageParameter) || 1, 10_000));
  const parsedLimit = Number(limitParameter);
  const limit = Math.min(parsedLimit > 0 ? parsedLimit : 20, 100);
  const offset = (page - 1) * limit;

  reqLogger.info(
    {
      category: category ?? 'all',
      employment: employment ?? 'any',
      experience: experience ?? 'any',
      limit,
      page,
      remote: Boolean(remote),
      searchQuery: searchQuery ?? 'none',
      section: 'data-fetch',
      sort,
    },
    'Jobs page accessed'
  );

  // OPTIMIZATION: Removed redundant totalJobs fetch
  // Total count is now streamed via JobsCountBadge component
  // Filter section always shown for better UX

  const baseId = 'jobs-page';
  const searchInputId = `${baseId}-search`;
  const categoryFilterId = `${baseId}-category`;
  const employmentFilterId = `${baseId}-employment`;
  const experienceFilterId = `${baseId}-experience`;
  const sortFilterId = `${baseId}-sort`;

  const buildFilterUrl = (newParameters: Record<string, boolean | string | undefined>) => {
    const urlParameters = new URLSearchParams();

    const currentParameters: Record<string, string | undefined> = {
      category: category === 'all' ? undefined : category,
      employment: employment === 'any' ? undefined : employment,
      experience: experience === 'any' ? undefined : experience,
      remote: remote ? 'true' : undefined,
      search: searchQuery ?? undefined,
      sort: sort === 'newest' ? undefined : sort,
    };

    const merged = { ...currentParameters, ...newParameters };

    for (const [key, value] of Object.entries(merged)) {
      if (typeof value === 'string' && value !== '') {
        urlParameters.set(key, String(value));
      }
    }

    const queryString = urlParameters.toString();
    return `/jobs${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div className="bg-background min-h-screen">
      <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER}>
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-accent/10 rounded-full p-3">
                <Briefcase className="text-primary h-8 w-8" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>AI Jobs Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover opportunities with companies building the future of artificial intelligence.
              From startups to industry giants, find your perfect role.
            </p>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <Suspense
                fallback={
                  <UnifiedBadge style="secondary" variant="base">
                    <Briefcase className="mr-1 h-3 w-3" />
                    <span className="bg-muted/40 inline-block h-4 w-16 animate-pulse rounded" />
                  </UnifiedBadge>
                }
              >
                <JobsCountBadge />
              </Suspense>
              <UnifiedBadge style="outline" variant="base">
                Community Driven
              </UnifiedBadge>
              <UnifiedBadge style="outline" variant="base">
                Verified Listings
              </UnifiedBadge>
            </div>

            <Button asChild size="sm" variant="outline">
              <Link className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} href={ROUTES.PARTNER}>
                <Plus className="h-3 w-3" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* OPTIMIZATION: Always show filter section for better UX */}
      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <Card className="card-gradient glow-effect">
            <CardContent className="space-y-4 p-6">
              <form action="/jobs" className={UI_CLASSES.GRID_RESPONSIVE_4} method="GET">
                <div className="relative">
                  <Search
                    className={`${POSITION_PATTERNS.ABSOLUTE_TOP_HALF_LEFT} text-muted-foreground h-4 w-4 -translate-y-1/2 transform`}
                  />
                  <Input
                    className="pl-10"
                    defaultValue={searchQuery ?? ''}
                    id={searchInputId}
                    name="search"
                    placeholder="Search jobs, companies, or skills..."
                  />
                </div>

                <Select defaultValue={category ?? 'all'} name="category">
                  <SelectTrigger aria-label="Filter jobs by category" id={categoryFilterId}>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue={employment ?? 'any'} name="employment">
                  <SelectTrigger
                    aria-label="Filter jobs by employment type"
                    id={employmentFilterId}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Types</SelectItem>
                    <SelectItem value={Constants.public.Enums.job_type[0]}>Full Time</SelectItem>
                    <SelectItem value={Constants.public.Enums.job_type[1]}>Part Time</SelectItem>
                    <SelectItem value={Constants.public.Enums.job_type[2]}>Contract</SelectItem>
                    <SelectItem value={Constants.public.Enums.job_type[3]}>Freelance</SelectItem>
                  </SelectContent>
                </Select>

                <div className={UI_CLASSES.FLEX_GAP_2}>
                  <Button
                    asChild
                    className={cn(
                      'flex-1',
                      remote && 'text-background bg-[#F6F8F4] hover:bg-[#F6F8F4]/90'
                    )}
                    type="button"
                    variant={remote ? 'default' : 'outline'}
                  >
                    <Link
                      href={buildFilterUrl({
                        remote: remote ? undefined : 'true',
                      })}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Remote
                    </Link>
                  </Button>
                  <Button
                    className="text-background bg-[#F6F8F4] hover:bg-[#F6F8F4]/90"
                    size="sm"
                    type="submit"
                  >
                    Filter
                  </Button>
                </div>

                <Select defaultValue={experience ?? 'any'} name="experience">
                  <SelectTrigger
                    aria-label="Filter jobs by experience level"
                    id={experienceFilterId}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Experience Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Levels</SelectItem>
                    <SelectItem value={Constants.public.Enums.experience_level[0]}>
                      Entry level
                    </SelectItem>
                    <SelectItem value={Constants.public.Enums.experience_level[1]}>
                      Mid level
                    </SelectItem>
                    <SelectItem value={Constants.public.Enums.experience_level[2]}>
                      Senior level
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue={sort} name="sort">
                  <SelectTrigger aria-label="Sort jobs" id={sortFilterId}>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="salary">Highest salary</SelectItem>
                  </SelectContent>
                </Select>

                <input name="page" type="hidden" value="1" />
              </form>

              {(searchQuery ?? '') !== '' ||
              (category !== undefined && category !== 'all') ||
              (employment !== undefined && employment !== 'any') ||
              (experience !== undefined && experience !== 'any') ||
              sort !== 'newest' ||
              remote !== undefined ? (
                <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} border-border mt-4 border-t pt-4`}>
                  <span className={UI_CLASSES.TEXT_SM_MUTED}>Active filters:</span>
                  {searchQuery ? (
                    <UnifiedBadge style="secondary" variant="base">
                      Search: {searchQuery}
                      <Link
                        aria-label="Remove search filter"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ search: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  ) : null}
                  {category && category !== 'all' ? (
                    <UnifiedBadge style="secondary" variant="base">
                      {isValidCategory(category)
                        ? (getCategoryConfig(category)?.typeName ?? category)
                        : category}
                      <Link
                        aria-label="Remove category filter"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ category: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  ) : null}
                  {employment && employment !== 'any' ? (
                    <UnifiedBadge style="secondary" variant="base">
                      {employment.charAt(0).toUpperCase() +
                        employment.slice(1).replace('time', ' Time')}
                      <Link
                        aria-label="Remove employment type filter"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ employment: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  ) : null}
                  {experience && experience !== 'any' ? (
                    <UnifiedBadge style="secondary" variant="base">
                      {experience === Constants.public.Enums.experience_level[0]
                        ? 'Entry level'
                        : experience === Constants.public.Enums.experience_level[1]
                          ? 'Mid level'
                          : 'Senior level'}
                      <Link
                        aria-label="Remove experience filter"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ experience: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  ) : null}
                  {remote ? (
                    <UnifiedBadge style="secondary" variant="base">
                      Remote
                      <Link
                        aria-label="Remove remote filter"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ remote: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  ) : null}
                  {sort !== 'newest' && (
                    <UnifiedBadge style="secondary" variant="base">
                      Sort: {sort === 'oldest' ? 'Oldest' : 'Highest Salary'}
                      <Link
                        aria-label="Reset sort"
                        className="hover:text-destructive ml-1"
                        href={buildFilterUrl({ sort: undefined })}
                      >
                        ×
                      </Link>
                    </UnifiedBadge>
                  )}
                  <Button asChild size="sm" variant="ghost">
                    <Link className="text-xs" href={ROUTES.JOBS}>
                      Clear All
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Suspense
              fallback={
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-24">
                    <div className="bg-accent/10 mb-6 rounded-full p-4">
                      <Briefcase className="text-muted-foreground h-12 w-12" />
                    </div>
                    <h3 className="mb-4 text-2xl font-bold">Loading Jobs...</h3>
                    <p className="text-muted-foreground mb-8 max-w-md text-center leading-relaxed">
                      Fetching the latest job listings...
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <JobsListSection
                category={category}
                employment={employment}
                experience={experience}
                limit={limit}
                offset={offset}
                remote={remote}
                searchQuery={searchQuery}
                sort={sort}
              />
            </Suspense>
          </div>

          {/* Unified ContentSidebar with JobsPromo (now includes job alerts form) + RecentlyViewed */}
          <ContentSidebar />
        </div>
      </section>
    </div>
  );
}

type SortOption = 'newest' | 'oldest' | 'salary';
const SORT_VALUES = new Set<SortOption>(['newest', 'oldest', 'salary']);

/****
 * Order job records by posted date or by parsed salary.
 *
 * Supports the `'newest'`, `'oldest'`, and `'salary'` sort modes.
 *
 * @param {JobsFilterResult['jobs']} jobs - Job objects to sort (as returned from the jobs query); if not an array, the function returns an empty array
 * @param {SortOption} sort - Sort mode: `'newest'`, `'oldest'`, or `'salary'`
 * @returns The input jobs sorted according to `sort`; returns an empty array when `jobs` is not a valid array
 *
 * @see extractSalaryValue - Parses salary strings into numeric values used for salary sorting
 */
function applyJobSorting(jobs: JobsFilterResult['jobs'], sort: SortOption) {
  if (!jobs || !Array.isArray(jobs)) return [];
  if (sort === 'oldest') {
    return jobs.toSorted((a, b) => {
      const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      return aDate - bDate;
    });
  }

  if (sort === 'salary') {
    return jobs.toSorted((a, b) => {
      const aMax = extractSalaryValue(a.salary);
      const bMax = extractSalaryValue(b.salary);
      return bMax - aMax;
    });
  }

  // newest default
  return jobs.toSorted((a, b) => {
    const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return bDate - aDate;
  });
}

/***
 * Parse a salary string into a numeric value suitable for sorting and comparison.
 *
 * Accepts numbers with commas, optional "k" suffix (e.g., "40k", "40.5k"), optional decimals, and optional ranges (e.g., "40k-60k"); when a range is provided the higher endpoint is returned.
 *
 * @param {null | string | undefined} raw - Salary text to parse; may be `null` or `undefined`.
 * @returns The numeric salary value representing the highest endpoint of the input, or `0` if parsing fails.
 * @see applyJobSorting
 */
function extractSalaryValue(raw: null | string | undefined) {
  if (!raw) return 0;
  // Normalize "k" suffix to thousands (e.g., "40k" -> "40000", "40.5k" -> "40500")
  const normalized = raw
    .replaceAll(',', '')
    .replaceAll(/(\d+(?:\.\d+)?)k/gi, (_, n) => String(Number(n) * 1000));
  // Allow optional decimals in both parts while still supporting 7+ digit values
  const match = normalized.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
  if (!match) return 0;
  const first = Number(match[1]) || 0;
  const second = match[2] ? Number(match[2]) : first;
  return Math.max(first, second);
}
