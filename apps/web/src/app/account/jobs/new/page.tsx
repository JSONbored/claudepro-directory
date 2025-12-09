import { type Database } from '@heyclaude/database-types';
import { type CreateJobInput } from '@heyclaude/web-runtime';
import { createJob } from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata, getPaymentPlanCatalog } from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { JobForm } from '@/src/components/core/forms/job-form';

/**
 * Dynamic Rendering Required
 * Authenticated route using cookies
 */

/**
 * Produce the Metadata for the /account/jobs/new page.
 *
 * Awaits a server connection to defer non-deterministic work to request time before generating page metadata.
 *
 * @returns The metadata object used by Next.js for the new job creation page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/jobs/new');
}

/**
 * Render the "Post a Job" page with a job creation form and plan catalog.
 *
 * Fetches the payment plan catalog for use in the form and provides a server action that creates jobs, handles payment-required flows (returns a checkout URL when needed), and redirects to the jobs list when creation succeeds without payment.
 *
 * @returns The React element for the New Job page containing the header and a JobForm wired to the server action that creates jobs and manages payment/redirect behavior.
 *
 * @see JobForm
 * @see getPaymentPlanCatalog
 * @see createJob
 */
export default async function NewJobPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'NewJobPage',
    route: '/account/jobs/new',
    module: 'apps/web/src/app/account/jobs/new',
  });

  // Section: Plan Catalog Fetch
  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
    reqLogger.info(
      {
        section: 'data-fetch',
        plansCount: planCatalog.length,
      },
      'NewJobPage: plan catalog loaded'
    );
  } catch (error) {
    const normalized = normalizeError(error, 'NewJobPage: failed to fetch plan catalog');
    reqLogger.warn(
      {
        section: 'data-fetch',
        err: normalized,
        name: normalized.name,
      },
      'NewJobPage: failed to fetch plan catalog, using fallback'
    );
    // planCatalog remains [] - JobForm will use legacy fallback
  }

  /**
   * Create a job from submitted form data, initiating checkout if payment is required or redirecting to the jobs list when no payment is needed.
   *
   * @param data - The payload from JobForm used to create the job
   * @returns An object describing the outcome:
   * - `{ success: true, requiresPayment: true, checkoutUrl: string, message: string }` when creation succeeded and a checkout URL is provided,
   * - `{ success: false, requiresPayment: true, message: string }` when creation indicates payment is required but no checkout URL could be started,
   * - `{ success: false, message: string }` when job creation failed.
   * Note: when creation succeeds and `requiresPayment` is `false`, the function performs a redirect to `/account/jobs` instead of returning.
   * @throws Normalized errors when the `createJob` call throws, when `result.serverError` is present, or when the action returns malformed/missing data
   *
   * @see createJob
   * @see normalizeError
   * @see redirect
   * @see JobForm
   */
  async function handleSubmit(data: CreateJobInput) {
    'use server';

    // Create request-scoped child logger for server action
    const actionLogger = logger.child({
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
      actionLogger.error({ err: normalized }, 'NewJobPage: createJob threw');
      throw normalized;
    }

    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'NewJobPage: createJob failed');
      actionLogger.error({ err: normalized }, 'NewJobPage: createJob failed');
      throw normalized;
    }

    // result.data should be present per types, but check kept to handle unexpected runtime/malformed responses
    if (!result.data) {
      const normalized = normalizeError(
        'createJob returned no data',
        'NewJobPage: createJob returned no data'
      );
      actionLogger.error({ err: normalized }, 'NewJobPage: createJob returned no data');
      throw normalized;
    }

    // Type the result data using generated database types
    type CreateJobResult =
      Database['public']['CompositeTypes']['create_job_with_payment_result'] & {
        checkoutUrl?: null | string;
      };
    const jobResult = result.data as CreateJobResult;

    if (jobResult.success) {
      if (jobResult.requires_payment) {
        if (!jobResult.checkoutUrl) {
          const normalized = normalizeError(
            new Error('Missing checkout URL for paid job creation'),
            'NewJobPage: missing checkout URL'
          );
          actionLogger.error(
            {
              err: normalized,
              jobId: jobResult.job_id ?? 'unknown',
              companyId: jobResult.company_id ?? 'unknown',
            },
            'NewJobPage: missing checkout URL'
          );
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
    actionLogger.error(
      {
        err: normalized,
        jobId: jobResult.job_id ?? 'unknown',
        companyId: jobResult.company_id ?? 'unknown',
        requiresPayment: jobResult.requires_payment ?? false,
      },
      'NewJobPage: createJob returned success=false'
    );
    return {
      success: false,
      message: 'Job creation failed. Please try again or contact support.',
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`mb-2 ${UI_CLASSES.HEADING_H2}`}>Post a Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" planCatalog={planCatalog} />
    </div>
  );
}
