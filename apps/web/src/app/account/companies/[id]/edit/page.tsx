/**
 * Edit Company Page - Update existing company via edge function
 */

import type { Database } from '@heyclaude/database-types';
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
  getUserCompanyById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CompanyForm } from '@/src/components/core/forms/company-form';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

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
  const startTime = Date.now();
  const { id } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    `/account/companies/${id}/edit`,
    'EditCompanyPage',
    {
      companyId: id,
    }
  );

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'EditCompanyPage' });

  if (!user) {
    logger.warn(
      'EditCompanyPage: unauthenticated access attempt',
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

  const hashedUserId = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash: hashedUserId };
  logger.info(
    'EditCompanyPage: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Company Data Fetch
  const companySectionStart = Date.now();
  let company: Database['public']['CompositeTypes']['user_companies_company'] | null = null;
  let hasError = false;
  try {
    company = await getUserCompanyById(user.id, id);
    logger.info(
      'EditCompanyPage: company data loaded',
      withDuration(
        {
          ...logContext,
          section: 'company-data-fetch',
          hasCompany: !!company,
        },
        companySectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company for edit page');
    logger.error(
      'EditCompanyPage: getUserCompanyById threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'company-data-fetch',
          sectionDuration_ms: Date.now() - companySectionStart,
        },
        startTime
      )
    );
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
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT_COMPANIES}>Back to companies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    logger.warn(
      'Company not found or access denied',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'company-data-fetch',
          sectionDuration_ms: Date.now() - companySectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  // Final summary log
  logger.info(
    'EditCompanyPage: page render completed',
    withDuration(
      {
        ...logContext,
        section: 'page-render',
      },
      startTime
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Edit Company</h1>
        <p className="text-muted-foreground">Update your company profile information</p>
      </div>

      <CompanyForm mode="edit" initialData={company} />
    </div>
  );
}
