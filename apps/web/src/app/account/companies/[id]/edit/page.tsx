/**
 * Edit Company Page - Update existing company via edge function
 */

import  { type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserCompanyById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { spaceY, muted, marginBottom, weight , size } from '@heyclaude/web-runtime/design-system';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CompanyForm } from '@/src/components/core/forms/company-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/companies/:id/edit');
}

interface EditCompanyPageProperties {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: EditCompanyPageProperties) {
  const { id } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'EditCompanyPage';
  const route = `/account/companies/${id}/edit`;
  const module = 'apps/web/src/app/account/companies/[id]/edit/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'EditCompanyPage' });

  if (!user) {
    reqLogger.warn('EditCompanyPage: unauthenticated access attempt', {
      section: 'authentication',
      companyId: id,
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
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
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Company unavailable</CardTitle>
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
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Edit Company</h1>
        <p className={muted.default}>Update your company profile information</p>
      </div>

      <CompanyForm mode="edit" initialData={company} />
    </div>
  );
}
