import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/forms/job-form';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import type { Json } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/jobs/new');

export default function NewJobPage() {
  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to create a job listing');

    const { data: rpcData, error } = await supabase.rpc('manage_job', {
      p_action: 'create',
      p_user_id: user.id,
      p_data: data as Json,
    });

    if (error) throw new Error(error.message);

    const result = rpcData as unknown as {
      success: boolean;
      job: { id: string; slug: string };
      requiresPayment: boolean;
      message: string;
    };

    if (result.success) {
      revalidatePath('/jobs');
      revalidatePath('/account/jobs');

      // If requires payment (featured/premium), stay on page with message
      if (result.requiresPayment) {
        return result;
      }

      // Standard plan - redirect to jobs list
      redirect('/account/jobs');
    }

    return { success: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Post a Job</h1>
        <p className="text-muted-foreground">
          Create a new job listing to reach talented developers
        </p>
      </div>

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job Listing" />
    </div>
  );
}
