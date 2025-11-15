/**
 * Job Analytics Page - Display view/click metrics for job postings.
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { ROUTES } from '@/src/lib/constants';
import { getUserJobById } from '@/src/lib/data/user-data';
import { ArrowLeft, BarChart, ExternalLink, Eye } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { BADGE_COLORS, type JobStatusType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/jobs/:id/analytics');

interface JobAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobAnalyticsPage({ params }: JobAnalyticsPageProps) {
  const resolvedParams = await params;
  const { user } = await getAuthenticatedUser({ context: 'JobAnalyticsPage' });

  if (!user) {
    logger.warn('JobAnalyticsPage: unauthenticated access attempt', {
      jobId: resolvedParams.id,
    });
    redirect('/login');
  }

  let job: Awaited<ReturnType<typeof getUserJobById>> | null = null;
  try {
    job = await getUserJobById(user.id, resolvedParams.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load job analytics detail');
    logger.error('JobAnalyticsPage: getUserJobById threw', normalized, {
      jobId: resolvedParams.id,
      userId: user.id,
    });
    throw normalized;
  }
  if (!job) {
    logger.warn('JobAnalyticsPage: job not found or not owned by user', {
      jobId: resolvedParams.id,
      userId: user.id,
    });
    notFound();
  }

  const viewCount = job.view_count ?? 0;
  const clickCount = job.click_count ?? 0;
  const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(2) : '0.00';

  const getStatusColor = (status: string) => {
    return BADGE_COLORS.jobStatus[status as JobStatusType] || 'bg-muted';
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
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
            <Button variant="outline" asChild>
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
            <UnifiedBadge
              variant="base"
              style="outline"
              className={getStatusColor(job.status ?? 'draft')}
            >
              {job.status ?? 'draft'}
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
              <p className="font-medium">{job.location || 'Remote'}</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Views</CardTitle>
            <Eye className={`${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_NEUTRAL}`} />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{viewCount.toLocaleString()}</div>
            <p className={'text-muted-foreground text-xs'}>
              Since {job.posted_at ? formatRelativeDate(job.posted_at) : 'creation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Clicks</CardTitle>
            <ExternalLink className={`${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_NEUTRAL}`} />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{clickCount.toLocaleString()}</div>
            <p className={'text-muted-foreground text-xs'}>Applications started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Click-Through Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{ctr}%</div>
            <p className={'text-muted-foreground text-xs'}>Of viewers clicked apply</p>
          </CardContent>
        </Card>
      </div>

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
