/**
 * Job Analytics Page - Display view/click metrics for job postings.
 */

import type { JobStatus } from '@heyclaude/web-runtime';
import { formatRelativeDate, logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserJobById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft, ExternalLink } from '@heyclaude/web-runtime/icons';
import { BADGE_COLORS, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { MetricsDisplay } from '@/src/components/features/analytics/metrics-display';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

interface JobAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobAnalyticsPageProps): Promise<Metadata> {
  const { id } = await params;
  return generatePageMetadata('/account/jobs/:id/analytics', { params: { id } });
}

export default async function JobAnalyticsPage({ params }: JobAnalyticsPageProps) {
  const { user } = await getAuthenticatedUser({ context: 'JobAnalyticsPage' });
  const { id } = await params;

  if (!user) {
    logger.warn('JobAnalyticsPage: unauthenticated access attempt', {
      jobId: id,
    });
    redirect(ROUTES.LOGIN);
  }

  let job: Awaited<ReturnType<typeof getUserJobById>> | null = null;
  let fetchError = false;
  try {
    job = await getUserJobById(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job analytics detail');
    logger.error('JobAnalyticsPage: getUserJobById threw', normalized, {
      jobId: id,
      userId: user.id,
    });
    fetchError = true;
  }
  if (!job || fetchError) {
    logger.warn('JobAnalyticsPage: job not found or not owned by user', {
      jobId: id,
      userId: user.id,
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Job analytics unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load analytics for this job. It may not exist or you may not have
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true} variant="outline">
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

  const getStatusColor = (status: JobStatus) => {
    return BADGE_COLORS.jobStatus[status] || 'bg-muted';
  };

  const status: JobStatus = job.status ?? 'draft';

  const formatStatus = (rawStatus: string) => {
    return rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild={true} className="mb-4">
          <Link href={ROUTES.ACCOUNT_JOBS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div>
            <h1 className="mb-2 font-bold text-3xl">Job Analytics</h1>
            <p className="text-muted-foreground">{job.title}</p>
          </div>
          {job.slug && (
            <Button variant="outline" asChild={true}>
              <Link href={`/jobs/${job.slug}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <CardTitle>Listing Details</CardTitle>
            <UnifiedBadge variant="base" style="outline" className={getStatusColor(status)}>
              {formatStatus(status)}
            </UnifiedBadge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Company</p>
              <p className="font-medium">{job.company}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">{job.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plan</p>
              <p className="font-medium capitalize">{job.plan}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{job.type}</p>
            </div>
            {job.posted_at && (
              <div>
                <p className="text-muted-foreground">Posted</p>
                <p className="font-medium">{formatRelativeDate(job.posted_at)}</p>
              </div>
            )}
            {job.expires_at && (
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p className="font-medium">{formatRelativeDate(job.expires_at)}</p>
              </div>
            )}
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
            trend:
              viewCount === 0
                ? 'unchanged'
                : Number.parseFloat(ctr) > 5
                  ? 'up'
                  : Number.parseFloat(ctr) > 0
                    ? 'unchanged'
                    : 'down',
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {viewCount === 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm">
                  Your job listing hasn't received any views yet. Try sharing it on social media or
                  updating the description to make it more discoverable.
                </p>
              </div>
            )}

            {viewCount > 0 && clickCount === 0 && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm text-yellow-400">
                  Your listing is getting views but no clicks. Consider:
                </p>
                <ul className="mt-2 ml-4 list-disc text-sm text-yellow-400">
                  <li>Making the job title more descriptive</li>
                  <li>Highlighting competitive benefits</li>
                  <li>Adding salary information</li>
                </ul>
              </div>
            )}

            {Number.parseFloat(ctr) > 5 && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-green-400 text-sm">
                  Great performance! Your CTR of {ctr}% is above average. Keep it up!
                </p>
              </div>
            )}

            <div className="text-muted-foreground text-sm">
              <p className="mb-2 font-medium">Tips to improve visibility:</p>
              <ul className="ml-4 list-disc space-y-1">
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
