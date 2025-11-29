/**
 * Edit Job Page - Database-First Architecture
 * Uses updateJob server action (calls update_job RPC)
 */

import { Constants, type Database } from '@heyclaude/database-types';
import  { type CreateJobInput } from '@heyclaude/web-runtime';
import { updateJob } from '@heyclaude/web-runtime/actions';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getPaymentPlanCatalog,
  getUserJobById,
} from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
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
  const { id } = await params;
  
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'EditJobPage',
    route: `/account/jobs/${id}/edit`,
    module: 'apps/web/src/app/account/jobs/[id]/edit',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'EditJobPage' });

  if (!user) {
    reqLogger.warn('EditJobPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });
  
  userLogger.info('EditJobPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Job Data Fetch
  let job: Database['public']['Tables']['jobs']['Row'] | null = null;
  try {
    job = await getUserJobById(user.id, id);
    userLogger.info('EditJobPage: job data loaded', {
      section: 'job-data-fetch',
      hasJob: !!job,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user job for edit page');
    userLogger.error('EditJobPage: getUserJobById threw', normalized, {
      section: 'job-data-fetch',
    });
    throw normalized;
  }
  if (!job) {
    userLogger.warn('EditJobPage: job not found or not owned by user', {
      section: 'job-data-fetch',
    });
    notFound();
  }

  // Section: Plan Catalog Fetch
  let planCatalog: Awaited<ReturnType<typeof getPaymentPlanCatalog>> = [];
  try {
    planCatalog = await getPaymentPlanCatalog();
    userLogger.info('EditJobPage: plan catalog loaded', {
      section: 'plan-catalog-fetch',
      plansCount: planCatalog.length,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load payment plan catalog');
    userLogger.error('EditJobPage: getPaymentPlanCatalog threw', normalized, {
      section: 'plan-catalog-fetch',
    });
  }

  const handleSubmit = async (data: EditJobInput) => {
    'use server';

    // Generate requestId for server action (separate from page render)
    const actionRequestId = generateRequestId();
    
    // Create request-scoped child logger for server action
    const actionLogger = logger.child({
      requestId: actionRequestId,
      operation: 'EditJobPageAction',
      route: `/account/jobs/${id}/edit`,
      module: 'apps/web/src/app/account/jobs/[id]/edit',
    });

    let result: Awaited<ReturnType<typeof updateJob>>;
    try {
      result = await updateJob({
        job_id: id,
        updates: data,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'updateJob server action failed');
      actionLogger.error('EditJobPage: updateJob threw', normalized);
      throw normalized;
    }

    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'updateJob server error response');
      actionLogger.error('EditJobPage: updateJob returned serverError', normalized);
      throw normalized;
    }

    if (!result.data) {
      const normalized = normalizeError(new Error('updateJob returned no data'), 'updateJob returned no data');
      actionLogger.error('EditJobPage: updateJob returned no data', normalized);
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
    userLogger.warn('EditJobPage: encountered invalid job type', {
      section: 'job-data-validation',
      type: job.type,
    });
  }
  if (!isValidJobCategory(job.category)) {
    userLogger.warn('EditJobPage: encountered invalid job category', {
      section: 'job-data-validation',
      category: job.category,
    });
  }

  const hasInvalidData = !(isValidJobType(job.type) && isValidJobCategory(job.category));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`mb-2 ${UI_CLASSES.HEADING_H2}`}>Edit Job Listing</h1>
        <p className="text-muted-foreground">Update your job posting details</p>
      </div>
      {hasInvalidData ? <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Some fields contain invalid data and couldn't be loaded. Please review and update.
          </p>
        </div> : null}
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
