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
  BarChart,
  Briefcase,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  Plus,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  BADGE_COLORS,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { JobDeleteButton } from '@/src/components/core/buttons/jobs/job-delete-button';
import { JobToggleButton } from '@/src/components/core/buttons/jobs/job-toggle-button';

/**
 * Dynamic Rendering Required
 * Authenticated user jobs
 * Runtime: Node.js (required for authenticated user data and Supabase server client)
 */

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

/**
 * Format an amount in cents as a US dollar string, optionally appending a monthly suffix.
 *
 * @param cents - Monetary amount in integer cents (e.g., 2500 for $25.00)
 * @param isSubscription - When true, append `/month` to indicate a recurring monthly price
 * @returns The formatted USD price string (e.g., "$25" or "$25/month")
 * @see USD_FORMATTER
 */
function formatPriceLabel(cents: number, isSubscription?: boolean | null): string {
  const base = USD_FORMATTER.format(cents / 100);
  return isSubscription ? `${base}/month` : base;
}

/**
 * Convert a string to title case by capitalizing the first letter of each word.
 *
 * @param value - The input string to convert
 * @returns The input string with each word capitalized and segments separated by single spaces
 *
 * @see humanizeStatus
 */
function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

/**
 * Converts a job status string into a human-readable title-cased label.
 *
 * @param value - The raw status value (e.g., "active", "pending", or `null`/`undefined`).
 * @returns The title-cased status (e.g., "Active") or `"Unknown"` when `value` is falsy.
 *
 * @see toTitleCase
 */
function humanizeStatus(value?: null | string): string {
  if (!value) return 'Unknown';
  return toTitleCase(value);
}

/**
 * Get the human-readable label for a job plan.
 *
 * @param plan - The job plan enum value; may be `undefined` or `null`
 * @returns The human-readable label for `plan`; defaults to the One-Time label when `plan` is missing.
 *
 * @see JOB_PLAN_LABELS
 */
function resolvePlanLabel(plan?: Database['public']['Enums']['job_plan'] | null): string {
  if (!plan) {
    return JOB_PLAN_LABELS['one-time'];
  }
  return JOB_PLAN_LABELS[plan];
}

/**
 * Resolve a human-readable label for a job tier.
 *
 * @param tier - The job tier enum value; when `undefined` or `null`, the standard tier label is used
 * @returns The label corresponding to `tier`, or the Standard tier label when no tier is provided
 *
 * @see JOB_TIER_LABELS
 */
function resolveTierLabel(tier?: Database['public']['Enums']['job_tier'] | null): string {
  if (!tier) {
    return JOB_TIER_LABELS.standard;
  }
  return JOB_TIER_LABELS[tier];
}

/**
 * Maps a job status to its badge color token.
 *
 * @param status - The job status to map
 * @returns The color token string associated with the provided `status`
 *
 * @see BADGE_COLORS.jobStatus
 */
function getStatusColor(status: JobStatus): string {
  return BADGE_COLORS.jobStatus[status];
}

/**
 * Generate metadata for the My Jobs account page.
 *
 * Awaits a server connection to defer non-deterministic work to request time (required for Cache Components),
 * then returns the page metadata for the "/account/jobs" route.
 *
 * @returns Page metadata for the "/account/jobs" route.
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/jobs');
}

interface MyJobsPageProperties {
  searchParams?: Promise<{ job_id?: string; payment?: string }>;
}

/**
 * Renders the "My Job Listings" account page and loads server-side data required to display
 * the user's jobs, billing summaries, and payment confirmation alert.
 *
 * This server component authenticates the current user, fetches the user's dashboard and
 * per-job billing summaries, and renders appropriate UI states for unauthenticated users,
 * data-fetch failures, empty job lists, and populated job listings (including billing info
 * and action controls).
 *
 * @param props.searchParams - Optional query parameters from the request. Recognized keys:
 *   - `payment`: payment status indicator (e.g., "success")
 *   - `job_id`: job identifier associated with a payment
 *
 * @returns The page React element for the user's job listings.
 *
 * @see getUserDashboard
 * @see getJobBillingSummaries
 * @see resolvePlanLabel
 * @see resolveTierLabel
 */
export default async function MyJobsPage({ searchParams }: MyJobsPageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'MyJobsPage',
    route: '/account/jobs',
    module: 'apps/web/src/app/account/jobs',
  });

  const resolvedSearchParameters = searchParams ? await searchParams : {};
  const paymentStatus = resolvedSearchParameters.payment;
  const paymentJobId = resolvedSearchParameters.job_id;

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'MyJobsPage' });

  if (!user) {
    reqLogger.warn('MyJobsPage: unauthenticated access attempt detected', {
      section: 'authentication',
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

  return (
    <div className="space-y-6">
      {/* Payment success alert - rendered immediately if paymentStatus is present */}
      {paymentStatus === 'success' && paymentJobId ? (
        <Suspense fallback={null}>
          <PaymentSuccessAlert
            paymentJobId={paymentJobId}
            userId={user.id}
            userLogger={userLogger}
          />
        </Suspense>
      ) : null}

      {/* Jobs list with header - dashboard data in Suspense for streaming */}
      <Suspense fallback={<div className="space-y-6">Loading jobs...</div>}>
        <JobsListWithHeader userId={user.id} userLogger={userLogger} />
      </Suspense>
    </div>
  );
}

/**
 * Render a success alert for a completed job payment.
 *
 * Fetches the user's dashboard to locate the paid job and loads billing summaries to display plan, tier,
 * price, and renewal/expiration information. If the dashboard cannot be loaded the component returns `null`.
 * Designed to be used as a server component and wrapped in a Suspense boundary for streaming.
 *
 * @param props.paymentJobId - The ID of the job associated with the successful payment
 * @param props.userId - The authenticated user's ID used to scope dashboard data
 * @param props.userLogger - A request-scoped logger (child) used to record fetch or normalization errors
 *
 * @see getUserDashboard
 * @see getJobBillingSummaries
 * @see resolvePlanLabel
 * @see resolveTierLabel
 * @see formatPriceLabel
 */
async function PaymentSuccessAlert({
  paymentJobId,
  userId,
  userLogger,
}: {
  paymentJobId: string;
  userId: string;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Fetch dashboard to get the job
  let data: Database['public']['Functions']['get_user_dashboard']['Returns'] | null = null;
  try {
    data = await getUserDashboard(userId);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user dashboard for payment alert');
    userLogger.error('MyJobsPage: getUserDashboard failed for payment alert', normalized);
    return null;
  }

  // Extract jobs from dashboard
  const jobs: Array<Database['public']['Tables']['jobs']['Row']> = (() => {
    const jobsData = data?.jobs;
    if (jobsData === undefined || jobsData === null || !Array.isArray(jobsData)) {
      return [];
    }
    return jobsData.filter(
      (item): item is Database['public']['Tables']['jobs']['Row'] =>
        item !== null && typeof item === 'object' && 'id' in item && typeof item['id'] === 'string'
    );
  })();

  const paymentJob = jobs.find((job) => job.id === paymentJobId) ?? null;
  const jobIds = [paymentJobId].filter(Boolean);

  // Fetch billing summary for this job
  let billingSummaries: JobBillingSummaryEntry[] = [];
  if (jobIds.length > 0) {
    try {
      billingSummaries = await getJobBillingSummaries(jobIds);
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to load job billing summary for payment alert'
      );
      userLogger.error('MyJobsPage: getJobBillingSummaries failed for payment alert', normalized);
    }
  }

  const paymentJobSummary = billingSummaries.find((s) => s.job_id === paymentJobId) ?? null;
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

  return (
    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-100">
      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
      <AlertTitle>Payment confirmed</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        <p>
          {paymentJob?.title ? `${paymentJob.title} is now live.` : 'Your job listing is now live.'}
        </p>
        <p className="text-xs text-emerald-900/80 sm:text-sm dark:text-emerald-100/80">
          {paymentAlertPlanLabel} • {paymentAlertTierLabel}
          {paymentAlertPrice ? ` • ${paymentAlertPrice}` : ''}
          {paymentAlertRenewal ? ` • ${paymentAlertRenewal}` : ''}
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Renders the jobs listing header and user dashboard jobs; loads dashboard data on the server
 * and displays either an empty-state card or a jobs list (billing details are loaded inside a
 * Suspense boundary).
 *
 * Fetch behavior:
 * - Calls getUserDashboard(userId) on the server and logs fetch results via the provided logger.
 * - If the dashboard fetch fails or returns no data, renders a "Job listings unavailable" card.
 * - Validates runtime shape of returned `jobs` JSON before rendering.
 *
 * @param props.userId - The authenticated user's ID whose dashboard and jobs should be loaded.
 * @param props.userLogger - A request-scoped logger (child logger) used for recording fetch and validation events.
 * @returns A React element containing the page header and either an empty-state card or the jobs list; billing details are streamed inside a Suspense boundary.
 *
 * @see JobsListWithBilling
 * @see PaymentSuccessAlert
 * @see getUserDashboard
 */
async function JobsListWithHeader({
  userId,
  userLogger,
}: {
  userId: string;
  userLogger: ReturnType<typeof logger.child>;
}) {
  // Section: Dashboard Data Fetch
  let data: Database['public']['Functions']['get_user_dashboard']['Returns'] | null = null;
  let fetchError = false;
  try {
    data = await getUserDashboard(userId);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Job listings unavailable</CardTitle>
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

  return (
    <>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">My Job Listings</h1>
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
          <CardContent className="flex flex-col items-center py-12">
            <Briefcase className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">No job listings yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md text-center">
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
        <Suspense fallback={<div className="grid gap-4">Loading job details...</div>}>
          <JobsListWithBilling jobs={jobs} jobIds={jobIds} userLogger={userLogger} />
        </Suspense>
      )}
    </>
  );
}

/**
 * Render a list of job cards augmented with billing summaries for each job.
 *
 * Fetches billing summaries for the provided `jobIds` and uses them to display per-job
 * billing details (plan, tier, price, renewal/expiration, and recent payment info).
 * This server component is intended to be wrapped in a Suspense boundary so billing
 * data can stream independently from other page data.
 *
 * @param props.jobs - Array of job rows to render as cards (from the `jobs` table).
 * @param props.jobIds - List of job IDs to fetch billing summaries for.
 * @param props.userLogger - Request-scoped child logger used to record billing fetch errors.
 * @returns The rendered jobs list element containing job cards and associated billing sections.
 *
 * @see JobsListWithHeader
 * @see PaymentSuccessAlert
 */
async function JobsListWithBilling({
  jobs,
  jobIds,
  userLogger,
}: {
  jobIds: string[];
  jobs: Array<Database['public']['Tables']['jobs']['Row']>;
  userLogger: ReturnType<typeof logger.child>;
}) {
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

  const getPlanBadge = (
    plan: Database['public']['Enums']['job_plan'] | null | undefined,
    tier?: Database['public']['Enums']['job_tier'] | null
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
    <div className="grid gap-4">
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
          Boolean(planPriceLabel ?? renewalCopy ?? paymentCopy) || Boolean(summary);

        return (
          <Card key={job.id}>
            <CardHeader>
              <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                <div className="flex-1">
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <UnifiedBadge
                      variant="base"
                      style="outline"
                      className={getStatusColor(job.status)}
                    >
                      {job.status}
                    </UnifiedBadge>
                    {getPlanBadge(job.plan, job.tier)}
                  </div>
                  <CardTitle className="mt-2">{job.title}</CardTitle>
                  <CardDescription>
                    {job.company} • {job.location ?? 'Remote'} • {job.type}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Eye className="h-4 w-4" />
                  {job.view_count ?? 0} views
                </div>
                {job.posted_at ? <div>Posted {formatRelativeDate(job.posted_at)}</div> : null}
                {job.expires_at ? <div>Expires {formatRelativeDate(job.expires_at)}</div> : null}
              </div>
              {showBillingCard ? (
                <div className="border-muted bg-muted/20 mb-4 rounded-lg border border-dashed p-3 text-xs sm:text-sm">
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className="text-foreground font-semibold">Billing</span>
                    <UnifiedBadge variant="base" style="outline" className="capitalize">
                      {planLabel} • {tierLabel}
                    </UnifiedBadge>
                  </div>
                  <div className="text-muted-foreground mt-2 space-y-1">
                    {planPriceLabel ? <p>Price: {planPriceLabel}</p> : null}
                    {renewalCopy ? <p>{renewalCopy}</p> : null}
                    {paymentCopy ? <p>{paymentCopy}</p> : null}
                  </div>
                </div>
              ) : null}

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

                {job.slug ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/jobs/${job.slug}`}>
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </Link>
                  </Button>
                ) : null}

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
  );
}