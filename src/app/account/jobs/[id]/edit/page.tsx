/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';
import { type UpdateJobInput, updateJob } from '@/src/lib/actions/jobs.actions';
import { getUserJobById } from '@/src/lib/data/user-data';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/account/jobs/:id/edit');

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const job = await getUserJobById(user.id, resolvedParams.id);
  if (!job) notFound();

  const handleSubmit = async (data: Omit<UpdateJobInput, 'job_id'>) => {
    'use server';

    // Call updateJob server action (calls update_job RPC with ownership verification)
    const result = await updateJob({
      job_id: resolvedParams.id,
      ...data,
    });

    if (result?.serverError) {
      throw new Error(result.serverError);
    }

    if (result?.data?.success) {
      redirect('/account/jobs');
    }

    return { success: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`mb-2 ${UI_CLASSES.HEADING_H2}`}>Edit Job Listing</h1>
        <p className="text-muted-foreground">Update your job posting details</p>
      </div>
      <JobForm
        initialData={{
          title: job.title,
          company: job.company,
          company_id: job.company_id,
          location: job.location,
          description: job.description,
          salary: job.salary,
          remote: job.remote ?? undefined,
          type: job.type,
          workplace: job.workplace,
          experience: job.experience,
          category: job.category,
          tags: Array.isArray(job.tags) ? (job.tags as string[]) : [],
          requirements: Array.isArray(job.requirements) ? (job.requirements as string[]) : [],
          benefits: Array.isArray(job.benefits) ? (job.benefits as string[]) : [],
          link: job.link,
          contact_email: job.contact_email,
          company_logo: job.company_logo,
          plan: job.plan as 'one-time' | 'subscription',
          tier: job.tier as 'standard' | 'featured',
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
      />
    </div>
  );
}
