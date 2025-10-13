import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { ArrowLeft, BarChart, ExternalLink, Eye } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { BADGE_COLORS, type JobStatusType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';

export const metadata = await generatePageMetadata('/account/jobs/:id/analytics');

interface JobAnalyticsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobAnalyticsPage({ params }: JobAnalyticsPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the job (RLS ensures user owns this job)
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    notFound();
  }

  // Calculate CTR (Click-Through Rate) with null safety
  const viewCount = job.view_count ?? 0;
  const clickCount = job.click_count ?? 0;
  const ctr = viewCount > 0 ? ((clickCount / viewCount) * 100).toFixed(2) : '0.00';

  const getStatusColor = (status: string) => {
    return BADGE_COLORS.jobStatus[status as JobStatusType] || 'bg-muted';
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={ROUTES.ACCOUNT_JOBS}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>

        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div>
            <h1 className="text-3xl font-bold mb-2">Job Analytics</h1>
            <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{job.title}</p>
          </div>
          {job.slug && (
            <Button variant="outline" asChild>
              <Link href={`/jobs/${job.slug}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Job Info Card */}
      <Card>
        <CardHeader>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <CardTitle>Listing Details</CardTitle>
            <Badge className={getStatusColor(job.status ?? 'draft')} variant="outline">
              {job.status ?? 'draft'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Company</p>
              <p className="font-medium">{job.company}</p>
            </div>
            <div>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Location</p>
              <p className="font-medium">{job.location || 'Remote'}</p>
            </div>
            <div>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Plan</p>
              <p className="font-medium capitalize">{job.plan}</p>
            </div>
            <div>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Type</p>
              <p className="font-medium capitalize">{job.type}</p>
            </div>
            {job.posted_at && (
              <div>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Posted</p>
                <p className="font-medium">{formatRelativeDate(job.posted_at)}</p>
              </div>
            )}
            {job.expires_at && (
              <div>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Expires</p>
                <p className="font-medium">{formatRelativeDate(job.expires_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viewCount.toLocaleString()}</div>
            <p className={`text-xs ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Since {job.posted_at ? formatRelativeDate(job.posted_at) : 'creation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickCount.toLocaleString()}</div>
            <p className={`text-xs ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>Applications started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr}%</div>
            <p className={`text-xs ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Of viewers clicked apply
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={UI_CLASSES.SPACE_Y_4}>
            {viewCount === 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  Your job listing hasn't received any views yet. Try sharing it on social media or
                  updating the description to make it more discoverable.
                </p>
              </div>
            )}

            {viewCount > 0 && clickCount === 0 && (
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  Your listing is getting views but no clicks. Consider:
                </p>
                <ul className="text-sm text-yellow-400 mt-2 ml-4 list-disc">
                  <li>Making the job title more descriptive</li>
                  <li>Highlighting competitive benefits</li>
                  <li>Adding salary information</li>
                </ul>
              </div>
            )}

            {Number.parseFloat(ctr) > 5 && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-green-400">
                  Great performance! Your CTR of {ctr}% is above average. Keep it up!
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Tips to improve visibility:</p>
              <ul className="ml-4 space-y-1 list-disc">
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
