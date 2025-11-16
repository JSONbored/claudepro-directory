import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';
import { type CreateJobInput, createJob } from '@/src/lib/actions/jobs.actions';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/jobs/new');

export default function NewJobPage() {
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
      const error = new Error(result.serverError);
      logger.error('NewJobPage: createJob failed', error, {
        title: data.title,
        company: data.company,
      });
      throw error;
    }

    if (!result?.data) {
      const error = new Error('createJob returned no data');
      logger.error('NewJobPage: createJob returned no data', error, {
        title: data.title,
        company: data.company,
      });
      throw error;
    }

    if (result.data.success) {
      // If requires payment and checkout URL exists, return for client redirect
      if (result.data.requiresPayment && result.data.checkoutUrl) {
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

    return { success: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`mb-2 ${UI_CLASSES.HEADING_H2}`}>Post a Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" />
    </div>
  );
}
