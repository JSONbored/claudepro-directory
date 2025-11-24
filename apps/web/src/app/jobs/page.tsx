/**
 * Jobs Listing Page - Database-First Job Board
 * Single RPC call to filter_jobs() - all filtering in PostgreSQL
 */

import { type JobsFilterResult, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getFilteredJobs } from '@heyclaude/web-runtime/data';
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
import type { PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import { POSITION_PATTERNS, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { JobAlertsCard } from '@/src/components/core/domain/jobs/job-alerts-card';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent } from '@/src/components/primitives/ui/card';
import { Input } from '@/src/components/primitives/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/ui/select';

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

/**
 * Caching Strategy: Delegated to Data Layer
 *
 * revalidate = false means this page won't automatically revalidate via Next.js.
 * Instead, job listing freshness is controlled by the cache configuration in the data layer.
 *
 * The getFilteredJobs() function uses fetchCachedRpc() with TTL-based caching.
 * Cache duration is configured via cache.jobs.ttl_seconds in the data layer configuration.
 *
 * To adjust job listing cache duration, update the cache.jobs.ttl_seconds setting,
 * not the Next.js revalidate value on this page.
 */
export const revalidate = false;

export async function generateMetadata({
  searchParams,
}: PagePropsWithSearchParams): Promise<Metadata> {
  const rawParams = await searchParams;
  return generatePageMetadata('/jobs', {
    filters: {
      category: rawParams?.['category'] as string | undefined,
      remote: rawParams?.['remote'] === 'true',
    },
  });
}

export default async function JobsPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;

  const searchQuery =
    (rawParams?.['q'] as string) ||
    (rawParams?.['query'] as string) ||
    (rawParams?.['search'] as string);
  const category = rawParams?.['category'] as string | undefined;
  const employment = rawParams?.['employment'] as string | undefined;
  const experience = rawParams?.['experience'] as string | undefined;
  const remote = rawParams?.['remote'] === 'true' ? true : undefined;
  const sortParam = (rawParams?.['sort'] as string | undefined)?.toLowerCase();
  const sort: SortOption = SORT_VALUES.has(sortParam as SortOption)
    ? (sortParam as SortOption)
    : 'newest';
  const page = Math.max(1, Math.min(Number(rawParams?.['page']) || 1, 10000));
  const limit = Math.min(Number(rawParams?.['limit']) || 20, 100);
  const offset = (page - 1) * limit;

  logger.info('Jobs page accessed', {
    searchQuery: searchQuery || 'none',
    category: category || 'all',
    employment: employment || 'any',
    remote: Boolean(remote),
    experience: experience || 'any',
    sort,
    page,
    limit,
  });

  let jobsResponse: JobsFilterResult | null = null;
  try {
    jobsResponse = await getFilteredJobs({
      ...(searchQuery ? { searchQuery } : {}),
      ...(category ? { category } : {}),
      ...(employment ? { employment } : {}),
      ...(experience ? { experience } : {}),
      ...(remote !== undefined ? { remote } : {}),
      sort,
      limit,
      offset,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs list');
    logger.error('JobsPage: getFilteredJobs failed', normalized, {
      hasSearch: Boolean(searchQuery),
      category: category || 'all',
      employment: employment || 'any',
      experience: experience || 'any',
      remote: Boolean(remote),
      sort,
      page,
      limit,
    });
  }

  const jobs = applyJobSorting(jobsResponse?.jobs ?? [], sort);
  const total_count = jobsResponse?.total_count ?? 0;

  const totalJobs = total_count;

  const baseId = 'jobs-page';
  const searchInputId = `${baseId}-search`;
  const categoryFilterId = `${baseId}-category`;
  const employmentFilterId = `${baseId}-employment`;
  const experienceFilterId = `${baseId}-experience`;
  const sortFilterId = `${baseId}-sort`;

  const buildFilterUrl = (newParams: Record<string, string | boolean | undefined>) => {
    const urlParams = new URLSearchParams();

    const currentParams: Record<string, string | undefined> = {
      search: searchQuery,
      category: category !== 'all' ? category : undefined,
      employment: employment !== 'any' ? employment : undefined,
      experience: experience !== 'any' ? experience : undefined,
      remote: remote ? 'true' : undefined,
      sort: sort !== 'newest' ? sort : undefined,
    };

    const merged = { ...currentParams, ...newParams };

    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.set(key, String(value));
      }
    }

    return `/jobs${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  };

  return (
    <div className={'min-h-screen bg-background'}>
      <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'mx-auto max-w-3xl text-center'}>
            <div className={'mb-6 flex justify-center'}>
              <div className={'rounded-full bg-accent/10 p-3'}>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>AI Jobs Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover opportunities with companies building the future of artificial intelligence.
              From startups to industry giants, find your perfect role.
            </p>

            <div className={'mb-8 flex flex-wrap justify-center gap-2'}>
              <UnifiedBadge variant="base" style="secondary">
                <Briefcase className="mr-1 h-3 w-3" />
                {totalJobs || 0} Jobs Available
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Community Driven
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Listings
              </UnifiedBadge>
            </div>

            <Button variant="outline" size="sm" asChild={true}>
              <Link href={ROUTES.PARTNER} className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Plus className="h-3 w-3" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {(totalJobs || 0) > 0 && (
        <section className={'px-4 pb-8'}>
          <div className={'container mx-auto'}>
            <Card className="card-gradient glow-effect">
              <CardContent className="space-y-4 p-6">
                <form method="GET" action="/jobs" className={UI_CLASSES.GRID_RESPONSIVE_4}>
                  <div className="relative">
                    <Search
                      className={`${POSITION_PATTERNS.ABSOLUTE_TOP_HALF_LEFT} -translate-y-1/2 h-4 w-4 transform text-muted-foreground`}
                    />
                    <Input
                      id={searchInputId}
                      name="search"
                      placeholder="Search jobs, companies, or skills..."
                      defaultValue={searchQuery || ''}
                      className="pl-10"
                    />
                  </div>

                  <Select name="category" defaultValue={category || 'all'}>
                    <SelectTrigger id={categoryFilterId} aria-label="Filter jobs by category">
                      <Filter className={'mr-2 h-4 w-4'} />
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

                  <Select name="employment" defaultValue={employment || 'any'}>
                    <SelectTrigger
                      id={employmentFilterId}
                      aria-label="Filter jobs by employment type"
                    >
                      <Clock className={'mr-2 h-4 w-4'} />
                      <SelectValue placeholder="Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">All Types</SelectItem>
                      <SelectItem value="fulltime">Full Time</SelectItem>
                      <SelectItem value="parttime">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className={UI_CLASSES.FLEX_GAP_2}>
                    <Button
                      type="button"
                      variant={remote ? 'default' : 'outline'}
                      className="flex-1"
                      asChild={true}
                    >
                      <Link
                        href={buildFilterUrl({
                          remote: remote ? undefined : 'true',
                        })}
                      >
                        <MapPin className={'mr-2 h-4 w-4'} />
                        Remote
                      </Link>
                    </Button>
                    <Button type="submit" size="sm">
                      Filter
                    </Button>
                  </div>

                  <Select name="experience" defaultValue={experience || 'any'}>
                    <SelectTrigger
                      id={experienceFilterId}
                      aria-label="Filter jobs by experience level"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">All Levels</SelectItem>
                      <SelectItem value="beginner">Entry level</SelectItem>
                      <SelectItem value="intermediate">Mid level</SelectItem>
                      <SelectItem value="advanced">Senior level</SelectItem>
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

                {(searchQuery ||
                  (category && category !== 'all') ||
                  (employment && employment !== 'any') ||
                  (experience && experience !== 'any') ||
                  sort !== 'newest' ||
                  remote) && (
                  <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-4 border-border border-t pt-4`}>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>Active filters:</span>
                    {searchQuery && (
                      <UnifiedBadge variant="base" style="secondary">
                        Search: {searchQuery}
                        <Link
                          href={buildFilterUrl({ search: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove search filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {category && category !== 'all' && (
                      <UnifiedBadge variant="base" style="secondary">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <Link
                          href={buildFilterUrl({ category: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove category filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {employment && employment !== 'any' && (
                      <UnifiedBadge variant="base" style="secondary">
                        {employment.charAt(0).toUpperCase() +
                          employment.slice(1).replace('time', ' Time')}
                        <Link
                          href={buildFilterUrl({ employment: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove employment type filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {experience && experience !== 'any' && (
                      <UnifiedBadge variant="base" style="secondary">
                        {experience === 'beginner'
                          ? 'Entry level'
                          : experience === 'intermediate'
                            ? 'Mid level'
                            : 'Senior level'}
                        <Link
                          href={buildFilterUrl({ experience: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove experience filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {remote && (
                      <UnifiedBadge variant="base" style="secondary">
                        Remote
                        <Link
                          href={buildFilterUrl({ remote: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove remote filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
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
                    <Button variant="ghost" size="sm" asChild={true}>
                      <Link href={ROUTES.JOBS} className="text-xs">
                        Clear All
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section className={'container mx-auto px-4 py-12'}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {(totalJobs || 0) === 0 ? (
              <Card>
                <CardContent className={'flex flex-col items-center justify-center py-24'}>
                  <div className={'mb-6 rounded-full bg-accent/10 p-4'}>
                    <Briefcase className={'h-12 w-12 text-muted-foreground'} />
                  </div>
                  <h3 className="mb-4 font-bold text-2xl">No Jobs Available Yet</h3>
                  <p className={'mb-8 max-w-md text-center text-muted-foreground leading-relaxed'}>
                    We're building our jobs board! Soon you'll find amazing opportunities with
                    companies working on the future of AI. Be the first to know when new positions
                    are posted.
                  </p>
                  <div className="flex gap-4">
                    <Button asChild={true}>
                      <Link href={ROUTES.PARTNER}>
                        <Plus className="mr-2 h-4 w-4" />
                        Post the First Job
                      </Link>
                    </Button>
                    <Button variant="outline" asChild={true}>
                      <Link href={ROUTES.COMMUNITY}>Join Community</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className={'flex flex-col items-center justify-center py-16'}>
                  <Briefcase className={'mb-4 h-16 w-16 text-muted-foreground'} />
                  <h3 className={'mb-2 font-semibold text-xl'}>No Jobs Found</h3>
                  <p className={'mb-6 max-w-md text-center text-muted-foreground'}>
                    No jobs match your current filters. Try adjusting your search criteria.
                  </p>
                  <Button variant="outline" asChild={true}>
                    <Link href={ROUTES.JOBS}>Clear All Filters</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
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
            )}
          </div>

          <aside className="w-full space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <JobsPromo />
            <JobAlertsCard
              defaultCategory={category || 'all'}
              defaultExperience={experience || 'any'}
              defaultRemote={remote ? 'remote' : 'any'}
            />
          </aside>
        </div>
      </section>

      <section className={'container mx-auto px-4 py-12'}>
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
    return clone.sort((a, b) => {
      const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      return aDate - bDate;
    });
  }

  if (sort === 'salary') {
    return clone.sort((a, b) => {
      const aMax = extractSalaryValue(a.salary);
      const bMax = extractSalaryValue(b.salary);
      return bMax - aMax;
    });
  }

  // newest default
  return clone.sort((a, b) => {
    const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return bDate - aDate;
  });
}

function extractSalaryValue(raw: string | null | undefined) {
  if (!raw) return 0;
  const match = raw.replace(/,/g, '').match(/(\d{2,6})(?:\s?-\s?(\d{2,6}))?/);
  if (!match) return 0;
  const first = Number(match[1]) || 0;
  const second = match[2] ? Number(match[2]) : first;
  return Math.max(first, second);
}
