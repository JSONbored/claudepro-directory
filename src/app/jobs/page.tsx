import Link from 'next/link';
import { JobCard } from '@/src/components/cards/job-card';
import { InlineEmailCTA } from '@/src/components/growth/inline-email-cta';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import { ROUTES } from '@/src/lib/constants/routes';
import { getJobs, type Job } from '@/src/lib/data/jobs';
import { Briefcase, Clock, Filter, MapPin, Plus, Search } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import {
  type JobsSearchParams,
  jobsSearchSchema,
  parseSearchParams,
} from '@/src/lib/schemas/search.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export async function generateMetadata({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  const params = parseSearchParams(jobsSearchSchema, rawParams, 'jobs page metadata');

  return generatePageMetadata('/jobs', {
    filters: {
      category: (params as JobsSearchParams).category,
      remote: params.remote,
    },
  });
}

// Enable ISR - revalidate every 4 hours for job listings

// Server-side filtering function
function filterJobs(jobs: Job[], params: JobsSearchParams): Job[] {
  return jobs.filter((job) => {
    // Use validated search query - combined from q, query, or search fields
    const searchQuery = params.q || params.query || params.search || params.location;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (params.location && job.location?.toLowerCase().includes(params.location.toLowerCase()));

    // Handle category filtering with the validated enum
    const matchesCategory =
      !params.category || params.category === 'all' || job.category === params.category;

    // Handle employment type
    const matchesType =
      !params.employment ||
      params.employment === 'any' ||
      job.type === params.employment.replace('-', ' '); // Convert 'full-time' to 'full time'

    // Handle remote filtering with validated boolean
    const matchesRemote = params.remote !== true || job.remote === true;

    // Handle experience level filtering - skip since Job type doesn't have level field
    const matchesExperience = !params.experience || params.experience === 'any';

    return matchesSearch && matchesCategory && matchesType && matchesRemote && matchesExperience;
  });
}

export default async function JobsPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;

  // Validate and parse search parameters with Zod
  const params = parseSearchParams(jobsSearchSchema, rawParams, 'jobs page');

  // Fetch jobs from database
  const allJobs = await getJobs();

  // Log validated parameters for monitoring
  logger.info('Jobs page accessed', {
    search: params.q || params.query || params.search || '',
    location: params.location || '',
    category: params.category,
    employment: params.employment,
    remote: params.remote ? 'true' : 'false',
    experience: params.experience,
    page: params.page,
    limit: params.limit,
    totalJobs: allJobs.length,
  });

  const filteredJobs = filterJobs(allJobs, params);

  // Generate stable, unique IDs for accessibility
  const baseId = 'jobs-page';
  const searchInputId = `${baseId}-search`;
  const categoryFilterId = `${baseId}-category`;
  const employmentFilterId = `${baseId}-employment`;

  // Build current filter URL for form actions with validated params
  const buildFilterUrl = (newParams: Record<string, string | boolean | undefined>) => {
    const urlParams = new URLSearchParams();

    // Convert validated params back to URL-compatible strings
    const currentParams: Record<string, string | undefined> = {
      search: params.search || params.q || params.query || undefined,
      location: params.location,
      category: params.category !== 'all' ? params.category : undefined,
      employment: params.employment !== 'any' ? params.employment : undefined,
      experience: params.experience !== 'any' ? params.experience : undefined,
      remote: params.remote === true ? 'true' : undefined,
    };

    // Merge with new params
    const merged = { ...currentParams, ...newParams };

    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.set(key, String(value));
      }
    });

    return `/jobs${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  };

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section - Server Rendered */}
      <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'text-center max-w-3xl mx-auto'}>
            <div className={'flex justify-center mb-6'}>
              <div className={'p-3 bg-accent/10 rounded-full'}>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>AI Jobs Board</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover opportunities with companies building the future of artificial intelligence.
              From startups to industry giants, find your perfect role.
            </p>

            <div className={'flex flex-wrap justify-center gap-2 mb-8'}>
              <UnifiedBadge variant="base" style="secondary">
                <Briefcase className="h-3 w-3 mr-1" />
                {allJobs.length} Jobs Available
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

      {/* Filters Section */}
      {allJobs.length > 0 && (
        <section className={'px-4 pb-8'}>
          <div className={'container mx-auto'}>
            <Card className="card-gradient glow-effect">
              <CardContent className="p-6">
                <form method="GET" action="/jobs" className={UI_CLASSES.GRID_RESPONSIVE_4}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={searchInputId}
                      name="search"
                      placeholder="Search jobs, companies, or skills..."
                      defaultValue={params.search || params.q || params.query || ''}
                      className="pl-10"
                    />
                  </div>

                  <Select name="category" defaultValue={params.category || 'all'}>
                    <SelectTrigger id={categoryFilterId} aria-label="Filter jobs by category">
                      <Filter className={'h-4 w-4 mr-2'} />
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

                  <Select name="employment" defaultValue={params.employment || 'any'}>
                    <SelectTrigger
                      id={employmentFilterId}
                      aria-label="Filter jobs by employment type"
                    >
                      <Clock className={'h-4 w-4 mr-2'} />
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
                      variant={params.remote === true ? 'default' : 'outline'}
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={buildFilterUrl({
                          remote: params.remote === true ? undefined : 'true',
                        })}
                      >
                        <MapPin className={'h-4 w-4 mr-2'} />
                        Remote
                      </Link>
                    </Button>
                    <Button type="submit" size="sm">
                      Filter
                    </Button>
                  </div>
                </form>

                {/* Active Filters */}
                {(params.search ||
                  params.q ||
                  params.query ||
                  params.location ||
                  (params.category && params.category !== 'all') ||
                  (params.employment && params.employment !== 'any') ||
                  params.remote) && (
                  <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-4 pt-4 border-t border-border`}>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>Active filters:</span>
                    {(params.search || params.q || params.query) && (
                      <UnifiedBadge variant="base" style="secondary">
                        Search: {params.search || params.q || params.query}
                        <Link
                          href={buildFilterUrl({ search: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove search filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {params.category && params.category !== 'all' && (
                      <UnifiedBadge variant="base" style="secondary">
                        {params.category.charAt(0).toUpperCase() + params.category.slice(1)}
                        <Link
                          href={buildFilterUrl({ category: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove category filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {params.employment && params.employment !== 'any' && (
                      <UnifiedBadge variant="base" style="secondary">
                        {params.employment.charAt(0).toUpperCase() +
                          params.employment.slice(1).replace('time', ' Time')}
                        <Link
                          href={buildFilterUrl({ employment: undefined })}
                          className="ml-1 hover:text-destructive"
                          aria-label="Remove employment type filter"
                        >
                          ×
                        </Link>
                      </UnifiedBadge>
                    )}
                    {params.remote === true && (
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

      {/* Jobs Content */}
      <section className={'container mx-auto px-4 py-12'}>
        <div className="space-y-8">
          {allJobs.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className={'flex flex-col items-center justify-center py-24'}>
                <div className={'p-4 bg-accent/10 rounded-full mb-6'}>
                  <Briefcase className={'h-12 w-12 text-muted-foreground'} />
                </div>
                <h3 className="text-2xl font-bold mb-4">No Jobs Available Yet</h3>
                <p className={'text-muted-foreground text-center mb-8 max-w-md leading-relaxed'}>
                  We're building our jobs board! Soon you'll find amazing opportunities with
                  companies working on the future of AI. Be the first to know when new positions are
                  posted.
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href={ROUTES.PARTNER}>
                      <Plus className="h-4 w-4 mr-2" />
                      Post the First Job
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={ROUTES.COMMUNITY}>Join Community</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredJobs.length === 0 ? (
            /* No Results State */
            <Card>
              <CardContent className={'flex flex-col items-center justify-center py-16'}>
                <Briefcase className={'h-16 w-16 text-muted-foreground mb-4'} />
                <h3 className={'text-xl font-semibold mb-2'}>No Jobs Found</h3>
                <p className={'text-muted-foreground text-center mb-6 max-w-md'}>
                  No jobs match your current filters. Try adjusting your search criteria.
                </p>
                <Button variant="outline" asChild>
                  <Link href={ROUTES.JOBS}>Clear All Filters</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Jobs Results */
            <>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <div>
                  <h2 className="text-2xl font-bold">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
                  </h2>
                  <p className="text-muted-foreground">Showing all available positions</p>
                </div>
              </div>

              <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
                {filteredJobs.map((job) => (
                  <JobCard key={job.slug} job={job} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <InlineEmailCTA
          variant="hero"
          context="jobs-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
