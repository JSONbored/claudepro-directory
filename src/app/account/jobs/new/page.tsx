import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/forms/job-form';
import { createJob } from '@/src/lib/actions/business.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/account/jobs/new');

export default function NewJobPage() {
  const handleSubmit = async (data: Parameters<typeof createJob>[0]) => {
    'use server';

    const result = await createJob(data);

    if (result?.data?.success) {
      // If requires payment (featured/premium), stay on page with message
      if (result.data.requiresPayment) {
        return result.data;
      }

      // Standard plan - redirect to jobs list
      redirect('/account/jobs');
    }

    return { success: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" />
    </div>
  );
}
