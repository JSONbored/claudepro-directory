/**
 * Create Company Page - Standalone company creation flow
 */

import { redirect } from 'next/navigation';
import { CompanyForm } from '@/src/components/core/forms/company-form';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';


export const metadata = generatePageMetadata('/account/companies/new');

export default async function NewCompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
