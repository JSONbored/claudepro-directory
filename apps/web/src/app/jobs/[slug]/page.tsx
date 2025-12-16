/**
 * Job Detail Page - Database-first job listing display
 */

import { ContentCategory } from '@heyclaude/data-layer/prisma';
import { getSafeMailtoUrl, getSafeWebsiteUrl, isValidCategory } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Users,
} from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata, getJobBySlug } from '@heyclaude/web-runtime/server';
import { type PageProps } from '@heyclaude/web-runtime/types/app.schema';
import { slugParamsSchema } from '@heyclaude/web-runtime/types/app.schema';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { cluster, gap, wrap, muted, paddingX, paddingY, marginX, marginBottom, marginRight, padding, spaceY, marginTop } from '@heyclaude/web-runtime/design-system';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';

import Loading from './loading';

/**
 * Dynamic Rendering: Job detail pages are rendered at request time
 * Uses connection() to defer non-deterministic operations (e.g., Date.now()) to request time
 * Caching behavior is handled by the data layer (getJobBySlug)
 * Remaining job pages are handled via dynamic routing on-demand
 */

/**
 * Builds page metadata for a job detail page from the provided route params and the job record.
 *
 * If the job cannot be loaded, returns metadata without the job `item` and logs the failure.
 *
 * @param params - Promise resolving to route params; must include `slug`.
 * @param params.params
 * @returns The page Metadata populated with the job data when available, otherwise metadata without `item`.
 * @see getJobBySlug
 * @see generatePageMetadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Create request-scoped child logger
  const metadataLogger = logger.child({
    module: 'apps/web/src/app/jobs/[slug]',
    operation: 'JobPageMetadata',
    route: `/jobs/${slug}`,
  });

  let job: Awaited<ReturnType<typeof getJobBySlug>> = null;
  try {
    job = await getJobBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job for metadata');
    metadataLogger.error(
      {
        err: normalized,
        operation: 'generateMetadata',
      },
      'JobPage: getJobBySlug threw in generateMetadata'
    );
  }

  return generatePageMetadata('/jobs/:slug', {
    item: job ? { ...job, tags: job.tags ?? [] } : undefined,
    params: { slug },
    slug,
  });
}

/**
 * Produce a bounded set of static route parameters (job slugs) for build-time pre-rendering.
 *
 * Returns up to 10 `{ slug: string }` objects to limit build-time work. If no jobs are available or an error occurs,
 * returns an empty array. Suspense boundaries will handle dynamic rendering for remaining job pages on-demand.
 *
 * @returns An array of parameter objects where each item is `{ slug: string }`; returns an empty array when no jobs are available or when fetching jobs fails.
 *
 * @see getFilteredJobs - source of job listings used to derive slugs
 */
export async function generateStaticParams() {
  // Limit to top 10 jobs to optimize build time
  // Remaining jobs are handled via dynamic routing on-demand
  const MAX_STATIC_JOBS = 10;

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/jobs/[slug]',
    operation: 'JobPageStaticParams',
    route: '/jobs',
  });

  const { getFilteredJobs } = await import('@heyclaude/web-runtime/server');
  try {
    const jobsResult = await getFilteredJobs({ limit: MAX_STATIC_JOBS });
    const jobs = jobsResult?.jobs ?? [];

    // Cache Components requires at least one result for build-time validation
    // If no jobs found, return a placeholder that will be handled gracefully by the page component
    if (jobs.length === 0) {
      reqLogger.warn(
        {
          section: 'data-fetch',
        },
        'JobPage: No jobs found in generateStaticParams, returning placeholder'
      );
      // Return placeholder slug (valid format: lowercase, numbers, single hyphens)
      // Page component will handle 404 gracefully for placeholder slug
      return [{ slug: 'placeholder' }];
    }

    return jobs.map((job: { slug: string }) => ({ slug: job.slug }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs for static params');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'JobPage: getFilteredJobs threw in generateStaticParams'
    );
    // Cache Components requires at least one result - return placeholder on error
    // Page component will handle 404 gracefully for placeholder slug
    return [{ slug: 'placeholder' }];
  }
}

/**
 * Render the job detail page for the given route slug.
 *
 * Validates the incoming `slug`, loads the matching job record, and renders the server-side UI
 * including metadata, structured data, header, description, requirements, benefits, apply actions,
 * and job details. Calls `notFound()` when slug validation fails or no job is found.
 *
 * @param props.params - Route parameters containing the `slug` for the job to display.
 * @param root0
 * @param root0.params
 * @returns The server-rendered React element for the job detail page.
 *
 * @see getJobBySlug
 * @see getSafeWebsiteUrl
 * @see getSafeMailtoUrl
 */
export default async function JobPage({ params }: PageProps) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  if (!params) {
    notFound();
  }

  const rawParameters = await params;
  const validationResult = slugParamsSchema.safeParse(rawParameters);
  const slug = validationResult.success
    ? validationResult.data.slug
    : String(rawParameters['slug']);

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/jobs/[slug]',
    operation: 'JobPage',
    route: `/jobs/${slug}`,
  });

  // Section: Parameter Validation
  if (!validationResult.success) {
    reqLogger.error(
      {
        err: new Error(validationResult.error.issues[0]?.message ?? 'Invalid slug'),
        errorCount: validationResult.error.issues.length,
        section: 'data-fetch',
      },
      'Invalid slug parameter for job page'
    );
    notFound();
  }

  const validatedSlug = validationResult.data.slug;

  // Handle placeholder slug from generateStaticParams (used when no jobs found at build time)
  // This satisfies Cache Components requirement for at least one static param
  if (validatedSlug === 'placeholder') {
    reqLogger.warn({ section: 'data-fetch' }, 'Placeholder slug detected, returning 404');
    notFound();
  }

  return (
    <Suspense fallback={<Loading />}>
      <JobPageContent reqLogger={reqLogger} slug={validatedSlug} />
    </Suspense>
  );
}

/**
 * Renders the job detail page content for a given slug.
 *
 * Fetches the job data in a Suspense boundary to enable progressive rendering.
 * If the job is not found, calls `notFound()` to trigger a 404 response.
 *
 * @param slug.reqLogger
 * @param slug - The validated job slug
 * @param reqLogger - Request-scoped logger for structured logging
 * @param slug.slug
 * @returns The server-rendered React element for the job detail page
 *
 * @see getJobBySlug
 * @see getSafeWebsiteUrl
 * @see getSafeMailtoUrl
 */
async function JobPageContent({
  reqLogger,
  slug,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  slug: string;
}) {
  // Section: Job Data Fetch
  let job: Awaited<ReturnType<typeof getJobBySlug>>;
  try {
    job = await getJobBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job detail');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'JobPage: getJobBySlug threw'
    );
    throw normalized;
  }

  if (!job) {
    reqLogger.warn({ section: 'data-fetch' }, 'JobPage: job not found');
    notFound();
  }

  const tags = job.tags ?? [];
  const requirements = job.requirements ?? [];
  const benefits = job.benefits ?? [];

  return (
    <>
      <Pulse
        category={ContentCategory.jobs} // 'jobs'
        slug={slug}
        variant="view"
      />
      <StructuredData route={`/jobs/${slug}`} />

      <div className={`bg-background min-h-screen`}>
        <div className="border-border/50 bg-card/30 border-b">
          <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.relaxed}`}>
            <Button asChild className={`${marginBottom.comfortable}`} variant="ghost">
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className={`${marginRight.tight} h-4 w-4`} />
                Back to Jobs
              </Link>
            </Button>

            <div className="max-w-4xl">
              <div className={`flex items-start ${gap.default} ${marginBottom.comfortable} gap-4`}>
                <div className={`bg-accent/10 rounded-lg ${padding.compact}`}>
                  <Building2 className={`text-primary h-6 w-6`} />
                </div>
                <div className="flex-1">
                  <h1 className={`${marginBottom.compact} text-3xl font-bold`}>{job.title}</h1>
                  <p className={`${muted.default} text-xl`}>{job.company}</p>
                </div>
              </div>

              <div className={`${muted.default} ${marginBottom.default} flex flex-wrap gap-4 text-sm`}>
                <div className={cluster.tight}>
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className={cluster.tight}>
                  <DollarSign className="h-4 w-4" />
                  <span>{job.salary ?? 'Competitive'}</span>
                </div>
                <div className={cluster.tight}>
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
                <div className={cluster.tight}>
                  <Users className="h-4 w-4" />
                  <span>{job.category}</span>
                </div>
                <div className={cluster.tight}>
                  <Calendar className="h-4 w-4" />
                  <span>Posted {job.posted_at}</span>
                </div>
              </div>

              <div className={`${wrap} ${gap.compact}`}>
                {tags.map((skill: string) => (
                  <UnifiedBadge key={skill} style="secondary" variant="base">
                    {skill}
                  </UnifiedBadge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
          <div className={`grid grid-cols-1 ${gap.relaxed} lg:grid-cols-3`}>
            <div className={`${spaceY.loose} lg:col-span-2`}>
              <Card>
                <CardHeader>
                  <CardTitle>About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`${muted.default}`}>{job.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={`${spaceY.compact}`}>
                    {requirements.map((request: string) => (
                      <li className={`flex items-start ${gap.default}`} key={request}>
                        <span className={`text-accent ${marginTop.tight}`}>•</span>
                        <span>{request}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className={`${spaceY.compact}`}>
                      {benefits.map((benefit: string) => (
                        <li className={`flex items-start ${gap.default}`} key={benefit}>
                          <span className={`${marginTop.tight} text-green-500`}>✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className={`${spaceY.relaxed}`}>
              {/* Apply Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className={`${spaceY.compact}`}>
                  {(() => {
                    const safeJobLink = getSafeWebsiteUrl(job.link);
                    if (!safeJobLink) return null;
                    // Explicit validation: getSafeWebsiteUrl guarantees the URL is safe
                    // It validates protocol (HTTPS only, or HTTP for localhost), removes credentials,
                    // normalizes hostname, and returns null for any invalid URLs
                    // At this point, safeJobLink is validated and safe for use in external links
                    const validatedUrl: string = safeJobLink;
                    return (
                      <Button asChild className="w-full">
                        <a href={validatedUrl} rel="noopener noreferrer" target="_blank">
                          <ExternalLink className={`${marginRight.tight} h-4 w-4`} />
                          Apply Now
                        </a>
                      </Button>
                    );
                  })()}
                  {(() => {
                    const safeMailtoUrl = getSafeMailtoUrl(job.contact_email);
                    if (!safeMailtoUrl) return null;
                    return (
                      <Button asChild className="w-full" variant="outline">
                        <a href={safeMailtoUrl}>
                          <Building2 className={`${marginRight.tight} h-4 w-4`} />
                          Contact Company
                        </a>
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className={`${spaceY.compact}`}>
                  <div className={`${cluster.compact} text-sm`}>
                    <Clock className={`${muted.default} h-4 w-4`} />
                    <span>
                      {(job.type ?? 'Unknown').charAt(0).toUpperCase() +
                        (job.type ?? 'Unknown').slice(1)}
                    </span>
                  </div>
                  <div className={`${cluster.compact} text-sm`}>
                    <MapPin className={`${muted.default} h-4 w-4`} />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${cluster.compact} text-sm`}>
                    <Users className={`${muted.default} h-4 w-4`} />
                    <span>
                      {job.category && isValidCategory(job.category)
                        ? (getCategoryConfig(job.category)?.typeName ?? job.category)
                        : (job.category ?? 'General')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
