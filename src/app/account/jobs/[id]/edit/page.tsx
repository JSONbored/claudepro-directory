import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/jobs/job-form';
import { updateJob } from '@/src/lib/actions/job-actions';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Edit Job - ClaudePro Directory',
  description: 'Edit your job listing',
};

interface EditJobPageProps {
  params: {
    id: string;
  };
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the job (RLS ensures user owns this job)
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    notFound();
  }

  const handleSubmit = async (data: Omit<Parameters<typeof updateJob>[0], 'id'>) => {
    'use server';

    const result = await updateJob({
      ...data,
      id: params.id,
    });

    if (result?.data?.success) {
      redirect('/account/jobs');
    }

    return { success: false };
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Job Listing</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Update your job posting details</p>
      </div>

      <JobForm
        initialData={{
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salary: job.salary,
          remote: job.remote,
          type: job.type,
          workplace: job.workplace,
          experience: job.experience,
          category: job.category,
          tags: job.tags,
          requirements: job.requirements,
          benefits: job.benefits,
          link: job.link,
          contact_email: job.contact_email,
          company_logo: job.company_logo,
          plan: job.plan,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
      />
    </div>
  );
}
