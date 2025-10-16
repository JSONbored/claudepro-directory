import Link from 'next/link';
import { JobActions } from '@/src/components/jobs/job-actions';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getUserJobs } from '@/src/lib/actions/business.actions';
import { ROUTES } from '@/src/lib/constants/routes';
import { BarChart, Briefcase, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { BADGE_COLORS, type JobStatusType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';

export const metadata = generatePageMetadata('/account/jobs');

export default async function MyJobsPage() {
  const jobs = await getUserJobs();

  const getStatusColor = (status: string) => {
    return BADGE_COLORS.jobStatus[status as JobStatusType] || 'bg-muted';
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'premium')
      return <Badge className="bg-purple-500/10 text-purple-400">Premium</Badge>;
    if (plan === 'featured')
      return <Badge className="bg-blue-500/10 text-blue-400">Featured</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="text-3xl font-bold mb-2">My Job Listings</h1>
          <p className="text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
            <Plus className="h-4 w-4 mr-2" />
            Post a Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className={'flex flex-col items-center py-12'}>
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No job listings yet</h3>
            <p className={'text-muted-foreground text-center max-w-md mb-4'}>
              Post your first job listing to reach talented developers in the Claude community
            </p>
            <Button asChild>
              <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
                <Plus className="h-4 w-4 mr-2" />
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
                      <Badge className={getStatusColor(job.status ?? 'draft')} variant="outline">
                        {job.status ?? 'draft'}
                      </Badge>
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
                <div className={'flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground'}>
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
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/jobs/${job.id}/analytics`}>
                      <BarChart className="h-3 w-3 mr-1" />
                      Analytics
                    </Link>
                  </Button>

                  {job.slug && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.slug}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}

                  <JobActions jobId={job.id} currentStatus={job.status ?? 'draft'} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
