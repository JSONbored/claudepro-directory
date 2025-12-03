/**
 * Job Detail Page - Database-first job listing display
 */

import { Constants } from '@heyclaude/database-types';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  iconSize,
  spaceY,
  muted,
  marginBottom,
  marginTop,
  weight,
  size,
  gap,
  padding,
  row,
  radius,
  minHeight,
} from '@heyclaude/web-runtime/design-system';
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
 * ISR: 30 minutes (1800s) - Matches CACHE_TTL.jobs_detail
 * Job postings need reasonably fresh data for status/applicant updates
 */
export const revalidate = 1800;
export const dynamicParams = true;

/**
 * Validate and sanitize an external website URL for safe use in href attributes.
 *
 * Accepts a string URL and returns a canonicalized href when the URL is allowed:
 * only `https:` URLs are permitted, while `http:` is permitted only for localhost
 * hostnames (`localhost`, `127.0.0.1`, `::1`). Returns `null` for invalid,
 * disallowed, or unsafe URLs.
 *
 * The returned href has credentials stripped, hostname normalized to lowercase
 * (trailing dot removed), and default ports (`80`, `443`) removed.
 *
 * @param url - The input URL to validate and sanitize; may be `null` or `undefined`.
 * @returns A sanitized canonical href string when allowed, or `null` if the input is invalid or disallowed.
 *
 * @see getSafeMailtoUrl
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
 * Validate and normalize an email address for safe use in a `mailto:` link.
 *
 * Performs format validation, rejects dangerous input (null bytes, path traversal, protocol injections),
 * lowercases and enforces a 254-character maximum, and returns a percent-encoded `mailto:` URL when valid.
 *
 * @param email - The email address to validate and normalize; may be `null` or `undefined`.
 * @returns A `mailto:` URL with the address percent-encoded, or `null` if the input is invalid.
 * @see getSafeWebsiteUrl
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
 * Build page metadata for a job detail route using the provided slug.
 *
 * Attempts to load the job by slug and, if found, includes the job as the page `item` (with `tags` defaulted to an empty array) in the generated metadata; otherwise returns route-level metadata for `/jobs/:slug`.
 *
 * @param params - An object (or a promise resolving to an object) containing the `slug` route parameter.
 * @returns The Next.js `Metadata` for the job page, optionally populated with the resolved job item.
 *
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
 * Produce route parameter objects for Next.js to pre-render a limited set of job pages.
 *
 * Attempts to fetch up to 10 top jobs and returns an array of `{ slug }` objects for ISR; when no jobs are available or an error occurs, returns a single placeholder slug so the build does not fail. This supports on-demand rendering for remaining job pages because `dynamicParams` is enabled.
 *
 * @returns An array of route parameter objects (`{ slug: string }[]`). If no jobs can be fetched, returns `[{ slug: 'placeholder' }]`.
 *
 * @see getFilteredJobs - server helper used to fetch the top jobs
 * @see dynamicParams - page-level flag enabling on-demand rendering for non-pre-rendered slugs
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
      reqLogger.warn('generateStaticParams: no jobs available, returning placeholder');
      return [{ slug: 'placeholder' }];
    }

    return jobs.slice(0, MAX_STATIC_JOBS).map((job) => ({ slug: job.slug }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs for static params');
    reqLogger.error('JobPage: getJobs threw in generateStaticParams', normalized);
    return [{ slug: 'placeholder' }];
  }
}

/**
 * Render the job detail page for a job identified by the route `slug`; validates parameters, loads job data server-side, and triggers a 404 when the slug is invalid or the job does not exist.
 *
 * The page participates in ISR as configured at the module level (see `revalidate` and `dynamicParams`) and creates a per-request scoped logger for diagnostics.
 *
 * @param params - Route parameters object containing `slug`
 * @returns The rendered job detail page content
 *
 * @see getJobBySlug - Loads job data from the database
 * @see getSafeWebsiteUrl - Validates external application links before rendering
 * @see getSafeMailtoUrl - Validates contact email before rendering mailto links
 * @see notFound - Triggers a Next.js 404 for invalid or missing resources
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

      <div className={`${minHeight.screen} bg-background`}>
        <div className="border-b border-border/50 bg-card/30">
          <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
            <Button variant="ghost" asChild className={marginBottom.comfortable}>
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>

            <div className="max-w-4xl">
              <div className={`${row.comfortable} mb-6`}>
                <div className={`${radius.lg} bg-accent/10 ${padding.compact}`}>
                  <Building2 className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>
                    {job.title}
                  </h1>
                  <p className={`${muted.default} ${size.xl}`}>{job.company}</p>
                </div>
              </div>

              <div
                className={`${marginBottom.default} flex flex-wrap ${gap.comfortable} ${muted.sm}`}
              >
                <div className={cluster.tight}>
                  <MapPin className={iconSize.sm} />
                  <span>{job.location}</span>
                </div>
                <div className={cluster.tight}>
                  <DollarSign className={iconSize.sm} />
                  <span>{job.salary ?? 'Competitive'}</span>
                </div>
                <div className={cluster.tight}>
                  <Clock className={iconSize.sm} />
                  <span>{job.type}</span>
                </div>
                <div className={cluster.tight}>
                  <Users className={iconSize.sm} />
                  <span>{job.category}</span>
                </div>
                <div className={cluster.tight}>
                  <Calendar className={iconSize.sm} />
                  <span>Posted {job.posted_at}</span>
                </div>
              </div>

              <div className={`flex flex-wrap ${gap.compact}`}>
                {tags.map((skill: string) => (
                  <UnifiedBadge key={skill} variant="base" style="secondary">
                    {skill}
                  </UnifiedBadge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
          <div className={`grid grid-cols-1 ${gap.loose} lg:grid-cols-3`}>
            <div className={`${spaceY.loose} lg:col-span-2`}>
              <Card>
                <CardHeader>
                  <CardTitle>About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={muted.default}>{job.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={spaceY.compact}>
                    {requirements.map((request: string) => (
                      <li key={request} className={`${row.default}`}>
                        <span className={`${marginTop.tight} text-accent`}>•</span>
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
                    <ul className={spaceY.compact}>
                      {benefits.map((benefit: string) => (
                        <li key={benefit} className={`${row.default}`}>
                          <span className={`${marginTop.tight} text-green-500`}>✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className={spaceY.relaxed}>
              {/* Apply Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className={spaceY.compact}>
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
                <CardContent className={spaceY.compact}>
                  <div className={`${cluster.compact} ${size.sm}`}>
                    <Clock className={`h-4 w-4 ${muted.default}`} />
                    <span>
                      {(job.type ?? 'Unknown').charAt(0).toUpperCase() +
                        (job.type ?? 'Unknown').slice(1)}
                    </span>
                  </div>
                  <div className={`${cluster.compact} ${size.sm}`}>
                    <MapPin className={`h-4 w-4 ${muted.default}`} />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${cluster.compact} ${size.sm}`}>
                    <Users className={`h-4 w-4 ${muted.default}`} />
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