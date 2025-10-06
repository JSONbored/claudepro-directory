import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/jobs/job-form';
import { createJob } from '@/src/lib/actions/job-actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Post a Job - ClaudePro Directory',
  description: 'Create a new job listing',
};

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
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" />
    </div>
  );
}
