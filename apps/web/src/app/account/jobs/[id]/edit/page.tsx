/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import type { Database } from '@heyclaude/database-types';
import type { CreateJobInput } from '@heyclaude/web-runtime';
import { updateJob } from '@heyclaude/web-runtime/actions';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPaymentPlanCatalog,
  getUserJobById,
} from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { JobForm } from '@/src/components/core/forms/job-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type EditJobInput = Partial<CreateJobInput>;

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

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    `/account/jobs/${id}/edit`,
    'EditJobPage',
    {
      jobId: id,
    }
  );

  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    logger.warn('EditJobPage: unauthenticated access attempt', undefined, baseLogContext);
    redirect('/login');
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };

  let job: Database['public']['Tables']['jobs']['Row'] | null = null;
  try {
    job = await getUserJobById(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    logger.error('EditJobPage: getUserJobById threw', normalized, logContext);
    throw normalized;
  }
  if (!job) {
    logger.warn('EditJobPage: job not found or not owned by user', undefined, logContext);
    notFound();
  }

  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load payment plan catalog');
    logger.error('EditJobPage: getPaymentPlanCatalog threw', normalized, logContext);
  }

  const handleSubmit = async (data: EditJobInput) => {
    'use server';

    // Generate requestId for server action (separate from page render)
    const actionRequestId = generateRequestId();
    const actionLogContext = createWebAppContextWithId(
      actionRequestId,
      `/account/jobs/${id}/edit`,
      'EditJobPageAction',
      {
        jobId: id,
      }
    );

    let result: Awaited<ReturnType<typeof updateJob>>;
    try {
      result = await updateJob({
        job_id: id,
        updates: data,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'updateJob server action failed');
      logger.error('EditJobPage: updateJob threw', normalized, actionLogContext);
      throw normalized;
    }

    if (result?.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      logger.error('EditJobPage: updateJob returned serverError', normalized, actionLogContext);
      throw normalized;
    }

    if (!result?.data) {
      const normalized = normalizeError('updateJob returned no data', 'updateJob returned no data');
      logger.error('EditJobPage: updateJob returned no data', normalized, actionLogContext);
      throw normalized;
    }

    if (result.data.success) {
      redirect('/account/jobs');
    }

    return { success: false };
  };

  // Type guards to safely check enum values
  function isValidJobType(value: string): value is Database['public']['Enums']['job_type'] {
    return ['full-time', 'part-time', 'contract', 'freelance', 'internship'].includes(value);
  }

  function isValidJobCategory(value: string): value is Database['public']['Enums']['job_category'] {
    return [
      'engineering',
      'design',
      'product',
      'marketing',
      'sales',
      'support',
      'research',
      'data',
      'operations',
      'leadership',
      'consulting',
      'education',
      'other',
    ].includes(value);
  }

  // Log warnings for invalid enum values to help track data integrity issues
  if (job.type && !isValidJobType(job.type)) {
    logger.warn('EditJobPage: encountered invalid job type', undefined, {
      ...logContext,
      type: job.type,
    });
  }
  if (job.category && !isValidJobCategory(job.category)) {
    logger.warn('EditJobPage: encountered invalid job category', undefined, {
      ...logContext,
      category: job.category,
    });
  }

  const hasInvalidData =
    (job.type && !isValidJobType(job.type)) || (job.category && !isValidJobCategory(job.category));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`mb-2 ${UI_CLASSES.HEADING_H2}`}>Edit Job Listing</h1>
        <p className="text-muted-foreground">Update your job posting details</p>
      </div>
      {hasInvalidData && (
        <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Some fields contain invalid data and couldn't be loaded. Please review and update.
          </p>
        </div>
      )}
      <JobForm
        initialData={{
          title: job.title,
          company: job.company,
          company_id: job.company_id,
          location: job.location,
          description: job.description,
          salary: job.salary,
          remote: job.remote ?? undefined,
          ...(job.type && isValidJobType(job.type) && { type: job.type }),
          workplace: job.workplace,
          experience: job.experience,
          ...(job.category && isValidJobCategory(job.category) && { category: job.category }),
          tags: job.tags || [],
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          link: job.link,
          contact_email: job.contact_email,
          company_logo: job.company_logo,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Job Listing"
        planCatalog={planCatalog}
      />
    </div>
  );
}
