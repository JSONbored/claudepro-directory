/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import { Constants, type Database } from '@heyclaude/database-types';
import type { CreateJobInput } from '@heyclaude/web-runtime';
import { updateJob } from '@heyclaude/web-runtime/actions';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
  withDuration,
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

interface EditJobPageMetadataProperties {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditJobPageMetadataProperties): Promise<Metadata> {
  const { id } = await params;
  return generatePageMetadata('/account/jobs/:id/edit', { params: { id } });
}

interface EditJobPageProperties {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProperties) {
  const startTime = Date.now();
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

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    logger.warn(
      'EditJobPage: unauthenticated access attempt',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'authentication',
        },
        authSectionStart
      )
    );
    redirect('/login');
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };
  logger.info(
    'EditJobPage: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Job Data Fetch
  const jobSectionStart = Date.now();
  let job: Database['public']['Tables']['jobs']['Row'] | null = null;
  try {
    job = await getUserJobById(user.id, id);
    logger.info(
      'EditJobPage: job data loaded',
      withDuration(
        {
          ...logContext,
          section: 'job-data-fetch',
          hasJob: !!job,
        },
        jobSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    logger.error(
      'EditJobPage: getUserJobById threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'job-data-fetch',
          sectionDuration_ms: Date.now() - jobSectionStart,
        },
        startTime
      )
    );
    throw normalized;
  }
  if (!job) {
    logger.warn(
      'EditJobPage: job not found or not owned by user',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'job-data-fetch',
          sectionDuration_ms: Date.now() - jobSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  // Section: Plan Catalog Fetch
  const planCatalogSectionStart = Date.now();
  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
    logger.info(
      'EditJobPage: plan catalog loaded',
      withDuration(
        {
          ...logContext,
          section: 'plan-catalog-fetch',
          plansCount: planCatalog.length,
        },
        planCatalogSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load payment plan catalog');
    logger.error(
      'EditJobPage: getPaymentPlanCatalog threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'plan-catalog-fetch',
          sectionDuration_ms: Date.now() - planCatalogSectionStart,
        },
        startTime
      )
    );
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

    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      logger.error('EditJobPage: updateJob returned serverError', normalized, actionLogContext);
      throw normalized;
    }

    if (!result.data) {
      const normalized = normalizeError('updateJob returned no data', 'updateJob returned no data');
      logger.error('EditJobPage: updateJob returned no data', normalized, actionLogContext);
      throw normalized;
    }

    if (result.data.success) {
      redirect('/account/jobs');
    }

    return { success: false };
  };

  // Type guards to safely check enum values - use Constants
  function isValidJobType(value: string): value is Database['public']['Enums']['job_type'] {
    return (Constants.public.Enums.job_type as readonly string[]).includes(value);
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
  if (!isValidJobType(job.type)) {
    logger.warn(
      'EditJobPage: encountered invalid job type',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'job-data-validation',
          type: job.type,
        },
        startTime
      )
    );
  }
  if (!isValidJobCategory(job.category)) {
    logger.warn(
      'EditJobPage: encountered invalid job category',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'job-data-validation',
          category: job.category,
        },
        startTime
      )
    );
  }

  const hasInvalidData = !isValidJobType(job.type) || !isValidJobCategory(job.category);

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
          ...(isValidJobType(job.type) && { type: job.type }),
          workplace: job.workplace,
          experience: job.experience,
          ...(isValidJobCategory(job.category) && { category: job.category }),
          tags: job.tags,
          requirements: job.requirements,
          benefits: job.benefits,
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
