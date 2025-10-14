/**
 * Collection Repository
 *
 * Provides data access layer for user collections with caching and performance monitoring.
 * Handles both collections and collection items with relational queries.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for collection items (relational data)
 *
 * @module repositories/collection
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

/** Collection entity type from database */
export type Collection = Database['public']['Tables']['user_collections']['Row'];
export type CollectionInsert = Database['public']['Tables']['user_collections']['Insert'];
export type CollectionUpdate = Database['public']['Tables']['user_collections']['Update'];

/** Collection Item entity type from database */
export type CollectionItem = Database['public']['Tables']['collection_items']['Row'];
export type CollectionItemInsert = Database['public']['Tables']['collection_items']['Insert'];
export type CollectionItemUpdate = Database['public']['Tables']['collection_items']['Update'];

/** Collection with items */
export type CollectionWithItems = Collection & {
  items?: CollectionItem[];
};

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * CollectionRepository
 * Handles all collection and collection item data access
 */
export class CollectionRepository extends CachedRepository<Collection, string> {
  constructor() {
    super('CollectionRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find collection by ID
   */
  async findById(id: string): Promise<RepositoryResult<Collection | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find collection: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all collections with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Collection[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_collections').select('*');

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
        throw new Error(`Failed to find collections: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one collection matching criteria
   */
  async findOne(criteria: Partial<Collection>): Promise<RepositoryResult<Collection | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_collections').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Collection, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find collection: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new collection
   */
  async create(data: Omit<Collection, 'id'>): Promise<RepositoryResult<Collection>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: collection, error } = await supabase
        .from('user_collections')
        .insert(data as CollectionInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A collection with this slug already exists');
        }
        throw new Error(`Failed to create collection: ${error.message}`);
      }

      // Invalidate user's collections cache
      this.clearCache(this.getCacheKey('user', data.user_id));

      return collection;
    });
  }

  /**
   * Update existing collection
   */
  async update(id: string, data: Partial<Collection>): Promise<RepositoryResult<Collection>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: collection, error } = await supabase
        .from('user_collections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as CollectionUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A collection with this slug already exists');
        }
        throw new Error(`Failed to update collection: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (collection) {
        this.clearCache(this.getCacheKey('user', collection.user_id));
        this.clearCache(this.getCacheKey('slug', `${collection.user_id}:${collection.slug}`));
      }

      return collection;
    });
  }

  /**
   * Delete collection
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get collection first for cache invalidation
      const collectionResult = await this.findById(id);
      const collection = collectionResult.success ? collectionResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('user_collections').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete collection: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (collection) {
        this.clearCache(this.getCacheKey('user', collection.user_id));
        this.clearCache(this.getCacheKey('slug', `${collection.user_id}:${collection.slug}`));
      }

      return true;
    });
  }

  /**
   * Check if collection exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count collections matching criteria
   */
  async count(criteria?: Partial<Collection>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_collections').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Collection, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count collections: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM COLLECTION METHODS
  // =====================================================

  /**
   * Find collections by user ID
   */
  async findByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Collection[]>> {
    return this.executeOperation('findByUser', async () => {
      if (!(options?.offset || options?.limit)) {
        const cacheKey = this.getCacheKey('user', userId);
        const cached = this.getFromCache(cacheKey);
        if (cached) return Array.isArray(cached) ? cached : [cached];
      }

      const supabase = await createClient();
      let query = supabase.from('user_collections').select('*').eq('user_id', userId);

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
        throw new Error(`Failed to find user collections: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
        const cacheKey = this.getCacheKey('user', userId);
        this.setCache(cacheKey, data as unknown as Collection);
      }

      return data || [];
    });
  }

  /**
   * Find collection by user and slug
   */
  async findByUserAndSlug(
    userId: string,
    slug: string
  ): Promise<RepositoryResult<Collection | null>> {
    return this.executeOperation('findByUserAndSlug', async () => {
      const cacheKey = this.getCacheKey('slug', `${userId}:${slug}`);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', userId)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find collection: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find public collections
   */
  async findPublicCollections(options?: QueryOptions): Promise<RepositoryResult<Collection[]>> {
    return this.executeOperation('findPublicCollections', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_collections').select('*').eq('is_public', true);

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
        throw new Error(`Failed to find public collections: ${error.message}`);
      }

      return data || [];
    });
  }

  // =====================================================
  // COLLECTION ITEM METHODS
  // =====================================================

  /**
   * Add item to collection
   */
  async addItem(item: CollectionItemInsert): Promise<RepositoryResult<CollectionItem>> {
    return this.executeOperation('addItem', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('collection_items')
        .insert(item)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Item already exists in collection');
        }
        throw new Error(`Failed to add item to collection: ${error.message}`);
      }

      // Invalidate collection cache
      this.clearCache(this.getCacheKey('id', item.collection_id));
      this.clearCache(this.getCacheKey('items', item.collection_id));

      return data;
    });
  }

  /**
   * Remove item from collection
   */
  async removeItem(itemId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('removeItem', async () => {
      // Get item first for cache invalidation
      const supabase = await createClient();
      const { data: item } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('id', itemId)
        .single();

      const { error } = await supabase.from('collection_items').delete().eq('id', itemId);

      if (error) {
        throw new Error(`Failed to remove item from collection: ${error.message}`);
      }

      // Clear caches
      if (item) {
        this.clearCache(this.getCacheKey('id', item.collection_id));
        this.clearCache(this.getCacheKey('items', item.collection_id));
      }

      return true;
    });
  }

  /**
   * Get items in collection
   */
  async getItems(
    collectionId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<CollectionItem[]>> {
    return this.executeOperation('getItems', async (): Promise<CollectionItem[]> => {
      if (!(options?.offset || options?.limit)) {
        const cacheKey = this.getCacheKey('items', collectionId);
        const cached = this.getFromCache(cacheKey);
        if (cached)
          return Array.isArray(cached)
            ? (cached as unknown as CollectionItem[])
            : ([cached] as unknown as CollectionItem[]);
      }

      const supabase = await createClient();
      let query = supabase.from('collection_items').select('*').eq('collection_id', collectionId);

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

      query = query.order(options?.sortBy || 'order', {
        ascending: options?.sortOrder !== 'desc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get collection items: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
        const cacheKey = this.getCacheKey('items', collectionId);
        this.setCache(cacheKey, data as unknown as Collection);
      }

      return data || [];
    });
  }

  /**
   * Update item order
   */
  async updateItemOrder(itemId: string, order: number): Promise<RepositoryResult<CollectionItem>> {
    return this.executeOperation('updateItemOrder', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('collection_items')
        .update({ order } as CollectionItemUpdate)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update item order: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', data.collection_id));
      this.clearCache(this.getCacheKey('items', data.collection_id));

      return data;
    });
  }

  /**
   * Reorder collection items
   */
  async reorderItems(
    collectionId: string,
    items: Array<{ id: string; order: number }>
  ): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('reorderItems', async () => {
      const supabase = await createClient();

      // Update each item's order
      const updates = items.map((item) =>
        supabase
          .from('collection_items')
          .update({ order: item.order } as CollectionItemUpdate)
          .eq('id', item.id)
          .eq('collection_id', collectionId)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to reorder items: ${errors[0]?.error?.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', collectionId));
      this.clearCache(this.getCacheKey('items', collectionId));

      return true;
    });
  }

  /**
   * Get collection with items
   */
  async findByIdWithItems(id: string): Promise<RepositoryResult<CollectionWithItems | null>> {
    return this.executeOperation('findByIdWithItems', async () => {
      const collectionResult = await this.findById(id);
      if (!(collectionResult.success && collectionResult.data)) {
        return null;
      }

      const itemsResult = await this.getItems(id);
      const items = itemsResult.success ? itemsResult.data : [];

      return {
        ...collectionResult.data,
        items: items || [],
      };
    });
  }
}

/**
 * Singleton instance
 */
export const collectionRepository = new CollectionRepository();
