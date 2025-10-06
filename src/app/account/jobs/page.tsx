import { getUserJobs } from '@/src/lib/actions/job-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Briefcase, Plus, Eye, ExternalLink, Edit, Pause, Play, Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import Link from 'next/link';
import type { Metadata } from 'next';
import { formatRelativeDate } from '@/src/lib/utils/date-utils';

export const metadata: Metadata = {
  title: 'My Jobs - ClaudePro Directory',
  description: 'Manage your job listings',
};

export default async function MyJobsPage() {
  const jobs = await getUserJobs();

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'premium') return <Badge className="bg-purple-500/10 text-purple-400">Premium</Badge>;
    if (plan === 'featured') return <Badge className="bg-blue-500/10 text-blue-400">Featured</Badge>;
    return null;
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="text-3xl font-bold mb-2">My Job Listings</h1>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            {jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Button asChild>
          <Link href="/account/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            Post a Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No job listings yet</h3>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
              Post your first job listing to reach talented developers in the Claude community
            </p>
            <Button asChild>
              <Link href="/account/jobs/new">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <Badge className={getStatusColor(job.status)} variant="outline">
                        {job.status}
                      </Badge>
                      {getPlanBadge(job.plan)}
                    </div>
                    <CardTitle className="mt-2">{job.title}</CardTitle>
                    <CardDescription>
                      {job.company} • {job.location || 'Remote'} • {job.type}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className={`${UI_CLASSES.FLEX_WRAP_GAP_4} ${UI_CLASSES.MB_4} ${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Eye className="h-4 w-4" />
                    {job.viewCount || 0} views
                  </div>
                  {job.posted_at && (
                    <div>Posted {formatRelativeDate(job.posted_at)}</div>
                  )}
                  {job.expires_at && (
                    <div>Expires {formatRelativeDate(job.expires_at)}</div>
                  )}
                </div>

                <div className={UI_CLASSES.FLEX_GAP_2}>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/jobs/${job.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  {job.status === 'active' && (
                    <Button variant="ghost" size="sm" disabled>
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  )}
                  
                  {job.status === 'paused' && (
                    <Button variant="ghost" size="sm" disabled>
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                  
                  {job.slug && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.slug}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm" disabled className="text-destructive">
                    <Trash className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
