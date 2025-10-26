/**
 * Content Similarity Repository
 *
 * Provides data access layer for content similarities with caching and performance monitoring.
 * Handles pre-computed similarity scores between content items for recommendations.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for bidirectional similarity queries
 *
 * @module repositories/content-similarity
 */

import { isValidCategory } from '@/src/lib/config/category-config';
import { UI_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import {
  BaseRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Content Similarity entity type from database */
export type ContentSimilarity = Database['public']['Tables']['content_similarities']['Row'];
export type ContentSimilarityInsert =
  Database['public']['Tables']['content_similarities']['Insert'];
export type ContentSimilarityUpdate =
  Database['public']['Tables']['content_similarities']['Update'];

/**
 * Similarity result with metadata
 *
 * @property content_type - Properly typed as CategoryId (not string)
 * This eliminates the need for type casts in consumers
 */
export interface SimilarityResult {
  content_slug: string;
  content_type: CategoryId;
  similarity_score: number;
  similarity_factors?: Record<string, unknown>;
  calculated_at: string;
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * ContentSimilarityRepository
 * Handles all content similarity data access for recommendations
 */
export class ContentSimilarityRepository extends BaseRepository<ContentSimilarity, string> {
  constructor() {
    super('ContentSimilarityRepository');
  }

  /**
   * Find similarity by ID
   */
  async findById(id: string): Promise<RepositoryResult<ContentSimilarity | null>> {
    return this.executeOperation('findById', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('content_similarities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find similarity: ${error.message}`);
      }

      if (data) {
      }

      return data;
    });
  }

  /**
   * Find all similarities with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<ContentSimilarity[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('content_similarities').select('*');

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
        query = query.order('similarity_score', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find similarities: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one similarity matching criteria
   */
  async findOne(
    criteria: Partial<ContentSimilarity>
  ): Promise<RepositoryResult<ContentSimilarity | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('content_similarities').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof ContentSimilarity, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find similarity: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new similarity
   */
  async create(
    data: Omit<ContentSimilarity, 'id' | 'calculated_at'>
  ): Promise<RepositoryResult<ContentSimilarity>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: similarity, error } = await supabase
        .from('content_similarities')
        .insert({
          ...data,
          calculated_at: new Date().toISOString(),
        } as ContentSimilarityInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Similarity already exists for this content pair');
        }
        throw new Error(`Failed to create similarity: ${error.message}`);
      }

      return similarity;
    });
  }

  /**
   * Update existing similarity
   */
  async update(
    id: string,
    data: Partial<ContentSimilarity>
  ): Promise<RepositoryResult<ContentSimilarity>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: similarity, error } = await supabase
        .from('content_similarities')
        .update({
          ...data,
          calculated_at: new Date().toISOString(),
        } as ContentSimilarityUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update similarity: ${error.message}`);
      }

      return similarity;
    });
  }

  /**
   * Delete similarity
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const supabase = await createClient();
      const { error } = await supabase.from('content_similarities').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete similarity: ${error.message}`);
      }

      return true;
    });
  }

  /**
   * Check if similarity exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count similarities matching criteria
   */
  async count(criteria?: Partial<ContentSimilarity>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('content_similarities').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof ContentSimilarity, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count similarities: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM SIMILARITY METHODS
  // =====================================================

  /**
   * Find similar content for a given content item
   */
  async findSimilarContent(
    contentType: string,
    contentSlug: string,
    options?: QueryOptions & { minScore?: number }
  ): Promise<RepositoryResult<SimilarityResult[]>> {
    return this.executeOperation('findSimilarContent', async (): Promise<SimilarityResult[]> => {
      if (!(options?.offset || options?.limit || options?.minScore)) {
      }

      const supabase = await createClient();
      let query = supabase
        .from('content_similarities')
        .select('*')
        .eq('content_a_type', contentType)
        .eq('content_a_slug', contentSlug);

      // Apply minimum score filter
      if (options?.minScore) {
        query = query.gte('similarity_score', options.minScore);
      }

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

      query = query.order(options?.sortBy || 'similarity_score', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find similar content: ${error.message}`);
      }

      // Transform to SimilarityResult format
      const results: SimilarityResult[] =
        data
          ?.map((sim) => {
            // Validate category type from database
            if (!isValidCategory(sim.content_b_type)) {
              logger.warn('Invalid category type in similarity data', {
                content_b_type: sim.content_b_type,
                content_a_slug: sim.content_a_slug,
                content_b_slug: sim.content_b_slug,
              });
              return null;
            }

            const result: SimilarityResult = {
              content_slug: sim.content_b_slug,
              content_type: sim.content_b_type, // TypeScript now knows this is CategoryId
              similarity_score: sim.similarity_score,
              calculated_at: sim.calculated_at,
            };
            if (
              typeof sim.similarity_factors === 'object' &&
              sim.similarity_factors !== null &&
              !Array.isArray(sim.similarity_factors)
            ) {
              result.similarity_factors = sim.similarity_factors as Record<string, unknown>;
            }
            return result;
          })
          .filter((r): r is SimilarityResult => r !== null) || [];

      if (!(options?.offset || options?.limit || options?.minScore) && results.length > 0) {
      }

      return results;
    });
  }

  /**
   * Find bidirectional similar content (content_a or content_b)
   */
  async findBidirectionalSimilarContent(
    contentType: string,
    contentSlug: string,
    options?: QueryOptions & { minScore?: number }
  ): Promise<RepositoryResult<SimilarityResult[]>> {
    return this.executeOperation('findBidirectionalSimilarContent', async () => {
      const supabase = await createClient();

      // Query where item is content_a
      const query1 = supabase
        .from('content_similarities')
        .select('*')
        .eq('content_a_type', contentType)
        .eq('content_a_slug', contentSlug);

      if (options?.minScore) {
        query1.gte('similarity_score', options.minScore);
      }

      // Query where item is content_b
      const query2 = supabase
        .from('content_similarities')
        .select('*')
        .eq('content_b_type', contentType)
        .eq('content_b_slug', contentSlug);

      if (options?.minScore) {
        query2.gte('similarity_score', options.minScore);
      }

      const [result1, result2] = await Promise.all([query1, query2]);

      if (result1.error) {
        throw new Error(`Failed to find similar content (forward): ${result1.error.message}`);
      }
      if (result2.error) {
        throw new Error(`Failed to find similar content (reverse): ${result2.error.message}`);
      }

      // Combine results
      const forwardResults: SimilarityResult[] =
        result1.data
          ?.map((sim) => {
            if (!isValidCategory(sim.content_b_type)) {
              logger.warn('Invalid category in forward similarity', {
                content_b_type: sim.content_b_type,
              });
              return null;
            }
            const result: SimilarityResult = {
              content_slug: sim.content_b_slug,
              content_type: sim.content_b_type,
              similarity_score: sim.similarity_score,
              calculated_at: sim.calculated_at,
            };
            if (
              typeof sim.similarity_factors === 'object' &&
              sim.similarity_factors !== null &&
              !Array.isArray(sim.similarity_factors)
            ) {
              result.similarity_factors = sim.similarity_factors as Record<string, unknown>;
            }
            return result;
          })
          .filter((r): r is SimilarityResult => r !== null) || [];

      const reverseResults: SimilarityResult[] =
        result2.data
          ?.map((sim) => {
            if (!isValidCategory(sim.content_a_type)) {
              logger.warn('Invalid category in reverse similarity', {
                content_a_type: sim.content_a_type,
              });
              return null;
            }
            const result: SimilarityResult = {
              content_slug: sim.content_a_slug,
              content_type: sim.content_a_type,
              similarity_score: sim.similarity_score,
              calculated_at: sim.calculated_at,
            };
            if (
              typeof sim.similarity_factors === 'object' &&
              sim.similarity_factors !== null &&
              !Array.isArray(sim.similarity_factors)
            ) {
              result.similarity_factors = sim.similarity_factors as Record<string, unknown>;
            }
            return result;
          })
          .filter((r): r is SimilarityResult => r !== null) || [];

      const allResults = [...forwardResults, ...reverseResults];

      // Sort by similarity score
      allResults.sort((a, b) => b.similarity_score - a.similarity_score);

      // Apply pagination
      const start = options?.offset || 0;
      const end = options?.limit ? start + options.limit : undefined;
      const paginatedResults = end ? allResults.slice(start, end) : allResults.slice(start);

      return paginatedResults;
    });
  }

  /**
   * Upsert similarity (create or update)
   */
  async upsert(
    contentAType: string,
    contentASlug: string,
    contentBType: string,
    contentBSlug: string,
    similarityScore: number,
    similarityFactors?: Record<string, unknown>
  ): Promise<RepositoryResult<ContentSimilarity>> {
    return this.executeOperation('upsert', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('content_similarities')
        .upsert(
          {
            content_a_type: contentAType,
            content_a_slug: contentASlug,
            content_b_type: contentBType,
            content_b_slug: contentBSlug,
            similarity_score: similarityScore,
            similarity_factors: similarityFactors || null,
            calculated_at: new Date().toISOString(),
          } as ContentSimilarityInsert,
          {
            onConflict: 'content_a_type,content_a_slug,content_b_type,content_b_slug',
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upsert similarity: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Batch upsert similarities (for bulk calculations)
   */
  async batchUpsert(
    similarities: Array<{
      content_a_type: string;
      content_a_slug: string;
      content_b_type: string;
      content_b_slug: string;
      similarity_score: number;
      similarity_factors?: Record<string, unknown>;
    }>
  ): Promise<RepositoryResult<number>> {
    return this.executeOperation('batchUpsert', async () => {
      const supabase = await createClient();

      const records = similarities.map((sim) => ({
        content_a_type: sim.content_a_type,
        content_a_slug: sim.content_a_slug,
        content_b_type: sim.content_b_type,
        content_b_slug: sim.content_b_slug,
        similarity_score: sim.similarity_score,
        similarity_factors: sim.similarity_factors || null,
        calculated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('content_similarities')
        .upsert(records as ContentSimilarityInsert[], {
          onConflict: 'content_a_type,content_a_slug,content_b_type,content_b_slug',
        })
        .select();

      if (error) {
        throw new Error(`Failed to batch upsert similarities: ${error.message}`);
      }

      const uniqueContent = new Set<string>();
      for (const sim of similarities) {
        uniqueContent.add(`${sim.content_a_type}:${sim.content_a_slug}`);
        uniqueContent.add(`${sim.content_b_type}:${sim.content_b_slug}`);
      }

      return data?.length || 0;
    });
  }

  /**
   * Delete all similarities for a content item
   */
  async deleteByContent(
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<number>> {
    return this.executeOperation('deleteByContent', async () => {
      const supabase = await createClient();

      // Delete where item is content_a
      const { error: error1, count: count1 } = await supabase
        .from('content_similarities')
        .delete({ count: 'exact' })
        .eq('content_a_type', contentType)
        .eq('content_a_slug', contentSlug);

      if (error1) {
        throw new Error(`Failed to delete similarities (forward): ${error1.message}`);
      }

      // Delete where item is content_b
      const { error: error2, count: count2 } = await supabase
        .from('content_similarities')
        .delete({ count: 'exact' })
        .eq('content_b_type', contentType)
        .eq('content_b_slug', contentSlug);

      if (error2) {
        throw new Error(`Failed to delete similarities (reverse): ${error2.message}`);
      }

      return (count1 || 0) + (count2 || 0);
    });
  }
}

/**
 * Singleton instance
 */
export const contentSimilarityRepository = new ContentSimilarityRepository();
