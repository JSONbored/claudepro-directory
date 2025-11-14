/**
 * Edit Company Page - Update existing company via edge function
 */

import { notFound, redirect } from 'next/navigation';
import { CompanyForm } from '@/src/components/core/forms/company-form';
import { getUserCompanyById } from '@/src/lib/data/user-data';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

export const metadata = generatePageMetadata('/account/companies/:id/edit');

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const company = await getUserCompanyById(user.id, id);

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
