/**
 * Job Detail Page - Database-first job listing display
 */

import { Constants } from '@heyclaude/database-types';
import { getSafeWebsiteUrl, getSafeMailtoUrl, isValidCategory } from '@heyclaude/web-runtime/core';
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
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
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
    operation: 'JobPageMetadata',
    route: `/jobs/${slug}`,
    module: 'apps/web/src/app/jobs/[slug]',
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
    params: { slug },
    item: job ? { ...job, tags: job.tags ?? [] } : undefined,
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
    operation: 'JobPageStaticParams',
    route: '/jobs',
    module: 'apps/web/src/app/jobs/[slug]',
  });

  const { getFilteredJobs } = await import('@heyclaude/web-runtime/server');
  try {
    const jobsResult = await getFilteredJobs({ limit: MAX_STATIC_JOBS });
    const jobs = jobsResult?.jobs ?? [];

    // Return empty array if no jobs found - Suspense boundaries will handle dynamic rendering
    // This follows Next.js best practices by avoiding placeholder patterns
    return jobs.map((job) => ({ slug: job.slug }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs for static params');
    reqLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'JobPage: getFilteredJobs threw in generateStaticParams'
    );
    // Return empty array on error - Suspense boundaries will handle dynamic rendering
    return [];
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
    operation: 'JobPage',
    route: `/jobs/${slug}`,
    module: 'apps/web/src/app/jobs/[slug]',
  });

  // Handle placeholder slugs (if any remain from old generateStaticParams)
  if (slug === '__placeholder__') {
    reqLogger.warn(
      {
        section: 'data-fetch',
        slug,
      },
      'JobPage: placeholder slug detected, returning 404'
    );
    notFound();
  }

  // Section: Parameter Validation
  if (!validationResult.success) {
    reqLogger.error(
      {
        section: 'data-fetch',
        err: new Error(validationResult.error.issues[0]?.message ?? 'Invalid slug'),
        errorCount: validationResult.error.issues.length,
      },
      'Invalid slug parameter for job page'
    );
    notFound();
  }

  const validatedSlug = validationResult.data.slug;

  return (
    <Suspense fallback={<Loading />}>
      <JobPageContent slug={validatedSlug} reqLogger={reqLogger} />
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
  slug,
  reqLogger,
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
        section: 'data-fetch',
        err: normalized,
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
        variant="view"
        category={Constants.public.Enums.content_category[9]} // 'jobs'
        slug={slug}
      />
      <StructuredData route={`/jobs/${slug}`} />

      <div className="bg-background min-h-screen">
        <div className="border-border/50 bg-card/30 border-b">
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>

            <div className="max-w-4xl">
              <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} mb-6 gap-4`}>
                <div className="bg-accent/10 rounded-lg p-3">
                  <Building2 className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-2 text-3xl font-bold">{job.title}</h1>
                  <p className="text-muted-foreground text-xl">{job.company}</p>
                </div>
              </div>

              <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  <span>{job.salary ?? 'Competitive'}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Users className="h-4 w-4" />
                  <span>{job.category}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Calendar className="h-4 w-4" />
                  <span>Posted {job.posted_at}</span>
                </div>
              </div>

              <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
                {tags.map((skill: string) => (
                  <UnifiedBadge key={skill} variant="base" style="secondary">
                    {skill}
                  </UnifiedBadge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{job.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.map((request: string) => (
                      <li key={request} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                        <span className="text-accent mt-1">•</span>
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
                    <ul className="space-y-2">
                      {benefits.map((benefit: string) => (
                        <li key={benefit} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                          <span className="mt-1 text-green-500">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Apply Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(() => {
                    const safeJobLink = getSafeWebsiteUrl(job.link);
                    if (!safeJobLink) return null;
                    // Explicit validation: getSafeWebsiteUrl guarantees the URL is safe
                    // It validates protocol (HTTPS only, or HTTP for localhost), removes credentials,
                    // normalizes hostname, and returns null for any invalid URLs
                    // At this point, safeJobLink is validated and safe for use in external links
                    const validatedUrl: string = safeJobLink;
                    return (
                      <Button className="w-full" asChild>
                        <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Apply Now
                        </a>
                      </Button>
                    );
                  })()}
                  {(() => {
                    const safeMailtoUrl = getSafeMailtoUrl(job.contact_email);
                    if (!safeMailtoUrl) return null;
                    return (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={safeMailtoUrl}>
                          <Building2 className="mr-2 h-4 w-4" />
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
                <CardContent className="space-y-2">
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span>
                      {(job.type ?? 'Unknown').charAt(0).toUpperCase() +
                        (job.type ?? 'Unknown').slice(1)}
                    </span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <Users className="text-muted-foreground h-4 w-4" />
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
