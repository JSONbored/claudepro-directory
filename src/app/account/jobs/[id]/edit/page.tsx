import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/jobs/job-form';
import { updateJob } from '@/src/lib/actions/business.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

export const metadata = generatePageMetadata('/account/jobs/:id/edit');

interface EditJobPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const resolvedParams = await params;
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
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    notFound();
  }

  const handleSubmit = async (data: Omit<Parameters<typeof updateJob>[0], 'id'>) => {
    'use server';

    const result = await updateJob({
      ...data,
      id: resolvedParams.id,
    });

    if (result?.data?.success) {
      redirect('/account/jobs');
    }

    return { success: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Job Listing</h1>
        <p className="text-muted-foreground">Update your job posting details</p>
      </div>

      <JobForm
        initialData={{
          title: job.title,
          company: job.company,
          location: job.location ?? undefined,
          description: job.description,
          salary: job.salary ?? undefined,
          remote: job.remote ?? false,
          type: job.type as 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance',
          workplace: (job.workplace as 'On site' | 'Remote' | 'Hybrid') ?? undefined,
          experience:
            (job.experience as 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive') ?? undefined,
          category: job.category,
          tags: Array.isArray(job.tags) ? (job.tags as string[]) : [],
          requirements: Array.isArray(job.requirements) ? (job.requirements as string[]) : [],
          benefits: Array.isArray(job.benefits) ? (job.benefits as string[]) : [],
          link: job.link,
          contact_email: job.contact_email ?? undefined,
          company_logo: job.company_logo ?? undefined,
          plan: job.plan as 'featured' | 'standard' | 'premium',
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
      />
    </div>
  );
}
