/**
 * Company Profile Page - Database-First via Edge Function
 * Single edge function call (GET) with Supabase CDN caching
 * Leverages get_company_profile() RPC + company_job_stats materialized view
 */

import type { Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  withDuration,
} from '@heyclaude/web-runtime/core';
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
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type React from 'react';

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

/**
 * Reusable component for rendering safe website links
 * Returns null if URL is invalid, otherwise renders an external link
 */
function SafeWebsiteLink({
  url,
  children,
  className,
}: {
  url: string | null | undefined;
  children: React.ReactNode;
  className?: string;
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
function getSafeWebsiteUrl(url: string | null | undefined): string | null {
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
// eslint-disable-next-line unicorn/prevent-abbreviations -- Next.js API convention
export const dynamicParams = true; // Allow unknown slugs to be rendered on demand (will 404 if invalid)

/**
 * Generate static params for company pages
 * Pre-renders top 50 companies at build time for optimal SEO and performance
 */
// eslint-disable-next-line unicorn/prevent-abbreviations -- Next.js API convention
export async function generateStaticParams() {
  const { getCompaniesList } = await import('@heyclaude/web-runtime/data');
  const { logger, createWebAppContextWithId, generateRequestId, normalizeError } = await import(
    '@heyclaude/web-runtime/core'
  );

  // Generate requestId for static params generation (build-time)
  // eslint-disable-next-line unicorn/prevent-abbreviations -- Must match architectural rule expectation
  const staticParamsRequestId = generateRequestId();
  // eslint-disable-next-line unicorn/prevent-abbreviations -- Must match architectural rule expectation
  const staticParamsLogContext = createWebAppContextWithId(
    staticParamsRequestId,
    '/companies/[slug]',
    'CompanyPageStaticParams'
  );

  try {
    const result = await getCompaniesList(50, 0);
    const companies = result.companies ?? [];

    return companies
      .filter((company): company is typeof company & { slug: string } => Boolean(company.slug))
      .map((company) => ({
        slug: company.slug,
      }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies for generateStaticParams');
    logger.error('generateStaticParams: failed to load companies', normalized, staticParamsLogContext);
    return [];
  }
}

export async function generateMetadata({ params }: CompanyPageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/companies/:slug', {
    params: { slug },
  });
}

export default async function CompanyPage({ params }: CompanyPageProperties) {
  const { slug } = await params;

  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, `/companies/${slug}`, 'CompanyPage', {
    slug,
  });

  // Section: Company Profile Fetch
  const profileSectionStart = Date.now();
  const profile = await getCompanyProfile(slug);

  if (!profile?.company) {
    logger.warn('CompanyPage: company not found', undefined, {
      ...withDuration(baseLogContext, startTime),
      requestId,
      operation: 'CompanyPage',
      section: 'company-profile-fetch',
      sectionDuration_ms: Date.now() - profileSectionStart,
    });
    notFound();
  }

  // profile and profile.company are guaranteed to be non-null after the check above
  const { company, active_jobs, stats } = profile;

  return (
    <>
      <StructuredData route={`/companies/${slug}`} />

      <div className={'min-h-screen bg-background'}>
        {/* Company Header */}
        <section className="relative border-border border-b">
          <div className={'container mx-auto px-4 py-12'}>
            <div className="flex items-start gap-6">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg border-4 border-background object-cover"
                  priority={true}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-4 border-background bg-accent font-bold text-2xl">
                  <Building className="h-12 w-12" />
                </div>
              )}

              <div className="flex-1">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
                  <h1 className="font-bold text-3xl">{company.name}</h1>
                  {company.featured && (
                    <UnifiedBadge variant="base" style="default">
                      Featured
                    </UnifiedBadge>
                  )}
                </div>

                {company.description && (
                  <p className={'mt-2 max-w-3xl text-muted-foreground'}>{company.description}</p>
                )}

                <div className={'mt-4 flex flex-wrap items-center gap-4 text-sm'}>
                  <SafeWebsiteLink
                    url={company.website}
                    className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.LINK_ACCENT}`}
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </SafeWebsiteLink>

                  {company.industry && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <TrendingUp className="h-4 w-4" />
                      {company.industry}
                    </div>
                  )}

                  {/* eslint-disable-next-line unicorn/explicit-length-check -- company.size is an enum value, not a Set/Map */}
                  {company.size && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Users className="h-4 w-4" />
                      {company.size}
                    </div>
                  )}

                  {company.using_cursor_since && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Calendar className="h-4 w-4" />
                      Using Claude since{' '}
                      {new Date(company.using_cursor_since).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className={'container mx-auto px-4 py-12'}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content - Active jobs */}
            <div className="space-y-6">
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <h2 className="font-bold text-2xl">
                  Active Positions ({active_jobs?.length ?? 0})
                </h2>
              </div>

              {!active_jobs || active_jobs.length === 0 ? (
                <Card>
                  <CardContent className={'flex flex-col items-center py-16'}>
                    <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className={'mb-2 font-semibold text-xl'}>No Active Positions</h3>
                    <p className={'mb-6 max-w-md text-center text-muted-foreground'}>
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
                    .filter((job): job is typeof job & {
                      id: string;
                      slug: string;
                      title: string;
                      company: string;
                      workplace: Database['public']['Enums']['workplace_type'];
                      experience: Database['public']['Enums']['experience_level'];
                      plan: Database['public']['Enums']['job_plan'];
                      posted_at: string;
                      expires_at: string;
                      view_count: number;
                      click_count: number;
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
                    })
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

                  {stats && (stats.remote_jobs ?? 0) > 0 && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={UI_CLASSES.TEXT_SM_MUTED}>Remote Positions</span>
                      <span className="font-semibold">{stats.remote_jobs ?? 0}</span>
                    </div>
                  )}

                  {stats?.avg_salary_min && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={UI_CLASSES.TEXT_SM_MUTED}>Avg. Salary</span>
                      <span className="font-semibold">
                        ${(stats.avg_salary_min / 1000).toFixed(0)}k+
                      </span>
                    </div>
                  )}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>Total Views</span>
                    <span className="font-semibold">
                      {(stats?.total_views ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {stats?.latest_job_posted_at && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={UI_CLASSES.TEXT_SM_MUTED}>Latest Posting</span>
                      <span className="font-semibold text-sm">
                        {new Date(stats.latest_job_posted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
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
