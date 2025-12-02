import { type Database } from '@heyclaude/database-types';
import { type JobStatus } from '@heyclaude/web-runtime';
import { formatRelativeDate } from '@heyclaude/web-runtime/core';
import { type JobBillingSummaryEntry } from '@heyclaude/web-runtime/data';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getJobBillingSummaries,
  getUserDashboard,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  between,
  bgColor,
  cluster,
  flexDir,
  flexWrap,
  gap,
  iconLeading,
  iconSize,
  alignItems,
  jobStatusBadge,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  muted,
  padding,
  radius,
  size,
  spaceY,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import {
  BarChart,
  Briefcase,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  Plus,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, Alert, AlertDescription, AlertTitle   } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';

import { JobDeleteButton } from '@/src/components/core/buttons/jobs/job-delete-button';
import { JobToggleButton } from '@/src/components/core/buttons/jobs/job-toggle-button';

/**
 * Dynamic Rendering Required
 * Authenticated user jobs
 * Runtime: Node.js (required for authenticated user data and Supabase server client)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

/**
 * Convert a raw job status token into a human-readable title-cased label.
 *
 * @param value - The raw status token (for example: "active", "pending", "expired"); may be null or undefined
 * @returns `'Unknown'` if `value` is missing, otherwise the `value` converted to Title Case
 *
 * @see toTitleCase
 */
function humanizeStatus(value?: null | string): string {
  if (!value) return 'Unknown';
  return toTitleCase(value);
}

/**
 * Map a job plan enum value to its human-readable label.
 *
 * @param plan - The job plan enum (`'one-time'` or `'subscription'`), or `null`/`undefined`
 * @returns The human-friendly label for the given plan; defaults to "One-Time" when `plan` is missing
 *
 * @see JOB_PLAN_LABELS
 */
function resolvePlanLabel(
  plan?: Database['public']['Enums']['job_plan'] | null
): string {
  if (!plan) {
    return JOB_PLAN_LABELS['one-time'];
  }
  return JOB_PLAN_LABELS[plan];
}

/**
 * Get a human-readable label for a job tier.
 *
 * @param tier - The job tier enum value; if omitted, `standard` is used.
 * @returns The friendly label for `tier`; `Standard` when `tier` is missing.
 *
 * @see JOB_TIER_LABELS
 */
function resolveTierLabel(
  tier?: Database['public']['Enums']['job_tier'] | null
): string {
  if (!tier) {
    return JOB_TIER_LABELS.standard;
  }
  return JOB_TIER_LABELS[tier];
}

/**
 * Get the badge color token for a job status.
 *
 * @param status - The job status to resolve
 * @returns The badge color token for the provided status
 *
 * @see jobStatusBadge
 */
function getStatusColor(status: JobStatus): string {
  return jobStatusBadge[status];
}

/**
 * Produce page metadata for the My Job Listings route ("/account/jobs").
 *
 * @returns Metadata object used to populate the page head for the My Job Listings page
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/jobs');
}

interface MyJobsPageProperties {
  searchParams?: Promise<{ job_id?: string; payment?: string; }>;
}

/**
 * Render the My Job Listings account page showing the user's job listings, per-job billing details, and an optional payment confirmation banner.
 *
 * This server component is rendered with dynamic SSR (dynamic = 'force-dynamic') on the Node.js runtime and performs server-side data fetching:
 * - Verifies authenticated user and renders a sign-in prompt when unauthenticated.
 * - Loads the user's dashboard and job billing summaries and validates job rows returned from RPC responses.
 * - Surfaces a payment success banner when `searchParams.payment === 'success'` and `searchParams.job_id` is present.
 *
 * @param searchParams - Optional URL query parameters; may include `payment` and `job_id` to surface a payment success banner for a specific job.
 * @returns The rendered JSX for the My Job Listings account page.
 *
 * @see getAuthenticatedUser
 * @see getUserDashboard
 * @see getJobBillingSummaries
 * @see ROUTES
 */
export default async function MyJobsPage({ searchParams }: MyJobsPageProperties) {
  const resolvedSearchParameters = searchParams ? await searchParams : {};
  const paymentStatus = resolvedSearchParameters.payment;
  const paymentJobId = resolvedSearchParameters.job_id;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'MyJobsPage',
    route: '/account/jobs',
    module: 'apps/web/src/app/account/jobs',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'MyJobsPage' });

  if (!user) {
    reqLogger.warn('MyJobsPage: unauthenticated access attempt detected', {
      section: 'authentication',
      timestamp: new Date().toISOString(),
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your job listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('MyJobsPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Dashboard Data Fetch
  let data: Database['public']['Functions']['get_user_dashboard']['Returns'] | null = null;
  let fetchError = false;
  try {
    data = await getUserDashboard(user.id);
    userLogger.info('MyJobsPage: dashboard data loaded', {
      section: 'dashboard-data-fetch',
      hasData: !!data,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user dashboard for jobs');
    userLogger.error('MyJobsPage: getUserDashboard threw', normalized, {
      section: 'dashboard-data-fetch',
    });
    fetchError = true;
  }

  if (!data) {
    userLogger.warn('MyJobsPage: getUserDashboard returned no data', {
      section: 'dashboard-data-fetch',
    });
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Job listings unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your job dashboard. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
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
    if (jobsData === undefined || jobsData === null || !Array.isArray(jobsData)) {
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
      .map((item) => item);
  })();

  if (jobs.length === 0) {
    userLogger.info('MyJobsPage: user has no job listings');
  }

  const jobIds = jobs.map((job) => job.id).filter(Boolean);
  let billingSummaries: JobBillingSummaryEntry[] = [];
  if (jobIds.length > 0) {
    try {
      billingSummaries = await getJobBillingSummaries(jobIds);
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load job billing summaries');
      userLogger.error('MyJobsPage: getJobBillingSummaries failed', normalized);
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
    paymentJobSummary?.price_cents == undefined
      ? null
      : formatPriceLabel(paymentJobSummary.price_cents, paymentJobSummary.is_subscription);
  const paymentAlertRenewal = (() => {
    if (paymentJobSummary?.is_subscription && paymentJobSummary.subscription_renews_at) {
      return `Renews ${formatRelativeDate(paymentJobSummary.subscription_renews_at, {
        style: 'simple',
      })}`;
    }
    if (paymentJobSummary?.is_subscription && paymentJobSummary.subscription_status) {
      return humanizeStatus(paymentJobSummary.subscription_status);
    }
    if (paymentJob?.expires_at) {
      return `Expires ${formatRelativeDate(paymentJob.expires_at)}`;
    }
    return null;
  })();

  const getPlanBadge = (
    plan: Database['public']['Enums']['job_plan'] | null | undefined,
    tier?: Database['public']['Enums']['job_tier'] | null
  ) => {
    if (tier === 'featured') {
      return (
        <UnifiedBadge variant="base" className={`${bgColor['green/10']} ${textColor.green} dark:${bgColor['green/20']} dark:text-green-400`}>
          Featured
        </UnifiedBadge>
      );
    }
    if (plan === 'subscription') {
      return (
        <UnifiedBadge variant="base" className={`${bgColor['purple/10']} ${textColor.purple} dark:${bgColor['purple/20']} dark:text-purple-400`}>
          Subscription
        </UnifiedBadge>
      );
    }
    return null;
  };

  return (
    <div className={spaceY.relaxed}>
      {paymentStatus === 'success' && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle className={`${iconSize.sm} ${textColor.emerald}`} />
          <AlertTitle>Payment confirmed</AlertTitle>
          <AlertDescription className={`${spaceY.tight} ${size.sm}`}>
            <p>
              {paymentJob?.title
                ? `${paymentJob.title} is now live.`
                : 'Your job listing is now live.'}
            </p>
            <p className={`text-emerald-900/80 ${size.xs} sm:${size.sm} dark:text-emerald-100/80`}>
              {paymentAlertPlanLabel} • {paymentAlertTierLabel}
              {paymentAlertPrice ? ` • ${paymentAlertPrice}` : ''}
              {paymentAlertRenewal ? ` • ${paymentAlertRenewal}` : ''}
            </p>
          </AlertDescription>
        </Alert>
      )}
      <div className={between.center}>
        <div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>My Job Listings</h1>
          <p className={muted.default}>
            {jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
            <Plus className={`mr-2 ${iconSize.sm}`} />
            Post a Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
            <Briefcase className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
            <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No job listings yet</h3>
            <p className={`${marginBottom.default} ${maxWidth.md} text-center ${muted.default}`}>
              Post your first job listing to reach talented developers in the Claude community
            </p>
            <Button asChild>
              <Link href={ROUTES.ACCOUNT_JOBS_NEW}>
                <Plus className={`mr-2 ${iconSize.sm}`} />
                Post Your First Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${gap.comfortable}`}>
          {jobs.map((job) => {
            const summary = billingSummaryMap.get(job.id);
            const planLabel = resolvePlanLabel(summary?.plan ?? job.plan);
            const tierLabel = resolveTierLabel(summary?.tier ?? job.tier);
            const planPriceLabel =
              summary?.price_cents == undefined
                ? null
                : formatPriceLabel(summary.price_cents, summary.is_subscription);
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
              : (job.expires_at
                ? `Active until ${formatRelativeDate(job.expires_at)}`
                : null);
            const paymentCopy =
              summary?.last_payment_at && summary.last_payment_amount !== null
                ? `${formatPriceLabel(summary.last_payment_amount, false)} • Received ${formatRelativeDate(
                    summary.last_payment_at
                  )}`
                : (summary?.last_payment_at
                  ? `Last payment ${formatRelativeDate(summary.last_payment_at)}`
                  : null);
            const showBillingCard =
              Boolean(planPriceLabel ?? renewalCopy ?? paymentCopy) || Boolean(summary);

            return (
              <Card key={job.id}>
                <CardHeader>
                  <div className={`flex ${alignItems.start} ${justify.between}`}>
                    <div className="flex-1">
                      <div className={cluster.compact}>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className={getStatusColor(job.status)}
                        >
                          {job.status}
                        </UnifiedBadge>
                        {getPlanBadge(job.plan, job.tier)}
                      </div>
                      <CardTitle className={marginTop.compact}>{job.title}</CardTitle>
                      <CardDescription>
                        {job.company} • {job.location ?? 'Remote'} • {job.type}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className={`${marginBottom.default} flex ${flexWrap.wrap} ${gap.comfortable} ${muted.sm}`}>
                    <div className={cluster.tight}>
                      <Eye className={iconSize.sm} />
                      {job.view_count ?? 0} views
                    </div>
                    {job.posted_at ? <div>Posted {formatRelativeDate(job.posted_at)}</div> : null}
                    {job.expires_at ? <div>Expires {formatRelativeDate(job.expires_at)}</div> : null}
                  </div>
                  {showBillingCard ? <div className={`${marginBottom.default} ${radius.lg} border border-muted border-dashed ${bgColor['muted/20']} ${padding.compact} ${size.xs} sm:${size.sm}`}>
                      <div className={between.center}>
                        <span className={`${weight.semibold} ${textColor.foreground}`}>Billing</span>
                        <UnifiedBadge variant="base" style="outline" className="capitalize">
                          {planLabel} • {tierLabel}
                        </UnifiedBadge>
                      </div>
                      <div className={`${marginTop.compact} ${spaceY.tight} ${muted.default}`}>
                        {planPriceLabel ? <p>Price: {planPriceLabel}</p> : null}
                        {renewalCopy ? <p>{renewalCopy}</p> : null}
                        {paymentCopy ? <p>{paymentCopy}</p> : null}
                      </div>
                    </div> : null}

                  <div className={cluster.compact}>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/account/jobs/${job.id}/edit`}>
                        <Edit className={iconLeading.xs} />
                        Edit
                      </Link>
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/account/jobs/${job.id}/analytics`}>
                        <BarChart className={iconLeading.xs} />
                        Analytics
                      </Link>
                    </Button>

                    {job.slug ? <Button variant="ghost" size="sm" asChild>
                        <Link href={`/jobs/${job.slug}`}>
                          <ExternalLink className={iconLeading.xs} />
                          View
                        </Link>
                      </Button> : null}

                    {(() => {
                      const status = job.status;
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