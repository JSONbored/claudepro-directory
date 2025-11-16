/**
 * Company Profile Page - Database-First via Edge Function
 * Single edge function call (GET) with Supabase CDN caching
 * Leverages get_company_profile() RPC + company_job_stats materialized view
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { getCompanyProfile } from '@/src/lib/data/companies/public';
import { ROUTES } from '@/src/lib/data/config/constants';
import { Briefcase, Building, Calendar, Globe, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 1800; // 30min ISR (fallback if edge function cache misses)

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/companies/:slug', {
    params: { slug },
  });
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;

  let profile: Awaited<ReturnType<typeof getCompanyProfile>>;
  try {
    profile = await getCompanyProfile(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company profile');
    logger.error('CompanyPage: getCompanyProfile threw', normalized, { slug });
    throw normalized;
  }

  if (!profile?.company) {
    logger.warn('CompanyPage: company not found', { slug });
    notFound();
  }

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
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} ${UI_CLASSES.LINK_ACCENT}`}
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}

                  {company.industry && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <TrendingUp className="h-4 w-4" />
                      {company.industry}
                    </div>
                  )}

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
                  Active Positions ({active_jobs?.length || 0})
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
                  {active_jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
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
                    <span className="font-semibold">{stats?.total_jobs || 0}</span>
                  </div>

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>Active Openings</span>
                    <span className="font-semibold text-green-600">{stats?.active_jobs || 0}</span>
                  </div>

                  {stats?.remote_jobs && stats.remote_jobs > 0 && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={UI_CLASSES.TEXT_SM_MUTED}>Remote Positions</span>
                      <span className="font-semibold">{stats.remote_jobs}</span>
                    </div>
                  )}

                  {stats?.avg_salary_min && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={UI_CLASSES.TEXT_SM_MUTED}>Avg. Salary</span>
                      <span className="font-semibold">
                        ${((stats.avg_salary_min ?? 0) / 1000).toFixed(0)}k+
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
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={UI_CLASSES.LINK_ACCENT}
                    >
                      Visit Website ?
                    </a>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}
