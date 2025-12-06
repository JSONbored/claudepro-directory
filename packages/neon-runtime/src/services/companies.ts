/**
 * CompaniesService - Prisma-based service for company operations
 * 
 * This service replaces the Supabase-based CompaniesService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/companies.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for get_company_admin_profile RPC
 * 
 * @property p_company_id - Company ID (UUID)
 */
export interface GetCompanyAdminProfileArgs {
  p_company_id: string;
}

/**
 * Arguments for get_company_profile RPC
 * 
 * @property p_slug - Company slug
 */
export interface GetCompanyProfileArgs {
  p_slug: string;
}

/**
 * Arguments for get_companies_list RPC
 * 
 * @property p_limit - Optional limit for results (defaults to 50)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetCompaniesListArgs {
  p_limit?: number | null;
  p_offset?: number | null;
}

/**
 * Prisma-based CompaniesService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class CompaniesService {
  /**
   * Calls the database RPC: get_company_admin_profile
   * 
   * @param args - RPC function arguments
   * @param args.p_company_id - Company ID (UUID)
   * @returns Company admin profile or null if not found
   */
  async getCompanyAdminProfile(args: GetCompanyAdminProfileArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_company_admin_profile($1)', [
          args.p_company_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[CompaniesService] getCompanyAdminProfile error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_company_profile
   * 
   * @param args - RPC function arguments
   * @param args.p_slug - Company slug
   * @returns Company profile or null if not found
   */
  async getCompanyProfile(args: GetCompanyProfileArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_company_profile($1)', [
          args.p_slug,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[CompaniesService] getCompanyProfile error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_companies_list
   * 
   * @param args - RPC function arguments
   * @param args.p_limit - Optional limit for results (defaults to 50)
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @returns Array of companies
   */
  async getCompaniesList(args: GetCompaniesListArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters, only pass if provided
        const hasArgs = args.p_limit !== undefined || args.p_offset !== undefined;
        const query = hasArgs
          ? 'SELECT * FROM get_companies_list($1, $2)'
          : 'SELECT * FROM get_companies_list()';
        const params = hasArgs
          ? [args.p_limit ?? null, args.p_offset ?? null]
          : [];
        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[CompaniesService] getCompaniesList error:', error);
      throw error;
    }
  }
}
