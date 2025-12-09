/**
 * Create Company Page - Standalone company creation flow
 */

import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CompanyForm } from '@/src/components/core/forms/company-form';

import Loading from './loading';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */

/**
 * Generate metadata for the /account/companies/new route.
 *
 * Awaits a server connection to ensure non-deterministic operations (e.g., Date.now()) are evaluated at request time for cache components, then returns the page metadata.
 *
 * @returns The Metadata object for the Create Company page.
 * @see generatePageMetadata
 * @see connection
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
 * @see logger
 */
export default async function NewCompanyPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'NewCompanyPage',
    route: '/account/companies/new',
    module: 'apps/web/src/app/account/companies/new/page',
  });

  return (
    <Suspense fallback={<Loading />}>
      <NewCompanyPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Server component that enforces authentication and renders the "Create Company" page content.
 *
 * If no authenticated user is found, logs a warning to `reqLogger` and redirects the request to `/login`.
 *
 * @param reqLogger - Request-scoped logger created for the current request; used for warning on unauthenticated access.
 * @param reqLogger.reqLogger
 * @returns The JSX for the page section containing the header, description, and the `CompanyForm` in create mode.
 *
 * @see CompanyForm
 * @see getAuthenticatedUser
 * @see redirect
 */
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
