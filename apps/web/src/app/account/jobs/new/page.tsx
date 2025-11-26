import type { Database } from '@heyclaude/database-types';
import type { CreateJobInput } from '@heyclaude/web-runtime';
import { createJob } from '@heyclaude/web-runtime/actions';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getPaymentPlanCatalog } from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { JobForm } from '@/src/components/core/forms/job-form';

/**
 * Dynamic Rendering Required
 * Authenticated route using cookies
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/jobs/new');
}

export default async function NewJobPage() {
  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/account/jobs/new', 'NewJobPage');

  // Section: Plan Catalog Fetch
  const planCatalogSectionStart = Date.now();
  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
    logger.info(
      'NewJobPage: plan catalog loaded',
      withDuration(
        {
          ...baseLogContext,
          section: 'plan-catalog-fetch',
          plansCount: planCatalog.length,
        },
        planCatalogSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'NewJobPage: failed to fetch plan catalog');
    logger.warn(
      'NewJobPage: failed to fetch plan catalog, using fallback',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'plan-catalog-fetch',
          sectionDuration_ms: Date.now() - planCatalogSectionStart,
          error: normalized.message,
          name: normalized.name,
        },
        startTime
      )
    );
    // planCatalog remains [] - JobForm will use legacy fallback
  }

  const handleSubmit = async (data: CreateJobInput) => {
    'use server';

    // Generate requestId for server action (separate from page render)
    const actionRequestId = generateRequestId();
    const actionLogContext = createWebAppContextWithId(
      actionRequestId,
      '/account/jobs/new',
      'NewJobPageAction',
      {
        title: data.title,
        company: data.company,
      }
    );

    let result: Awaited<ReturnType<typeof createJob>>;
    try {
      // Call createJob server action (calls create_job_with_payment RPC + Polar checkout)
      result = await createJob(data);
    } catch (error) {
      const normalized = normalizeError(error, 'createJob server action failed');
      logger.error('NewJobPage: createJob threw', normalized, actionLogContext);
      throw normalized;
    }

    if (result.serverError) {
      const error = normalizeError(result.serverError, 'NewJobPage: createJob failed');
      logger.error('NewJobPage: createJob failed', error, actionLogContext);
      throw error;
    }

    if (!result.data) {
      const error = normalizeError(
        'createJob returned no data',
        'NewJobPage: createJob returned no data'
      );
      logger.error('NewJobPage: createJob returned no data', error, actionLogContext);
      throw error;
    }

    // Type the result data using generated database types
    type CreateJobResult = Database['public']['CompositeTypes']['create_job_with_payment_result'] & {
      checkoutUrl?: string | null;
    };
    const jobResult = result.data as CreateJobResult;

    if (jobResult.success) {
      if (jobResult.requires_payment) {
        if (!jobResult.checkoutUrl) {
          const error = normalizeError(
            new Error('Missing checkout URL for paid job creation'),
            'NewJobPage: missing checkout URL'
          );
          logger.error('NewJobPage: missing checkout URL', error, {
            ...actionLogContext,
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
    const error = normalizeError(
      new Error('Job creation failed'),
      'NewJobPage: createJob returned success=false'
    );
    logger.error('NewJobPage: createJob returned success=false', error, {
      ...actionLogContext,
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
