/**
 * Create Company Page - Standalone company creation flow
 */

import { logger } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import type { Metadata } from 'next';
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

export default async function NewCompanyPage() {
  const { user } = await getAuthenticatedUser({ context: 'NewCompanyPage' });

  if (!user) {
    logger.warn('NewCompanyPage: unauthenticated access attempt', undefined, {
      requestId: generateRequestId(),
      operation: 'NewCompanyPage',
      route: '/account/companies/new',
      timestamp: new Date().toISOString(),
    });
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
