/**
 * Create Company Page - Standalone company creation flow
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CompanyForm } from '@/src/components/core/forms/company-form';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/companies/new');
}

export default async function NewCompanyPage() {
  const { user } = await getAuthenticatedUser({ context: 'NewCompanyPage' });

  if (!user) {
    logger.warn('NewCompanyPage: unauthenticated access attempt');
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Create Company</h1>
        <p className="text-muted-foreground">
          Add a new company profile to post jobs and showcase your organization
        </p>
      </div>

      <CompanyForm mode="create" />
    </div>
  );
}
