/**
 * Job Detail Page - Database-first job listing display
 */

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
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
import { generatePageMetadata, getJobBySlug } from '@heyclaude/web-runtime/server';
import type { PageProps } from '@heyclaude/web-runtime/types/app.schema';
import { slugParamsSchema } from '@heyclaude/web-runtime/types/app.schema';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

/**
 * Validate and sanitize external website URL for safe use in href attributes
 * Only allows HTTPS URLs (or HTTP for localhost in development)
 * Returns canonicalized URL or null if invalid
 */
/**
 * ISR: 2 hours (7200s) - Job postings are relatively stable
 */
export const revalidate = 7200;

function getSafeWebsiteUrl(url: string | null | undefined): string | null {
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
function getSafeMailtoUrl(email: string | null | undefined): string | null {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let job: Awaited<ReturnType<typeof getJobBySlug>> | null = null;
  try {
    job = await getJobBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job for metadata');
    logger.error('JobPage: getJobBySlug threw in generateMetadata', normalized, {
      requestId: generateRequestId(),
      operation: 'JobPage',
      route: `/jobs/${slug}`,
      slug,
    });
  }

  return generatePageMetadata('/jobs/:slug', {
    params: { slug },
    item: job ? { ...job, tags: job.tags || [] } : undefined,
    slug,
  });
}

export async function generateStaticParams() {
  const { getFilteredJobs } = await import('@heyclaude/web-runtime/server');
  try {
    const jobsResult = await getFilteredJobs({});
    const jobs = jobsResult?.jobs ?? [];

    if (jobs.length === 0) {
      logger.warn('generateStaticParams: no jobs available, returning placeholder', undefined, {
        requestId: generateRequestId(),
        operation: 'JobPage',
        route: '/jobs',
      });
      return [{ slug: 'placeholder' }];
    }

    return jobs.map((job) => ({ slug: job.slug }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load jobs for static params');
    logger.error('JobPage: getJobs threw in generateStaticParams', normalized, {
      requestId: generateRequestId(),
      operation: 'JobPage',
      route: '/jobs',
    });
    return [{ slug: 'placeholder' }];
  }
}

export default async function JobPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for job page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        requestId: generateRequestId(),
        operation: 'JobPage',
        route: `/jobs/${String(rawParams['slug'])}`,
        slug: String(rawParams['slug']),
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;
  let job: Awaited<ReturnType<typeof getJobBySlug>> | null = null;
  try {
    job = await getJobBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job detail');
    logger.error('JobPage: getJobBySlug threw', normalized, {
      requestId: generateRequestId(),
      operation: 'JobPage',
      route: `/jobs/${slug}`,
      slug,
    });
    throw normalized;
  }

  if (!job) {
    logger.warn('JobPage: job not found', undefined, {
      requestId: generateRequestId(),
      operation: 'JobPage',
      route: `/jobs/${slug}`,
      slug,
    });
    notFound();
  }

  const tags = job.tags || [];
  const requirements = job.requirements || [];
  const benefits = job.benefits || [];

  return (
    <>
      <Pulse variant="view" category="jobs" slug={slug} />
      <StructuredData route={`/jobs/${slug}`} />

      <div className={'min-h-screen bg-background'}>
        <div className={'border-border/50 border-b bg-card/30'}>
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild={true} className="mb-6">
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className={'mr-2 h-4 w-4'} />
                Back to Jobs
              </Link>
            </Button>

            <div className="max-w-4xl">
              <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} mb-6 gap-4`}>
                <div className={'rounded-lg bg-accent/10 p-3'}>
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-2 font-bold text-3xl">{job.title}</h1>
                  <p className={'text-muted-foreground text-xl'}>{job.company}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  <span>{job.salary || 'Competitive'}</span>
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
            <div className={'space-y-8 lg:col-span-2'}>
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
                    {requirements.map((req: string) => (
                      <li key={req} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                        <span className="mt-1 text-accent">•</span>
                        <span>{req}</span>
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
                      <Button className="w-full" asChild={true}>
                        <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className={'mr-2 h-4 w-4'} />
                          Apply Now
                        </a>
                      </Button>
                    );
                  })()}
                  {(() => {
                    const safeMailtoUrl = getSafeMailtoUrl(job.contact_email);
                    if (!safeMailtoUrl) return null;
                    return (
                      <Button variant="outline" className="w-full" asChild={true}>
                        <a href={safeMailtoUrl}>
                          <Building2 className={'mr-2 h-4 w-4'} />
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
                    <Clock className={'h-4 w-4 text-muted-foreground'} />
                    <span>
                      {(job.type ?? 'Unknown').charAt(0).toUpperCase() +
                        (job.type ?? 'unknown').slice(1)}
                    </span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <MapPin className={'h-4 w-4 text-muted-foreground'} />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <Users className={'h-4 w-4 text-muted-foreground'} />
                    <span>
                      {(job.category ?? 'General').charAt(0).toUpperCase() +
                        (job.category ?? 'general').slice(1)}
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
