/**
 * Create Company Page - Standalone company creation flow
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { lazy, Suspense } from 'react';

import Loading from './loading';

// OPTIMIZATION: Dynamic import for large form component (580 lines) - only loads when needed
const CompanyForm = lazy(() =>
  import('@/src/components/core/forms/company-form').then((mod) => ({
    default: mod.CompanyForm,
  }))
);

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
  'use cache';
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
  return (
    <Suspense fallback={<Loading />}>
      <NewCompanyPageContent />
    </Suspense>
  );
}

/**
 * Server component that enforces authentication and renders the "Create Company" page content.
 *
 * If no authenticated user is found, logs a warning and redirects the request to `/login`.
 *
 * @returns The JSX for the page section containing the header, description, and the `CompanyForm` in create mode.
 *
 * @see CompanyForm
 * @see getAuthenticatedUser
 * @see redirect
 */
async function NewCompanyPageContent() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/companies/new/page',
    operation: 'NewCompanyPage',
    route: '/account/companies/new',
  });

  const { user } = await getAuthenticatedUser({ context: 'NewCompanyPage' });

  if (!user) {
    reqLogger.warn({ section: 'data-fetch' }, 'NewCompanyPage: unauthenticated access attempt');
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Create Company</h1>
        <p className="text-muted-foreground text-base">
          Add a new company profile to post jobs and showcase your organization
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <CompanyForm mode="create" />
      </Suspense>
    </div>
  );
}
