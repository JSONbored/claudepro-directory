/**
 * Service Factory Pattern
 *
 * Factory for creating and managing service instances with configuration injection.
 * Provides standardized service initialization and configuration management.
 *
 * Production Standards:
 * - Type-safe service configuration
 * - Environment-based configuration
 * - Lazy initialization
 * - Configuration validation with Zod
 *
 * @module di/service-factory
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { batchAllSettled } from '@/src/lib/utils/batch.utils';

/**
 * Base service configuration schema
 */
export const baseServiceConfigSchema = z.object({
  /** Service name for logging/identification */
  serviceName: z.string().min(1),
  /** Enable debug logging */
  debug: z.boolean().default(false),
  /** Service timeout in milliseconds */
  timeout: z.number().min(100).max(60000).default(5000),
  /** Retry attempts on failure */
  retryAttempts: z.number().min(0).max(5).default(3),
  /** Retry delay in milliseconds */
  retryDelay: z.number().min(100).max(10000).default(1000),
});

export type BaseServiceConfig = z.infer<typeof baseServiceConfigSchema>;

/**
 * Base Service Interface
 * All services should implement this interface
 */
export interface IService {
  /** Service name */
  readonly name: string;
  /** Service initialization */
  initialize?(): Promise<void>;
  /** Service cleanup */
  destroy?(): Promise<void>;
  /** Service health check */
  healthCheck?(): Promise<boolean>;
}

/**
 * Abstract Base Service
 * Provides common functionality for all services
 */
export abstract class BaseService implements IService {
  protected config: BaseServiceConfig;
  public readonly name: string;

  constructor(config: Partial<BaseServiceConfig>) {
    // Validate and merge with defaults
    this.config = baseServiceConfigSchema.parse({
      ...config,
      serviceName: config.serviceName || this.constructor.name,
    });
    this.name = this.config.serviceName;

    if (this.config.debug) {
      logger.debug('Service initialized', { name: this.name });
    }
  }

  /**
   * Optional initialization hook
   */
  async initialize(): Promise<void> {
    if (this.config.debug) {
      logger.debug('Service initialize called', { name: this.name });
    }
  }

  /**
   * Optional cleanup hook
   */
  async destroy(): Promise<void> {
    if (this.config.debug) {
      logger.debug('Service destroy called', { name: this.name });
    }
  }

  /**
   * Optional health check
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Execute operation with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * 2 ** attempt;
          logger.warn('Service operation failed, retrying', {
            name: this.name,
            operation: operationName,
            attempt: attempt + 1,
            maxAttempts: this.config.retryAttempts + 1,
            nextRetryIn: `${delay}ms`,
          });

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we reach here, lastError must be set since we attempted at least once
    if (!lastError) {
      lastError = new Error('Operation failed with unknown error');
    }

    logger.error('Service operation failed after all retries', lastError, {
      name: this.name,
      operation: operationName,
      attempts: this.config.retryAttempts + 1,
    });

    throw lastError;
  }
}

/**
 * Service Registry
 * Module-level singleton service storage
 */
const services = new Map<string, IService>();

/**
 * Create or get service instance (singleton pattern)
 */
export function getService<T extends IService>(name: string, factory: () => T): T {
  if (!services.has(name)) {
    const service = factory();
    services.set(name, service);
    logger.debug('Service created', { name });
  }

  return services.get(name) as T;
}

/**
 * Register a service instance
 */
export function registerService<T extends IService>(name: string, service: T): void {
  if (services.has(name)) {
    logger.warn(`Service "${name}" already registered, overwriting`);
  }
  services.set(name, service);
  logger.debug('Service registered', { name });
}

/**
 * Check if service is registered
 */
export function hasService(name: string): boolean {
  return services.has(name);
}

/**
 * Get service if it exists
 */
export function getServiceOrNull<T extends IService>(name: string): T | null {
  return (services.get(name) as T) || null;
}

/**
 * Remove service
 */
export async function removeService(name: string): Promise<void> {
  const service = services.get(name);
  if (service?.destroy) {
    await service.destroy();
  }
  services.delete(name);
  logger.debug('Service removed', { name });
}

/**
 * Cleanup all services
 */
export async function destroyAllServices(): Promise<void> {
  const promises = Array.from(services.values())
    .filter((service) => service.destroy)
    .map((service) => service.destroy?.()) // Optional chaining - safe after filter
    .filter((p): p is Promise<void> => p !== undefined);

  if (promises.length > 0) {
    await batchAllSettled(promises, 'service-cleanup');
  }

  services.clear();
  logger.debug('All services destroyed');
}

/**
 * Health check all services
 */
export async function healthCheckAllServices(): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const [name, service] of services.entries()) {
    if (service.healthCheck) {
      try {
        const healthy = await service.healthCheck();
        results.set(name, healthy);
      } catch {
        results.set(name, false);
      }
    } else {
      results.set(name, true); // Assume healthy if no health check
    }
  }

  return results;
}
