/**
 * Edit Company Page - Update existing company via edge function
 */

import type { Database } from '@heyclaude/database-types';
import { hashUserId, logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserCompanyById,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
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

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser({ context: 'EditCompanyPage' });

  if (!user) {
    logger.warn('EditCompanyPage: unauthenticated access attempt', undefined, {
      requestId: generateRequestId(),
      operation: 'EditCompanyPage',
      route: `/account/companies/${id}/edit`,
      companyId: id,
    });
    redirect('/login');
  }

  const hashedUserId = hashUserId(user.id);

  let company: Database['public']['CompositeTypes']['user_companies_company'] | null = null;
  let hasError = false;
  try {
    company = await getUserCompanyById(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company for edit page');
    logger.error('EditCompanyPage: getUserCompanyById threw', normalized, {
      requestId: generateRequestId(),
      operation: 'EditCompanyPage',
      route: `/account/companies/${id}/edit`,
      companyId: id,
      hashedUserId,
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
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT_COMPANIES}>Back to companies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    logger.warn('Company not found or access denied', undefined, {
      requestId: generateRequestId(),
      operation: 'EditCompanyPage',
      route: `/account/companies/${id}/edit`,
      companyId: id,
      hashedUserId,
    });
    notFound();
  }

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
