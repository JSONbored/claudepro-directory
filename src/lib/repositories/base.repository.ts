/**
 * Base Repository Pattern Implementation
 *
 * Provides abstract base classes for repository pattern implementation.
 * Enforces separation of data access logic from business logic.
 *
 * Production Standards:
 * - Type-safe generic interfaces
 * - Error handling patterns
 * - Logging integration
 * - Performance monitoring hooks
 * - Transaction support ready
 *
 * @module repositories/base
 */

import { logger } from '@/src/lib/logger';

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  /** Skip N results (pagination) */
  offset?: number;
  /** Limit results count */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Include soft-deleted records */
  includeSoftDeleted?: boolean;
}

/**
 * Result wrapper for repository operations
 */
export interface RepositoryResult<T> {
  /** Operation success status */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Additional metadata */
  metadata?: {
    /** Execution time in ms */
    executionTime?: number;
    /** Cache hit/miss */
    cached?: boolean;
    /** Affected rows count */
    affected?: number;
  };
}

/**
 * Base Repository Interface
 * Defines standard CRUD operations for all repositories
 */
export interface IRepository<T, ID = string> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<RepositoryResult<T | null>>;

  /**
   * Find all entities matching criteria
   */
  findAll(options?: QueryOptions): Promise<RepositoryResult<T[]>>;

  /**
   * Find one entity matching criteria
   */
  findOne(criteria: Partial<T>): Promise<RepositoryResult<T | null>>;

  /**
   * Create new entity
   */
  create(data: Omit<T, 'id'>): Promise<RepositoryResult<T>>;

  /**
   * Update existing entity
   */
  update(id: ID, data: Partial<T>): Promise<RepositoryResult<T>>;

  /**
   * Delete entity (soft or hard delete)
   */
  delete(id: ID, soft?: boolean): Promise<RepositoryResult<boolean>>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<RepositoryResult<boolean>>;

  /**
   * Count entities matching criteria
   */
  count(criteria?: Partial<T>): Promise<RepositoryResult<number>>;
}

/**
 * Abstract Base Repository
 * Provides common functionality for all repositories
 */
export abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  protected readonly repositoryName: string;

  constructor(repositoryName: string) {
    this.repositoryName = repositoryName;
  }

  /**
   * Wrap operation with error handling and logging
   */
  protected async executeOperation<R>(
    operationName: string,
    operation: () => Promise<R>
  ): Promise<RepositoryResult<R>> {
    const startTime = performance.now();

    try {
      const data = await operation();
      const executionTime = performance.now() - startTime;

      logger.debug('Repository operation completed', {
        repository: this.repositoryName,
        operation: operationName,
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      return {
        success: true,
        data,
        metadata: {
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(
        'Repository operation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          repository: this.repositoryName,
          operation: operationName,
          executionTime: `${executionTime.toFixed(2)}ms`,
        }
      );

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime,
        },
      };
    }
  }

  // Abstract methods that must be implemented by concrete repositories
  abstract findById(id: ID): Promise<RepositoryResult<T | null>>;
  abstract findAll(options?: QueryOptions): Promise<RepositoryResult<T[]>>;
  abstract findOne(criteria: Partial<T>): Promise<RepositoryResult<T | null>>;
  abstract create(data: Omit<T, 'id'>): Promise<RepositoryResult<T>>;
  abstract update(id: ID, data: Partial<T>): Promise<RepositoryResult<T>>;
  abstract delete(id: ID, soft?: boolean): Promise<RepositoryResult<boolean>>;
  abstract exists(id: ID): Promise<RepositoryResult<boolean>>;
  abstract count(criteria?: Partial<T>): Promise<RepositoryResult<number>>;
}

/**
 * Cache-enabled Repository Base
 * Extends BaseRepository with caching capabilities
 */
export abstract class CachedRepository<T, ID = string> extends BaseRepository<T, ID> {
  protected cache = new Map<string, { data: T; timestamp: number }>();
  protected readonly cacheTTL: number;

  constructor(repositoryName: string, cacheTTL = 5 * 60 * 1000) {
    super(repositoryName);
    this.cacheTTL = cacheTTL;
  }

  /**
   * Get from cache if available and not expired
   */
  protected getFromCache(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache entry
   */
  protected setCache(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache entry
   */
  protected clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  protected clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key
   */
  protected getCacheKey(prefix: string, id: ID): string {
    return `${this.repositoryName}:${prefix}:${String(id)}`;
  }
}
