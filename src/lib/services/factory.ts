/**
 * Service Factory & Dependency Injection Container
 *
 * Provides centralized service instantiation, dependency injection, and lifecycle management.
 * Enables loose coupling, easier testing, and configuration injection across all services.
 *
 * Production Standards:
 * - Type-safe service registration and resolution
 * - Support for singleton, transient, and scoped lifetimes
 * - Automatic dependency injection
 * - Configuration injection from environment
 * - Performance monitoring and health checks
 * - Graceful error handling and fallbacks
 *
 * @module services/factory
 */

import { logger } from '@/src/lib/logger';

// =====================================================
// TYPES & INTERFACES
// =====================================================

/**
 * Service lifetime determines how instances are managed
 */
export enum ServiceLifetime {
  /** Single instance shared across the application */
  Singleton = 'singleton',
  /** New instance created for each request */
  Transient = 'transient',
  /** Single instance per scope (e.g., per HTTP request) */
  Scoped = 'scoped',
}

/**
 * Service configuration options
 */
export interface ServiceOptions<T = unknown> {
  /** Service lifetime */
  lifetime?: ServiceLifetime | undefined;
  /** Dependencies to inject */
  dependencies?: string[] | undefined;
  /** Configuration to inject */
  config?: Record<string, unknown> | undefined;
  /** Factory function to create service instance */
  factory: (
    deps: ServiceDependencies,
    config?: Record<string, unknown> | undefined
  ) => T | Promise<T>;
  /** Health check function (optional) */
  healthCheck?: ((service: T) => Promise<boolean>) | undefined;
  /** Initialization function (optional) */
  init?: ((service: T) => Promise<void>) | undefined;
}

/**
 * Service registration entry
 */
interface ServiceRegistration<T = unknown> {
  name: string;
  options: ServiceOptions<T>;
  instance?: T | undefined;
  initializing?: Promise<void> | undefined;
}

/**
 * Dependencies injected into service factories
 */
export interface ServiceDependencies {
  [serviceName: string]: unknown;
}

/**
 * Service factory configuration
 */
export interface ServiceFactoryConfig {
  /** Enable performance monitoring */
  enableMonitoring?: boolean;
  /** Enable health checks */
  enableHealthChecks?: boolean;
  /** Default service lifetime */
  defaultLifetime?: ServiceLifetime;
}

// =====================================================
// SERVICE FACTORY IMPLEMENTATION
// =====================================================

/**
 * ServiceFactory
 * Manages service registration, instantiation, and dependency injection
 */
export class ServiceFactory {
  private services: Map<string, ServiceRegistration> = new Map();
  private scopes: Map<string, Map<string, unknown>> = new Map();
  private config: ServiceFactoryConfig;
  private currentScopeId?: string | undefined;

  constructor(config: ServiceFactoryConfig = {}) {
    this.config = {
      enableMonitoring: true,
      enableHealthChecks: true,
      defaultLifetime: ServiceLifetime.Singleton,
      ...config,
    };
  }

  /**
   * Register a service with the factory
   */
  register<T>(name: string, options: ServiceOptions<T>): void {
    if (this.services.has(name)) {
      logger.warn(`Service ${name} is already registered, overwriting`, undefined);
    }

    const registration: ServiceRegistration<T> = {
      name,
      options: {
        lifetime: this.config.defaultLifetime,
        ...options,
      },
    };

    this.services.set(name, registration as ServiceRegistration<unknown>);

    if (this.config.enableMonitoring) {
      logger.debug(`Service registered: ${name}`, {
        lifetime: registration.options.lifetime ?? 'singleton',
        hasDependencies: (options.dependencies?.length ?? 0) > 0,
        hasConfig: !!options.config,
      });
    }
  }

  /**
   * Resolve a service by name with dependency injection
   */
  async resolve<T>(name: string): Promise<T> {
    const registration = this.services.get(name) as ServiceRegistration<T> | undefined;

    if (!registration) {
      throw new Error(`Service ${name} is not registered`);
    }

    const startTime = this.config.enableMonitoring ? performance.now() : 0;

    try {
      const instance = await this.resolveInstance(registration);

      if (this.config.enableMonitoring) {
        const duration = performance.now() - startTime;
        logger.debug(`Service resolved: ${name}`, {
          duration: `${duration.toFixed(2)}ms`,
          lifetime: registration.options.lifetime ?? 'singleton',
        });
      }

      return instance;
    } catch (error) {
      logger.error(
        `Failed to resolve service: ${name}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Resolve service instance based on lifetime
   */
  private async resolveInstance<T>(registration: ServiceRegistration<T>): Promise<T> {
    const { lifetime } = registration.options;

    switch (lifetime) {
      case ServiceLifetime.Singleton:
        return this.resolveSingleton(registration);

      case ServiceLifetime.Transient:
        return this.createInstance(registration);

      case ServiceLifetime.Scoped:
        return this.resolveScoped(registration);

      default:
        throw new Error(`Unknown service lifetime: ${lifetime}`);
    }
  }

  /**
   * Resolve singleton service (create once, reuse forever)
   */
  private async resolveSingleton<T>(registration: ServiceRegistration<T>): Promise<T> {
    if (registration.instance) {
      return registration.instance;
    }

    // Handle concurrent initialization
    if (registration.initializing) {
      await registration.initializing;
      return registration.instance as T;
    }

    // Create and initialize instance
    registration.initializing = (async () => {
      registration.instance = await this.createInstance(registration);

      if (registration.options.init) {
        await registration.options.init(registration.instance);
      }
    })();

    await registration.initializing;
    registration.initializing = undefined;

    return registration.instance as T;
  }

  /**
   * Resolve scoped service (create once per scope)
   */
  private async resolveScoped<T>(registration: ServiceRegistration<T>): Promise<T> {
    if (!this.currentScopeId) {
      throw new Error(
        `Service ${registration.name} has scoped lifetime but no scope is active. Call beginScope() first.`
      );
    }

    const scope = this.scopes.get(this.currentScopeId);
    if (!scope) {
      throw new Error(`Scope ${this.currentScopeId} not found`);
    }

    const existing = scope.get(registration.name) as T | undefined;
    if (existing) {
      return existing;
    }

    const instance = await this.createInstance(registration);
    scope.set(registration.name, instance);

    return instance;
  }

  /**
   * Create new service instance with dependency injection
   */
  private async createInstance<T>(registration: ServiceRegistration<T>): Promise<T> {
    const { factory, dependencies, config } = registration.options;

    // Resolve dependencies
    const deps: ServiceDependencies = {};
    if (dependencies) {
      for (const depName of dependencies) {
        deps[depName] = await this.resolve(depName);
      }
    }

    // Create instance (factory can be sync or async)
    const instance = await Promise.resolve(factory(deps, config));

    return instance;
  }

  /**
   * Begin a new scope for scoped services
   * Returns scope ID that must be passed to endScope()
   */
  beginScope(): string {
    const scopeId = `scope_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.scopes.set(scopeId, new Map());
    this.currentScopeId = scopeId;

    if (this.config.enableMonitoring) {
      logger.debug(`Scope begun: ${scopeId}`);
    }

    return scopeId;
  }

  /**
   * End a scope and dispose of scoped service instances
   */
  endScope(scopeId: string): void {
    const scope = this.scopes.get(scopeId);
    if (!scope) {
      logger.warn(`Attempted to end non-existent scope: ${scopeId}`, undefined);
      return;
    }

    // Clear scoped instances
    scope.clear();
    this.scopes.delete(scopeId);

    if (this.currentScopeId === scopeId) {
      this.currentScopeId = undefined;
    }

    if (this.config.enableMonitoring) {
      logger.debug(`Scope ended: ${scopeId}`);
    }
  }

  /**
   * Run health checks on all registered services
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    if (!this.config.enableHealthChecks) {
      return new Map();
    }

    const results = new Map<string, boolean>();

    for (const [name, registration] of this.services) {
      if (registration.options.healthCheck && registration.instance) {
        try {
          const healthy = await registration.options.healthCheck(registration.instance);
          results.set(name, healthy);

          if (!healthy) {
            logger.warn(`Service health check failed: ${name}`, undefined);
          }
        } catch (error) {
          logger.error(
            `Health check error for service: ${name}`,
            error instanceof Error ? error : new Error(String(error))
          );
          results.set(name, false);
        }
      }
    }

    return results;
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a service is registered
   */
  isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.scopes.clear();
    this.currentScopeId = undefined;

    if (this.config.enableMonitoring) {
      logger.debug('Service factory cleared');
    }
  }
}

// =====================================================
// GLOBAL FACTORY INSTANCE
// =====================================================

/**
 * Global service factory instance
 * Use this for production code
 */
export const serviceFactory = new ServiceFactory({
  enableMonitoring: process.env.NODE_ENV === 'development',
  enableHealthChecks: true,
  defaultLifetime: ServiceLifetime.Singleton,
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Register a singleton service
 */
export function registerSingleton<T>(
  name: string,
  factory: (deps: ServiceDependencies, config?: Record<string, unknown>) => T | Promise<T>,
  options?: Partial<ServiceOptions<T>>
): void {
  serviceFactory.register(name, {
    lifetime: ServiceLifetime.Singleton,
    factory,
    ...options,
  });
}

/**
 * Register a transient service
 */
export function registerTransient<T>(
  name: string,
  factory: (deps: ServiceDependencies, config?: Record<string, unknown>) => T,
  options?: Partial<ServiceOptions<T>>
): void {
  serviceFactory.register(name, {
    lifetime: ServiceLifetime.Transient,
    factory,
    ...options,
  });
}

/**
 * Register a scoped service
 */
export function registerScoped<T>(
  name: string,
  factory: (deps: ServiceDependencies, config?: Record<string, unknown>) => T,
  options?: Partial<ServiceOptions<T>>
): void {
  serviceFactory.register(name, {
    lifetime: ServiceLifetime.Scoped,
    factory,
    ...options,
  });
}

/**
 * Resolve a service from the global factory
 */
export async function resolve<T>(name: string): Promise<T> {
  return serviceFactory.resolve<T>(name);
}
