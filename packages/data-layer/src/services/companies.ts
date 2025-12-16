/**
 * Companies Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Uses generated Prisma postgres-types for RPC function types and Zod schemas.
 */

import type {
  GetCompanyAdminProfileArgs,
  GetCompanyAdminProfileReturns,
  GetCompanyProfileArgs,
  GetCompanyProfileReturns,
  GetCompaniesListArgs,
  GetCompaniesListReturns,
} from '@heyclaude/database-types/postgres-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Companies Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions (returns composite types)
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class CompaniesService extends BasePrismaService {
  /**
   * Get company admin profile
   *
   * Uses RPC wrapper for complex function that returns composite type.
   *
   * @param args - Arguments with company_id
   * @returns Company admin profile
   */
  async getCompanyAdminProfile(
    args: GetCompanyAdminProfileArgs
  ): Promise<GetCompanyAdminProfileReturns> {
    return this.callRpc<GetCompanyAdminProfileReturns>(
      'get_company_admin_profile',
      args,
      {
        methodName: 'getCompanyAdminProfile',
      }
    );
  }

  /**
   * Get company profile by slug
   *
   * Uses RPC wrapper because get_company_profile returns a composite type
   * (company_profile_result), not a simple table row.
   *
   * @param args - Arguments with slug
   * @returns Company profile (composite type)
   */
  async getCompanyProfile(
    args: GetCompanyProfileArgs
  ): Promise<GetCompanyProfileReturns> {
    return this.callRpc<GetCompanyProfileReturns>(
      'get_company_profile',
      args,
      {
        methodName: 'getCompanyProfile',
      }
    );
  }

  /**
   * Get companies list
   *
   * Uses RPC wrapper for paginated list function.
   *
   * @param args - Pagination and filter arguments
   * @returns Companies list
   */
  async getCompaniesList(
    args: GetCompaniesListArgs
  ): Promise<GetCompaniesListReturns> {
    return this.callRpc<GetCompaniesListReturns>(
      'get_companies_list',
      args,
      {
        methodName: 'getCompaniesList',
      }
    );
  }
}
