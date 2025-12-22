/**
 * PrismockerClient - In-memory Prisma Client mock
 *
 * Provides a type-safe, in-memory implementation of PrismaClient
 * that works perfectly with pnpm and supports all Prisma operations.
 */

// PrismaClient is a class export, not a type export
// We don't need to import it here since we use generic types
import type { PrismockerOptions } from './types.js';
import { QueryEngine } from './query-engine.js';
import { ModelProxy } from './model-proxy.js';

/**
 * PrismockerClient - In-memory Prisma Client mock
 *
 * @example
 * ```typescript
 * import { createPrismocker } from 'prismocker';
 * import type { PrismaClient } from '@prisma/client';
 *
 * const prisma = createPrismocker<PrismaClient>();
 *
 * // Use just like PrismaClient
 * const users = await prisma.user.findMany();
 * await prisma.user.create({ data: { name: 'John' } });
 *
 * // Reset for test isolation
 * prisma.reset();
 * ```
 */
export class PrismockerClient {
  private stores: Map<string, any[]> = new Map();
  private modelProxies: Map<string, any> = new Map();
  private queryEngine: QueryEngine;
  private options: PrismockerOptions;
  private overriddenMethods: Map<string | symbol, any> = new Map();

  constructor(options?: PrismockerOptions) {
    this.options = {
      logQueries: false,
      logger: console.log,
      ...options,
    };
    this.queryEngine = new QueryEngine(this.options);
  }

  /**
   * Create a proxied instance that intercepts model access
   * This is called by createPrismocker factory function
   */
  static create(options?: PrismockerOptions): any {
    const instance = new PrismockerClient(options);
    
    // Use Proxy to intercept model access (prisma.content, prisma.jobs, etc.)
    return new Proxy(instance, {
      get: (target, prop: string | symbol) => {
        // Check if method has been overridden (e.g., by test spies)
        if (target.overriddenMethods.has(prop)) {
          return target.overriddenMethods.get(prop);
        }

        // If it's a method on PrismockerClient, return it
        if (prop in target && typeof (target as any)[prop] === 'function') {
          return (target as any)[prop].bind(target);
        }

        // Special Prisma methods
        if (prop === '$queryRaw' || prop === '$queryRawUnsafe' || prop === '$transaction') {
          return target.getPrismaMethod(prop as string);
        }

        // Otherwise, treat as model name
        return target.getModel(prop as string);
      },
      set: (target, prop: string | symbol, value: any) => {
        // Allow overriding Prisma methods (e.g., $queryRawUnsafe for testing)
        // Store in overriddenMethods so get handler can return it
        if (prop === '$queryRaw' || prop === '$queryRawUnsafe' || prop === '$transaction') {
          target.overriddenMethods.set(prop, value);
          return true;
        }
        
        // Allow setting other properties
        (target as any)[prop] = value;
        return true;
      },
    });
  }

  /**
   * Get model proxy (e.g., prisma.content, prisma.jobs)
   * Creates proxy on first access
   */
  private getModel(modelName: string): any {
    if (!this.modelProxies.has(modelName)) {
      this.modelProxies.set(modelName, new ModelProxy(modelName, this, this.queryEngine, this.options));
    }
    return this.modelProxies.get(modelName);
  }

  /**
   * Get Prisma-specific methods ($queryRaw, $queryRawUnsafe, $transaction)
   */
  private getPrismaMethod(methodName: string): any {
    switch (methodName) {
      case '$queryRaw':
      case '$queryRawUnsafe':
        // Raw queries are typically mocked in tests anyway
        // Return a stub that can be overridden
        return async (...args: any[]) => {
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] ${methodName} called`, { args });
          }
          return [];
        };

      case '$transaction':
        // Simplified transaction - just execute the callback
        return async (callback: (tx: any) => Promise<any>, options?: any) => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $transaction called', { options });
          }
          // Pass the proxied instance (which is 'this' in the Proxy context)
          // The Proxy will handle model access in the callback
          const proxy = new Proxy(this, {
            get: (target, prop: string | symbol) => {
              if (prop in target && typeof (target as any)[prop] === 'function') {
                return (target as any)[prop].bind(target);
              }
              if (prop === '$queryRaw' || prop === '$queryRawUnsafe' || prop === '$transaction') {
                return target.getPrismaMethod(prop as string);
              }
              return target.getModel(prop as string);
            },
          });
          return callback(proxy);
        };

      default:
        return undefined;
    }
  }

  /**
   * Get or create store for a model
   */
  getStore(modelName: string): any[] {
    if (!this.stores.has(modelName)) {
      this.stores.set(modelName, []);
    }
    return this.stores.get(modelName)!;
  }

  /**
   * Reset all data (for test isolation)
   */
  reset(): void {
    this.stores.clear();
    this.modelProxies.clear();
    this.overriddenMethods.clear();
    if (this.options.logQueries) {
      this.options.logger?.('[Prismocker] Reset all data');
    }
  }

  /**
   * Get all data for a model (useful for debugging)
   */
  getData(modelName: string): any[] {
    return [...this.getStore(modelName)];
  }

  /**
   * Set data for a model (useful for test setup)
   */
  setData(modelName: string, data: any[]): void {
    this.stores.set(modelName, [...data]);
  }
}

