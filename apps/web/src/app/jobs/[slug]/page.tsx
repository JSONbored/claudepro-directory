/**
 * Job Detail Page - Database-first job listing display
 */

import { Constants } from '@heyclaude/database-types';
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
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
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
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';

/**
 * Validate and sanitize external website URL for safe use in href attributes
 * Only allows HTTPS URLs (or HTTP for localhost in development)
 * Returns canonicalized URL or null if invalid
 */
/**
 * ISR: 2 hours (7200s) - Job postings are relatively stable
 */
export const revalidate = 7200;
export const dynamicParams = true; /**
 * Validate and sanitize an external website URL for safe use as an href.
 *
 * @param url - The input URL to validate; may be `null` or `undefined`.
 * @returns A canonicalized, safe href string when the input is an allowed URL, `null` otherwise. Allowed URLs use `https:` universally; `http:` is allowed only for localhost addresses. URLs containing credentials or failing parsing are rejected.
 *
 * @see getSafeMailtoUrl
 * @see /apps/web/src/app/jobs/[slug]/page.tsx - usage for external apply links
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
    if (parsed.protocol === 'https:') {
      // HTTPS always allowed
    } else if (parsed.protocol === 'http:' && isLocalhost) {
      // HTTP allowed only for local development
    } else {
      return null;
    }
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove credentials
    parsed.username = '';
    parsed.password = '';
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

/**
 * Validate and sanitize email address for safe use in mailto links
 * Returns safe mailto URL or null if email is invalid
 */
function getSafeMailtoUrl(email: null | string | undefined): null | string {
  if (!email || typeof email !== 'string') return null;

  // Trim and normalize
  const trimmed = email.trim();
  if (trimmed.length === 0) return null;

  // Basic email format validation (RFC 5322 simplified)
  // Prevents injection attacks while allowing valid emails
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Validate format
  if (!emailRegex.test(trimmed)) return null;

  // Security checks: reject dangerous patterns
  // Prevent null bytes
  if (trimmed.includes('\0')) return null;
  // Prevent path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('//')) return null;
  // Prevent protocol injection (javascript:, data:, etc.)
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null;

  // Normalize to lowercase
  const normalized = trimmed.toLowerCase();

  // Limit length (RFC 5321: max 254 characters)
  if (normalized.length > 254) return null;

  // Encode email in mailto URL to prevent injection
  // encodeURIComponent handles special characters safely
  return `mailto:${encodeURIComponent(normalized)}`;
}

/**
 * Builds page metadata for a job detail page from the provided route params and the job record.
 *
 * If the job cannot be loaded, returns metadata without the job `item` and logs the failure.
 *
 * @param params - Promise resolving to route params; must include `slug`.
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
  // Generate requestId for metadata generation (separate from page render)
  const metadataRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    requestId: metadataRequestId,
    operation: 'JobPageMetadata',
    route: `/jobs/${slug}`,
    module: 'apps/web/src/app/jobs/[slug]',
  });

  let job: Awaited<ReturnType<typeof getJobBySlug>> = null;
  try {
    job = await getJobBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job for metadata');
    metadataLogger.error('JobPage: getJobBySlug threw in generateMetadata', normalized, {
      operation: 'generateMetadata',
    });
  }

  return generatePageMetadata('/jobs/:slug', {
    params: { slug },
    item: job ? { ...job, tags: job.tags ?? [] } : undefined,
    slug,
  });
}

/**
 * Produce static route parameters (slugs) for pre-rendering a subset of job pages at build time.
 *
 * Generates an array of parameter objects used by Next.js to statically pre-render job pages.
 * Only a limited number of jobs are returned to bound build-time work; remaining jobs are handled on demand.
 *
 * @returns An array of parameter objects `{ slug: string }` for up to 10 jobs; returns an empty array if no jobs are available or if an error occurs.
 *
 * @see getFilteredJobs - source of job listings used to derive slugs
 * @see export const dynamicParams - remaining job pages are rendered on-demand when not pre-rendered
 */
export async function generateStaticParams() {
  // Limit to top 10 jobs to optimize build time
  // ISR with dynamicParams=true handles remaining jobs on-demand
  const MAX_STATIC_JOBS = 10;

  // Generate requestId for static params generation (build-time)
  const staticParametersRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId: staticParametersRequestId,
    operation: 'JobPageStaticParams',
    route: '/jobs',
    module: 'apps/web/src/app/jobs/[slug]',
  });

  const { getFilteredJobs } = await import('@heyclaude/web-runtime/server');
  try {
    const jobsResult = await getFilteredJobs({ limit: MAX_STATIC_JOBS });
    const jobs = jobsResult?.jobs ?? [];

    if (jobs.length === 0) {
      reqLogger.warn('generateStaticParams: no jobs available, returning no static params');
      return [];
    }

    return jobs.map((job) => ({ slug: job.slug }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs for static params');
    reqLogger.error('JobPage: getFilteredJobs threw in generateStaticParams', normalized);
    return [];
  }
}

/**
 * Renders the job detail page for a given route slug: validates the slug, loads the job record,
 * and returns the server-rendered UI for the job (header, description, requirements, benefits,
 * apply actions, and job details). If the slug is invalid or the job is not found, the route
 * resolves to a 404 via next/navigation.notFound().
 *
 * @param props.params - Route parameters containing the `slug` for the job to display.
 * @returns The server-rendered React element for the job detail page.
 *
 * @see getJobBySlug
 * @see getSafeWebsiteUrl
 * @see getSafeMailtoUrl
 */
export default async function JobPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParameters = await params;
  const validationResult = slugParamsSchema.safeParse(rawParameters);

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const slug = validationResult.success
    ? validationResult.data.slug
    : String(rawParameters['slug']);

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'JobPage',
    route: `/jobs/${slug}`,
    module: 'apps/web/src/app/jobs/[slug]',
  });

  // Section: Parameter Validation
  if (!validationResult.success) {
    reqLogger.error(
      'Invalid slug parameter for job page',
      new Error(validationResult.error.issues[0]?.message ?? 'Invalid slug'),
      {
        section: 'parameter-validation',
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const validatedSlug = validationResult.data.slug;

  // Section: Job Data Fetch
  let job: Awaited<ReturnType<typeof getJobBySlug>>;
  try {
    job = await getJobBySlug(validatedSlug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job detail');
    reqLogger.error('JobPage: getJobBySlug threw', normalized, {
      section: 'job-data-fetch',
    });
    throw normalized;
  }

  if (!job) {
    reqLogger.warn('JobPage: job not found', {
      section: 'job-data-fetch',
    });
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
                      {(job.category ?? 'General').charAt(0).toUpperCase() +
                        (job.category ?? 'General').slice(1)}
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