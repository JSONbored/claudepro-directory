/**
 * Edit Company Page - Update existing company via edge function
 */

import { type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserCompanyById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CompanyForm } from '@/src/components/core/forms/company-form';

/**
 * Provide metadata for the edit-company route and ensure a server-side connection before performing non-deterministic operations.
 *
 * Awaits a server connection to satisfy Cache Components requirements for non-deterministic operations (e.g., date/time) and then returns metadata for the '/account/companies/:id/edit' page.
 *
 * @returns Page metadata for '/account/companies/:id/edit'
 *
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/companies/:id/edit');
}

interface EditCompanyPageProperties {
  params: Promise<{ id: string }>;
}

/**
 * Renders the Edit Company page for the company identified by the route `id`.
 *
 * Fetches the authenticated user, loads the company for that user, and renders a pre-populated
 * company edit form when access is allowed. If the user is unauthenticated this page
 * redirects to the login route. If the company cannot be loaded this page returns an
 * error card; if the company does not exist or access is denied this page triggers a 404.
 *
 * @param props.params - Route parameters containing the `id` of the company to edit.
 * @returns The page element that displays the edit form pre-populated with the company data,
 *          or an error card / redirect / 404 response when appropriate.
 *
 * @see CompanyForm
 * @see getUserCompanyById
 * @see getAuthenticatedUser
 * @see ROUTES.ACCOUNT_COMPANIES
 */
export default async function EditCompanyPage({ params }: EditCompanyPageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'EditCompanyPage';
  const modulePath = 'apps/web/src/app/account/companies/[id]/edit/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    module: modulePath,
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading company editor...</div>}>
      <EditCompanyPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the edit-company UI for the specified company id, handling authentication, data loading errors, and access control.
 *
 * @param params - Route parameters as a promise resolving to an object with an `id` property for the company to edit.
 * @param reqLogger - Request-scoped logger used for structured, redacted logging within the request lifecycle.
 * @returns A React element: the populated CompanyForm when the company is loaded, an error card when data loading fails; this function may redirect unauthenticated users to `/login` or call `notFound()` when the company is not found or access is denied.
 *
 * @see CompanyForm
 * @see getUserCompanyById
 * @see getAuthenticatedUser
 * @see ROUTES.ACCOUNT_COMPANIES
 */
async function EditCompanyPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ id: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { id } = await params;
  const route = `/account/companies/${id}/edit`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'EditCompanyPage' });

  if (!user) {
    routeLogger.warn('EditCompanyPage: unauthenticated access attempt', {
      section: 'authentication',
      companyId: id,
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = routeLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('EditCompanyPage: authentication successful', {
    section: 'authentication',
    companyId: id,
  });

  // Section: Company Data Fetch
  let company: Database['public']['CompositeTypes']['user_companies_company'] | null = null;
  let hasError = false;
  try {
    company = await getUserCompanyById(user.id, id);
    userLogger.info('EditCompanyPage: company data loaded', {
      section: 'company-data-fetch',
      hasCompany: !!company,
      companyId: id,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company for edit page');
    // Wrapper API: error(message, error, context) - wrapper internally calls Pino with (logData, message)
    userLogger.error('EditCompanyPage: getUserCompanyById threw', normalized, {
      section: 'company-data-fetch',
      companyId: id,
    });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Company unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load this company. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT_COMPANIES}>Back to companies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    userLogger.warn('Company not found or access denied', {
      section: 'company-data-fetch',
      companyId: id,
    });
    notFound();
  }

  // Final summary log
  userLogger.info('EditCompanyPage: page execution completed', {
    section: 'page-execution',
    companyId: id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Edit Company</h1>
        <p className="text-muted-foreground">Update your company profile information</p>
      </div>

      <CompanyForm mode="edit" initialData={company} />
    </div>
  );
}