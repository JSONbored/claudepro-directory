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
import { IndexManager, type IndexConfig } from './index-manager.js';
import { QueryCache } from './query-cache.js';
import { parseSimpleSelect, executeSimpleSelect } from './sql-parser.js';

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
  private indexManager: IndexManager;
  private queryCache: QueryCache;
  private queryStats: Array<{
    modelName: string;
    operation: string;
    timestamp: number;
    duration?: number;
    args?: any;
    resultCount?: number;
  }> = [];
  private debugMode: boolean = false;
  private middleware: Array<(params: any, next: any) => Promise<any>> = [];
  private eventListeners: Map<string, Array<(event: any) => void>> = new Map();

  constructor(options?: PrismockerOptions) {
    this.options = {
      logQueries: false,
      logger: console.log,
      enableIndexes: true, // Enable indexes by default for performance
      ...options,
    };
    this.queryEngine = new QueryEngine(this.options);
    this.indexManager = new IndexManager();
    this.queryCache = new QueryCache(this.options);

    // Configure indexes from options
    if (this.options.enableIndexes && this.options.indexConfig) {
      for (const [modelName, config] of Object.entries(this.options.indexConfig)) {
        this.indexManager.configureModel(modelName, config);
      }
    }
  }

  /**
   * Creates a proxied PrismockerClient instance that intercepts model access.
   *
   * This static method is called by the `createPrismocker` factory function.
   * It creates a Proxy that intercepts property access to provide:
   * - Model proxies (e.g., `prisma.user`, `prisma.company`)
   * - Prisma-specific methods (e.g., `$queryRaw`, `$transaction`)
   * - Prismocker-specific methods (e.g., `reset()`, `setData()`)
   *
   * **Type Safety Note:** The Proxy handler returns `any` at runtime, but TypeScript
   * uses `ExtractModels<T>` (from `createPrismocker`) to understand the correct types.
   * This allows full type safety while maintaining runtime flexibility.
   *
   * @param options - Configuration options for Prismocker behavior
   * @returns A proxied PrismockerClient instance that behaves like PrismaClient
   *
   * @example
   * ```typescript
   * const prisma = PrismockerClient.create({
   *   logQueries: true,
   * });
   * ```
   *
   * @internal This method is typically called by `createPrismocker`, not directly by users
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
        if (
          prop === '$queryRaw' ||
          prop === '$queryRawUnsafe' ||
          prop === '$executeRaw' ||
          prop === '$executeRawUnsafe' ||
          prop === '$transaction' ||
          prop === '$connect' ||
          prop === '$disconnect' ||
          prop === '$use' ||
          prop === '$on' ||
          prop === '$metrics'
        ) {
          return target.getPrismaMethod(prop as string);
        }

        // Prisma Client extensions ($extends)
        // Extensions are typically added via $extends() which returns a new client
        // For Prismocker, we support extensions by allowing method/property access
        // Extensions are transparent at runtime, so we just pass through
        if (prop === '$extends') {
          // Return a function that simulates Prisma's $extends
          // This allows Prismocker to work with extended Prisma clients
          return (extensions: any) => {
            // For now, return the same instance
            // Full extension support would require implementing Prisma's extension system
            // which is complex. Most extensions work transparently.
            return target;
          };
        }

        // Otherwise, treat as model name
        return target.getModel(prop as string);
      },
      set: (target, prop: string | symbol, value: any) => {
        // Allow overriding Prisma methods (e.g., $queryRawUnsafe for testing)
        // Store in overriddenMethods so get handler can return it
        if (
          prop === '$queryRaw' ||
          prop === '$queryRawUnsafe' ||
          prop === '$executeRaw' ||
          prop === '$executeRawUnsafe' ||
          prop === '$transaction' ||
          prop === '$connect' ||
          prop === '$disconnect' ||
          prop === '$use' ||
          prop === '$on' ||
          prop === '$metrics'
        ) {
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
   * Gets or creates a model proxy for the specified model name.
   *
   * Model proxies provide Prisma operations (findMany, create, update, etc.)
   * for a specific model. They are created lazily on first access.
   *
   * @param modelName - The name of the Prisma model (e.g., 'user', 'company', 'job')
   * @returns A ModelProxy instance that provides Prisma operations for the model
   *
   * @internal This method is called by the Proxy handler when accessing model properties
   */
  private getModel(modelName: string): any {
    if (!this.modelProxies.has(modelName)) {
      this.modelProxies.set(
        modelName,
        new ModelProxy(modelName, this, this.queryEngine, this.options)
      );
    }
    return this.modelProxies.get(modelName);
  }

  /**
   * Gets a Prisma-specific method handler.
   *
   * Returns handlers for Prisma's special methods like `$queryRaw`, `$transaction`, etc.
   * These methods are accessed via the Proxy and provide enhanced functionality
   * with configurable executors and SQL parsing support.
   *
   * @param methodName - The name of the Prisma method ('$queryRaw', '$transaction', etc.)
   * @returns A function handler for the specified Prisma method, or undefined if not supported
   *
   * @internal This method is called by the Proxy handler when accessing Prisma methods
   */
  private getPrismaMethod(methodName: string): any {
    switch (methodName) {
      case '$queryRaw':
      case '$queryRawUnsafe':
        // Enhanced raw query execution with configurable executor and SQL parsing
        return async (query: string | TemplateStringsArray, ...values: any[]): Promise<any[]> => {
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] ${methodName} called`, { query, values });
          }

          // Handle template string (for $queryRaw)
          let sqlQuery: string;
          if (Array.isArray(query)) {
            // Template string: $queryRaw`SELECT * FROM users WHERE id = ${userId}`
            sqlQuery = query.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
          } else {
            // Regular string (for $queryRawUnsafe)
            sqlQuery = query as string;
            // Replace parameter placeholders ($1, $2, etc.) with actual values
            if (values.length > 0) {
              sqlQuery = sqlQuery.replace(/\$(\d+)/g, (_, index) => {
                const valueIndex = parseInt(index, 10) - 1;
                return valueIndex >= 0 && valueIndex < values.length
                  ? JSON.stringify(values[valueIndex])
                  : `$${index}`;
              });
            }
          }

          // Try custom executor first
          if (this.options.queryRawExecutor) {
            try {
              const result = await this.options.queryRawExecutor(
                sqlQuery,
                values,
                this.stores as ReadonlyMap<string, any[]>
              );
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} executed via custom executor`, {
                  resultCount: Array.isArray(result) ? result.length : 0,
                });
              }
              return Array.isArray(result) ? result : [];
            } catch (error: any) {
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} custom executor error`, {
                  error: error.message,
                });
              }
              // Fall through to default behavior
            }
          }

          // Try SQL parsing if enabled
          if (this.options.enableSqlParsing) {
            try {
              // sqlQuery is now a string (converted above)
              const parsed = parseSimpleSelect(sqlQuery);
              if (parsed) {
                const result = executeSimpleSelect(parsed, this.stores as ReadonlyMap<string, any[]>);
                if (this.options.logQueries) {
                  this.options.logger?.(`[Prismocker] ${methodName} executed via SQL parser`, {
                    tableName: parsed.tableName,
                    resultCount: result.length,
                  });
                }
                return result;
              }
            } catch (error: any) {
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} SQL parsing error`, {
                  error: error.message,
                });
              }
              // Fall through to default behavior
            }
          }

          // Default: return empty array (can be overridden by user)
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] ${methodName} returning empty array (no executor/parser)`, {
              hint: 'Provide queryRawExecutor or enable enableSqlParsing for query execution',
            });
          }
          return [];
        };

      case '$executeRaw':
      case '$executeRawUnsafe':
        // Raw SQL execution for DML/DDL statements (INSERT, UPDATE, DELETE, etc.)
        // Returns count of affected rows (number) instead of data (array)
        return async (query: string | TemplateStringsArray, ...values: any[]): Promise<number> => {
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] ${methodName} called`, { query, values });
          }

          // Handle template string (for $executeRaw)
          let sqlQuery: string;
          // TemplateStringsArray is array-like but Array.isArray() returns false
          // Check for array-like object with length property and numeric indices
          if (
            query &&
            typeof query === 'object' &&
            'length' in query &&
            typeof (query as any).length === 'number'
          ) {
            // Template string: $executeRaw`UPDATE users SET name = ${name} WHERE id = ${id}`
            // Properly quote string values when interpolating
            const templateArray = query as any;
            sqlQuery = '';
            for (let i = 0; i < templateArray.length; i++) {
              sqlQuery += templateArray[i];
              if (i < values.length) {
                const value = values[i];
                // Quote string values, but not numbers/booleans/null
                const interpolatedValue =
                  value === null
                    ? 'null'
                    : typeof value === 'string'
                      ? `'${value.replace(/'/g, "''")}'` // Escape single quotes
                      : typeof value === 'number' || typeof value === 'boolean'
                        ? String(value)
                        : `'${String(value).replace(/'/g, "''")}'`; // Default to quoted string
                sqlQuery += interpolatedValue;
              }
            }
          } else {
            // Regular string (for $executeRawUnsafe)
            sqlQuery = query as string;
            // Replace parameter placeholders ($1, $2, etc.) with actual values
            if (values.length > 0) {
              sqlQuery = sqlQuery.replace(/\$(\d+)/g, (_, index) => {
                const valueIndex = parseInt(index, 10) - 1;
                return valueIndex >= 0 && valueIndex < values.length
                  ? JSON.stringify(values[valueIndex])
                  : `$${index}`;
              });
            }
          }

          // Try custom executor first
          if (this.options.executeRawExecutor) {
            try {
              const result = await this.options.executeRawExecutor(
                sqlQuery,
                values,
                this.stores
              );
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} executed via custom executor`, {
                  affectedRows: typeof result === 'number' ? result : 0,
                });
              }
              return typeof result === 'number' ? result : 0;
            } catch (error: any) {
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} custom executor error`, {
                  error: error.message,
                });
              }
              // Fall through to default behavior
            }
          }

          // Try SQL parsing if enabled
          if (this.options.enableSqlParsing) {
            try {
              // Attempt to parse and execute simple INSERT/UPDATE/DELETE statements
              const affectedRows = this.executeSimpleDml(sqlQuery);
              if (affectedRows !== null) {
                if (this.options.logQueries) {
                  this.options.logger?.(`[Prismocker] ${methodName} executed via SQL parser`, {
                    affectedRows,
                  });
                }
                return affectedRows;
              }
            } catch (error: any) {
              if (this.options.logQueries) {
                this.options.logger?.(`[Prismocker] ${methodName} SQL parsing error`, {
                  error: error.message,
                });
              }
              // Fall through to default behavior
            }
          }

          // Default: return 0 (no rows affected)
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] ${methodName} returning 0 (no executor/parser)`, {
              hint: 'Provide executeRawExecutor or enable enableSqlParsing for DML execution',
            });
          }
          return 0;
        };

      case '$transaction':
        // Transaction with rollback support
        return async (input: ((tx: any) => Promise<any>) | Array<Promise<any>>, options?: any) => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $transaction called', { options });
          }

          // Create snapshot before transaction
          const snapshot = this.snapshotState();

          try {
            // Handle interactive transaction (callback)
            if (typeof input === 'function') {
              // Create transaction-scoped client that uses snapshot stores
              // This ensures each transaction sees its own isolated state
              const txClient = this.createTransactionClient(snapshot);

              // Pass the proxied transaction client instance
              const proxy = new Proxy(txClient, {
                get: (target, prop: string | symbol) => {
                  if (prop in target && typeof (target as any)[prop] === 'function') {
                    return (target as any)[prop].bind(target);
                  }
                  if (
                    prop === '$queryRaw' ||
                    prop === '$queryRawUnsafe' ||
                    prop === '$executeRaw' ||
                    prop === '$executeRawUnsafe' ||
                    prop === '$transaction' ||
                    prop === '$connect' ||
                    prop === '$disconnect' ||
                    prop === '$use' ||
                    prop === '$on' ||
                    prop === '$metrics'
                  ) {
                    return target.getPrismaMethod(prop as string);
                  }
                  return target.getModel(prop as string);
                },
              });

              const result = await input(proxy);

              // Commit transaction: copy snapshot stores back to main stores
              this.commitTransaction(snapshot, txClient);

              if (this.options.logQueries) {
                this.options.logger?.('[Prismocker] Transaction committed successfully');
              }

              return result;
            }

            // Handle batch transaction (array of operations)
            if (Array.isArray(input)) {
              const results = await Promise.all(input);

              if (this.options.logQueries) {
                this.options.logger?.('[Prismocker] Batch transaction committed successfully');
              }

              return results;
            }

            throw new Error(
              'Prismocker: $transaction expects a callback function or array of promises'
            );
          } catch (error: any) {
            // Rollback on error
            if (this.options.logQueries) {
              this.options.logger?.('[Prismocker] Transaction failed, rolling back', {
                error: error.message,
              });
            }

            this.restoreState(snapshot);

            // Re-throw the error
            throw error;
          }
        };

      case '$connect':
        // Connection management (no-op for in-memory mocking)
        return async (): Promise<void> => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $connect called (no-op for in-memory)');
          }
          // Emit connect event if listeners exist
          this.emitEvent('connect', {});
        };

      case '$disconnect':
        // Connection management (no-op for in-memory mocking)
        return async (): Promise<void> => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $disconnect called (no-op for in-memory)');
          }
          // Emit disconnect event if listeners exist
          this.emitEvent('disconnect', {});
        };

      case '$use':
        // Middleware support
        return (middleware: (params: any, next: any) => Promise<any>): void => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $use middleware registered');
          }
          this.middleware.push(middleware);
        };

      case '$on':
        // Event listener support
        return (event: 'query' | 'info' | 'warn' | 'error' | 'connect' | 'disconnect', callback: (event: any) => void): void => {
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] $on listener registered for event: ${event}`);
          }
          if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
          }
          this.eventListeners.get(event)!.push(callback);
        };

      case '$metrics':
        // Metrics API stub (Prisma 7.1.0+)
        return async (options?: any): Promise<any> => {
          if (this.options.logQueries) {
            this.options.logger?.('[Prismocker] $metrics called', { options });
          }
          // Return mock metrics structure matching Prisma's metrics API
          // Integrate with queryStats for realistic metrics
          return {
            counters: [
              {
                key: 'prisma_client_queries_total',
                value: this.queryStats.length,
                labels: {},
              },
            ],
            gauges: [
              {
                key: 'prisma_client_queries_active',
                value: 0, // No active queries in in-memory mock
                labels: {},
              },
            ],
            histograms: this.queryStats.length > 0
              ? [
                  {
                    key: 'prisma_client_queries_duration_histogram_ms',
                    value: this.queryStats
                      .filter((q) => q.duration !== undefined)
                      .map((q) => q.duration!),
                    labels: {},
                    buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
                  },
                ]
              : [],
            // Include query statistics if available
            ...(this.debugMode && {
              queryStats: {
                totalQueries: this.queryStats.length,
                queriesByModel: this.getQueryStats().queriesByModel,
                queriesByOperation: this.getQueryStats().queriesByOperation,
                averageDuration: this.getQueryStats().averageDuration,
              },
            }),
          };
        };

      default:
        return undefined;
    }
  }

  /**
   * Emits an event to all registered listeners.
   *
   * @param event - Event name ('query', 'info', 'warn', 'error', 'connect', 'disconnect')
   * @param data - Event data to pass to listeners
   *
   * @internal This method is used internally to emit events to registered listeners
   * ModelProxy can access this via the client reference
   */
  emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          // Silently ignore listener errors to prevent breaking operations
          if (this.options.logQueries) {
            this.options.logger?.(`[Prismocker] Event listener error for ${event}:`, error);
          }
        }
      });
    }
  }

  /**
   * Executes middleware in order before an operation and emits query events.
   *
   * @param params - Operation parameters (model, action, args)
   * @param operation - The operation function to execute
   * @returns The result of the operation after middleware execution
   *
   * @internal This method is used internally by ModelProxy to execute middleware
   */
  async executeWithMiddleware<T>(params: any, operation: () => Promise<T>): Promise<T> {
    // Emit query event before operation
    this.emitEvent('query', {
      model: params.model,
      action: params.action,
      args: params.args,
    });

    if (this.middleware.length === 0) {
      return operation();
    }

    // Build middleware chain
    let index = 0;
    const next = async (): Promise<T> => {
      if (index >= this.middleware.length) {
        return operation();
      }
      const middleware = this.middleware[index++];
      return middleware(params, next);
    };

    return next();
  }

  /**
   * Gets or creates the in-memory store for a model.
   *
   * Each model has its own store (array of records) that holds all data
   * for that model. Stores are created lazily on first access.
   *
   * @param modelName - The name of the Prisma model
   * @returns The array of records for the specified model (empty array if model has no data)
   *
   * @internal This method is used internally by ModelProxy and other components
   */
  getStore(modelName: string): any[] {
    if (!this.stores.has(modelName)) {
      this.stores.set(modelName, []);
    }
    const store = this.stores.get(modelName)!;

    // Build indexes if enabled and not already built
    if (this.options.enableIndexes && store.length > 0) {
      // Check if indexes need to be rebuilt (simple check: if no indexes exist for this model)
      // In a real implementation, we'd track whether indexes are up to date
      // For now, we'll rebuild on first access after data changes
      // This is a simplified approach - in production, we'd track index state
    }

    return store;
  }

  /**
   * Gets the index manager instance if indexes are enabled.
   *
   * The index manager provides fast lookups for findUnique and findFirst operations
   * by maintaining in-memory indexes on model fields.
   *
   * @returns The IndexManager instance if `enableIndexes` is true, otherwise null
   *
   * @internal This method is used by ModelProxy to optimize queries
   *
   * @see {@link PrismockerOptions.enableIndexes} for enabling/disabling indexes
   */
  getIndexManager(): IndexManager | null {
    return this.options.enableIndexes ? this.indexManager : null;
  }

  /**
   * Gets the query cache instance if query caching is enabled.
   *
   * The query cache stores query results and reuses them for identical queries,
   * improving performance for repeated queries.
   *
   * @returns The QueryCache instance if `enableQueryCache` is true, otherwise null
   *
   * @internal This method is used by ModelProxy to cache query results
   *
   * @see {@link PrismockerOptions.enableQueryCache} for enabling/disabling query caching
   */
  getQueryCache(): QueryCache | null {
    return this.options.enableQueryCache ? this.queryCache : null;
  }

  /**
   * Resets all in-memory data, clearing all model stores and resetting Prismocker to its initial state.
   *
   * This method is essential for test isolation. Call it in `beforeEach` or `afterEach`
   * hooks to ensure each test starts with a clean state.
   *
   * **What gets reset:**
   * - All model stores (all data is cleared)
   * - All model proxies (recreated on next access)
   * - All overridden methods (e.g., mocked `$queryRawUnsafe`)
   * - All indexes (if enabled)
   * - Query cache (if enabled)
   * - Query statistics (if debug mode is enabled)
   *
   * @example
   * ```typescript
   * describe('My Tests', () => {
   *   let prisma: PrismaClient;
   *
   *   beforeEach(() => {
   *     prisma = createPrismocker<PrismaClient>();
   *     // Reset before each test for isolation
   *     prisma.reset();
   *   });
   * });
   * ```
   */
  reset(): void {
    this.stores.clear();
    this.modelProxies.clear();
    this.overriddenMethods.clear();
    this.queryStats = [];
    if (this.options.enableIndexes) {
      this.indexManager.clear();
    }
    if (this.options.enableQueryCache) {
      this.queryCache.clear();
    }
    if (this.options.logQueries) {
      this.options.logger?.('[Prismocker] Reset all data');
    }
  }

  /**
   * Enables or disables debug mode for comprehensive logging and statistics tracking.
   *
   * When debug mode is enabled, Prismocker will:
   * - Log all queries with detailed information (query name, arguments, results)
   * - Track query statistics (total queries, duration, operations by model)
   * - Provide enhanced debugging information via `getQueryStats()` and `visualizeState()`
   * - Automatically enable query logging (`logQueries: true`)
   *
   * @param enabled - Whether to enable debug mode. Defaults to `true` if not specified.
   *
   * @example
   * ```typescript
   * const prisma = createPrismocker<PrismaClient>();
   *
   * // Enable debug mode
   * prisma.enableDebugMode();
   *
   * // Perform some operations
   * await prisma.user.findMany();
   * await prisma.user.create({ data: { name: 'John' } });
   *
   * // Get statistics
   * const stats = prisma.getQueryStats();
   * console.log(stats.totalQueries); // 2
   * console.log(stats.queriesByModel); // { user: 2 }
   *
   * // Disable debug mode
   * prisma.enableDebugMode(false);
   * ```
   */
  enableDebugMode(enabled: boolean = true): void {
    this.debugMode = enabled;
    this.options.logQueries = enabled;
    if (enabled && this.options.logQueries) {
      this.options.logger?.('[Prismocker] Debug mode enabled');
    }
  }

  /**
   * Gets detailed statistics about all queries executed since debug mode was enabled or the last reset.
   *
   * Returns comprehensive query statistics including:
   * - Total number of queries executed
   * - Queries grouped by model name
   * - Queries grouped by operation type
   * - Average query duration
   * - Detailed query information (timestamp, duration, arguments, result count)
   *
   * **Note:** Query statistics are only collected when debug mode is enabled.
   * Call `enableDebugMode()` before executing queries to collect statistics.
   *
   * @returns An object containing query statistics with the following structure:
   * - `totalQueries`: Total number of queries executed
   * - `queriesByModel`: Record mapping model names to query counts
   * - `queriesByOperation`: Record mapping operation names to query counts
   * - `averageDuration`: Average query duration in milliseconds
   * - `queries`: Array of detailed query information objects
   *
   * @example
   * ```typescript
   * prisma.enableDebugMode();
   * await prisma.user.findMany();
   * await prisma.user.create({ data: { name: 'John' } });
   *
   * const stats = prisma.getQueryStats();
   * console.log(stats.totalQueries); // 2
   * console.log(stats.queriesByModel); // { user: 2 }
   * console.log(stats.queriesByOperation); // { findMany: 1, create: 1 }
   * console.log(stats.averageDuration); // Average duration in ms
   * ```
   *
   * @see {@link enableDebugMode} for enabling query statistics collection
   */
  getQueryStats(): {
    totalQueries: number;
    queriesByModel: Record<string, number>;
    queriesByOperation: Record<string, number>;
    averageDuration: number;
    queries: Array<{
      modelName: string;
      operation: string;
      timestamp: number;
      duration?: number;
      args?: any;
      resultCount?: number;
    }>;
  } {
    const queriesByModel: Record<string, number> = {};
    const queriesByOperation: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const query of this.queryStats) {
      queriesByModel[query.modelName] = (queriesByModel[query.modelName] || 0) + 1;
      queriesByOperation[query.operation] = (queriesByOperation[query.operation] || 0) + 1;
      if (query.duration !== undefined) {
        totalDuration += query.duration;
        durationCount++;
      }
    }

    return {
      totalQueries: this.queryStats.length,
      queriesByModel,
      queriesByOperation,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      queries: [...this.queryStats],
    };
  }

  /**
   * Visualizes the current internal state of Prismocker as a formatted string.
   *
   * Returns a human-readable representation of:
   * - All model stores with record counts and sample data
   * - Index statistics (if indexes are enabled and `includeIndexes` is true)
   * - Query cache statistics (if query cache is enabled and `includeCache` is true)
   * - Query statistics (if debug mode is enabled and `includeQueryStats` is true)
   *
   * This is extremely useful for debugging test failures, understanding data state,
   * and verifying that operations worked as expected.
   *
   * @param options - Visualization options
   * @param options.maxRecordsPerModel - Maximum number of records to display per model (default: 10)
   * @param options.includeIndexes - Whether to include index statistics (default: false)
   * @param options.includeCache - Whether to include query cache statistics (default: false)
   * @param options.includeQueryStats - Whether to include query statistics (default: false, requires debug mode)
   * @returns A formatted string representation of Prismocker's internal state
   *
   * @example
   * ```typescript
   * prisma.setData('user', [
   *   { id: '1', name: 'Alice' },
   *   { id: '2', name: 'Bob' },
   * ]);
   *
   * const state = prisma.visualizeState({
   *   includeIndexes: true,
   *   includeCache: true,
   *   includeQueryStats: true,
   * });
   * console.log(state);
   * // Output:
   * // === Prismocker State ===
   * // 📦 Stores:
   * //   user: 2 records
   * //     [0] {"id":"1","name":"Alice"}
   * //     [1] {"id":"2","name":"Bob"}
   * // ...
   * ```
   */
  visualizeState(options?: {
    maxRecordsPerModel?: number;
    includeIndexes?: boolean;
    includeCache?: boolean;
  }): string {
    const maxRecords = options?.maxRecordsPerModel ?? 10;
    const includeIndexes = options?.includeIndexes ?? false;
    const includeCache = options?.includeCache ?? false;

    const lines: string[] = [];
    lines.push('=== Prismocker State ===\n');

    // Store data
    lines.push('📦 Stores:');
    for (const [modelName, store] of this.stores.entries()) {
      const recordCount = store.length;
      const displayCount = Math.min(recordCount, maxRecords);
      lines.push(`  ${modelName}: ${recordCount} record${recordCount !== 1 ? 's' : ''}`);
      if (displayCount > 0) {
        for (let i = 0; i < displayCount; i++) {
          const record = store[i];
          const preview = JSON.stringify(record, null, 2)
            .split('\n')
            .slice(0, 3)
            .join('\n');
          lines.push(`    [${i}] ${preview}${record ? '...' : ''}`);
        }
        if (recordCount > maxRecords) {
          lines.push(`    ... and ${recordCount - maxRecords} more`);
        }
      }
      lines.push('');
    }

    // Index statistics
    if (includeIndexes && this.options.enableIndexes) {
      lines.push('🔍 Indexes:');
      const indexStats = this.indexManager.getStats();
      lines.push(`  Models indexed: ${indexStats.modelCount}`);
      lines.push(`  Total indexes: ${indexStats.totalIndexes}`);
      for (const [modelName, modelStats] of Object.entries(indexStats.models)) {
        lines.push(`  ${modelName}:`);
        lines.push(`    Fields: ${modelStats.fields.join(', ')}`);
        lines.push(`    Total entries: ${modelStats.totalEntries}`);
      }
      lines.push('');
    }

    // Cache statistics
    if (includeCache && this.options.enableQueryCache) {
      lines.push('💾 Query Cache:');
      const cacheStats = this.queryCache.getStats();
      lines.push(`  Entries: ${cacheStats.size}/${cacheStats.maxSize}`);
      lines.push(`  TTL: ${cacheStats.ttl}ms`);
      if (cacheStats.entries.length > 0) {
        lines.push(`  Oldest entry: ${cacheStats.entries[0]?.age}ms ago`);
        lines.push(`  Newest entry: ${cacheStats.entries[cacheStats.entries.length - 1]?.age}ms ago`);
      }
      lines.push('');
    }

    // Query statistics
    if (this.debugMode || this.queryStats.length > 0) {
      lines.push('📊 Query Statistics:');
      const stats = this.getQueryStats();
      lines.push(`  Total queries: ${stats.totalQueries}`);
      lines.push(`  Average duration: ${stats.averageDuration.toFixed(2)}ms`);
      lines.push(`  By model: ${JSON.stringify(stats.queriesByModel, null, 2)}`);
      lines.push(`  By operation: ${JSON.stringify(stats.queriesByOperation, null, 2)}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Records a query execution for statistics tracking.
   *
   * This method is called internally by ModelProxy and other components
   * to track query execution for debugging and performance analysis.
   *
   * @param modelName - The name of the model (or undefined for Prisma methods like $queryRaw)
   * @param operation - The operation name (e.g., 'findMany', 'create', '$queryRaw')
   * @param args - The arguments passed to the operation
   * @param resultCount - The number of results returned (if applicable)
   * @param duration - The execution duration in milliseconds
   *
   * @internal This method is called automatically by Prismocker internals
   */
  recordQuery(
    modelName: string,
    operation: string,
    args?: any,
    resultCount?: number,
    duration?: number
  ): void {
    if (this.debugMode || this.options.logQueries) {
      this.queryStats.push({
        modelName,
        operation,
        timestamp: Date.now(),
        args,
        resultCount,
        duration,
      });
    }
  }

  /**
   * Gets all in-memory data for a specific model.
   *
   * Retrieves a copy of all records currently stored in memory for the given model.
   * This is useful for assertions in tests and debugging.
   *
   * @param modelName - The name of the Prisma model (e.g., 'user', 'company', 'job')
   * @returns A copy of the array of records for the specified model (empty array if model has no data)
   *
   * @example
   * ```typescript
   * // Set up test data
   * prisma.setData('user', [
   *   { id: '1', name: 'Alice' },
   *   { id: '2', name: 'Bob' },
   * ]);
   *
   * // Get all data for assertions
   * const users = prisma.getData('user');
   * expect(users).toHaveLength(2);
   * expect(users[0].name).toBe('Alice');
   * ```
   */
  getData(modelName: string): any[] {
    return [...this.getStore(modelName)];
  }

  /**
   * Sets in-memory data for a specific model, replacing any existing data.
   *
   * This is the primary way to seed test data in Prismocker. It directly populates
   * the in-memory store for a given model with the provided data.
   *
   * **Important behaviors:**
   * - Replaces all existing data for the model (does not merge)
   * - Automatically rebuilds indexes if `enableIndexes` is true
   * - Automatically invalidates query cache for the model if `enableQueryCache` is true
   *
   * @param modelName - The name of the Prisma model (e.g., 'user', 'company', 'job')
   * @param data - An array of records to set for the model. Each record should match your Prisma schema.
   *
   * @example
   * ```typescript
   * // Set up initial test data
   * prisma.setData('user', [
   *   { id: '1', name: 'Alice', email: 'alice@example.com' },
   *   { id: '2', name: 'Bob', email: 'bob@example.com' },
   * ]);
   *
   * // Data is immediately available for queries
   * const users = await prisma.user.findMany();
   * expect(users).toHaveLength(2);
   * ```
   *
   * @see {@link getData} for retrieving data
   */
  setData(modelName: string, data: any[]): void {
    this.stores.set(modelName, [...data]);

    // Rebuild indexes after setting data
    if (this.options.enableIndexes) {
      this.indexManager.buildIndexes(modelName, this.stores.get(modelName)!);
    }

    // Invalidate query cache for this model
    if (this.options.enableQueryCache) {
      this.queryCache.invalidateModel(modelName);
    }
  }

  /**
   * Creates a deep snapshot of the current state of all model stores.
   *
   * This method is used internally by `$transaction` to capture the state before
   * executing a transaction. If the transaction fails, the state can be restored
   * from this snapshot to implement rollback functionality.
   *
   * The snapshot includes a deep copy of all records, ensuring that modifications
   * to the snapshot don't affect the original data.
   *
   * @returns A Map mapping model names to arrays of deeply cloned records
   *
   * @internal This method is called automatically by `$transaction` for rollback support
   *
   * @see {@link restoreState} for restoring state from a snapshot
   */
  private snapshotState(): Map<string, any[]> {
    const snapshot = new Map<string, any[]>();
    for (const [modelName, store] of this.stores.entries()) {
      // Deep clone the store array and all records
      snapshot.set(
        modelName,
        store.map((record: any) => {
          if (record === null || typeof record !== 'object') {
            return record;
          }
          if (record instanceof Date) {
            return new Date(record.getTime());
          }
          if (Array.isArray(record)) {
            return record.map((item: any) => {
              if (item === null || typeof item !== 'object') {
                return item;
              }
              if (item instanceof Date) {
                return new Date(item.getTime());
              }
              return { ...item };
            });
          }
          return { ...record };
        })
      );
    }
    return snapshot;
  }

  /**
   * Restores the state of all model stores from a previously created snapshot.
   *
   * This method is used internally by `$transaction` to rollback changes when
   * a transaction fails. It restores all stores to the exact state they were in
   * when the snapshot was created.
   *
   * **Important:** After restoring state, all model proxies are cleared to ensure
   * that new QueryEngine instances are created for subsequent operations, preventing
   * stale state issues.
   *
   * @param snapshot - The snapshot object created by `snapshotState()`
   *
   * @internal This method is called automatically by `$transaction` for rollback support
   *
   * @see {@link snapshotState} for creating a snapshot
   */
  private restoreState(snapshot: Map<string, any[]>): void {
    // Clear current stores
    this.stores.clear();

    // Restore from snapshot
    for (const [modelName, data] of snapshot.entries()) {
      // Deep clone the data again to avoid reference issues
      this.stores.set(
        modelName,
        data.map((record: any) => {
          if (record === null || typeof record !== 'object') {
            return record;
          }
          if (record instanceof Date) {
            return new Date(record.getTime());
          }
          if (Array.isArray(record)) {
            return record.map((item: any) => {
              if (item === null || typeof item !== 'object') {
                return item;
              }
              if (item instanceof Date) {
                return new Date(item.getTime());
              }
              return { ...item };
            });
          }
          return { ...record };
        })
      );
    }

    // Clear model proxies so they get recreated with fresh query engines
    this.modelProxies.clear();

    if (this.options.logQueries) {
      this.options.logger?.('[Prismocker] State restored from snapshot');
    }
  }

  /**
   * Creates a transaction-scoped client that uses snapshot stores for isolation.
   *
   * This method creates a new PrismockerClient instance that uses the snapshot stores
   * instead of the main stores. This ensures that each transaction sees its own isolated
   * state and doesn't interfere with other concurrent transactions.
   *
   * @param snapshot - The snapshot stores to use for this transaction
   * @returns A new PrismockerClient instance with snapshot stores
   *
   * @internal This method is called automatically by `$transaction` for transaction isolation
   */
  private createTransactionClient(snapshot: Map<string, any[]>): PrismockerClient {
    // Create a new client instance with the same options
    const txClient = new PrismockerClient(this.options);
    
    // Replace its stores with the snapshot stores (deep clone to avoid reference issues)
    txClient.stores.clear();
    for (const [modelName, data] of snapshot.entries()) {
      txClient.stores.set(
        modelName,
        data.map((record: any) => {
          if (record === null || typeof record !== 'object') {
            return record;
          }
          if (record instanceof Date) {
            return new Date(record.getTime());
          }
          if (Array.isArray(record)) {
            return record.map((item: any) => {
              if (item === null || typeof item !== 'object') {
                return item;
              }
              if (item instanceof Date) {
                return new Date(item.getTime());
              }
              return { ...item };
            });
          }
          return { ...record };
        })
      );
    }
    
    // Rebuild indexes for transaction client
    if (this.options.enableIndexes) {
      for (const [modelName, data] of txClient.stores.entries()) {
        txClient.indexManager.buildIndexes(modelName, data);
      }
    }
    
    return txClient;
  }

  /**
   * Commits transaction changes by copying snapshot stores back to main stores.
   *
   * After a transaction completes successfully, this method copies all changes
   * from the transaction-scoped client's stores back to the main client's stores.
   *
   * @param snapshot - The original snapshot (not used, but kept for consistency)
   * @param txClient - The transaction-scoped client with committed changes
   *
   * @internal This method is called automatically by `$transaction` after successful commit
   */
  private commitTransaction(snapshot: Map<string, any[]>, txClient: PrismockerClient): void {
    // Copy all stores from transaction client to main client
    for (const [modelName, data] of txClient.stores.entries()) {
      // Deep clone to avoid reference issues
      this.stores.set(
        modelName,
        data.map((record: any) => {
          if (record === null || typeof record !== 'object') {
            return record;
          }
          if (record instanceof Date) {
            return new Date(record.getTime());
          }
          if (Array.isArray(record)) {
            return record.map((item: any) => {
              if (item === null || typeof item !== 'object') {
                return item;
              }
              if (item instanceof Date) {
                return new Date(item.getTime());
              }
              return { ...item };
            });
          }
          return { ...record };
        })
      );
    }
    
    // Rebuild indexes for main client
    if (this.options.enableIndexes) {
      for (const [modelName, data] of this.stores.entries()) {
        this.indexManager.buildIndexes(modelName, data);
      }
    }
    
    // Clear model proxies so they get recreated with fresh query engines
    this.modelProxies.clear();
    
    // Invalidate query cache for all models that were modified
    for (const modelName of txClient.stores.keys()) {
      this.queryCache.invalidateModel(modelName);
    }
    
    if (this.options.logQueries) {
      this.options.logger?.('[Prismocker] Transaction committed to main stores');
    }
  }

  /**
   * Executes simple DML (Data Manipulation Language) statements against in-memory stores.
   *
   * This is a basic SQL parser that supports simple INSERT, UPDATE, and DELETE statements.
   * It's used by `$executeRaw` and `$executeRawUnsafe` when `enableSqlParsing` is true.
   *
   * **Supported SQL patterns:**
   * - `INSERT INTO table (columns) VALUES (values)` - Simple INSERT with explicit columns
   * - `UPDATE table SET column = value WHERE column = value` - Simple UPDATE with equality WHERE
   * - `DELETE FROM table WHERE column = value` - Simple DELETE with equality WHERE
   *
   * **Limitations:**
   * - Only supports simple equality WHERE clauses (e.g., `WHERE id = 'value'`)
   * - Does NOT support: JOINs, subqueries, complex WHERE clauses, transactions, constraints
   * - For complex queries, use a custom `executeRawExecutor` instead
   *
   * @param sqlQuery - The SQL query string to parse and execute
   * @returns The number of affected rows if parsing and execution succeed, or `null` if parsing fails
   *
   * @internal This method is called automatically by `$executeRaw` and `$executeRawUnsafe` when SQL parsing is enabled
   *
   * @see {@link PrismockerOptions.enableSqlParsing} for enabling SQL parsing
   * @see {@link PrismockerOptions.executeRawExecutor} for providing a custom executor
   */
  private executeSimpleDml(sqlQuery: string): number | null {
    const trimmed = sqlQuery.trim().toUpperCase();

    // INSERT statement
    if (trimmed.startsWith('INSERT')) {
      const insertMatch = sqlQuery.match(/INSERT\s+INTO\s+([a-zA-Z_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (insertMatch) {
        const tableName = insertMatch[1].trim();
        const columns = insertMatch[2].split(',').map((c) => c.trim());
        const values = insertMatch[3].split(',').map((v) => {
          const trimmed = v.trim();
          // Remove quotes for strings
          if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
            return trimmed.slice(1, -1);
          }
          // Parse numbers
          if (!isNaN(Number(trimmed))) {
            return Number(trimmed);
          }
          // Parse booleans
          if (trimmed.toLowerCase() === 'true') return true;
          if (trimmed.toLowerCase() === 'false') return false;
          // Parse null
          if (trimmed.toLowerCase() === 'null') return null;
          return trimmed;
        });

        const store = this.getStore(tableName);
        const record: any = {};
        columns.forEach((col, idx) => {
          record[col] = values[idx];
        });
        store.push(record);

        // Update indexes if enabled
        if (this.options.enableIndexes) {
          this.indexManager.addRecord(tableName, record, store.length - 1);
        }

        // Invalidate query cache for this model
        if (this.options.enableQueryCache) {
          this.queryCache.invalidateModel(tableName);
        }

        return 1; // One row inserted
      }
      return null; // Failed to parse
    }

    // UPDATE statement
    if (trimmed.startsWith('UPDATE')) {
      // Match: UPDATE table SET field = value WHERE field = value
      // Handle quoted strings and stop at WHERE clause
      // Pattern: UPDATE table SET field = 'value' WHERE field = 'value'
      // or: UPDATE table SET field = value WHERE field = value
      const updateMatch = sqlQuery.match(/UPDATE\s+([a-zA-Z_]+)\s+SET\s+([a-zA-Z_]+)\s*=\s*((?:'[^']*'|"[^"]*"|[^\s]+))(?:\s+WHERE\s+(.+))?/i);
      if (updateMatch) {
        const tableName = updateMatch[1].trim();
        const setField = updateMatch[2].trim();
        let setValue = updateMatch[3].trim();
        const whereClause = updateMatch[4]?.trim();

        const store = this.getStore(tableName);
        let affectedRows = 0;

        // Parse set value
        let parsedValue: any = setValue;
        if ((setValue.startsWith("'") && setValue.endsWith("'")) || (setValue.startsWith('"') && setValue.endsWith('"'))) {
          parsedValue = setValue.slice(1, -1);
        } else if (!isNaN(Number(setValue))) {
          parsedValue = Number(setValue);
        } else if (setValue.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (setValue.toLowerCase() === 'false') {
          parsedValue = false;
        } else if (setValue.toLowerCase() === 'null') {
          parsedValue = null;
        }

        for (let i = 0; i < store.length; i++) {
          const record = store[i];
          let shouldUpdate = true;

          // Apply WHERE clause if present
          if (whereClause) {
            const whereMatch = whereClause.match(/([a-zA-Z_]+)\s*=\s*(.+)/);
            if (whereMatch) {
              const whereField = whereMatch[1].trim();
              let whereValue: any = whereMatch[2].trim();
              // Parse where value
              if ((whereValue.startsWith("'") && whereValue.endsWith("'")) || (whereValue.startsWith('"') && whereValue.endsWith('"'))) {
                whereValue = whereValue.slice(1, -1);
              } else if (!isNaN(Number(whereValue))) {
                whereValue = Number(whereValue);
              } else if (whereValue.toLowerCase() === 'true') {
                whereValue = true;
              } else if (whereValue.toLowerCase() === 'false') {
                whereValue = false;
              } else if (whereValue.toLowerCase() === 'null') {
                whereValue = null;
              }
              shouldUpdate = record[whereField] === whereValue;
            } else {
              // WHERE clause didn't match - no records will be updated
              shouldUpdate = false;
            }
          }

          if (shouldUpdate) {
            const oldRecord = { ...record };
            record[setField] = parsedValue;

            // Update indexes if enabled
            if (this.options.enableIndexes) {
              this.indexManager.updateRecord(tableName, i, oldRecord, record);
            }

            affectedRows++;
          }
        }

        // Invalidate query cache for this model
        if (this.options.enableQueryCache && affectedRows > 0) {
          this.queryCache.invalidateModel(tableName);
        }

        return affectedRows;
      }
      return null; // Failed to parse
    }

    // DELETE statement
    if (trimmed.startsWith('DELETE')) {
      const deleteMatch = sqlQuery.match(/DELETE\s+FROM\s+([a-zA-Z_]+)(?:\s+WHERE\s+(.+))?/i);
      if (deleteMatch) {
        const tableName = deleteMatch[1].trim();
        const whereClause = deleteMatch[2]?.trim();

        const store = this.getStore(tableName);
        let affectedRows = 0;
        const indicesToDelete: number[] = [];

        for (let i = store.length - 1; i >= 0; i--) {
          const record = store[i];
          let shouldDelete = true;

          // Apply WHERE clause if present
          if (whereClause) {
            const whereMatch = whereClause.match(/([a-zA-Z_]+)\s*=\s*(.+)/);
            if (whereMatch) {
              const whereField = whereMatch[1].trim();
              let whereValue: any = whereMatch[2].trim();
              // Parse where value
              if ((whereValue.startsWith("'") && whereValue.endsWith("'")) || (whereValue.startsWith('"') && whereValue.endsWith('"'))) {
                whereValue = whereValue.slice(1, -1);
              } else if (!isNaN(Number(whereValue))) {
                whereValue = Number(whereValue);
              } else if (whereValue.toLowerCase() === 'true') {
                whereValue = true;
              } else if (whereValue.toLowerCase() === 'false') {
                whereValue = false;
              } else if (whereValue.toLowerCase() === 'null') {
                whereValue = null;
              }
              shouldDelete = record[whereField] === whereValue;
            }
          }

          if (shouldDelete) {
            indicesToDelete.push(i);
            affectedRows++;
          }
        }

        // Delete records in reverse order to maintain indices
        for (const idx of indicesToDelete) {
          const record = store[idx];

          // Remove from indexes if enabled
          if (this.options.enableIndexes) {
            this.indexManager.removeRecord(tableName, idx, record);
          }

          store.splice(idx, 1);
        }

        // Invalidate query cache for this model
        if (this.options.enableQueryCache && affectedRows > 0) {
          this.queryCache.invalidateModel(tableName);
        }

        return affectedRows;
      }
      return null; // Failed to parse
    }

    return null; // Not a supported DML statement
  }
}
