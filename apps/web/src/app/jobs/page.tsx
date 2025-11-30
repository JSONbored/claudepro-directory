/**
 * Jobs Listing Page - Database-First Job Board
 * Single RPC call to filter_jobs() - all filtering in PostgreSQL
 */

import { Constants } from '@heyclaude/database-types';
import  { type JobsFilterResult } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getFilteredJobs } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, cluster, grid, muted, absolute } from '@heyclaude/web-runtime/design-system';
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
import  { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import { UnifiedBadge, Button , Card, CardContent, Input ,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue   } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { JobAlertsCard } from '@/src/components/core/domain/jobs/job-alerts-card';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((module_) => ({
      default: module_.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

/**
 * ISR: 15 minutes (900s) - Jobs update frequently but don't need real-time freshness
 *
 * Hybrid Rendering Strategy:
 * - Base job list (no filters) uses ISR with 15min revalidation
 * - Filtered queries bypass cache (uncached SSR) for real-time results
 */
export const revalidate = 900;

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
      <Briefcase className="mr-1 h-3 w-3" />
      {totalJobs} Jobs Available
    </UnifiedBadge>
  );
}

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
      (category ?? '') !== 'all' ||
      (employment ?? '') !== 'any' ||
      (experience ?? '') !== 'any' ||
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
        <CardContent className="flex flex-col items-center justify-center py-24">
          <div className="mb-6 rounded-full bg-accent/10 p-4">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-4 font-bold text-2xl">No Jobs Available Yet</h3>
          <p className="mb-8 max-w-md text-center text-muted-foreground leading-relaxed">
            We're building our jobs board! Soon you'll find amazing opportunities with companies
            working on the future of AI. Be the first to know when new positions are posted.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href={ROUTES.PARTNER}>
                <Plus className="mr-2 h-4 w-4" />
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
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Briefcase className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-xl">No Jobs Found</h3>
          <p className="mb-6 max-w-md text-center text-muted-foreground">
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
          <h2 className="font-bold text-2xl">
            {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
          </h2>
          <p className="text-muted-foreground">Showing all available positions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.slug} job={job} />
        ))}
      </div>
    </>
  );
}

/**
 * Server-rendered jobs listing page that parses query parameters, builds filter URLs, and renders the jobs UI.
 *
 * Parses search and filter query parameters (search/q/query, category, employment, experience, remote, sort, page, limit),
 * normalizes pagination (clamps page and limit, computes offset), and exposes helper IDs and a buildFilterUrl function
 * used by the filter form and active-filter controls. The page streams the total job count via JobsCountBadge and
 * delegates filtered job fetching and rendering to JobsListSection; filtered queries bypass the cache while the base
 * list uses ISR-appropriate rendering.
 *
 * @param props.searchParams - Incoming URL search parameters (may be a Promise). Supported keys: `q`, `query`, `search`, `category`, `employment`, `experience`, `remote`, `sort`, `page`, `limit`.
 * @returns The rendered jobs page JSX.
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
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-accent/10 p-3">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">AI Jobs Board</h1>

            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
              Discover opportunities with companies building the future of artificial intelligence.
              From startups to industry giants, find your perfect role.
            </p>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <Suspense
                fallback={
                  <UnifiedBadge variant="base" style="secondary">
                    <Briefcase className="mr-1 h-3 w-3" />
                    <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted/40" />
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
              <form method="GET" action="/jobs" className={grid.responsive4}>
                  <div className="relative">
                    <Search
                      className={`${absolute.topHalfLeft} -translate-y-1/2 h-4 w-4 transform text-muted-foreground`}
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

                  <Select name="employment" defaultValue={employment ?? 'any'}>
                    <SelectTrigger
                      id={employmentFilterId}
                      aria-label="Filter jobs by employment type"
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
                        <MapPin className="mr-2 h-4 w-4" />
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

                { }
                {((searchQuery ?? '') !== '' ||
                  (category ?? '') !== 'all' ||
                  (employment ?? '') !== 'any' ||
                  (experience ?? '') !== 'any' ||
                  sort !== 'newest' ||
                  remote) ? <div className="flex flex-wrap gap-2 mt-4 border-border border-t pt-4">
                    <span className={`${muted.default} text-sm`}>Active filters:</span>
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
                      <Link href={ROUTES.JOBS} className="text-xs">
                        Clear All
                      </Link>
                    </Button>
                  </div> : null}
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
                    <div className="mb-6 rounded-full bg-accent/10 p-4">
                      <Briefcase className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="mb-4 font-bold text-2xl">Loading Jobs...</h3>
                    <p
                      className="mb-8 max-w-md text-center text-muted-foreground leading-relaxed"
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

          <aside className="w-full space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <JobsPromo />
            <JobAlertsCard
              defaultCategory={category ?? 'all'}
              defaultExperience={experience ?? 'any'}
              defaultRemote={remote ? 'remote' : 'any'}
            />
          </aside>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
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

function extractSalaryValue(raw: null | string | undefined) {
  if (!raw) return 0;
  const match = raw.replaceAll(',', '').match(/(\d{2,6})(?:\s?-\s?(\d{2,6}))?/);
  if (!match) return 0;
  const first = Number(match[1]) || 0;
  const second = match[2] ? Number(match[2]) : first;
  return Math.max(first, second);
}