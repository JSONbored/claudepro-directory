import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { JobForm } from '@/src/components/forms/job-form';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/jobs/new');

export default function NewJobPage() {
  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server';

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('You must be signed in to create a job listing');

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
          'X-Job-Action': 'create',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to create job: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      job: { id: string; slug: string };
      requiresPayment: boolean;
      checkoutUrl?: string;
      message: string;
    };

    if (result.success) {
      revalidatePath('/jobs');
      revalidatePath('/account/jobs');

      // If requires payment, return checkout URL for client-side redirect
      if (result.requiresPayment && result.checkoutUrl) {
        return {
          success: true,
          requiresPayment: true,
          checkoutUrl: result.checkoutUrl,
          message: 'Redirecting to payment...',
        };
      }

      // Standard plan - redirect to jobs list
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
