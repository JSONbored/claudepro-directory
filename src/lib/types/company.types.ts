/**
 * Company Types
 *
 * Centralized type definitions for company-related entities.
 * Single source of truth for all company type imports.
 *
 * @module types/company
 */

import type { Database } from '@/src/types/database.types';

/** Company entity from database */
export type Company = Database['public']['Tables']['companies']['Row'];

/** Company insert payload */
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];

/** Company update payload */
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

/** Company job statistics from materialized view */
export type CompanyJobStats = Database['public']['Views']['company_job_stats']['Row'];
