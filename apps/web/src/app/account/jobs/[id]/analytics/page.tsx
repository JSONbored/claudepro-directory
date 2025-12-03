/**
 * Job Analytics Page - Display view/click metrics for job postings.
 */

import  { type JobStatus } from '@heyclaude/web-runtime';
import { formatRelativeDate } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserJobById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  between,
  bgColor,
  grid,
  iconSize,
  jobStatusBadge,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  size,
  spaceY,
  weight,
  marginRight,
  border,
  borderColor,
  textColor,
  marginLeft,
  listStyle,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, ExternalLink } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { MetricsDisplay } from '@/src/components/features/analytics/metrics-display';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface JobAnalyticsPageProperties {
  params: Promise<{ id: string }>;
}

/**
 * Produce a human-friendly label from a raw job status string.
 *
 * @param rawStatus - Status value that may contain underscores and lowercase letters (e.g., "in_review")
 * @returns The status formatted with spaces and title-cased words (e.g., "In Review")
 *
 * @see getStatusColor
 * @see jobStatusBadge
 */
function formatStatus(rawStatus: string): string {
  return rawStatus.replaceAll('_', ' ').replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get the design-system color key associated with a job status.
 *
 * @param status - The job status to map to a badge color
 * @returns The color key string from the `jobStatusBadge` mapping for `status`
 *
 * @see jobStatusBadge
 * @see JobStatus
 */
function getStatusColor(status: JobStatus): string {
  return jobStatusBadge[status];
}

/**
 * Generate metadata for the /account/jobs/:id/analytics page.
 *
 * Uses the route `id` parameter to produce Next.js page metadata for the analytics route.
 *
 * @param props - Page properties containing route parameters.
 * @param props.params - An object (or a promise resolving to an object) with route parameters, including `id`.
 * @returns The Next.js page metadata for the analytics route.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({ params }: JobAnalyticsPageProperties): Promise<Metadata> {
  const { id } = await params;
  return generatePageMetadata('/account/jobs/:id/analytics', { params: { id } });
}

/**
 * Render the Job Analytics dashboard for the job identified by the route `id`.
 *
 * Performs server-side authentication, loads the authenticated user's job data, computes basic
 * metrics (views, clicks, click-through rate), and returns a React element showing listing details,
 * performance metrics, and contextual insights. Unauthenticated requests are redirected to the login
 * route; if the job cannot be loaded or is not owned by the user, a fallback UI is returned.
 *
 * @param params - Route parameters (a promise resolving to an object with `id`) used to locate the job
 * @returns A React element containing the job analytics dashboard, or a fallback Card when analytics are unavailable
 *
 * @see getAuthenticatedUser
 * @see getUserJobById
 * @see MetricsDisplay
 * @see generateRequestId
 */
export default async function JobAnalyticsPage({ params }: JobAnalyticsPageProperties) {
  const { id } = await params;
  
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'JobAnalyticsPage',
    route: `/account/jobs/${id}/analytics`,
    module: 'apps/web/src/app/account/jobs/[id]/analytics',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'JobAnalyticsPage' });

  if (!user) {
    reqLogger.warn('JobAnalyticsPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    redirect(ROUTES.LOGIN);
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });
  
  userLogger.info('JobAnalyticsPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Job Data Fetch
  let job: Awaited<ReturnType<typeof getUserJobById>> = null;
  try {
    job = await getUserJobById(user.id, id);
    userLogger.info('JobAnalyticsPage: job data loaded', {
      section: 'job-data-fetch',
      hasJob: !!job,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job analytics detail');
    userLogger.error('JobAnalyticsPage: getUserJobById threw', normalized, {
      section: 'job-data-fetch',
    });
  }
  if (!job) {
    userLogger.warn('JobAnalyticsPage: job not found or not owned by user', {
      section: 'job-data-fetch',
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Job analytics unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load analytics for this job. It may not exist or you may not have
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT_JOBS}>Back to job listings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viewCount = job.view_count ?? 0;
  const clickCount = job.click_count ?? 0;
  const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(2) : '0.00';

  const status: JobStatus = job.status;

  // Final summary log
  userLogger.info('JobAnalyticsPage: page render completed', {
    section: 'page-render',
    jobId: id,
    status,
  });

  return (
    <div className={spaceY.relaxed}>
      <div>
        <Button variant="ghost" size="sm" asChild className={marginBottom.default}>
          <Link href={ROUTES.ACCOUNT_JOBS}>
            <ArrowLeft className={`${marginRight.compact} ${iconSize.sm}`} />
            Back to Jobs
          </Link>
        </Button>
        <div className={between.center}>
          <div>
            <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Job Analytics</h1>
            <p className={muted.default}>{job.title}</p>
          </div>
          {job.slug ? <Button variant="outline" asChild>
              <Link href={`${ROUTES.JOBS}/${job.slug}`}>
                <ExternalLink className={`${marginRight.compact} ${iconSize.sm}`} />
                View Listing
              </Link>
            </Button> : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={between.center}>
            <CardTitle>Listing Details</CardTitle>
            <UnifiedBadge variant="base" style="outline" className={getStatusColor(status)}>
              {formatStatus(status)}
            </UnifiedBadge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`${grid.cols2} ${size.sm}`}>
            <div>
              <p className={muted.default}>Company</p>
              <p className={weight.medium}>{job.company}</p>
            </div>
            <div>
              <p className={muted.default}>Location</p>
              <p className={weight.medium}>{job.location ?? 'Not specified'}</p>
            </div>
            <div>
              <p className={muted.default}>Plan</p>
              <p className={`${weight.medium} capitalize`}>{job.plan}</p>
            </div>
            <div>
              <p className={muted.default}>Type</p>
              <p className={`${weight.medium} capitalize`}>{job.type}</p>
            </div>
            {job.posted_at ? <div>
                <p className={muted.default}>Posted</p>
                <p className={weight.medium}>{formatRelativeDate(job.posted_at)}</p>
              </div> : null}
            {job.expires_at ? <div>
                <p className={muted.default}>Expires</p>
                <p className={weight.medium}>{formatRelativeDate(job.expires_at)}</p>
              </div> : null}
          </div>
        </CardContent>
      </Card>

      <MetricsDisplay
        title="Performance Metrics"
        description="Key metrics for your job listing"
        metrics={[
          {
            label: 'Total Views',
            value: viewCount.toLocaleString(),
            change: `Since ${job.posted_at ? formatRelativeDate(job.posted_at) : 'creation'}`,
            trend: viewCount > 0 ? 'up' : 'unchanged',
          },
          {
            label: 'Clicks',
            value: clickCount.toLocaleString(),
            change: 'Users who clicked to view',
            trend: clickCount > 0 ? 'up' : 'unchanged',
          },
          {
            label: 'Click-Through Rate',
            value: `${ctr}%`,
            change: 'Of viewers who clicked apply',
            trend: (() => {
              if (viewCount === 0) return 'unchanged';
              const ctrValue = Number.parseFloat(ctr);
              if (ctrValue > 5) return 'up';
              if (ctrValue > 0) return 'unchanged';
              return 'down';
            })(),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={spaceY.comfortable}>
            {viewCount === 0 && (
              <div className={`${radius.lg} ${bgColor['muted/50']} ${padding.default}`}>
                <p className={size.sm}>
                  Your job listing hasn't received any views yet. Try sharing it on social media or
                  updating the description to make it more discoverable.
                </p>
              </div>
            )}

            {viewCount > 0 && clickCount === 0 && (
              <div className={`${radius.lg} ${border.default} ${borderColor['yellow/20']} ${bgColor.warning} ${padding.default}`}>
                <p className={`${size.sm} ${textColor.warning400}`}>
                  Your listing is getting views but no clicks. Consider:
                </p>
                <ul className={`${marginTop.compact} ${marginLeft.comfortable} ${listStyle.disc} ${size.sm} ${textColor.warning400}`}>
                  <li>Making the job title more descriptive</li>
                  <li>Highlighting competitive benefits</li>
                  <li>Adding salary information</li>
                </ul>
              </div>
            )}

            {Number.parseFloat(ctr) > 5 && (
              <div className={`${radius.lg} ${border.default} ${borderColor['green/20']} ${bgColor.success} ${padding.default}`}>
                <p className={`${textColor.success400} ${size.sm}`}>
                  Great performance! Your CTR of {ctr}% is above average. Keep it up!
                </p>
              </div>
            )}

            <div className={muted.sm}>
              <p className={`${marginBottom.tight} ${weight.medium}`}>Tips to improve visibility:</p>
              <ul className={`${marginLeft.comfortable} ${listStyle.disc} ${spaceY.tight}`}>
                <li>Use clear, descriptive job titles</li>
                <li>Include relevant technologies in tags</li>
                <li>Specify remote/hybrid work options</li>
                <li>Add competitive salary ranges</li>
                <li>Update the listing regularly to boost freshness</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}