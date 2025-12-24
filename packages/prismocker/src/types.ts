/**
 * Configuration options for Prismocker behavior.
 *
 * These options control various aspects of Prismocker's functionality, including
 * logging, validation, performance optimizations, and custom executors.
 *
 * @example
 * ```typescript
 * const prisma = createPrismocker<PrismaClient>({
 *   logQueries: true,
 *   enableIndexes: true,
 *   enableQueryCache: true,
 *   validateWithZod: true,
 * });
 * ```
 */
export interface PrismockerOptions {
  /**
   * Whether to log queries (useful for debugging)
   * @default false
   */
  logQueries?: boolean;

  /**
   * Custom logger function
   * @default console.log
   */
  logger?: (message: string, data?: any) => void;

  /**
   * Enable Zod schema validation for create/update operations
   *
   * When enabled, Prismocker will validate data against generated Zod schemas
   * if they are available. This requires prisma-zod-generator to be configured.
   *
   * @default false
   */
  validateWithZod?: boolean;

  /**
   * Path to generated Zod schemas
   *
   * Defaults to '@prisma/zod' or '@heyclaude/database-types/prisma/zod'
   * depending on your generator configuration.
   *
   * @default '@prisma/zod'
   */
  zodSchemasPath?: string;

  /**
   * Custom Zod schema loader function
   *
   * Allows custom loading logic for Zod schemas (e.g., from custom paths).
   *
   * @param modelName - Model name (e.g., 'companies', 'jobs')
   * @param operation - Operation type ('create', 'update', 'where', etc.)
   * @returns Zod schema or undefined if not available
   */
  zodSchemaLoader?: (
    modelName: string,
    operation: 'create' | 'update' | 'where' | 'select' | 'include'
  ) => Promise<any> | any | undefined;

  /**
   * Enable index manager for performance optimization
   *
   * When enabled, Prismocker maintains indexes for:
   * - Primary keys (id fields) - for fast findUnique lookups
   * - Foreign keys (fields ending in _id) - for fast relation loading
   * - Custom indexes - for frequently filtered fields
   *
   * @default true
   */
  enableIndexes?: boolean;

  /**
   * Index configuration per model
   *
   * Allows fine-grained control over which fields are indexed for each model.
   */
  indexConfig?: Record<string, import('./index-manager.js').IndexConfig>;

  /**
   * Enable query result caching for performance optimization
   *
   * When enabled, Prismocker caches query results and reuses them for identical queries.
   * Cache is automatically invalidated when data changes (create, update, delete, setData).
   *
   * @default false
   */
  enableQueryCache?: boolean;

  /**
   * Maximum number of cache entries to store
   *
   * When the cache reaches this size, oldest entries are evicted (LRU).
   *
   * @default 100
   */
  queryCacheMaxSize?: number;

  /**
   * Time to live for cache entries in milliseconds
   *
   * If set to 0 (default), cache entries never expire based on time (only invalidated on data changes).
   * If set to a positive number, cache entries expire after this many milliseconds.
   *
   * @default 0 (no expiration)
   */
  queryCacheTTL?: number;

  /**
   * Enable lazy relation loading
   *
   * When enabled, relations are loaded on-demand when accessed, rather than eagerly.
   * This can improve memory usage for large datasets with many relations.
   *
   * @default false
   */
  enableLazyRelations?: boolean;

  /**
   * Custom executor for $queryRaw and $queryRawUnsafe
   *
   * Allows you to provide custom logic for executing raw SQL queries.
   * If not provided, Prismocker will attempt to parse and execute simple SELECT queries
   * against the in-memory stores, or return an empty array for other queries.
   *
   * @param query - SQL query string
   * @param values - Query parameter values
   * @param stores - Map of model stores (read-only access)
   * @returns Query results (array of objects)
   */
  queryRawExecutor?: (
    query: string,
    values: any[],
    stores: ReadonlyMap<string, any[]>
  ) => Promise<any[]> | any[];

  /**
   * Enable SQL parsing for $queryRaw and $queryRawUnsafe
   *
   * When enabled, Prismocker will attempt to parse simple SELECT queries
   * and execute them against the in-memory stores.
   *
   * Supported query types:
   * - Simple SELECT queries (SELECT * FROM table_name)
   * - SELECT with WHERE clauses (basic equality)
   * - SELECT with LIMIT/OFFSET
   *
   * Complex queries (JOINs, subqueries, etc.) will fall back to custom executor or return empty array.
   *
   * @default false
   */
  enableSqlParsing?: boolean;

  /**
   * Custom executor for $executeRaw and $executeRawUnsafe
   *
   * Allows you to provide custom logic for executing raw SQL DML/DDL statements
   * (INSERT, UPDATE, DELETE, etc.). If not provided, Prismocker will attempt to parse
   * and execute simple DML statements against the in-memory stores, or return 0
   * for other statements.
   *
   * @param query - SQL query string
   * @param values - Query parameter values
   * @param stores - Map of model stores (read-write access for DML operations)
   * @returns Number of affected rows
   */
  executeRawExecutor?: (
    query: string,
    values: any[],
    stores: Map<string, any[]>
  ) => Promise<number> | number;
}

