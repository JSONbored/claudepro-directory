/**
 * Company Profile Page - Database-First via Edge Function
 * Single edge function call (GET) with Supabase CDN caching
 * Leverages get_company_profile() RPC + company_job_stats materialized view
 */

import { type Database } from '@heyclaude/database-types';
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
import type React from 'react';

import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { StructuredData } from '@/src/components/core/infra/structured-data';

/**
 * Reusable component for rendering safe website links
 * Returns null if URL is invalid, otherwise renders an external link
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

/**
 * Validate and sanitize external website URL for safe use in href attributes
 * Only allows HTTPS URLs (or HTTP for localhost in development)
 * Returns canonicalized URL or null if invalid
 */
function getSafeWebsiteUrl(url: null | string | undefined): null | string {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol (or HTTP for localhost/development)
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';
    const isValidProtocol =
      parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLocalhost);
    if (!isValidProtocol) return null;
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href (guaranteed to be normalized and safe)
    return parsed.href;
  } catch {
    return null;
  }
}

interface CompanyPageProperties {
  params: Promise<{ slug: string }>;
}

export const revalidate = 1800; // 30min ISR (fallback if edge function cache misses)
export const dynamicParams = true; // Allow unknown slugs to be rendered on demand (will 404 if invalid)

/**
 * Produce route params for pre-rendering company pages at build time.
 *
 * Generates up to 10 { slug } objects for static pre-rendering; remaining company pages are rendered on demand via dynamicParams with ISR. On failure, logs the error and returns an empty array.
 *
 * @returns An array of objects each containing a `slug` string for a company page; empty if fetching fails or no slugs are available.
 *
 * @see {@link /apps/web/src/app/companies/[slug]/page.tsx | CompanyPage}
 * @see {@link getCompaniesList} from @heyclaude/web-runtime/data
 * @see {@link generateRequestId}
 * @see {@link normalizeError}
 */
export async function generateStaticParams() {
  // Limit to top 10 companies to optimize build time
  const MAX_STATIC_COMPANIES = 10;

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

    return companies
      .filter((company): company is typeof company & { slug: string } => Boolean(company.slug))
      .map((company) => ({
        slug: company.slug,
      }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies for generateStaticParams');
    reqLogger.error('generateStaticParams: failed to load companies', normalized);
    return [];
  }
}

export async function generateMetadata({ params }: CompanyPageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/companies/:slug', {
    params: { slug },
  });
}

/**
 * Render the company profile page for a given slug, including the company header,
 * active job listings, and a sidebar with hiring statistics and site CTA.
 *
 * This server component fetches the company profile by slug and returns a 404
 * when the company is not found. The rendered page includes:
 * - StructuredData for the route
 * - Company header (logo or placeholder, name, featured badge, description, metadata, website)
 * - Main content with active positions or a "No Active Positions" callout
 * - Sidebar with company stats and a website CTA
 *
 * Data fetching uses the app's RPC materialized view and participates in the
 * file-level ISR configuration (revalidation settings applied at the route level).
 *
 * @param params - Route params object containing the `slug` of the company
 * @returns The company profile page element containing header, listings, and stats
 *
 * @see getCompanyProfile
 * @see SafeWebsiteLink
 * @see generateStaticParams
 */
export default async function CompanyPage({ params }: CompanyPageProperties) {
  const { slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CompanyPage',
    route: `/companies/${slug}`,
    module: 'apps/web/src/app/companies/[slug]',
  });

  // Section: Company Profile Fetch
  const profile = await getCompanyProfile(slug);

  if (!profile?.company) {
    reqLogger.warn('CompanyPage: company not found', {
      section: 'company-profile-fetch',
    });
    notFound();
  }

  // profile and profile.company are guaranteed to be non-null after the check above
  const { company, active_jobs, stats } = profile;

  return (
    <>
      <StructuredData route={`/companies/${slug}`} />

      <div className="bg-background min-h-screen">
        {/* Company Header */}
        <section className="border-border relative border-b">
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
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content - Active jobs */}
            <div className="space-y-6">
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <h2 className="text-2xl font-bold">
                  Active Positions ({active_jobs?.length ?? 0})
                </h2>
              </div>

              {!active_jobs || active_jobs.length === 0 ? (
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
                  {active_jobs
                    .filter(
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
                          job.view_count !== null &&
                          job.click_count !== null
                        );
                      }
                    )
                    .map((job) => {
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
            </div>

            {/* Sidebar - Company stats */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
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
                      <span className="font-semibold">
                        ${(stats.avg_salary_min / 1000).toFixed(0)}k+
                      </span>
                    </div>
                  ) : null}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>Total Views</span>
                    <span className="font-semibold">
                      {(stats?.total_views ?? 0).toLocaleString()}
                    </span>
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
                  <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                    {company.website
                      ? 'Visit their website to learn more about the company and culture.'
                      : 'Check back regularly for new opportunities!'}
                  </p>
                  <SafeWebsiteLink url={company.website} className={UI_CLASSES.LINK_ACCENT}>
                    Visit Website
                  </SafeWebsiteLink>
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}