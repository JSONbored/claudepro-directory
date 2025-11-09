/**
 * Edit Job Page - Update existing job postings.
 */

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/forms/job-form';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

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

  const job = data as Tables<'jobs'>;

  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server';

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('You must be signed in to update jobs');

    // Get JWT token for edge function authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Call jobs-handler edge function directly
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jobs-handler`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Job-Action': 'update',
        },
        body: JSON.stringify({ ...data, id: resolvedParams.id }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to update job: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      job: Tables<'jobs'>;
    };

    if (result.success) {
      if (!result.job || typeof result.job !== 'object') {
        throw new Error('Invalid response: job object missing on successful update');
      }

      if (!result.job.slug || typeof result.job.slug !== 'string') {
        throw new Error('Invalid response: job slug missing or invalid');
      }

      revalidatePath('/jobs');
      revalidatePath(`/jobs/${result.job.slug}`);
      revalidatePath('/account/jobs');

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
