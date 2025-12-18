/**
 * Cached Helper Factory
 * 
 * Factory function to create cached helper functions for API routes.
 * Eliminates repetitive boilerplate across multiple API routes.
 * 
 * Pattern eliminated:
 * ```typescript
 * async function getCachedX() {
 *   'use cache';
 *   cacheLife('long');
 *   const { Service } = await import('@heyclaude/data-layer');
 *   return new Service().methodName({...});
 * }
 * ```
 * 
 * **⚠️ IMPORTANT: Server-Only Module**
 * - ❌ **DO NOT** import this in client components (`'use client'`)
 * - ✅ **ONLY** import in server components, API routes, or server actions
 * - Uses `import 'server-only'` to enforce server-only boundary
 */

import 'server-only';

import { cacheLife } from 'next/cache';

/**
 * Cache life profile options
 * 
 * Simplified profiles:
 * - `short`: Frequently changing data (5-15 min)
 * - `medium`: Moderately changing data (1-6 hours)
 * - `long`: Rarely changing data (1+ days)
 * - `userProfile`: User-specific data (1min stale, 5min revalidate, 30min expire)
 */
type CacheLifeProfile = 
  | 'short'
  | 'medium'
  | 'long'
  | 'userProfile'
  | { expire: number; revalidate: number; stale: number };

/**
 * Options for creating a cached helper function
 */
interface CachedHelperOptions {
  /**
   * Cache life profile to use
   */
  cacheLife: CacheLifeProfile;
  
  /**
   * Service name to import (e.g., 'ContentService', 'TrendingService')
   */
  serviceName: string;
  
  /**
   * Service method name to call (e.g., 'getCategoryConfigs')
   * This avoids function closure issues during Next.js build analysis
   */
  methodName: string;
  
  /**
   * Optional arguments to pass to the service method
   */
  methodArgs?: unknown[];
  
  /**
   * Optional cache tags to apply
   */
  cacheTags?: string[];
}

/**
 * Create a cached helper function for API routes.
 * 
 * This factory eliminates the repetitive pattern of:
 * - 'use cache' directive
 * - cacheLife() call
 * - Lazy service import
 * - Service instantiation
 * - Service method call
 * 
 * @param options - Configuration for the cached helper
 * @returns A cached helper function with no arguments
 * 
 * @example
 * ```typescript
 * const getCachedCategoryConfigs = createCachedHelper({
 *   cacheLife: 'long',
 *   serviceName: 'ContentService', // Service class name (not key)
 *   methodName: 'getCategoryConfigs',
 * });
 * 
 * // Usage in API route
 * const data = await getCachedCategoryConfigs();
 * ```
 */
export function createCachedHelper<TReturn = unknown>(
  options: CachedHelperOptions
): () => Promise<TReturn> {
  const { cacheLife: cacheLifeProfile, serviceName, methodName, methodArgs = [], cacheTags } = options;
  
  return async () => {
    'use cache';
    
    // Apply cache life profile
    if (typeof cacheLifeProfile === 'string') {
      cacheLife(cacheLifeProfile);
    } else {
      cacheLife(cacheLifeProfile);
    }
    
    // Apply cache tags if provided
    if (cacheTags) {
      const { cacheTag } = await import('next/cache');
      for (const tag of cacheTags) {
        cacheTag(tag);
      }
    }
    
    // OPTIMIZATION: Use service factory instead of direct instantiation
    const { getService } = await import('../data/service-factory');
    
    // Map service class names to service keys
    const serviceKeyMap: Record<string, string> = {
      'AccountService': 'account',
      'ChangelogService': 'changelog',
      'CompaniesService': 'companies',
      'ContentService': 'content',
      'JobsService': 'jobs',
      'MiscService': 'misc',
      'NewsletterService': 'newsletter',
      'SearchService': 'search',
      'TrendingService': 'trending',
    };
    
    const serviceKey = serviceKeyMap[serviceName];
    if (!serviceKey) {
      throw new Error(
        `Service '${serviceName}' not found in service key map. ` +
        `Available services: ${Object.keys(serviceKeyMap).join(', ')}`
      );
    }
    
    const service = await getService(serviceKey as Parameters<typeof getService>[0]);
    const method = (service as unknown as Record<string, (...args: unknown[]) => Promise<TReturn>>)[methodName];
    
    if (!method || typeof method !== 'function') {
      throw new Error(
        `Method '${methodName}' not found on service '${serviceName}'. ` +
        `Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(service)).filter(m => m !== 'constructor').join(', ')}`
      );
    }
    
    return method.apply(service, methodArgs);
  };
}
