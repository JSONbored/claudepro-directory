import Link from 'next/link';
import { z } from 'zod';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { BarChart, Briefcase, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { BADGE_COLORS, type JobStatusType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import type { Tables } from '@/src/types/database.types';

const DashboardResponseSchema = z.object({
  jobs: z.array(z.custom<Tables<'jobs'>>()),
});

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/jobs');

export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let jobs: Array<Tables<'jobs'>> = [];
  let hasError = false;

  if (user) {
    const { data, error } = await supabase.rpc('get_user_dashboard', { p_user_id: user.id });
    if (error) {
      logger.error('Failed to fetch user dashboard', error);
      hasError = true;
    } else {
      try {
        const validated = DashboardResponseSchema.parse(data);
        jobs = validated.jobs;
      } catch (validationError) {
        logger.error(
          'Invalid dashboard response',
          validationError instanceof Error ? validationError : new Error(String(validationError))
        );
        jobs = [];
      }
    }
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load jobs. Please try again later.</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return BADGE_COLORS.jobStatus[status as JobStatusType] || 'bg-muted';
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'premium')
      return (
        <UnifiedBadge variant="base" className="bg-purple-500/10 text-purple-400">
          Premium
        </UnifiedBadge>
      );
    if (plan === 'featured')
      return (
        <UnifiedBadge variant="base" className="bg-blue-500/10 text-blue-400">
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
        <Button asChild>
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
            <Button asChild>
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
                        className={getStatusColor(job.status ?? 'draft')}
                      >
                        {job.status ?? 'draft'}
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/jobs/${job.id}/edit`}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/jobs/${job.id}/analytics`}>
                      <BarChart className="mr-1 h-3 w-3" />
                      Analytics
                    </Link>
                  </Button>

                  {job.slug && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.slug}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  )}

                  {job.status === 'active' && (
                    <UnifiedButton
                      variant="job-toggle"
                      jobId={job.id}
                      currentStatus={job.status ?? 'draft'}
                    />
                  )}

                  <UnifiedButton variant="job-delete" jobId={job.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
