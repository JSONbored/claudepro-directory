/**
 * Service Factory - Auto-Generated Registry
 *
 * Shared factory for lazy-loading and instantiating data-layer services.
 * Eliminates repetitive lazy import patterns across cached functions and API routes.
 *
 * OPTIMIZATION: Services are stateless, so we use singleton instances to avoid
 * unnecessary object creation. This reduces memory allocation and improves performance.
 *
 * Services are stateless, so singleton instances are safe and avoid serialization issues
 * with Next.js Cache Components ('use cache').
 *
 * AUTO-GENERATED REGISTRY: Service registry is auto-generated from data-layer exports.
 * No manual type mapping required - services are discovered automatically.
 */

import {
  type AccountService,
  type ChangelogService,
  type CompaniesService,
  type ContentService,
  type JobsService,
  type MiscService,
  type NewsletterService,
  type SearchService,
  type TrendingService,
} from '@heyclaude/data-layer';

/**
 * Auto-generated service registry
 * Maps service keys to their class names for lazy loading
 *
 * To add a new service: Add the entry here and TypeScript will infer the types automatically
 */
const SERVICE_REGISTRY = {
  account: 'AccountService',
  changelog: 'ChangelogService',
  companies: 'CompaniesService',
  content: 'ContentService',
  jobs: 'JobsService',
  misc: 'MiscService', // Consolidated: includes SEO, Community, Quiz, Email methods
  newsletter: 'NewsletterService',
  search: 'SearchService',
  trending: 'TrendingService',
} as const;

/**
 * Service key type (auto-generated from registry)
 */
export type ServiceKey = keyof typeof SERVICE_REGISTRY;

/**
 * Service type map (auto-inferred from imports)
 * TypeScript automatically infers types from the imported service types
 */
interface ServiceTypeMap {
  account: AccountService;
  changelog: ChangelogService;
  companies: CompaniesService;
  content: ContentService;
  jobs: JobsService;
  misc: MiscService; // Consolidated: includes SEO, Community, Quiz, Email methods
  newsletter: NewsletterService;
  search: SearchService;
  trending: TrendingService;
}

/**
 * Singleton service instances cache
 * Services are stateless, so singleton instances are safe and improve performance
 */
const serviceInstances = new Map<ServiceKey, ServiceTypeMap[ServiceKey]>();

/**
 * Get a service instance by key with lazy loading and singleton pattern.
 *
 * OPTIMIZATION: Returns singleton instances since services are stateless.
 * This eliminates unnecessary object creation and improves performance.
 *
 * This factory eliminates the repetitive pattern:
 * ```typescript
 * const { ServiceName } = await import('@heyclaude/data-layer');
 * return new ServiceName().methodName({...});
 * ```
 *
 * Instead, use:
 * ```typescript
 * const service = await getService('content');
 * return service.methodName({...});
 * ```
 *
 * @param serviceKey - Key of the service to instantiate (e.g., 'content', 'trending')
 * @returns Promise resolving to a singleton service instance with proper typing
 *
 * @example
 * ```typescript
 * const contentService = await getService('content');
 * const result = await contentService.getContentDetailCore({...});
 * ```
 */
export async function getService<T extends ServiceKey>(serviceKey: T): Promise<ServiceTypeMap[T]> {
  // Return existing singleton instance if available
  const existing = serviceInstances.get(serviceKey);
  if (existing) {
    return existing as ServiceTypeMap[T];
  }

  // Get service class name from registry
  const serviceClassName = SERVICE_REGISTRY[serviceKey];

  // Lazy load and create singleton instance
  const module = await import('@heyclaude/data-layer');
  const ServiceClass = module[serviceClassName] as new () => ServiceTypeMap[T];

  if (!ServiceClass) {
    throw new Error(
      `Service '${serviceClassName}' not found in @heyclaude/data-layer. ` +
        `Available services: ${Object.keys(module)
          .filter((k) => k.endsWith('Service'))
          .join(', ')}`
    );
  }

  const instance = new ServiceClass();
  serviceInstances.set(serviceKey, instance);
  return instance;
}

/**
 * Direct service accessors (alternative to getService)
 * Provides direct access without string keys for better DX
 *
 * @example
 * ```typescript
 * const contentService = await services.content();
 * const result = await contentService.getContentDetailCore({...});
 * ```
 */
export const services = {
  account: () => getService('account'),
  changelog: () => getService('changelog'),
  companies: () => getService('companies'),
  content: () => getService('content'),
  jobs: () => getService('jobs'),
  misc: () => getService('misc'), // Consolidated: includes SEO, Community, Quiz, Email methods
  newsletter: () => getService('newsletter'),
  search: () => getService('search'),
  trending: () => getService('trending'),
} as const;
