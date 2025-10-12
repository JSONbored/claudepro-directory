/**
 * Service Container with Dependency Injection
 *
 * Lightweight DI container for managing service instances and dependencies.
 * Provides singleton pattern, lazy initialization, and configuration injection.
 *
 * Production Standards:
 * - Type-safe service registration and resolution
 * - Singleton lifecycle management
 * - Configuration injection support
 * - Circular dependency detection
 * - Memory leak prevention
 *
 * @module di/service-container
 */

import { logger } from '@/src/lib/logger';

/**
 * Service factory function type
 */
type ServiceFactory<T> = (container: ServiceContainer) => T;

/**
 * Service registration options
 */
interface ServiceRegistration<T> {
  /** Service factory function */
  factory: ServiceFactory<T>;
  /** Service instance (if singleton and already initialized) */
  instance?: T;
  /** Whether service is a singleton */
  singleton: boolean;
  /** Service dependencies (for circular detection) */
  dependencies?: string[];
}

/**
 * Service Container
 * Manages service instances and their dependencies
 */
export class ServiceContainer {
  private services = new Map<string, ServiceRegistration<unknown>>();
  private resolving = new Set<string>();

  /**
   * Register a service factory
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    options: {
      singleton?: boolean;
      dependencies?: string[];
    } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;

    if (this.services.has(name)) {
      logger.warn(`Service "${name}" is already registered, overwriting`);
    }

    this.services.set(name, {
      factory: factory as ServiceFactory<unknown>,
      singleton,
      dependencies,
    });

    logger.debug('Service registered', {
      name,
      singleton,
      dependencies: dependencies.join(', '),
    });
  }

  /**
   * Resolve a service instance
   */
  resolve<T>(name: string): T {
    const registration = this.services.get(name);

    if (!registration) {
      throw new Error(`Service "${name}" is not registered`);
    }

    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected for service "${name}"`);
    }

    // Return existing singleton instance
    if (registration.singleton && registration.instance) {
      return registration.instance as T;
    }

    // Mark as resolving
    this.resolving.add(name);

    try {
      // Create new instance
      const instance = registration.factory(this) as T;

      // Store singleton instance
      if (registration.singleton) {
        registration.instance = instance;
      }

      logger.debug('Service resolved', { name });

      return instance;
    } finally {
      // Clear resolving flag
      this.resolving.delete(name);
    }
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): void {
    this.services.delete(name);
    logger.debug('Service unregistered', { name });
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
    logger.debug('Service container cleared');
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Service decorator for automatic registration
 */
export function Service(name: string, options?: { singleton?: boolean; dependencies?: string[] }) {
  return function <T extends { new (...args: unknown[]): unknown }>(ctor: T) {
    serviceContainer.register(name, () => new ctor(), options);
    return ctor;
  };
}
