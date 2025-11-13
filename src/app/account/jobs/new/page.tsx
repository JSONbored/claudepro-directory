import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';
import { type CreateJobInput, createJob } from '@/src/lib/actions/jobs.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';


export const metadata = generatePageMetadata('/account/jobs/new');

export default function NewJobPage() {
  const handleSubmit = async (data: CreateJobInput) => {
    'use server';

    // Call createJob server action (calls create_job_with_payment RPC + Polar checkout)
    const result = await createJob(data);

    if (result?.serverError) {
      throw new Error(result.serverError);
    }

    if (result?.data?.success) {
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
