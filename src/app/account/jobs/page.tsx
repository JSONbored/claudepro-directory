import Link from 'next/link';
import { JobDeleteButton } from '@/src/components/core/buttons/jobs/job-delete-button';
import { JobToggleButton } from '@/src/components/core/buttons/jobs/job-toggle-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserDashboard } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { BarChart, Briefcase, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Tables } from '@/src/types/database.types';
import type { GetGetUserDashboardReturn, JobStatus } from '@/src/types/database-overrides';

export const metadata = generatePageMetadata('/account/jobs');

export default async function MyJobsPage() {
  const { user } = await getAuthenticatedUser({ context: 'MyJobsPage' });

  if (!user) {
    logger.warn('MyJobsPage: unauthenticated access attempt detected');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your job listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let data: GetGetUserDashboardReturn | null = null;
  let fetchError = false;
  try {
    data = await getUserDashboard(user.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user dashboard for jobs');
    logger.error('MyJobsPage: getUserDashboard threw', normalized, { userId: user.id });
    fetchError = true;
  }

  if (!data) {
    logger.warn('MyJobsPage: getUserDashboard returned no data', { userId: user.id });
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Job listings unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your job dashboard. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jobs: Array<Tables<'jobs'>> = data?.jobs || [];
  if (jobs.length === 0) {
    logger.info('MyJobsPage: user has no job listings', { userId: user.id });
  }

  const getStatusColor = (status: JobStatus) => {
    return BADGE_COLORS.jobStatus[status] || 'bg-muted';
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'premium')
      return (
        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_PREMIUM}>
          Premium
        </UnifiedBadge>
      );
    if (plan === 'featured')
      return (
        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_PUBLISHED}>
          Featured
        </UnifiedBadge>
      );
    return null;
  };

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Job Listings</h1>
          <p className="text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Button asChild={true}>
          <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            Post a Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className={'flex flex-col items-center py-12'}>
            <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">No job listings yet</h3>
            <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
              Post your first job listing to reach talented developers in the Claude community
            </p>
            <Button asChild={true}>
              <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                  <div className="flex-1">
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <UnifiedBadge
                        variant="base"
                        style="outline"
                        className={getStatusColor(
                          (job.status ?? ('draft' as JobStatus)) as JobStatus
                        )}
                      >
                        {job.status ?? ('draft' as JobStatus)}
                      </UnifiedBadge>
                      {getPlanBadge(job.plan ?? 'standard')}
                    </div>
                    <CardTitle className="mt-2">{job.title}</CardTitle>
                    <CardDescription>
                      {job.company} • {job.location || 'Remote'} • {job.type}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Eye className="h-4 w-4" />
                    {job.view_count ?? 0} views
                  </div>
                  {job.posted_at && <div>Posted {formatRelativeDate(job.posted_at)}</div>}
                  {job.expires_at && <div>Expires {formatRelativeDate(job.expires_at)}</div>}
                </div>

                <div className={UI_CLASSES.FLEX_GAP_2}>
                  <Button variant="outline" size="sm" asChild={true}>
                    <Link href={`/account/jobs/${job.id}/edit`}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" asChild={true}>
                    <Link href={`/account/jobs/${job.id}/analytics`}>
                      <BarChart className="mr-1 h-3 w-3" />
                      Analytics
                    </Link>
                  </Button>

                  {job.slug && (
                    <Button variant="ghost" size="sm" asChild={true}>
                      <Link href={`/jobs/${job.slug}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  )}

                  {job.status === ('active' as JobStatus) && (
                    <JobToggleButton
                      jobId={job.id}
                      currentStatus={(job.status ?? ('draft' as JobStatus)) as JobStatus}
                    />
                  )}

                  <JobDeleteButton jobId={job.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
