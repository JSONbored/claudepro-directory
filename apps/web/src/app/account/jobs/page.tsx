import type { Database } from '@heyclaude/database-types';
import type { JobStatus } from '@heyclaude/web-runtime';
import { formatRelativeDate, logger, normalizeError } from '@heyclaude/web-runtime/core';
import type { JobBillingSummaryEntry } from '@heyclaude/web-runtime/data';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getJobBillingSummaries,
  getUserDashboard,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  BarChart,
  Briefcase,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  Plus,
} from '@heyclaude/web-runtime/icons';
import { BADGE_COLORS, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JobDeleteButton } from '@/src/components/core/buttons/jobs/job-delete-button';
import { JobToggleButton } from '@/src/components/core/buttons/jobs/job-toggle-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/primitives/ui/alert';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

const JOB_PLAN_LABELS: Record<Database['public']['Enums']['job_plan'], string> = {
  'one-time': 'One-Time',
  subscription: 'Subscription',
};
const JOB_TIER_LABELS: Record<Database['public']['Enums']['job_tier'], string> = {
  standard: 'Standard',
  featured: 'Featured',
};
const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatPriceLabel(cents: number, isSubscription?: boolean | null): string {
  const base = USD_FORMATTER.format(cents / 100);
  return isSubscription ? `${base}/month` : base;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function humanizeStatus(value?: string | null): string {
  if (!value) return 'Unknown';
  return toTitleCase(value);
}

function resolvePlanLabel(plan?: string | null): string {
  if (!plan) {
    return JOB_PLAN_LABELS['one-time'];
  }
  return JOB_PLAN_LABELS[plan as Database['public']['Enums']['job_plan']] ?? toTitleCase(plan);
}

function resolveTierLabel(tier?: string | null): string {
  if (!tier) {
    return JOB_TIER_LABELS.standard;
  }
  return JOB_TIER_LABELS[tier as Database['public']['Enums']['job_tier']] ?? toTitleCase(tier);
}

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/jobs');
}

interface MyJobsPageProps {
  searchParams?: Promise<{ payment?: string; job_id?: string }>;
}

export default async function MyJobsPage({ searchParams }: MyJobsPageProps = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const paymentStatus = resolvedSearchParams?.payment;
  const paymentJobId = resolvedSearchParams?.job_id;

  const { user } = await getAuthenticatedUser({ context: 'MyJobsPage' });

  if (!user) {
    logger.warn('MyJobsPage: unauthenticated access attempt detected', undefined, {
      route: '/account/jobs',
      timestamp: new Date().toISOString(),
    });
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

  let data: Database['public']['Functions']['get_user_dashboard']['Returns'] | null = null;
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

  // Validate and convert jobs from Json to jobs table rows
  // The RPC returns jobs as Json | null, so we need runtime validation
  const jobs: Array<Database['public']['Tables']['jobs']['Row']> = (() => {
    const jobsData = data?.jobs;
    if (!(jobsData && Array.isArray(jobsData))) {
      return [];
    }

    return jobsData
      .filter((item): item is Database['public']['Tables']['jobs']['Row'] => {
        // Validate required fields for jobs table row
        // Use bracket notation for index signature properties
        return (
          item !== null &&
          typeof item === 'object' &&
          'id' in item &&
          typeof item['id'] === 'string' &&
          'company' in item &&
          typeof item['company'] === 'string' &&
          'description' in item &&
          typeof item['description'] === 'string' &&
          'link' in item &&
          typeof item['link'] === 'string' &&
          'title' in item &&
          typeof item['title'] === 'string' &&
          'created_at' in item &&
          typeof item['created_at'] === 'string' &&
          'is_placeholder' in item &&
          typeof item['is_placeholder'] === 'boolean' &&
          'category' in item &&
          typeof item['category'] === 'string' &&
          'plan' in item &&
          (typeof item['plan'] === 'string' || item['plan'] === null) &&
          'type' in item &&
          typeof item['type'] === 'string'
        );
      })
      .map((item) => item as Database['public']['Tables']['jobs']['Row']);
  })();

  if (jobs.length === 0) {
    logger.info('MyJobsPage: user has no job listings', { userId: user.id });
  }

  const jobIds = jobs.map((job) => job.id).filter((id): id is string => Boolean(id));
  let billingSummaries: JobBillingSummaryEntry[] = [];
  if (jobIds.length > 0) {
    try {
      billingSummaries = await getJobBillingSummaries(jobIds);
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load job billing summaries');
      logger.error('MyJobsPage: getJobBillingSummaries failed', normalized, { userId: user.id });
    }
  }
  const billingSummaryMap = new Map<string, JobBillingSummaryEntry>();
  for (const summary of billingSummaries) {
    if (summary.job_id) {
      billingSummaryMap.set(summary.job_id, summary);
    }
  }
  const paymentJobSummary =
    paymentStatus === 'success' && paymentJobId
      ? (billingSummaryMap.get(paymentJobId) ?? null)
      : null;
  const paymentJob =
    paymentStatus === 'success' && paymentJobId
      ? (jobs.find((job) => job.id === paymentJobId) ?? null)
      : null;
  const paymentAlertPlanLabel = resolvePlanLabel(
    paymentJobSummary?.plan ?? paymentJob?.plan ?? null
  );
  const paymentAlertTierLabel = resolveTierLabel(
    paymentJobSummary?.tier ?? paymentJob?.tier ?? null
  );
  const paymentAlertPrice =
    paymentJobSummary?.price_cents != null
      ? formatPriceLabel(paymentJobSummary.price_cents, paymentJobSummary.is_subscription)
      : null;
  const paymentAlertRenewal =
    paymentJobSummary?.is_subscription && paymentJobSummary.subscription_renews_at
      ? `Renews ${formatRelativeDate(paymentJobSummary.subscription_renews_at, {
          style: 'simple',
        })}`
      : paymentJobSummary?.is_subscription && paymentJobSummary.subscription_status
        ? humanizeStatus(paymentJobSummary.subscription_status)
        : paymentJob?.expires_at
          ? `Expires ${formatRelativeDate(paymentJob.expires_at)}`
          : null;

  const getStatusColor = (status: JobStatus) => {
    return BADGE_COLORS.jobStatus[status] || 'bg-muted';
  };

  const getPlanBadge = (
    plan: Database['public']['Enums']['job_plan'] | string | null | undefined,
    tier?: Database['public']['Enums']['job_tier'] | string | null
  ) => {
    if (tier === 'featured') {
      return (
        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_PUBLISHED}>
          Featured
        </UnifiedBadge>
      );
    }
    if (plan === 'subscription') {
      return (
        <UnifiedBadge variant="base" className={UI_CLASSES.STATUS_PREMIUM}>
          Subscription
        </UnifiedBadge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {paymentStatus === 'success' && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          <AlertTitle>Payment confirmed</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>
              {paymentJob?.title
                ? `${paymentJob.title} is now live.`
                : 'Your job listing is now live.'}
            </p>
            <p className="text-emerald-900/80 text-xs sm:text-sm dark:text-emerald-100/80">
              {paymentAlertPlanLabel} • {paymentAlertTierLabel}
              {paymentAlertPrice ? ` • ${paymentAlertPrice}` : ''}
              {paymentAlertRenewal ? ` • ${paymentAlertRenewal}` : ''}
            </p>
          </AlertDescription>
        </Alert>
      )}
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
          {jobs.map((job) => {
            const summary = billingSummaryMap.get(job.id);
            const planLabel = resolvePlanLabel(summary?.plan ?? job.plan ?? null);
            const tierLabel = resolveTierLabel(summary?.tier ?? job.tier ?? null);
            const planPriceLabel =
              summary?.price_cents != null
                ? formatPriceLabel(summary.price_cents, summary.is_subscription)
                : null;
            const renewalCopy = summary?.is_subscription
              ? [
                  summary.subscription_status ? humanizeStatus(summary.subscription_status) : null,
                  summary.subscription_renews_at
                    ? `Renews ${formatRelativeDate(summary.subscription_renews_at, {
                        style: 'simple',
                      })}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' • ')
              : job.expires_at
                ? `Active until ${formatRelativeDate(job.expires_at)}`
                : null;
            const paymentCopy =
              summary?.last_payment_at && summary.last_payment_amount !== null
                ? `${formatPriceLabel(summary.last_payment_amount, false)} • Received ${formatRelativeDate(
                    summary.last_payment_at
                  )}`
                : summary?.last_payment_at
                  ? `Last payment ${formatRelativeDate(summary.last_payment_at)}`
                  : null;
            const showBillingCard =
              Boolean(planPriceLabel || renewalCopy || paymentCopy) || Boolean(summary);

            return (
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
                        {getPlanBadge(job.plan ?? null, job.tier ?? null)}
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
                  {showBillingCard && (
                    <div className="mb-4 rounded-lg border border-muted border-dashed bg-muted/20 p-3 text-xs sm:text-sm">
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                        <span className="font-semibold text-foreground">Billing</span>
                        <UnifiedBadge variant="base" style="outline" className="capitalize">
                          {planLabel} • {tierLabel}
                        </UnifiedBadge>
                      </div>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {planPriceLabel && <p>Price: {planPriceLabel}</p>}
                        {renewalCopy && <p>{renewalCopy}</p>}
                        {paymentCopy && <p>{paymentCopy}</p>}
                      </div>
                    </div>
                  )}

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

                    {(() => {
                      const status = job.status ?? 'draft';
                      return status === 'active' || status === 'draft' ? (
                        <JobToggleButton jobId={job.id} currentStatus={status} />
                      ) : null;
                    })()}

                    <JobDeleteButton jobId={job.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
