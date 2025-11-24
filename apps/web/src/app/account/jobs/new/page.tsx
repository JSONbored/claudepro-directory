import type { CreateJobInput } from '@heyclaude/web-runtime';
import { createJob } from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getPaymentPlanCatalog } from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/jobs/new');
}

export default async function NewJobPage() {
  const planCatalog = await getPaymentPlanCatalog();

  const handleSubmit = async (data: CreateJobInput) => {
    'use server';

    let result: Awaited<ReturnType<typeof createJob>>;
    try {
      // Call createJob server action (calls create_job_with_payment RPC + Polar checkout)
      result = await createJob(data);
    } catch (error) {
      const normalized = normalizeError(error, 'createJob server action failed');
      logger.error('NewJobPage: createJob threw', normalized, {
        title: data.title,
        company: data.company,
      });
      throw normalized;
    }

    if (result?.serverError) {
      const error = normalizeError(result.serverError, 'NewJobPage: createJob failed');
      logger.error('NewJobPage: createJob failed', error, {
        title: data.title,
        company: data.company,
      });
      throw error;
    }

    if (!result?.data) {
      const error = normalizeError(
        'createJob returned no data',
        'NewJobPage: createJob returned no data'
      );
      logger.error('NewJobPage: createJob returned no data', error, {
        title: data.title,
        company: data.company,
      });
      throw error;
    }

    if (result.data.success) {
      if (result.data.requiresPayment) {
        if (!result.data.checkoutUrl) {
          const error = normalizeError(
            'Missing checkout URL for paid job creation',
            'NewJobPage: missing checkout URL'
          );
          logger.error('NewJobPage: missing checkout URL', error, {
            title: data.title,
            company: data.company,
            jobId: result.data.jobId,
            companyId: result.data.companyId,
          });
          return {
            success: false,
            message:
              'Unable to start checkout right now. Please try again shortly or contact support.',
          };
        }

        return {
          success: true,
          requiresPayment: true,
          checkoutUrl: result.data.checkoutUrl,
          message: 'Redirecting to payment...',
        };
      }

      // No payment required or Polar not configured - redirect to jobs list
      redirect('/account/jobs');
    }

    // Handle unexpected failure case
    const error = normalizeError(
      'Job creation failed',
      'NewJobPage: createJob returned success=false'
    );
    logger.error('NewJobPage: createJob returned success=false', error, {
      title: data.title,
      company: data.company,
      jobId: result.data.jobId,
      companyId: result.data.companyId,
      requiresPayment: result.data.requiresPayment,
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
