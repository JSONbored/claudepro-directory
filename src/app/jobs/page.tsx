/**
 * Jobs Listing Page - Database-First Job Board
 * Single RPC call to filter_jobs() - all filtering in PostgreSQL
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { JobCard } from '@/src/components/domain/job-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent } from '@/src/components/primitives/card';
import { Input } from '@/src/components/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { ROUTES } from '@/src/lib/constants/routes';
import { Briefcase, Clock, Filter, MapPin, Plus, Search } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

type JobRow = Database['public']['Tables']['jobs']['Row'];

export async function generateMetadata({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  return generatePageMetadata('/jobs', {
    filters: {
      category: rawParams?.category as string | undefined,
      remote: rawParams?.remote === 'true',
    },
  });
}

export default async function JobsPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  const supabase = await createClient();

  const searchQuery =
    (rawParams?.q as string) || (rawParams?.query as string) || (rawParams?.search as string);
  const category = rawParams?.category as string | undefined;
  const employment = rawParams?.employment as string | undefined;
  const experience = rawParams?.experience as string | undefined;
  const remote = rawParams?.remote === 'true';
  const page = Number(rawParams?.page) || 1;
  const limit = Math.min(Number(rawParams?.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const { data: filteredJobs, error } = await supabase.rpc('filter_jobs', {
    ...(searchQuery && { p_search_query: searchQuery }),
    ...(category && category !== 'all' && { p_category: category }),
    ...(employment && employment !== 'any' && { p_employment_type: employment }),
    ...(remote && { p_remote_only: remote }),
    ...(experience && experience !== 'any' && { p_experience_level: experience }),
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    logger.error('Failed to filter jobs', error);
  }

  const jobs = (filteredJobs || []) as JobRow[];

  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('active', true);

  logger.info('Jobs page accessed', {
    ...(searchQuery && { search: searchQuery }),
    ...(category && { category }),
    ...(employment && { employment }),
    ...(remote && { remote }),
    ...(experience && { experience }),
    page,
    limit,
    totalJobs: totalJobs || 0,
    filteredCount: jobs.length,
  });

  const baseId = 'jobs-page';
  const searchInputId = `${baseId}-search`;
  const categoryFilterId = `${baseId}-category`;
  const employmentFilterId = `${baseId}-employment`;

  const buildFilterUrl = (newParams: Record<string, string | boolean | undefined>) => {
    const urlParams = new URLSearchParams();

    const currentParams: Record<string, string | undefined> = {
      search: searchQuery,
      category: category !== 'all' ? category : undefined,
      employment: employment !== 'any' ? employment : undefined,
      experience: experience !== 'any' ? experience : undefined,
      remote: remote ? 'true' : undefined,
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

            <Button variant="outline" size="sm" asChild>
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
              <CardContent className="p-6">
                <form method="GET" action="/jobs" className={UI_CLASSES.GRID_RESPONSIVE_4}>
                  <div className="relative">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
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
                      asChild
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
                </form>

                {(searchQuery ||
                  (category && category !== 'all') ||
                  (employment && employment !== 'any') ||
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
                    <Button variant="ghost" size="sm" asChild>
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
                  <Button variant="outline" asChild>
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
                <Button variant="outline" asChild>
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

              <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
                {jobs.map((job) => (
                  <JobCard key={job.slug} job={job} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="jobs-page" />
      </section>
    </div>
  );
}
