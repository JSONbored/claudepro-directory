/**
 * Company Profile Page - Database-First via Edge Function
 * Single edge function call (GET) with Supabase CDN caching
 * Leverages get_company_profile() RPC + company_job_stats materialized view
 */

import { type Database } from '@heyclaude/database-types';
import { getSafeWebsiteUrl } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getCompanyProfile } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Briefcase,
  Building,
  Calendar,
  Globe,
  TrendingUp,
  Users,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import type React from 'react';

import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { StructuredData } from '@/src/components/core/infra/structured-data';

/**
 * Render an external anchor for a validated website URL or nothing when the URL is not safe.
 *
 * @param url - The website URL to validate; may be `null` or `undefined`. If not a safe URL, nothing is rendered.
 * @param children - Content to display inside the anchor element.
 * @param className - Optional CSS class names applied to the anchor.
 * @returns An anchor element for the validated URL, or `null` if the URL is not safe.
 *
 * @see {@link @heyclaude/web-runtime/core#getSafeWebsiteUrl}
 */
function SafeWebsiteLink({
  url,
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  url: null | string | undefined;
}) {
  const safeUrl = getSafeWebsiteUrl(url);
  if (!safeUrl) return null;

  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

interface CompanyPageProperties {
  params: Promise<{ slug: string }>;
}

/**
 * Limit to top 10 companies to optimize build time for static pre-rendering.
 * Remaining company pages are rendered on demand via dynamicParams with ISR.
 */
const MAX_STATIC_COMPANIES = 10;

/**
 * Generate route params for build-time pre-rendering of a subset of company pages.
 *
 * Produces up to `MAX_STATIC_COMPANIES` objects of the form `{ slug }` for static pre-rendering.
 * If no valid slugs are found or fetching companies fails, returns a placeholder array containing `{ slug: '__placeholder__' }`
 * to satisfy Cache Components build-time requirements so remaining pages can be rendered dynamically.
 *
 * @returns An array of `{ slug: string }` objects for build-time pre-rendering, or `[{ slug: '__placeholder__' }]` when no valid slugs are available or an error occurs.
 *
 * @see {@link /apps/web/src/app/companies/[slug]/page.tsx | CompanyPage}
 * @see {@link getCompaniesList} from @heyclaude/web-runtime/data
 * @see {@link generateRequestId}
 * @see {@link normalizeError}
 * @see {@link MAX_STATIC_COMPANIES}
 */
export async function generateStaticParams() {
  // Generate requestId for static params generation (build-time)
  const staticParamsRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId: staticParamsRequestId,
    operation: 'CompanyPageStaticParams',
    route: '/companies/[slug]',
    module: 'apps/web/src/app/companies/[slug]',
  });

  const { getCompaniesList } = await import('@heyclaude/web-runtime/data');

  try {
    const result = await getCompaniesList(MAX_STATIC_COMPANIES, 0);
    const companies = result.companies ?? [];

    const validCompanies = companies
      .filter((company): company is typeof company & { slug: string } => Boolean(company.slug))
      .map((company) => ({
        slug: company.slug,
      }));

    if (validCompanies.length === 0) {
      reqLogger.warn('generateStaticParams: no companies available, returning placeholder');
      // Cache Components requires at least one result for build-time validation
      // Return a placeholder that will be handled dynamically (404 in page component)
      return [{ slug: '__placeholder__' }];
    }

    return validCompanies;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies for generateStaticParams');
    reqLogger.error('generateStaticParams: failed to load companies', normalized);
    // Cache Components requires at least one result - return placeholder on error
    return [{ slug: '__placeholder__' }];
  }
}

/**
 * Generate page metadata for a company detail route identified by `slug`.
 *
 * Defers non-deterministic work to request time before producing metadata for `/companies/:slug`.
 *
 * @param params - Route parameters containing the `slug` of the company
 * @returns The Metadata for the `/companies/:slug` page
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({ params }: CompanyPageProperties): Promise<Metadata> {
  const { slug } = await params;

  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  return generatePageMetadata('/companies/:slug', {
    params: { slug },
  });
}

/**
 * Render the company profile page shell and stream the header, job listings, and stats into their Suspense boundaries.
 *
 * The component emits a static page structure immediately (for partial page rendering) while CompanyHeader,
 * CompanyJobsList, and CompanyStats load their cached data and stream into the UI.
 *
 * @param params - Route params object containing the `slug` of the company
 * @returns The React element tree for the company profile page (header, listings, and stats)
 *
 * @see getCompanyProfile
 * @see SafeWebsiteLink
 * @see generateStaticParams
 */
export default async function CompanyPage({ params }: CompanyPageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CompanyPage',
    module: 'apps/web/src/app/companies/[slug]',
  });

  const { slug } = await params;

  // Static shell - renders immediately for PPR
  return (
    <>
      <StructuredData route={`/companies/${slug}`} />
      <div className="bg-background min-h-screen">
        {/* Company Header - streams in Suspense */}
        <section className="border-border relative border-b">
          <Suspense fallback={<CompanyHeaderSkeleton />}>
            <CompanyHeader slug={slug} reqLogger={reqLogger} />
          </Suspense>
        </section>

        {/* Content - streams in Suspense */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content - Active jobs */}
            <div className="space-y-6">
              <Suspense fallback={<JobsListSkeleton />}>
                <CompanyJobsList slug={slug} reqLogger={reqLogger} />
              </Suspense>
            </div>

            {/* Sidebar - Company stats */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              <Suspense fallback={<StatsSkeleton />}>
                <CompanyStats slug={slug} reqLogger={reqLogger} />
              </Suspense>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Renders the company profile header for a company page.
 *
 * Fetches the company's cached profile and renders the logo, name, badges,
 * description, and metadata links (website, industry, size, "using since" date).
 * If the company cannot be found, logs a warning and calls `notFound()` to
 * trigger a 404 response.
 *
 * @param props.slug - The company slug used to fetch the profile.
 * @param props.reqLogger - Request-scoped logger used for route-scoped logging.
 * @returns The header JSX for the company's profile page.
 *
 * @see getCompanyProfile
 * @see SafeWebsiteLink
 */
async function CompanyHeader({
  slug,
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  slug: string;
}) {
  const route = `/companies/${slug}`;
  const routeLogger = reqLogger.child({ route });

  // Fetch company profile (cached via 'use cache')
  const profile = await getCompanyProfile(slug);

  if (!profile?.company) {
    routeLogger.warn('CompanyPage: company not found', {
      section: 'company-profile-fetch',
    });
    notFound();
  }

  const { company } = profile;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-start gap-6">
        {company.logo ? (
          <Image
            src={company.logo}
            alt={`${company.name} logo`}
            width={96}
            height={96}
            className="border-background h-24 w-24 rounded-lg border-4 object-cover"
            priority
          />
        ) : (
          <div className="border-background bg-accent flex h-24 w-24 items-center justify-center rounded-lg border-4 text-2xl font-bold">
            <Building className="h-12 w-12" />
          </div>
        )}

        <div className="flex-1">
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.featured ? (
              <UnifiedBadge variant="base" style="default">
                Featured
              </UnifiedBadge>
            ) : null}
          </div>

          {company.description ? (
            <p className="text-muted-foreground mt-2 max-w-3xl">{company.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <SafeWebsiteLink
              url={company.website}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.LINK_ACCENT}`}
            >
              <Globe className="h-4 w-4" />
              Website
            </SafeWebsiteLink>

            {company.industry ? (
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <TrendingUp className="h-4 w-4" />
                {company.industry}
              </div>
            ) : null}

            {/* eslint-disable-next-line unicorn/explicit-length-check -- company.size is an enum value, not a Set/Map */}
            {company.size ? (
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Users className="h-4 w-4" />
                {company.size}
              </div>
            ) : null}

            {company.using_cursor_since ? (
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Calendar className="h-4 w-4" />
                Using Claude since{' '}
                {new Date(company.using_cursor_since).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the company's active job listings section by fetching the company profile and displaying either a "No Active Positions" card or a grid of validated JobCard entries.
 *
 * Fetches the profile for `slug`, filters active jobs to required fields, and renders a count header plus the appropriate content.
 *
 * If the company is not found, logs a warning and calls `notFound()` to render a 404 response.
 *
 * @param props.slug - The company slug to load job listings for.
 * @param props.reqLogger - A request-scoped logger; used to create a route-scoped child logger for this component.
 * @returns A JSX element containing the section header and either a "No Active Positions" card or a grid of `JobCard` components.
 *
 * @see getCompanyProfile
 * @see JobCard
 * @see notFound
 */
async function CompanyJobsList({
  slug,
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  slug: string;
}) {
  const route = `/companies/${slug}`;
  const routeLogger = reqLogger.child({ route });

  // Fetch company profile (cached via 'use cache')
  const profile = await getCompanyProfile(slug);

  if (!profile?.company) {
    routeLogger.warn('CompanyPage: company not found', {
      section: 'company-profile-fetch',
    });
    notFound();
  }

  const { active_jobs } = profile;

  const filteredActiveJobs =
    active_jobs?.filter(
      (
        job
      ): job is typeof job & {
        click_count: number;
        company: string;
        experience: Database['public']['Enums']['experience_level'];
        expires_at: string;
        id: string;
        plan: Database['public']['Enums']['job_plan'];
        posted_at: string;
        slug: string;
        title: string;
        view_count: number;
        workplace: Database['public']['Enums']['workplace_type'];
      } => {
        return Boolean(
          job.id &&
          job.slug &&
          job.title &&
          job.company &&
          job.workplace &&
          job.experience &&
          job.plan &&
          job.posted_at &&
          job.expires_at &&
          typeof job.view_count === 'number' &&
          typeof job.click_count === 'number'
        );
      }
    ) ?? [];

  return (
    <>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <h2 className="text-2xl font-bold">Active Positions ({filteredActiveJobs.length})</h2>
      </div>

      {filteredActiveJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Briefcase className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">No Active Positions</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              This company doesn't have any job openings at the moment. Check back later!
            </p>
            <Link href={ROUTES.JOBS}>
              <UnifiedBadge variant="base" style="default">
                Browse All Jobs
              </UnifiedBadge>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredActiveJobs.map((job) => {
            return (
              <JobCard
                key={job.id}
                job={{
                  id: job.id,
                  slug: job.slug,
                  title: job.title,
                  company: job.company,
                  company_logo: job.company_logo,
                  location: job.location,
                  description: job.description,
                  salary: job.salary,
                  remote: job.remote ?? false,
                  type: job.type,
                  workplace: job.workplace,
                  experience: job.experience,
                  category: job.category,
                  tags: job.tags ?? [],
                  plan: job.plan,
                  tier: job.tier,
                  posted_at: job.posted_at,
                  expires_at: job.expires_at,
                  view_count: job.view_count,
                  click_count: job.click_count,
                  link: job.link,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Renders a company statistics sidebar by fetching the company's profile and streaming the data into Suspense.
 *
 * Fetches the cached company profile for the given slug and renders summary stats (total jobs, active openings,
 * remote positions, average salary, total views, latest posting) plus a CTA with a link to the company website when available.
 * If the profile is missing or lacks a company, logs a warning and triggers a notFound response.
 *
 * @param props.slug - The company slug used to fetch the profile
 * @param props.reqLogger - A request-scoped logger instance for structured logging
 * @returns The sidebar JSX containing company stats and a CTA
 *
 * @see getCompanyProfile
 * @see SafeWebsiteLink
 * @see notFound
 */
async function CompanyStats({
  slug,
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  slug: string;
}) {
  const route = `/companies/${slug}`;
  const routeLogger = reqLogger.child({ route });

  // Fetch company profile (cached via 'use cache')
  const profile = await getCompanyProfile(slug);

  if (!profile?.company) {
    routeLogger.warn('CompanyPage: company not found', {
      section: 'company-profile-fetch',
    });
    notFound();
  }

  const { company, stats } = profile;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Company Stats</CardTitle>
          <CardDescription>Hiring activity and engagement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <span className={UI_CLASSES.TEXT_SM_MUTED}>Total Jobs Posted</span>
            <span className="font-semibold">{stats?.total_jobs ?? 0}</span>
          </div>

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <span className={UI_CLASSES.TEXT_SM_MUTED}>Active Openings</span>
            <span className="font-semibold text-green-600">{stats?.active_jobs ?? 0}</span>
          </div>

          {stats && (stats.remote_jobs ?? 0) > 0 ? (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={UI_CLASSES.TEXT_SM_MUTED}>Remote Positions</span>
              <span className="font-semibold">{stats.remote_jobs ?? 0}</span>
            </div>
          ) : null}

          {stats?.avg_salary_min ? (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={UI_CLASSES.TEXT_SM_MUTED}>Avg. Salary</span>
              <span className="font-semibold">${(stats.avg_salary_min / 1000).toFixed(0)}k+</span>
            </div>
          ) : null}

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <span className={UI_CLASSES.TEXT_SM_MUTED}>Total Views</span>
            <span className="font-semibold">{(stats?.total_views ?? 0).toLocaleString()}</span>
          </div>

          {stats?.latest_job_posted_at ? (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={UI_CLASSES.TEXT_SM_MUTED}>Latest Posting</span>
              <span className="text-sm font-semibold">
                {new Date(stats.latest_job_posted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* CTA Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg">Interested in joining?</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const safeWebsiteUrl = getSafeWebsiteUrl(company.website);
            const hasWebsite = Boolean(safeWebsiteUrl);

            return (
              <>
                <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                  {hasWebsite
                    ? 'Visit their website to learn more about the company and culture.'
                    : 'Check back regularly for new opportunities!'}
                </p>
                {hasWebsite ? (
                  <SafeWebsiteLink url={safeWebsiteUrl} className={UI_CLASSES.LINK_ACCENT}>
                    Visit Website
                  </SafeWebsiteLink>
                ) : null}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Render a skeleton placeholder for the company header used during progressive rendering.
 *
 * Shows animated blocks that match the company header layout (logo, title, description, and metadata)
 * to indicate loading state while the real CompanyHeader streams in.
 *
 * @returns A JSX element containing the skeleton header layout with animated placeholders.
 *
 * @see CompanyHeader - the real header component that replaces this skeleton
 * @see CompanyJobsList - main content that loads alongside the header
 * @see StatsSkeleton - related sidebar skeleton used during loading
 */
function CompanyHeaderSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-start gap-6">
        <div className="bg-muted h-24 w-24 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="bg-muted h-8 w-64 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="mt-4 flex gap-4">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a skeleton placeholder for the jobs list while job data is loading.
 *
 * Displays a pulsing heading block and four placeholder job cards to match the
 * final list layout and preserve page structure during suspense-driven loading.
 *
 * @returns A JSX element containing the jobs list loading skeleton.
 *
 * @see JobsList
 * @see JobCard
 */
function JobsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="py-12">
              <div className="bg-muted h-48 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Render a skeleton placeholder for the Company Stats card while data is loading.
 *
 * Displays an animated header and five placeholder stat rows to match the final layout.
 *
 * @returns A JSX element containing a Card with an animated header and five stat-row placeholders.
 *
 * @see CompanyStats
 */
function StatsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted h-6 w-32 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-48 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-12 animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}