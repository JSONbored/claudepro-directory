/**
 * Edit Company Page - Update existing company via edge function
 */

import { notFound, redirect } from 'next/navigation';
import { CompanyForm } from '@/src/components/core/forms/company-form';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserCompanyById } from '@/src/lib/data/account/user-data';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/account/companies/:id/edit');

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser({ context: 'EditCompanyPage' });

  if (!user) {
    logger.warn('EditCompanyPage: unauthenticated access attempt', { companyId: id });
    redirect('/login');
  }

  let company: Awaited<ReturnType<typeof getUserCompanyById>> | null = null;
  try {
    company = await getUserCompanyById(user.id, id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company for edit page');
    logger.error('EditCompanyPage: getUserCompanyById threw', normalized, {
      companyId: id,
      userId: user.id,
    });
    throw normalized;
  }

  if (!company) {
    logger.warn('Company not found or access denied', { companyId: id, userId: user.id });
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
