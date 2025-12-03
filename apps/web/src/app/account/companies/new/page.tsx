/**
 * Create Company Page - Standalone company creation flow
 */

import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { spaceY, muted, marginBottom, weight , size } from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import  { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CompanyForm } from '@/src/components/core/forms/company-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generate the Next.js page metadata for the "Create Company" route.
 *
 * @returns The Metadata object for the '/account/companies/new' page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/companies/new');
}

/**
 * Render the "Create Company" page for an authenticated user.
 *
 * Verifies authentication on the server; if the request is unauthenticated the function redirects to `/login`, otherwise it returns the page UI containing the company creation form.
 *
 * @returns The React element tree for the new-company page.
 *
 * @see generateRequestId
 * @see getAuthenticatedUser
 * @see CompanyForm
 * @see redirect
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
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Create Company</h1>
        <p className={muted.default}>
          Add a new company profile to post jobs and showcase your organization
        </p>
      </div>

      <CompanyForm mode="create" />
    </div>
  );
}