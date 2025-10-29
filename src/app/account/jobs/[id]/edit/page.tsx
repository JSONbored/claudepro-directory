/**
 * Edit Job Page - Update existing job postings.
 */

import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/forms/job-form';
import { updateJob } from '@/src/lib/actions/business.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

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

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) notFound();

  const job = data as Database['public']['Tables']['jobs']['Row'];

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
