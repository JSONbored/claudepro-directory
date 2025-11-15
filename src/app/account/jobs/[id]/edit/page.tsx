/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';
import { type UpdateJobInput, updateJob } from '@/src/lib/actions/jobs.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserJobById } from '@/src/lib/data/user-data';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/jobs/:id/edit');

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const resolvedParams = await params;
  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    logger.warn('EditJobPage: unauthenticated access attempt', { jobId: resolvedParams.id });
    redirect('/login');
  }

  let job: Awaited<ReturnType<typeof getUserJobById>> | null = null;
  try {
    job = await getUserJobById(user.id, resolvedParams.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    logger.error('EditJobPage: getUserJobById threw', normalized, {
      jobId: resolvedParams.id,
      userId: user.id,
    });
    throw normalized;
  }
  if (!job) {
    logger.warn('EditJobPage: job not found or not owned by user', {
      jobId: resolvedParams.id,
      userId: user.id,
    });
    notFound();
  }

  const handleSubmit = async (data: Omit<UpdateJobInput, 'job_id'>) => {
    'use server';

    let result;
    try {
      result = await updateJob({
        job_id: resolvedParams.id,
        ...data,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'updateJob server action failed');
      logger.error('EditJobPage: updateJob threw', normalized, {
        jobId: resolvedParams.id,
        userId: user.id,
      });
      throw normalized;
    }

    if (result?.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      logger.error('EditJobPage: updateJob returned serverError', normalized, {
        jobId: resolvedParams.id,
        userId: user.id,
      });
      throw normalized;
    }

    if (!result?.data) {
      logger.error('EditJobPage: updateJob returned no data', undefined, {
        jobId: resolvedParams.id,
        userId: user.id,
      });
      return { success: false };
    }

    if (result.data.success) {
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
