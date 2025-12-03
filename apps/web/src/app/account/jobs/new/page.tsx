import  { type Database } from '@heyclaude/database-types';
import  { type CreateJobInput } from '@heyclaude/web-runtime';
import { createJob } from '@heyclaude/web-runtime/actions';
import { spaceY, muted, marginBottom, weight , size, tracking,
} from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata, getPaymentPlanCatalog } from '@heyclaude/web-runtime/server';
import  { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { JobForm } from '@/src/components/core/forms/job-form';

/**
 * Dynamic Rendering Required
 * Authenticated route using cookies
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generates page metadata for the "/account/jobs/new" route used by Next.js.
 *
 * @returns The metadata object for the "/account/jobs/new" page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/jobs/new');
}

/**
 * Render the "Post a Job" page and provide a server action that creates jobs and handles post-creation flows.
 *
 * The component loads the payment plan catalog server-side (falls back to an empty catalog on failure)
 * and exposes a server action (`handleSubmit`) which calls `createJob`, normalizes and logs errors,
 * returns a checkout payload when payment is required, or redirects to the jobs list when creation
 * succeeds without payment.
 *
 * @returns The page's React element containing the job form and related UI.
 *
 * @see JobForm
 * @see createJob
 * @see getPaymentPlanCatalog
 */
export default async function NewJobPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'NewJobPage',
    route: '/account/jobs/new',
    module: 'apps/web/src/app/account/jobs/new',
  });

  // Section: Plan Catalog Fetch
  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
    reqLogger.info('NewJobPage: plan catalog loaded', {
      section: 'plan-catalog-fetch',
      plansCount: planCatalog.length,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'NewJobPage: failed to fetch plan catalog');
    reqLogger.warn('NewJobPage: failed to fetch plan catalog, using fallback', {
      err: normalized,
      section: 'plan-catalog-fetch',
      name: normalized.name,
    });
    // planCatalog remains [] - JobForm will use legacy fallback
  }

  /**
   * Create a job and handle the post-creation flow: either redirect to the jobs list or return a payload to start checkout.
   *
   * @param data - Job creation input payload
   * @returns When payment is required: an object `{ success: true, requiresPayment: true, checkoutUrl, message }`
   *          if a checkout URL is available, or `{ success: false, requiresPayment: true, message }` if checkout could not
   *          be started. When creation fails: `{ success: false, message }`. When creation succeeds with no payment required
   *          the function performs a redirect to `/account/jobs` and does not return.
   * @throws NormalizedError when the underlying `createJob` call throws, when the RPC returns a `serverError`, or when
   *         the RPC result contains no `data`.
   * @see createJob
   * @see generateRequestId
   */
  async function handleSubmit(data: CreateJobInput) {
    'use server';

    // Generate requestId for server action (separate from page render)
    const actionRequestId = generateRequestId();
    
    // Create request-scoped child logger for server action
    const actionLogger = logger.child({
      requestId: actionRequestId,
      operation: 'NewJobPageAction',
      route: '/account/jobs/new',
      module: 'apps/web/src/app/account/jobs/new',
    });

    let result: Awaited<ReturnType<typeof createJob>>;
    try {
      // Call createJob server action (calls create_job_with_payment RPC + Polar checkout)
      result = await createJob(data);
    } catch (error) {
      const normalized = normalizeError(error, 'createJob server action failed');
      actionLogger.error('NewJobPage: createJob threw', normalized);
      throw normalized;
    }

    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'NewJobPage: createJob failed');
      actionLogger.error('NewJobPage: createJob failed', normalized);
      throw normalized;
    }

    // Type assertion: result.data should exist if no serverError
    // The action returns { data, serverError } where data is null on error
    const resultData = result.data;
    if (!resultData) {
      const normalized = normalizeError(
        'createJob returned no data',
        'NewJobPage: createJob returned no data'
      );
      actionLogger.error('NewJobPage: createJob returned no data', normalized);
      throw normalized;
    }

    // Type the result data using generated database types
    type CreateJobResult = Database['public']['CompositeTypes']['create_job_with_payment_result'] & {
      checkoutUrl?: null | string;
    };
    const jobResult = resultData as CreateJobResult;

    if (jobResult.success) {
      if (jobResult.requires_payment) {
        if (!jobResult.checkoutUrl) {
          const normalized = normalizeError(
            new Error('Missing checkout URL for paid job creation'),
            'NewJobPage: missing checkout URL'
          );
          actionLogger.error('NewJobPage: missing checkout URL', normalized, {
            jobId: jobResult.job_id ?? 'unknown',
            companyId: jobResult.company_id ?? 'unknown',
          });
          return {
            success: false,
            requiresPayment: true,
            message:
              'Unable to start checkout right now. Please try again shortly or contact support.',
          };
        }

        return {
          success: true,
          requiresPayment: true,
          checkoutUrl: jobResult.checkoutUrl,
          message: 'Redirecting to payment...',
        };
      }

      // No payment required or Polar not configured - redirect to jobs list
      redirect('/account/jobs');
    }

    // Handle unexpected failure case
    const normalized = normalizeError(
      new Error('Job creation failed'),
      'NewJobPage: createJob returned success=false'
    );
      actionLogger.error('NewJobPage: createJob returned success=false', normalized, {
      jobId: jobResult.job_id ?? 'unknown',
      companyId: jobResult.company_id ?? 'unknown',
      requiresPayment: jobResult.requires_payment ?? false,
    });
    return {
      success: false,
      message: 'Job creation failed. Please try again or contact support.',
    };
  };

  return (
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']} ${tracking.tight}`}>Post a Job</h1>
        <p className={muted.default}>
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" planCatalog={planCatalog} />
    </div>
  );
}