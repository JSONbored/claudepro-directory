import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CompanyAdminProfileResult = Database['public']['Functions']['get_company_admin_profile']['Returns'];
export type CompanyProfileResult = Database['public']['Functions']['get_company_profile']['Returns'];
export type CompaniesListResult = Database['public']['Functions']['get_companies_list']['Returns'];

export class CompaniesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getCompanyAdminProfile(companyId: string) {
    const { data, error } = await this.supabase.rpc('get_company_admin_profile', { p_company_id: companyId });
    if (error) throw error;
    return data as CompanyAdminProfileResult;
  }

  async getCompanyProfile(slug: string) {
    const { data, error } = await this.supabase.rpc('get_company_profile', { p_slug: slug });
    if (error) throw error;
    return data as CompanyProfileResult;
  }

  async getCompaniesList(limit = 50, offset = 0) {
    const { data, error } = await this.supabase.rpc('get_companies_list', { p_limit: limit, p_offset: offset });
    if (error) throw error;
    return data as CompaniesListResult;
  }
}
