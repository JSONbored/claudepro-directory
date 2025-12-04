/**
 * Create Company Page - Standalone company creation flow
 */

import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CompanyForm } from '@/src/components/core/forms/company-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/companies/new');
}

/**
 * Renders the "Create Company" page, ensuring the request is authenticated and redirecting to the login page when not.
 *
 * Performs a server-side authentication check using getAuthenticatedUser; unauthenticated requests are redirected to "/login".
 * Generates a request-scoped ID for instrumentation and returns a React element containing the page header and a CompanyForm in create mode.
 *
 * @returns A React element rendering the "Create Company" page.
 *
 * @see getAuthenticatedUser
 * @see CompanyForm
 * @see generateRequestId
 * @see logger
 */
export default async function NewCompanyPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'NewCompanyPage',
    route: '/account/companies/new',
    module: 'apps/web/src/app/account/companies/new/page',
  });

  const { user } = await getAuthenticatedUser({ context: 'NewCompanyPage' });

  if (!user) {
    reqLogger.warn('NewCompanyPage: unauthenticated access attempt');
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Create Company</h1>
        <p className="text-muted-foreground">
          Add a new company profile to post jobs and showcase your organization
        </p>
      </div>

      <CompanyForm mode="create" />
    </div>
  );
}