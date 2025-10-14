/**
 * Company Repository
 *
 * Provides data access layer for company profiles with caching and performance monitoring.
 * Handles company CRUD operations, ownership verification, and slug lookups.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for owner-based operations
 *
 * @module repositories/company
 */

import { UI_CONFIG } from '@/src/lib/constants';
import {
  CachedRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Company entity type from database */
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * CompanyRepository
 * Handles all company profile data access
 */
export class CompanyRepository extends CachedRepository<Company, string> {
  constructor() {
    super('CompanyRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find company by ID
   */
  async findById(id: string): Promise<RepositoryResult<Company | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find company: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        // Also cache by slug
        if (data.slug) {
          this.setCache(this.getCacheKey('slug', data.slug), data);
        }
      }

      return data;
    });
  }

  /**
   * Find all companies with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Company[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('companies').select('*');

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      // Apply sorting
      if (options?.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.sortOrder === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find companies: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one company matching criteria
   */
  async findOne(criteria: Partial<Company>): Promise<RepositoryResult<Company | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('companies').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Company, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find company: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new company
   */
  async create(
    data: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'featured'>
  ): Promise<RepositoryResult<Company>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as CompanyInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A company with this name or slug already exists');
        }
        throw new Error(`Failed to create company: ${error.message}`);
      }

      // Cache the new company
      if (company) {
        this.setCache(this.getCacheKey('id', company.id), company);
        if (company.slug) {
          this.setCache(this.getCacheKey('slug', company.slug), company);
        }
      }

      return company;
    });
  }

  /**
   * Update existing company
   */
  async update(id: string, data: Partial<Company>): Promise<RepositoryResult<Company>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: company, error } = await supabase
        .from('companies')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as CompanyUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update company: ${error.message}`);
      }

      // Clear all caches for this company
      this.clearCache(this.getCacheKey('id', id));
      if (company?.slug) {
        this.clearCache(this.getCacheKey('slug', company.slug));
      }
      if (company?.owner_id) {
        this.clearCache(this.getCacheKey('owner', company.owner_id));
      }

      // Cache the updated company
      if (company) {
        this.setCache(this.getCacheKey('id', company.id), company);
        if (company.slug) {
          this.setCache(this.getCacheKey('slug', company.slug), company);
        }
      }

      return company;
    });
  }

  /**
   * Delete company
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get company first for cache invalidation
      const companyResult = await this.findById(id);
      const company = companyResult.success ? companyResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('companies').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete company: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (company?.slug) {
        this.clearCache(this.getCacheKey('slug', company.slug));
      }
      if (company?.owner_id) {
        this.clearCache(this.getCacheKey('owner', company.owner_id));
      }

      return true;
    });
  }

  /**
   * Check if company exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count companies matching criteria
   */
  async count(criteria?: Partial<Company>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('companies').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Company, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count companies: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM COMPANY METHODS
  // =====================================================

  /**
   * Find company by slug
   */
  async findBySlug(slug: string): Promise<RepositoryResult<Company | null>> {
    return this.executeOperation('findBySlug', async () => {
      const cacheKey = this.getCacheKey('slug', slug);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find company by slug: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        // Also cache by ID
        this.setCache(this.getCacheKey('id', data.id), data);
      }

      return data;
    });
  }

  /**
   * Find companies by owner ID
   */
  async findByOwner(ownerId: string, options?: QueryOptions): Promise<RepositoryResult<Company[]>> {
    return this.executeOperation('findByOwner', async () => {
      const supabase = await createClient();
      let query = supabase.from('companies').select('*').eq('owner_id', ownerId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find owner companies: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Update company with ownership verification
   */
  async updateByOwner(
    id: string,
    ownerId: string,
    data: Partial<Company>
  ): Promise<RepositoryResult<Company>> {
    return this.executeOperation('updateByOwner', async () => {
      const supabase = await createClient();

      // Filter out undefined values to avoid exactOptionalPropertyTypes issues
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as CompanyUpdate;

      const { data: company, error } = await supabase
        .from('companies')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update company: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (company?.slug) {
        this.clearCache(this.getCacheKey('slug', company.slug));
      }
      this.clearCache(this.getCacheKey('owner', ownerId));

      // Cache the updated company
      if (company) {
        this.setCache(this.getCacheKey('id', company.id), company);
        if (company.slug) {
          this.setCache(this.getCacheKey('slug', company.slug), company);
        }
      }

      return company;
    });
  }

  /**
   * Get featured companies
   */
  async getFeatured(limit = 10): Promise<RepositoryResult<Company[]>> {
    return this.executeOperation('getFeatured', async () => {
      const cacheKey = this.getCacheKey('featured', String(limit));
      const cached = this.getFromCache(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get featured companies: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data as unknown as Company);
      }

      return data || [];
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('isSlugAvailable', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to check slug availability: ${error.message}`);
      }

      return (count || 0) === 0;
    });
  }
}

/**
 * Singleton instance
 */
export const companyRepository = new CompanyRepository();
