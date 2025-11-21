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
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

interface EditJobPageMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditJobPageMetadataProps): Promise<Metadata> {
  const { id } = await params;
  return generatePageMetadata('/account/jobs/:id/edit', { params: { id } });
}

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    logger.warn('EditJobPage: unauthenticated access attempt', { jobId: id });
    redirect('/login');
  }

  let job: Database['public']['Tables']['jobs']['Row'] | null = null;
  try {
    job = await getUserJobById(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    logger.error('EditJobPage: getUserJobById threw', normalized, {
      jobId: id,
      userId: user.id,
    });
    throw normalized;
  }
  if (!job) {
    logger.warn('EditJobPage: job not found or not owned by user', {
      jobId: id,
      userId: user.id,
    });
    notFound();
  }

  const handleSubmit = async (data: Omit<UpdateJobInput, 'job_id'>) => {
    'use server';

    let result: Awaited<ReturnType<typeof updateJob>>;
    try {
      result = await updateJob({
        job_id: id,
        ...data,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'updateJob server action failed');
      logger.error('EditJobPage: updateJob threw', normalized, {
        jobId: id,
        userId: user.id,
      });
      throw normalized;
    }

    if (result?.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      logger.error('EditJobPage: updateJob returned serverError', normalized, {
        jobId: id,
        userId: user.id,
      });
      throw normalized;
    }

    if (!result?.data) {
      const error = new Error('updateJob returned no data');
      logger.error('EditJobPage: updateJob returned no data', error, {
        jobId: id,
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
          ...(job.type && { type: job.type as Database['public']['Enums']['job_type'] }),
          workplace: job.workplace,
          experience: job.experience,
          ...(job.category && {
            category: job.category as Database['public']['Enums']['job_category'],
          }),
          tags: job.tags || [],
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          link: job.link,
          contact_email: job.contact_email,
          company_logo: job.company_logo,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
      />
    </div>
  );
}
