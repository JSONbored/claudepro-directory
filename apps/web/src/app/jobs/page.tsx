/**
 * Jobs Listing Page - Database-First Job Board
 * Single RPC call to filter_jobs() - all filtering in PostgreSQL
 */

import { Constants } from '@heyclaude/database-types';
import { type JobsFilterResult } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getFilteredJobs } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  animate,
  between,
  cluster,
  grid,
  muted,
  absolute,
  spaceY,
  marginBottom,
  marginTop,
  iconLeading,
  iconSize,
  weight,
  radius,
  size,
  padding,
  gap,
  minHeight,
  maxWidth,
  bgColor,
  textColor,
  alignItems,
  borderBottom,
  borderTop,
  justify,
  flexWrap,
  flexDir,
  overflow,
  tracking,
  leading,
  skeletonSize,
} from '@heyclaude/web-runtime/design-system';
import {
  Briefcase,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import {
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { JobAlertsCard } from '@/src/components/core/domain/jobs/job-alerts-card';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';

/**
 * Dynamic Rendering Required
 *
 * Jobs page is always dynamic because:
 * 1. Accepts search params for filtering (type, location, remote)
 * 2. Results depend on user-provided query parameters
 * 3. Job listings change frequently
 *
 * Note: revalidate is NOT used when dynamic = 'force-dynamic'
 * Data caching is handled at the data layer (CACHE_TTL.jobs = 1800s)
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

/**
 * Streaming Jobs Count Badge
 * Fetches total job count independently to avoid duplicate RPC calls
 * OPTIMIZATION: This component streams its own data, eliminating the
 * redundant count-only query in the main page component.
 */
async function JobsCountBadge() {
  let totalJobs = 0;
  try {
    const response = await getFilteredJobs({ limit: 1, offset: 0 }, false);
    totalJobs = response?.total_count ?? 0;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch jobs count for badge');
    logger.warn('JobsCountBadge failed to fetch count', {
      err: normalized,
      requestId: generateRequestId(),
      route: '/jobs',
      operation: 'JobsCountBadge',
    });
    // Badge will show 0 jobs
  }
  return (
    <UnifiedBadge variant="base" style="secondary">
      <Briefcase className={iconLeading.xs} />
      {totalJobs} Jobs Available
    </UnifiedBadge>
  );
}

/**
 * Builds metadata for the /jobs page from the provided search parameters.
 *
 * Reads the `category` and `remote` query values (interpreting `'remote' === 'true'` as a boolean)
 * and delegates metadata construction to `generatePageMetadata`.
 *
 * @param props.searchParams - An awaitable Record of query parameters for the current request.
 *                             Expected keys: `category` (string) and `remote` ('true'|'false').
 * @returns Metadata for the /jobs route.
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
 * Renders the jobs listing section for the /jobs page using server-side data.
 *
 * Fetches filtered jobs via `getFilteredJobs`, applies client-side sorting, and renders one of:
 * - a placeholder when there are no jobs in the system,
 * - a "no jobs found" message when filters produce zero results,
 * - a grid of JobCard entries when jobs are available.
 *
 * When any filter/search parameter is present, the component bypasses cache and performs uncached SSR for fresh results.
 * When no filters are active, the listing is served with ISR/cached behavior.
 *
 * @param props.searchQuery - Full-text search string to filter jobs.
 * @param props.category - Category slug to filter jobs (omit or use 'all' for no category filter).
 * @param props.employment - Employment type to filter (e.g., 'full-time', or 'any' for no filter).
 * @param props.experience - Experience level to filter (e.g., 'senior', or 'any' for no filter).
 * @param props.remote - If provided, filters by remote-friendly (`true`) or non-remote (`false`) roles.
 * @param props.sort - Sort option applied after fetching (`'newest' | 'oldest' | 'salary'`).
 * @param props.limit - Maximum number of jobs to fetch.
 * @param props.offset - Offset for pagination.
 * @returns JSX element containing the jobs section markup.
 *
 * @see getFilteredJobs
 * @see applyJobSorting
 * @see JobsCountBadge
 * @see JobCard
 */
async function JobsListSection({
  searchQuery,
  category,
  employment,
  experience,
  remote,
  sort,
  limit,
  offset,
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
  const sectionRequestId = generateRequestId();
  const sectionLogger = logger.child({
    requestId: sectionRequestId,
    operation: 'JobsListSection',
    route: '/jobs',
    module: 'apps/web/src/app/jobs',
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
        sort,
        limit,
        offset,
      },
      noCache
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs list');
    sectionLogger.error('JobsPage: getFilteredJobs failed', normalized, {
      hasSearch: Boolean(searchQuery),
      category: category ?? 'all',
      employment: employment ?? 'any',
      experience: experience ?? 'any',
      remote: Boolean(remote),
      sort,
      limit,
      offset,
    });
  }

  const jobs = applyJobSorting(jobsResponse?.jobs ?? [], sort);
  const total_count = jobsResponse?.total_count ?? 0;

  if (total_count === 0) {
    return (
      <Card>
        <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.yXl}`}>
          <div className={`${marginBottom.comfortable} ${radius.full} ${bgColor['accent/10']} ${padding.default}`}>
            <Briefcase className={`${iconSize['3xl']} ${muted.default}`} />
          </div>
          <h3 className={`${marginBottom.default} ${weight.bold} ${size['2xl']}`}>No Jobs Available Yet</h3>
          <p className={`${marginBottom.relaxed} ${maxWidth.md} text-center ${muted.default} ${leading.relaxed}`}>
            We're building our jobs board! Soon you'll find amazing opportunities with companies
            working on the future of AI. Be the first to know when new positions are posted.
          </p>
          <div className={`flex ${gap.comfortable}`}>
            <Button asChild>
              <Link href={ROUTES.PARTNER}>
                <Plus className={`mr-2 ${iconSize.sm}`} />
                Post the First Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
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
        <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.yHero}`}>
          <Briefcase className={`${marginBottom.default} ${iconSize['4xl']} ${muted.default}`} />
          <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No Jobs Found</h3>
          <p className={`${marginBottom.comfortable} ${maxWidth.md} text-center ${muted.default}`}>
            No jobs match your current filters. Try adjusting your search criteria.
          </p>
          <Button variant="outline" asChild>
            <Link href={ROUTES.JOBS}>Clear All Filters</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className={between.center}>
        <div>
          <h2 className={`${weight.bold} ${size['2xl']}`}>
            {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
          </h2>
          <p className={muted.default}>Showing all available positions</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${gap.relaxed} md:grid-cols-2`}>
        {jobs.map((job) => (
          <JobCard key={job.slug} job={job} />
        ))}
      </div>
    </>
  );
}

/**
 * Render the server-side jobs listing page with parsed filters, pagination, and filter URL helpers.
 *
 * Parses query parameters (search/q/query, category, employment, experience, remote, sort, page, limit),
 * normalizes pagination (clamps page and limit, computes offset), and exposes helper IDs and buildFilterUrl
 * for the filter form and active-filter controls. Streams the total job count via JobsCountBadge and delegates
 * filtered job fetching and rendering to JobsListSection; filtered queries bypass the cache while the base
 * listing uses ISR-appropriate rendering.
 *
 * @param props.searchParams - Incoming URL search parameters (may be a Promise). Supported keys: `q`, `query`, `search`, `category`, `employment`, `experience`, `remote`, `sort`, `page`, `limit`.
 * @returns The page JSX for the jobs listing, including filter UI, active-filter badges, job list section, and side content.
 *
 * @see JobsListSection
 * @see JobsCountBadge
 * @see getFilteredJobs
 */
export default async function JobsPage({ searchParams }: PagePropsWithSearchParams) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'JobsPage',
    route: '/jobs',
    module: 'apps/web/src/app/jobs',
  });

  // Section: Parameter Parsing
  const rawParameters = (await searchParams) ?? {};

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
  const limit = Math.min(Number(limitParameter) || 20, 100);
  const offset = (page - 1) * limit;

  reqLogger.info('Jobs page accessed', {
    section: 'parameter-parsing',
    searchQuery: searchQuery ?? 'none',
    category: category ?? 'all',
    employment: employment ?? 'any',
    remote: Boolean(remote),
    experience: experience ?? 'any',
    sort,
    page,
    limit,
  });

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
      search: searchQuery ?? undefined,
      category: category === 'all' ? undefined : category,
      employment: employment === 'any' ? undefined : employment,
      experience: experience === 'any' ? undefined : experience,
      remote: remote ? 'true' : undefined,
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      <section className={`relative ${overflow.hidden} ${borderBottom.default}`}>
        <div className={`container mx-auto ${padding.xDefault} py-20`}>
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex ${justify.center}`}>
              <div className={`${radius.full} ${bgColor['accent/10']} ${padding.compact}`}>
                <Briefcase className={`${iconSize.xl} ${textColor.primary}`} />
              </div>
            </div>

            <h1 className={`${marginBottom.default} ${weight.bold} ${size['4xl']} ${tracking.tight} sm:${size['5xl']}`}>AI Jobs Board</h1>

            <p className={`mx-auto ${marginTop.default} ${maxWidth.xl} ${muted.lg}`}>
              Discover opportunities with companies building the future of artificial intelligence.
              From startups to industry giants, find your perfect role.
            </p>

            <div className={`${marginBottom.relaxed} flex ${flexWrap.wrap} ${justify.center} ${gap.compact}`}>
              <Suspense
                fallback={
                  <UnifiedBadge variant="base" style="secondary">
                    <Briefcase className={iconLeading.xs} />
                    <span className={`inline-block ${skeletonSize.barCompact} ${animate.pulse} rounded bg-muted/40`} />
                  </UnifiedBadge>
                }
              >
                <JobsCountBadge />
              </Suspense>
              <UnifiedBadge variant="base" style="outline">
                Community Driven
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Listings
              </UnifiedBadge>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.PARTNER} className={cluster.compact}>
                <Plus className={iconSize.xs} />
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
            <CardContent className={`${spaceY.comfortable} ${padding.comfortable}`}>
              <form method="GET" action="/jobs" className={grid.responsive4}>
                  <div className="relative">
                    <Search
                      className={`${absolute.topHalfLeft} -translate-y-1/2 ${iconSize.sm} transform ${muted.default}`}
                    />
                    <Input
                      id={searchInputId}
                      name="search"
                      placeholder="Search jobs, companies, or skills..."
                      defaultValue={searchQuery ?? ''}
                      className="pl-10"
                    />
                  </div>

                  <Select name="category" defaultValue={category ?? 'all'}>
                    <SelectTrigger id={categoryFilterId} aria-label="Filter jobs by category">
                      <Filter className={`mr-2 ${iconSize.sm}`} />
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

                  <Select name="employment" defaultValue={employment ?? 'any'}>
                    <SelectTrigger
                      id={employmentFilterId}
                      aria-label="Filter jobs by employment type"
                    >
                      <Clock className={`mr-2 ${iconSize.sm}`} />
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

                  <div className={cluster.compact}>
                    <Button
                      type="button"
                      variant={remote ? 'default' : 'outline'}
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={buildFilterUrl({
                          remote: remote ? undefined : 'true',
                        })}
                      >
                        <MapPin className={`mr-2 ${iconSize.sm}`} />
                        Remote
                      </Link>
                    </Button>
                    <Button type="submit" size="sm">
                      Filter
                    </Button>
                  </div>

                  <Select name="experience" defaultValue={experience ?? 'any'}>
                    <SelectTrigger
                      id={experienceFilterId}
                      aria-label="Filter jobs by experience level"
                    >
                      <SlidersHorizontal className={`mr-2 ${iconSize.sm}`} />
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

                  <Select name="sort" defaultValue={sort}>
                    <SelectTrigger id={sortFilterId} aria-label="Sort jobs">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="salary">Highest salary</SelectItem>
                    </SelectContent>
                  </Select>

                  <input type="hidden" name="page" value="1" />
                </form>

                {((searchQuery !== undefined && searchQuery !== '') ||
                  (category !== undefined && category !== 'all') ||
                  (employment !== undefined && employment !== 'any') ||
                  (experience !== undefined && experience !== 'any') ||
                  sort !== 'newest' ||
                  remote) ? <div className={`flex ${flexWrap.wrap} ${gap.compact} ${marginTop.default} ${borderTop.default} pt-4`}>
                    <span className={`${muted.sm}`}>Active filters:</span>
                    {searchQuery ? <UnifiedBadge variant="base" style="secondary">
                        Search: {searchQuery}
                        <Link
                          href={buildFilterUrl({ search: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove search filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge> : null}
                    {category && category !== 'all' ? <UnifiedBadge variant="base" style="secondary">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <Link
                          href={buildFilterUrl({ category: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove category filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge> : null}
                    {employment && employment !== 'any' ? <UnifiedBadge variant="base" style="secondary">
                        {employment.charAt(0).toUpperCase() +
                          employment.slice(1).replace('time', ' Time')}
                        <Link
                          href={buildFilterUrl({ employment: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove employment type filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge> : null}
                    {experience && experience !== 'any' ? <UnifiedBadge variant="base" style="secondary">
                        {experience === Constants.public.Enums.experience_level[0]
                          ? 'Entry level'
                          : (experience === Constants.public.Enums.experience_level[1]
                            ? 'Mid level'
                            : 'Senior level')}
                        <Link
                          href={buildFilterUrl({ experience: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove experience filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge> : null}
                    {remote ? <UnifiedBadge variant="base" style="secondary">
                        Remote
                        <Link
                          href={buildFilterUrl({ remote: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove remote filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge> : null}
                    {sort !== 'newest' && (
                      <UnifiedBadge variant="base" style="secondary">
                        Sort: {sort === 'oldest' ? 'Oldest' : 'Highest Salary'}
                        <Link
                          href={buildFilterUrl({ sort: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Reset sort"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.JOBS} className={size.xs}>
                        Clear All
                      </Link>
                    </Button>
                  </div> : null}
              </CardContent>
            </Card>
          </div>
        </section>

      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <div className={`grid grid-cols-1 ${gap.loose} lg:grid-cols-[1fr_320px]`}>
          <div className={spaceY.loose}>
            <Suspense
              fallback={
                <Card>
                  <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.yXl}`}>
                    <div className={`${marginBottom.comfortable} ${radius.full} ${bgColor['accent/10']} ${padding.default}`}>
                      <Briefcase className={`${iconSize['3xl']} ${muted.default}`} />
                    </div>
                    <h3 className={`${marginBottom.default} ${weight.bold} ${size['2xl']}`}>Loading Jobs...</h3>
                    <p
                      className={`${marginBottom.relaxed} ${maxWidth.md} text-center ${muted.default} ${leading.relaxed}`}
                    >
                      Fetching the latest job listings...
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <JobsListSection
                searchQuery={searchQuery}
                category={category}
                employment={employment}
                experience={experience}
                remote={remote}
                sort={sort}
                limit={limit}
                offset={offset}
              />
            </Suspense>
          </div>

          <aside className={`w-full ${spaceY.relaxed} lg:sticky lg:top-24 lg:h-fit`}>
            <JobsPromo />
            <JobAlertsCard
              defaultCategory={category ?? 'all'}
              defaultExperience={experience ?? 'any'}
              defaultRemote={remote ? 'remote' : 'any'}
            />
          </aside>
        </div>
      </section>

      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}

type SortOption = 'newest' | 'oldest' | 'salary';
const SORT_VALUES = new Set<SortOption>(['newest', 'oldest', 'salary']);

function applyJobSorting(jobs: JobsFilterResult['jobs'], sort: SortOption) {
  if (!(jobs && Array.isArray(jobs))) return [];
  const clone = [...jobs];
  if (sort === 'oldest') {
    return clone.toSorted((a, b) => {
      const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      return aDate - bDate;
    });
  }

  if (sort === 'salary') {
    return clone.toSorted((a, b) => {
      const aMax = extractSalaryValue(a.salary);
      const bMax = extractSalaryValue(b.salary);
      return bMax - aMax;
    });
  }

  // newest default
  return clone.toSorted((a, b) => {
    const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return bDate - aDate;
  });
}

/**
 * Extracts a numeric salary value from a raw salary string.
 *
 * Accepts strings containing a single value or a range (optionally with commas) and returns the larger numeric value found; returns 0 when no numeric value can be extracted.
 *
 * @param raw - Salary text (e.g., "£40,000", "40k - 60k", or null/undefined)
 * @returns The extracted numeric salary value, or 0 if unavailable
 *
 * @see applyJobSorting
 */
function extractSalaryValue(raw: null | string | undefined) {
  if (!raw) return 0;
  const match = raw.replaceAll(',', '').match(/(\d{2,6})(?:\s?-\s?(\d{2,6}))?/);
  if (!match) return 0;
  const first = Number(match[1]) || 0;
  const second = match[2] ? Number(match[2]) : first;
  return Math.max(first, second);
}