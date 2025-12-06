/**
 * Create Company Page - Standalone company creation flow
 */

import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CompanyForm } from '@/src/components/core/forms/company-form';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// MIGRATED: Removed export const runtime = 'nodejs' (default, not needed with Cache Components)
// TODO: Will add Suspense boundaries or "use cache" after analyzing build errors

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

/**
 * Provide page metadata for the '/account/companies/new' route.
 *
 * @returns The Metadata object for the Create Company page.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/companies/new');
}

/**
 * Render the Create Company page and enforce server-side authentication, redirecting unauthenticated requests to /login.
 *
 * @returns A React element that renders the Create Company page, including the header and a `CompanyForm` in create mode.
 *
 * @see getAuthenticatedUser
 * @see CompanyForm
 * @see generateRequestId
 * @see logger
 */
export default async function NewCompanyPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'NewCompanyPage',
    route: '/account/companies/new',
    module: 'apps/web/src/app/account/companies/new/page',
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading company form...</div>}>
      <NewCompanyPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

async function NewCompanyPageContent({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
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
