/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';
import { type UpdateJobInput, updateJob } from '@/src/lib/actions/jobs.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserJobById } from '@/src/lib/data/account/user-data';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { ensureStringArray } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { JobCategory, JobPlan, JobTier, Tables } from '@/src/types/database-overrides';

export const metadata: Promise<Metadata> = generatePageMetadata('/account/jobs/:id/edit');

interface EditJobPageProps {
  params: { id: string };
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    logger.warn('EditJobPage: unauthenticated access attempt', { jobId: params.id });
    redirect('/login');
  }

  let job: Tables<'jobs'> | null = null;
  try {
    job = await getUserJobById(user.id, params.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    logger.error('EditJobPage: getUserJobById threw', normalized, {
      jobId: params.id,
      userId: user.id,
    });
    throw normalized;
  }
  if (!job) {
    logger.warn('EditJobPage: job not found or not owned by user', {
      jobId: params.id,
      userId: user.id,
    });
    notFound();
  }

  const handleSubmit = async (data: Omit<UpdateJobInput, 'job_id'>) => {
    'use server';

    let result: Awaited<ReturnType<typeof updateJob>>;
    try {
      result = await updateJob({
        job_id: params.id,
        ...data,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'updateJob server action failed');
      logger.error('EditJobPage: updateJob threw', normalized, {
        jobId: params.id,
        userId: user.id,
      });
      throw normalized;
    }

    if (result?.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      logger.error('EditJobPage: updateJob returned serverError', normalized, {
        jobId: params.id,
        userId: user.id,
      });
      throw normalized;
    }

    if (!result?.data) {
      const error = new Error('updateJob returned no data');
      logger.error('EditJobPage: updateJob returned no data', error, {
        jobId: params.id,
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
          category: (job.category as JobCategory) ?? undefined,
          tags: ensureStringArray(job.tags),
          requirements: ensureStringArray(job.requirements),
          benefits: ensureStringArray(job.benefits),
          link: job.link,
          contact_email: job.contact_email,
          company_logo: job.company_logo,
          plan: job.plan as JobPlan,
          tier: job.tier as JobTier,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
      />
    </div>
  );
}
