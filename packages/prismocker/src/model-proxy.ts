/**
 * ModelProxy - Provides Prisma model operations for a specific model.
 *
 * This class implements all Prisma model operations (findMany, findUnique, create, update, delete, etc.)
 * for a single Prisma model. Each model in Prismocker has its own ModelProxy instance that handles
 * all operations for that model, including filtering, sorting, relations, aggregations, and more.
 *
 * ModelProxy instances are created lazily when you access a model property (e.g., `prisma.user`).
 *
 * @example
 * ```typescript
 * const prisma = createPrismocker<PrismaClient>();
 *
 * // ModelProxy is created automatically when accessing prisma.user
 * const users = await prisma.user.findMany();
 * const user = await prisma.user.create({ data: { name: 'John' } });
 * ```
 *
 * @internal This class is used internally by PrismockerClient and is not directly instantiated by users
 */
import type { PrismockerOptions } from './types.js';
import { QueryEngine } from './query-engine.js';
import { loadZodSchema, validateWithZod } from './prisma-ecosystem.js';

export class ModelProxy {
  private modelName: string;
  private client: any;
  private queryEngine: QueryEngine;
  private options: PrismockerOptions;

  constructor(
    modelName: string,
    client: any,
    queryEngine: QueryEngine,
    options: PrismockerOptions
  ) {
    this.modelName = modelName;
    this.client = client;
    this.queryEngine = queryEngine;
    this.options = options;

    // Set relation loader for relation filters (some, every, none)
    this.queryEngine.setRelationLoader((record: any, relationName: string) => {
      return this.loadRelationForFilter(record, relationName);
    });
  }

  /**
   * Finds multiple records matching the specified criteria.
   *
   * This is the primary method for querying multiple records. It supports:
   * - Filtering with `where` clause (all Prisma operators)
   * - Sorting with `orderBy`
   * - Pagination with `skip` and `take`
   * - Field selection with `select`
   * - Relation inclusion with `include`
   * - Query result caching (if enabled)
   * - Index optimization (if enabled)
   *
   * @param args - Query arguments
   * @param args.where - Filter conditions (optional)
   * @param args.orderBy - Sort order (optional)
   * @param args.skip - Number of records to skip (optional)
   * @param args.take - Maximum number of records to return (optional)
   * @param args.select - Fields to select (optional, supports relations)
   * @param args.include - Relations to include (optional, supports nested relations)
   * @returns Promise resolving to an array of matching records
   *
   * @example
   * ```typescript
   * // Basic query
   * const users = await prisma.user.findMany();
   *
   * // With filtering
   * const activeUsers = await prisma.user.findMany({
   *   where: { status: 'active' },
   * });
   *
   * // With sorting and pagination
   * const recentUsers = await prisma.user.findMany({
   *   where: { status: 'active' },
   *   orderBy: { createdAt: 'desc' },
   *   skip: 0,
   *   take: 10,
   * });
   *
   * // With relations
   * const usersWithPosts = await prisma.user.findMany({
   *   include: { posts: true },
   * });
   * ```
   */
  async findMany(args?: any): Promise<any[]> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'findMany',
        args,
      },
      async () => {
        const startTime = Date.now();
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.findMany`, { args });
        }

        // Check query cache first
    const queryCache = this.client.getQueryCache();
    if (queryCache) {
      const cached = queryCache.get(this.modelName, 'findMany', args);
      if (cached !== null) {
        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'findMany', args, cached.length, duration);
        return cached;
      }
    }

    const store = this.client.getStore(this.modelName);
    let results = [...store];

    // Apply where clause
    if (args?.where) {
      results = this.queryEngine.filter(results, args.where);
    }

    // Apply orderBy
    if (args?.orderBy) {
      results = this.queryEngine.sort(results, args.orderBy);
    }

    // Apply skip
    if (args?.skip !== undefined) {
      results = results.slice(args.skip);
    }

    // Apply take
    if (args?.take !== undefined) {
      results = results.slice(0, args.take);
    }

    // Apply select (with relation support)
    if (args?.select) {
      results = results.map((record) => this.applySelect(record, args.select));
    }

    // Apply include (with relation support)
    if (args?.include) {
      results = results.map((record) => this.applyInclude(record, args.include));
    }

    // Cache the result
    if (queryCache) {
      queryCache.set(this.modelName, 'findMany', args, results);
    }

        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'findMany', args, results.length, duration);
        return results;
      }
    );
  }

  /**
   * Apply select clause to a record (supports relations)
   */
  private applySelect(record: any, select: any): any {
    const selected: any = {};

    for (const key in select) {
      const selectValue = select[key];

      // Direct field selection (boolean true)
      if (selectValue === true) {
        // Check if this is a relation (not a direct field on the record)
        // Relations are typically not direct fields, so if key is not in record, it might be a relation
        if (key in record) {
          selected[key] = record[key];
        } else {
          // This might be a relation - try to load it
          // For lazy loading, create a getter
          if (this.options.enableLazyRelations) {
            let lazyValue: any = undefined;
            let lazyLoaded = false;
            Object.defineProperty(selected, key, {
              get: () => {
                if (!lazyLoaded) {
                  lazyValue = this.loadRelation(record, key, {});
                  lazyLoaded = true;
                }
                return lazyValue;
              },
              enumerable: true,
              configurable: true,
            });
          } else {
            // Eager loading: load immediately
            const relationData = this.loadRelation(record, key, {});
            if (relationData !== undefined) {
              selected[key] = relationData;
            }
          }
        }
      }
      // Relation selection (object with nested select)
      else if (selectValue && typeof selectValue === 'object' && !Array.isArray(selectValue)) {
        // Lazy loading: return a Proxy that loads on access
        // Note: For arrays, we return the actual array (loaded lazily) to support Array.isArray checks
        // The array is still lazy-loaded (only loaded on first property access)
        if (this.options.enableLazyRelations) {
          // For lazy loading, we create a getter that loads on first access
          // This allows Array.isArray() to work correctly
          let lazyValue: any = undefined;
          let lazyLoaded = false;
          Object.defineProperty(selected, key, {
            get: () => {
              if (!lazyLoaded) {
                lazyValue = this.loadRelation(record, key, selectValue);
                lazyLoaded = true;
              }
              return lazyValue;
            },
            enumerable: true,
            configurable: true,
          });
        } else {
          // Eager loading: load immediately
          const relationData = this.loadRelation(record, key, selectValue);
          if (relationData !== undefined) {
            selected[key] = relationData;
          }
        }
      }
    }

    return selected;
  }

  /**
   * Apply include clause to a record (supports relations)
   *
   * Unlike select, include includes all fields by default and only adds relation data.
   * If a relation has nested select/include, those are applied to the relation data.
   */
  private applyInclude(record: any, include: any, recordModelName?: string): any {
    // Start with all fields from the record
    const included: any = { ...record };

    // Use the provided model name, or fall back to this model name
    // This is important for nested relations where the record belongs to a different model
    const modelName = recordModelName || this.modelName;

    for (const key in include) {
      const includeValue = include[key];

      // Relation inclusion (boolean true or object with nested select/include)
      if (
        includeValue === true ||
        (includeValue && typeof includeValue === 'object' && !Array.isArray(includeValue))
      ) {
        // If it's just true, load the relation with all fields
        // If it's an object, it may have nested select/include
        const relationConfig = includeValue === true ? {} : includeValue;

        // For nested relations, we need to use the correct model context
        // Create a temporary ModelProxy for the record's model if it's different
        if (modelName !== this.modelName) {
          // Use the related model's ModelProxy to load nested relations
          const relatedModelProxy = this.client.getModel(modelName);
          if (relatedModelProxy) {
            // Load relation using the related model's context
            const relationData = relatedModelProxy['loadRelation'](record, key, relationConfig);
            if (relationData !== undefined) {
              included[key] = relationData;
            }
            continue;
          }
        }

        // Lazy loading: return a getter that loads on access
        // Note: For arrays, we return the actual array (loaded lazily) to support Array.isArray checks
        // The array is still lazy-loaded (only loaded on first property access)
        if (this.options.enableLazyRelations) {
          // For lazy loading, we create a getter that loads on first access
          // This allows Array.isArray() to work correctly
          let lazyValue: any = undefined;
          let lazyLoaded = false;
          Object.defineProperty(included, key, {
            get: () => {
              if (!lazyLoaded) {
                lazyValue = this.loadRelation(record, key, relationConfig);
                lazyLoaded = true;
              }
              return lazyValue;
            },
            enumerable: true,
            configurable: true,
          });
        } else {
          // Eager loading: load immediately
          const relationData = this.loadRelation(record, key, relationConfig);
          if (relationData !== undefined) {
            included[key] = relationData;
          }
        }
      }
    }

    return included;
  }

  /**
   * Create a lazy relation proxy that loads data on first access
   */
  private createLazyRelation(
    record: any,
    relationName: string,
    relationConfig: any
  ): any {
    let cachedValue: any = undefined;
    let loaded = false;

    // Create a Proxy that intercepts property access
    // For arrays, we need to return the actual array to pass Array.isArray checks
    // For objects, we can return a Proxy that loads on access
    return new Proxy(
      {},
      {
        get: (_target, prop: string | symbol) => {
          // Load relation data on first access
          if (!loaded) {
            cachedValue = this.loadRelation(record, relationName, relationConfig);
            loaded = true;
          }

          // For arrays, return the actual array when accessed directly (not via a property)
          // This allows Array.isArray() to work correctly
          // The array is still lazy-loaded (only loaded on first access)
          if (Array.isArray(cachedValue)) {
            // Return the actual array for direct access (e.g., Array.isArray check)
            // But still support property access for array methods
            if (prop === Symbol.toPrimitive || prop === 'valueOf') {
              return () => cachedValue;
            }
            // Return array methods and properties
            if (prop === 'length') {
              return cachedValue.length;
            }
            if (typeof prop === 'string' && /^\d+$/.test(prop)) {
              return cachedValue[Number(prop)];
            }
            if (prop === Symbol.iterator || prop === 'forEach' || prop === 'map' || prop === 'filter' || prop === 'find' || prop === 'some' || prop === 'every') {
              return cachedValue[prop as keyof typeof cachedValue];
            }
            // For any other access, return the actual array
            // This allows Array.isArray() and other checks to work
            return cachedValue[prop as keyof typeof cachedValue];
          }

          // Handle object access (for one-to-one relations)
          if (cachedValue && typeof cachedValue === 'object' && !Array.isArray(cachedValue)) {
            return cachedValue[prop as keyof typeof cachedValue];
          }

          // Fallback
          return cachedValue;
        },
        has: (_target, prop: string | symbol) => {
          if (!loaded) {
            cachedValue = this.loadRelation(record, relationName, relationConfig);
            loaded = true;
          }
          if (Array.isArray(cachedValue)) {
            return prop in cachedValue || prop === 'length';
          }
          if (cachedValue && typeof cachedValue === 'object') {
            return prop in cachedValue;
          }
          return false;
        },
        ownKeys: (_target) => {
          if (!loaded) {
            cachedValue = this.loadRelation(record, relationName, relationConfig);
            loaded = true;
          }
          if (Array.isArray(cachedValue)) {
            return Array.from({ length: cachedValue.length }, (_, i) => String(i));
          }
          if (cachedValue && typeof cachedValue === 'object') {
            return Object.keys(cachedValue);
          }
          return [];
        },
        // Make the Proxy behave like the actual value for type checks
        // This allows Array.isArray() and instanceof checks to work
        getPrototypeOf: (_target) => {
          if (!loaded) {
            cachedValue = this.loadRelation(record, relationName, relationConfig);
            loaded = true;
          }
          if (Array.isArray(cachedValue)) {
            return Array.prototype;
          }
          if (cachedValue && typeof cachedValue === 'object') {
            return Object.getPrototypeOf(cachedValue);
          }
          return Object.prototype;
        },
      }
    );
  }

  /**
   * Load relation data for filtering (used by relation filters: some, every, none)
   * This is a simplified version that just loads the relation data without select/include
   */
  private loadRelationForFilter(record: any, relationName: string): any[] | any | null {
    // Use the same logic as loadRelation but without select/include
    return this.loadRelation(record, relationName, {});
  }

  /**
   * Load relation data for a record
   * Supports common Prisma relation patterns:
   * - One-to-many: relation name is plural, foreign key on related model
   * - One-to-one: relation name is singular OR plural (optional), foreign key on related model or this model
   *
   * IMPORTANT: Some one-to-one relations have plural names (e.g., jobs.companies).
   * We detect this by checking if the reverse foreign key exists on the source record.
   */
  private loadRelation(record: any, relationName: string, relationSelect: any): any {
    // Infer the related model name
    // Common pattern: relation name matches model name (e.g., "jobs" -> "jobs" model)
    // Handle singular/plural: "profile" -> "profiles", "post" -> "posts"
    let relatedModelName = relationName;
    
    // Try singular relation name first (e.g., "profile" -> "profiles")
    if (!relationName.endsWith('s') && relationName.length > 1) {
      const pluralName = `${relationName}s`;
      const pluralStore = this.client.getStore(pluralName);
      if (pluralStore) {
        relatedModelName = pluralName;
      }
    }
    
    // If plural name doesn't exist, try the original name
    if (relatedModelName === relationName) {
      const originalStore = this.client.getStore(relationName);
      if (!originalStore) {
        // Try singular version of plural relation name (e.g., "profiles" -> "profile")
        if (relationName.endsWith('s') && relationName.length > 1) {
          const singularName = relationName.slice(0, -1);
          const singularStore = this.client.getStore(singularName);
          if (singularStore) {
            relatedModelName = singularName;
          }
        }
      }
    }

    const relatedStore = this.client.getStore(relatedModelName);
    if (!relatedStore) {
      // Model doesn't exist, return empty array/null based on relation name pattern
      return relationName.endsWith('s') && relationName.length > 1 ? [] : null;
    }

    // Infer foreign key field name
    // For jobs.companies: foreign key is "company_id" on jobs model (reverse direction)
    // For companies.jobs: foreign key is "company_id" on jobs model (forward direction)
    const forwardForeignKey = this.inferForeignKeyField(this.modelName, relatedModelName);
    const reverseForeignKey = this.inferForeignKeyField(relatedModelName, this.modelName);

    // Try to find the actual foreign key by checking what fields exist in related store
    // This handles cases where the foreign key doesn't follow the standard pattern
    // (e.g., user_collections -> collection_items uses "collection_id" not "user_collection_id")
    const findActualForeignKey = (candidateKeys: string[]): string | null => {
      if (relatedStore.length === 0) {
        return candidateKeys[0] || null; // Return first candidate if no data to check
      }

      // Check which candidate key actually exists in the data
      const sampleRecord = relatedStore[0];
      for (const key of candidateKeys) {
        if (key in sampleRecord) {
          return key;
        }
      }

      return candidateKeys[0] || null; // Fallback to first candidate
    };

    // Generate alternative foreign key patterns to try
    const generateForeignKeyCandidates = (fromModel: string, toModel: string): string[] => {
      const candidates: string[] = [];

      // Standard pattern: {singularFromModelName}_id
      const singularFrom = this.toSingular(fromModel);
      const snakeCaseFrom = this.toSnakeCase(singularFrom);
      candidates.push(`${snakeCaseFrom}_id`);

      // Alternative: {singularToModelName}_id (for cases like user_collections -> collection_items)
      const singularTo = this.toSingular(toModel);
      const snakeCaseTo = this.toSnakeCase(singularTo);
      if (snakeCaseTo !== snakeCaseFrom) {
        candidates.push(`${snakeCaseTo}_id`);
      }

      // Alternative: {fromModelName}_id (without singularization)
      const fromSnakeCase = this.toSnakeCase(fromModel);
      if (fromSnakeCase !== snakeCaseFrom) {
        candidates.push(`${fromSnakeCase}_id`);
      }

      // Enhanced: Try removing common suffixes from singularTo
      // e.g., "collection_item" -> try "collection_id" (removes "_item")
      // Common suffixes to try removing: _item, _items, _collection, _collections, _user, _users, etc.
      const commonSuffixes = [
        '_item',
        '_items',
        '_collection',
        '_collections',
        '_user',
        '_users',
        '_job',
        '_jobs',
        '_content',
        '_contents',
        '_option',
        '_options',
        '_question',
        '_questions',
      ];
      for (const suffix of commonSuffixes) {
        if (snakeCaseTo.endsWith(suffix)) {
          const withoutSuffix = snakeCaseTo.slice(0, -suffix.length);
          if (withoutSuffix && withoutSuffix !== snakeCaseFrom) {
            candidates.push(`${withoutSuffix}_id`);
          }
        }
      }

      // Also try removing the last word if it's a common word
      // e.g., "collection_item" -> "collection"
      const words = snakeCaseTo.split('_');
      if (words.length > 1) {
        const commonWords = [
          'item',
          'items',
          'collection',
          'collections',
          'user',
          'users',
          'job',
          'jobs',
          'content',
          'contents',
          'option',
          'options',
          'question',
          'questions',
        ];
        const lastWord = words[words.length - 1];
        if (commonWords.includes(lastWord)) {
          const withoutLastWord = words.slice(0, -1).join('_');
          if (withoutLastWord && withoutLastWord !== snakeCaseFrom) {
            candidates.push(`${withoutLastWord}_id`);
          }
        }
      }

      // Special case: If fromModel and toModel share a common prefix, try extracting the shared part
      // e.g., quiz_questions -> quiz_options: try "question_id" (shared "quiz_" prefix, extract "question" from "questions")
      const fromWords = fromSnakeCase.split('_');
      const toWords = snakeCaseTo.split('_');
      if (fromWords.length > 1 && toWords.length > 1) {
        // Find common prefix
        let commonPrefixLength = 0;
        for (let i = 0; i < Math.min(fromWords.length, toWords.length); i++) {
          if (fromWords[i] === toWords[i]) {
            commonPrefixLength = i + 1;
          } else {
            break;
          }
        }
        // If they share a prefix, try extracting the key part from fromModel
        // e.g., quiz_questions -> extract "questions" -> singularize to "question" -> try "question_id"
        if (commonPrefixLength > 0 && fromWords.length > commonPrefixLength) {
          const keyPart = fromWords[commonPrefixLength]; // "questions" from "quiz_questions"
          if (keyPart && keyPart !== 'id') {
            // Singularize the key part (e.g., "questions" -> "question")
            const singularKeyPart = this.toSingular(keyPart);
            if (singularKeyPart && singularKeyPart !== keyPart) {
              candidates.push(`${singularKeyPart}_id`); // "question_id"
            }
            // Also try the original (non-singularized) version
            candidates.push(`${keyPart}_id`); // "questions_id"
          }
        }
      }

      return candidates;
    };

    // Determine relation direction:
    // - If relation name is plural, it's usually one-to-many (foreign key on related model)
    // - BUT: some one-to-one relations have plural names (e.g., jobs.companies)
    // - Check if foreign key exists on THIS model first (reverse direction) - if so, it's one-to-one
    const isOneToMany =
      relationName.endsWith('s') && relationName.length > 1 && !record[reverseForeignKey];

    if (isOneToMany) {
      // One-to-many: find all related records where foreign key matches this record's id
      // e.g., for companies.jobs: find all jobs where jobs.company_id === company.id
      // Try multiple foreign key patterns
      const forwardCandidates = generateForeignKeyCandidates(this.modelName, relatedModelName);
      const actualForwardKey = findActualForeignKey(forwardCandidates) || forwardForeignKey;

      // Determine which field on the source record to use for matching
      // Priority: If foreign key field name exists on source record, use it (handles non-PK references)
      // Otherwise, use primary key (standard case)
      // This handles cases like quiz_options.question_id referencing quiz_questions.question_id (not id)
      const sourceMatchField = actualForwardKey in record ? actualForwardKey : 'id';
      const sourceMatchValue = record[sourceMatchField];

      const relatedRecords = relatedStore.filter((relatedRecord: any) => {
        return relatedRecord[actualForwardKey] === sourceMatchValue;
      });

      // Apply nested select/include to related records
      // Use the related model's context for nested relations
      if (relationSelect.select) {
        return relatedRecords.map((relatedRecord: any) =>
          this.applySelect(relatedRecord, relationSelect.select)
        );
      }
      if (relationSelect.include) {
        return relatedRecords.map((relatedRecord: any) => {
          // Use the related model's ModelProxy to apply nested includes
          const relatedModelProxy = this.client.getModel(relatedModelName);
          if (relatedModelProxy) {
            return relatedModelProxy['applyInclude'](relatedRecord, relationSelect.include, relatedModelName);
          }
          // Fallback to current model's applyInclude
          return this.applyInclude(relatedRecord, relationSelect.include, relatedModelName);
        });
      }

      return relatedRecords;
    } else {
      // One-to-one: find single related record
      // Try reverse first: foreign key on this model pointing to related model
      // e.g., for jobs.companies: find company where company.id === job.company_id
      if (reverseForeignKey && record[reverseForeignKey]) {
        const relatedRecord = relatedStore.find((relatedRecord: any) => {
          return relatedRecord.id === record[reverseForeignKey];
        });

        if (relatedRecord) {
          if (relationSelect.select) {
            return this.applySelect(relatedRecord, relationSelect.select);
          }
          if (relationSelect.include) {
            // Use the related model's ModelProxy to apply nested includes
            const relatedModelProxy = this.client.getModel(relatedModelName);
            if (relatedModelProxy) {
              return relatedModelProxy['applyInclude'](relatedRecord, relationSelect.include, relatedModelName);
            }
            // Fallback to current model's applyInclude
            return this.applyInclude(relatedRecord, relationSelect.include, relatedModelName);
          }
          return relatedRecord;
        }
      }

      // Try forward: foreign key on related model pointing to this model
      // e.g., for users.profile: find profile where profile.user_id === user.id
      // Try multiple foreign key patterns
      const forwardCandidates = generateForeignKeyCandidates(this.modelName, relatedModelName);
      const actualForwardKey = findActualForeignKey(forwardCandidates) || forwardForeignKey;

      // Determine which field on the source record to use for matching
      // Priority: If foreign key field name exists on source record, use it (handles non-PK references)
      // Otherwise, use primary key (standard case)
      const sourceMatchField = actualForwardKey in record ? actualForwardKey : 'id';
      const sourceMatchValue = record[sourceMatchField];

      const relatedRecord = relatedStore.find((relatedRecord: any) => {
        return relatedRecord[actualForwardKey] === sourceMatchValue;
      });

      if (relatedRecord) {
        if (relationSelect.select) {
          return this.applySelect(relatedRecord, relationSelect.select);
        }
        if (relationSelect.include) {
          // Use the related model's ModelProxy to apply nested includes
          const relatedModelProxy = this.client.getModel(relatedModelName);
          if (relatedModelProxy) {
            return relatedModelProxy['applyInclude'](relatedRecord, relationSelect.include, relatedModelName);
          }
          // Fallback to current model's applyInclude
          return this.applyInclude(relatedRecord, relationSelect.include, relatedModelName);
        }
        return relatedRecord;
      }

      return null;
    }
  }

  /**
   * Infer foreign key field name on the related model
   *
   * For a relation from modelA to modelB, the foreign key is typically on modelB
   * and named {singularModelA}_id
   *
   * @param fromModelName - The model that owns the relation (e.g., "companies")
   * @param toModelName - The related model (e.g., "jobs")
   * @returns Foreign key field name (e.g., "company_id")
   */
  private inferForeignKeyField(fromModelName: string, toModelName: string): string {
    // Common patterns:
    // 1. {singularFromModelName}_id (snake_case) - e.g., "company_id" for companies -> jobs
    // 2. {singularFromModelName}Id (camelCase) - e.g., "companyId" for companies -> jobs

    // Convert fromModelName to singular and snake_case
    const singularFromModelName = this.toSingular(fromModelName);
    const snakeCase = this.toSnakeCase(singularFromModelName);

    // Try snake_case pattern first (most common in Prisma)
    // Also try camelCase as fallback
    const snakeCaseKey = `${snakeCase}_id`;
    const camelCaseKey = `${this.toCamelCase(singularFromModelName)}Id`;

    // Check which pattern exists in the related model's data (if any)
    // For now, default to snake_case as it's most common
    return snakeCaseKey;
  }

  /**
   * Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .split('_')
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
  }

  /**
   * Convert plural word to singular (basic implementation)
   */
  private toSingular(word: string): string {
    // Basic pluralization rules
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es') && word.length > 3) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && word.length > 1) {
      return word.slice(0, -1);
    }
    return word;
  }

  /**
   * Convert camelCase or PascalCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Finds a single record that matches the unique constraint specified in the `where` clause.
   *
   * This method expects exactly 0 or 1 matching records. If multiple records match,
   * it throws an error indicating a unique constraint violation.
   *
   * **Supported features:**
   * - Unique constraint validation (throws error if multiple records match)
   * - Index optimization for fast lookups (if enabled)
   * - Field selection with `select`
   * - Relation inclusion with `include`
   * - Query result caching (if enabled)
   *
   * @param args - Query arguments
   * @param args.where - Unique constraint fields (e.g., `{ id: 'user-1' }` or `{ email: 'user@example.com' }`)
   * @param args.select - Fields to select (optional, supports relations)
   * @param args.include - Relations to include (optional, supports nested relations)
   * @returns Promise resolving to the matching record, or `null` if no record matches
   * @throws {Error} If multiple records match the unique constraint
   *
   * @example
   * ```typescript
   * // Find by ID
   * const user = await prisma.user.findUnique({
   *   where: { id: 'user-1' },
   * });
   *
   * // Find by unique field
   * const user = await prisma.user.findUnique({
   *   where: { email: 'user@example.com' },
   * });
   *
   * // With relations
   * const user = await prisma.user.findUnique({
   *   where: { id: 'user-1' },
   *   include: { posts: true },
   * });
   * ```
   */
  async findUnique(args: { where: any; select?: any; include?: any }): Promise<any | null> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'findUnique',
        args,
      },
      async () => {
        const startTime = Date.now();
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.findUnique`, { args });
        }

        // Check query cache first
    const queryCache = this.client.getQueryCache();
    if (queryCache) {
      const cached = queryCache.get(this.modelName, 'findUnique', args);
      if (cached !== null) {
        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'findUnique', args, cached.length, duration);
        return cached.length > 0 ? cached[0] : null;
      }
    }

    const store = this.client.getStore(this.modelName);
    let results: any[];

    // Try to use index for simple equality lookups (e.g., { id: 'value' })
    const indexManager = this.client.getIndexManager();
    if (indexManager && args.where) {
      const whereKeys = Object.keys(args.where);
      // If where clause is a simple equality on a single field, try index lookup
      if (whereKeys.length === 1) {
        const fieldName = whereKeys[0];
        const fieldValue = args.where[fieldName];
        // Check if it's a simple equality (not an object with operators)
        if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue !== 'object') {
          const recordIndices = indexManager.getRecordIndices(
            this.modelName,
            fieldName,
            fieldValue
          );
          if (recordIndices && recordIndices.size > 0) {
            // Use index lookup - much faster than filtering all records
            results = (Array.from(recordIndices) as number[])
              .map((idx) => store[idx])
              .filter((r) => r !== undefined);
          } else {
            // Index exists but no matches
            results = [];
          }
        } else {
          // Complex where clause - use normal filtering
          results = this.queryEngine.filter(store, args.where);
        }
      } else {
        // Multiple fields or complex where clause - use normal filtering
        results = this.queryEngine.filter(store, args.where);
      }
    } else {
      // No index manager or no where clause - use normal filtering
      results = this.queryEngine.filter(store, args.where);
    }

    if (results.length === 0) {
      return null;
    }

    if (results.length > 1) {
      const whereStr = JSON.stringify(args?.where, null, 2);
      throw new Error(
        `Prismocker: findUnique found ${results.length} records (expected 0 or 1). Unique constraint violation.\n\n` +
          `Where clause: ${whereStr}\n\n` +
          `This usually means:\n` +
          `  1. Multiple records match the unique constraint in your test data\n` +
          `  2. The unique constraint fields are not actually unique in your seed data\n\n` +
          `To fix:\n` +
          `  - Ensure your test data has unique values for the constraint fields\n` +
          `  - Check that you're using the correct unique field(s) in your where clause\n` +
          `  - Use findFirst() instead if you expect multiple matches\n` +
          `  - Review your seed data: ${this.modelName} has ${this.client.getStore(this.modelName).length} total records`
      );
    }

    let result = results[0] || null;

    // Apply select (with relation support)
    if (args?.select && result) {
      result = this.applySelect(result, args.select);
    }

    // Apply include (with relation support)
    if (args?.include && result) {
      result = this.applyInclude(result, args.include);
    }

    // Cache the result
    if (queryCache) {
      queryCache.set(this.modelName, 'findUnique', args, result ? [result] : []);
    }

        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'findUnique', args, result ? 1 : 0, duration);
        return result;
      }
    );
  }

  /**
   * Finds a single record matching the unique constraint, or throws an error if not found.
   *
   * This method behaves exactly like `findUnique`, but throws a descriptive error
   * if no record matches the `where` clause. This is useful when you expect a record
   * to exist and want to fail fast if it doesn't.
   *
   * @param args - Query arguments (same as `findUnique`)
   * @param args.where - Unique constraint fields
   * @param args.select - Fields to select (optional)
   * @param args.include - Relations to include (optional)
   * @returns Promise resolving to the matching record
   * @throws {Error} If no record matches the unique constraint, or if multiple records match
   *
   * @example
   * ```typescript
   * // Throws error if user doesn't exist
   * const user = await prisma.user.findUniqueOrThrow({
   *   where: { id: 'user-1' },
   * });
   *
   * // With relations
   * const user = await prisma.user.findUniqueOrThrow({
   *   where: { email: 'user@example.com' },
   *   include: { posts: true },
   * });
   * ```
   *
   * @see {@link findUnique} for the non-throwing version
   */
  async findUniqueOrThrow(args: { where: any; select?: any; include?: any }): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findUniqueOrThrow`, { args });
    }

    const result = await this.findUnique(args);

    if (result === null) {
      // Enhanced error message
      const store = this.client.getStore(this.modelName);
      const totalRecords = store.length;
      const sampleRecords = store.slice(0, 3).map((r: any) => {
        const sample: any = {};
        for (const key in args.where) {
          if (key in r) {
            sample[key] = (r as any)[key];
          }
        }
        return sample;
      });

      throw new Error(
        `Prismocker: Record not found for ${this.modelName}.findUniqueOrThrow.\n\n` +
          `Where clause: ${JSON.stringify(args.where, null, 2)}\n` +
          `Total records in ${this.modelName}: ${totalRecords}\n` +
          (sampleRecords.length > 0
            ? `Sample records (first 3):\n${sampleRecords.map((r: any) => `  ${JSON.stringify(r)}`).join('\n')}\n`
            : '') +
          `\nThis usually means:\n` +
          `  1. The record doesn't exist in your test data\n` +
          `  2. The where clause doesn't match any records\n` +
          `  3. The field names in where clause are incorrect\n\n` +
          `To fix:\n` +
          `  - Check that the record exists in your seed data\n` +
          `  - Verify the where clause matches your data structure\n` +
          `  - Use findUnique() first to verify the record exists\n` +
          `  - Or use findFirstOrThrow() if you don't need unique constraint`
      );
    }

    return result;
  }

  /**
   * Finds the first record matching the specified criteria.
   *
   * This method is similar to `findMany`, but returns only the first matching record
   * (or `null` if no records match). It's useful when you only need one result and
   * don't care about unique constraints.
   *
   * **Supported features:**
   * - All `findMany` features (where, orderBy, select, include)
   * - Returns first match or null
   * - No unique constraint validation (unlike `findUnique`)
   *
   * @param args - Query arguments (same as `findMany`)
   * @param args.where - Filter conditions (optional)
   * @param args.orderBy - Sort order (optional, determines which record is "first")
   * @param args.select - Fields to select (optional)
   * @param args.include - Relations to include (optional)
   * @returns Promise resolving to the first matching record, or `null` if no records match
   *
   * @example
   * ```typescript
   * // Find first active user
   * const user = await prisma.user.findFirst({
   *   where: { status: 'active' },
   * });
   *
   * // Find first user ordered by creation date
   * const oldestUser = await prisma.user.findFirst({
   *   orderBy: { createdAt: 'asc' },
   * });
   *
   * // With relations
   * const user = await prisma.user.findFirst({
   *   where: { status: 'active' },
   *   include: { posts: true },
   * });
   * ```
   *
   * @see {@link findMany} for getting multiple records
   * @see {@link findUnique} for unique constraint validation
   */
  async findFirst(args?: any): Promise<any | null> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findFirst`, { args });
    }

    const results = await this.findMany(args);
    return results[0] || null;
  }

  /**
   * Finds the first record matching the criteria, or throws an error if not found.
   *
   * This method behaves exactly like `findFirst`, but throws a descriptive error
   * if no record matches. This is useful when you expect a record to exist and want
   * to fail fast if it doesn't.
   *
   * @param args - Query arguments (same as `findFirst`)
   * @param args.where - Filter conditions (optional)
   * @param args.orderBy - Sort order (optional)
   * @param args.select - Fields to select (optional)
   * @param args.include - Relations to include (optional)
   * @returns Promise resolving to the first matching record
   * @throws {Error} If no record matches the criteria
   *
   * @example
   * ```typescript
   * // Throws error if no active user exists
   * const user = await prisma.user.findFirstOrThrow({
   *   where: { status: 'active' },
   * });
   * ```
   *
   * @see {@link findFirst} for the non-throwing version
   */
  async findFirstOrThrow(args?: any): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findFirstOrThrow`, { args });
    }

    const result = await this.findFirst(args);

    if (result === null) {
      // Enhanced error message
      const store = this.client.getStore(this.modelName);
      const totalRecords = store.length;
      const whereClause = args?.where ? JSON.stringify(args.where, null, 2) : '{}';
      const sampleRecords = store.slice(0, 3);

      throw new Error(
        `Prismocker: Record not found for ${this.modelName}.findFirstOrThrow.\n\n` +
          `Where clause: ${whereClause}\n` +
          `Total records in ${this.modelName}: ${totalRecords}\n` +
          (sampleRecords.length > 0
            ? `Sample records (first 3):\n${sampleRecords.map((r: any) => `  ${JSON.stringify(r)}`).join('\n')}\n`
            : '') +
          `\nThis usually means:\n` +
          `  1. The record doesn't exist in your test data\n` +
          `  2. The where clause doesn't match any records\n` +
          `  3. The field names in where clause are incorrect\n\n` +
          `To fix:\n` +
          `  - Check that the record exists in your seed data\n` +
          `  - Verify the where clause matches your data structure\n` +
          `  - Use findFirst() first to verify the record exists\n` +
          `  - Or use findUniqueOrThrow() if you need unique constraint`
      );
    }

    return result;
  }

  /**
   * Creates a new record or updates an existing one based on the `where` clause.
   *
   * This method first checks if a record matching the `where` clause exists:
   * - If a record exists: updates it with `update` data
   * - If no record exists: creates a new record with `create` data (merged with `where` values)
   *
   * **Note:** The `where` clause values are automatically merged into the `create` data
   * to ensure the created record matches the where clause.
   *
   * @param args - Upsert arguments
   * @param args.where - Criteria to find existing record (used for both lookup and creation)
   * @param args.create - Data to use when creating a new record
   * @param args.update - Data to use when updating an existing record
   * @returns Promise resolving to the created or updated record
   *
   * @example
   * ```typescript
   * // Create or update user
   * const user = await prisma.user.upsert({
   *   where: { email: 'user@example.com' },
   *   create: {
   *     email: 'user@example.com',
   *     name: 'New User',
   *   },
   *   update: {
   *     name: 'Updated User',
   *   },
   * });
   * ```
   */
  async upsert(args: { where: any; create: any; update: any }): Promise<any> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'upsert',
        args,
      },
      async () => {
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.upsert`, { args });
        }

        const store = this.client.getStore(this.modelName);
        const existing = this.queryEngine.filter(store, args.where);

        if (existing.length > 0) {
          // Update existing record
          return await this.update({
            where: args.where,
            data: args.update,
          });
        } else {
          // Create new record
          return await this.create({
            data: {
              ...args.create,
              ...Object.fromEntries(Object.entries(args.where).map(([key, value]) => [key, value])),
            },
          });
        }
      }
    );
  }

  /**
   * Creates a new record in the model's store.
   *
   * This method creates a new record with the provided data. It automatically:
   * - Generates an `id` if not provided (using `generateId()`)
   * - Sets `createdAt` and `updatedAt` timestamps if not provided
   * - Validates data with Zod schemas if `validateWithZod` is enabled
   * - Updates indexes if `enableIndexes` is true
   * - Invalidates query cache for the model
   *
   * @param args - Create arguments
   * @param args.data - The data for the new record (should match your Prisma schema)
   * @returns Promise resolving to the created record (with generated fields like `id`, `createdAt`, `updatedAt`)
   * @throws {Error} If Zod validation fails and `validateWithZod` is enabled
   *
   * @example
   * ```typescript
   * // Create a user
   * const user = await prisma.user.create({
   *   data: {
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *   },
   * });
   * // Returns: { id: 'generated-id', name: 'John Doe', email: 'john@example.com', createdAt: Date, updatedAt: Date }
   *
   * // Create with explicit ID
   * const user = await prisma.user.create({
   *   data: {
   *     id: 'user-1',
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *   },
   * });
   * ```
   */
  async create(args: { data: any }): Promise<any> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'create',
        args,
      },
      async () => {
        const startTime = Date.now();
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.create`, { args });
        }

        // Optional Zod validation
    let validatedData = args.data;
    if (this.options.validateWithZod) {
      try {
        const schema = this.options.zodSchemaLoader
          ? await this.options.zodSchemaLoader(this.modelName, 'create')
          : await loadZodSchema(this.modelName, 'create', this.options.zodSchemasPath);

        if (schema) {
          validatedData = validateWithZod(schema, args.data, this.modelName, 'create');
        }
      } catch (error: any) {
        // Log validation error but don't fail if validation is optional
        if (this.options.logQueries) {
          this.options.logger?.(
            `[Prismocker] Zod validation warning for ${this.modelName}.create: ${error.message}`
          );
        }
        // If validation fails and it's enabled, throw the error
        if (this.options.validateWithZod) {
          throw error;
        }
      }
    }

    const store = this.client.getStore(this.modelName);
    const record = {
      ...validatedData,
      id: validatedData.id || this.generateId(),
      createdAt: validatedData.createdAt || new Date(),
      updatedAt: validatedData.updatedAt || new Date(),
    };

    const recordIndex = store.length;
    store.push(record);

    // Update indexes
    const indexManager = this.client.getIndexManager();
    if (indexManager) {
      indexManager.addRecord(this.modelName, record, recordIndex);
    }

    // Invalidate query cache for this model
    const queryCache = this.client.getQueryCache();
    if (queryCache) {
      queryCache.invalidateModel(this.modelName);
    }

        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'create', args, 1, duration);
        return record;
      }
    );
  }

  /**
   * Creates multiple records in a single operation.
   *
   * This method is more efficient than calling `create` multiple times, especially
   * when creating many records. It supports optional duplicate skipping.
   *
   * **Note:** Unlike Prisma's `createMany`, this method does NOT return the created records.
   * It only returns a count of how many records were created.
   *
   * @param args - CreateMany arguments
   * @param args.data - Array of data objects for the new records
   * @param args.skipDuplicates - If `true`, skip records with duplicate IDs (default: `false`)
   * @returns Promise resolving to an object with `count` property indicating how many records were created
   *
   * @example
   * ```typescript
   * // Create multiple users
   * const result = await prisma.user.createMany({
   *   data: [
   *     { name: 'Alice', email: 'alice@example.com' },
   *     { name: 'Bob', email: 'bob@example.com' },
   *     { name: 'Charlie', email: 'charlie@example.com' },
   *   ],
   * });
   * console.log(result.count); // 3
   *
   * // Create with duplicate skipping
   * const result = await prisma.user.createMany({
   *   data: [
   *     { id: 'user-1', name: 'Alice' },
   *     { id: 'user-1', name: 'Bob' }, // Duplicate ID, skipped if skipDuplicates is true
   *   ],
   *   skipDuplicates: true,
   * });
   * console.log(result.count); // 1 (only first record created)
   * ```
   */
  async createMany(args: { data: any[]; skipDuplicates?: boolean }): Promise<{ count: number }> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.createMany`, { args });
    }

    const store = this.client.getStore(this.modelName);
    const records = args.data.map((data) => ({
      ...data,
      id: data.id || this.generateId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    }));

    const indexManager = this.client.getIndexManager();

    if (args.skipDuplicates) {
      // Simple duplicate check based on id
      const existingIds = new Set(store.map((r: any) => r.id));
      const newRecords = records.filter((r) => !existingIds.has(r.id));
      const startIndex = store.length;
      store.push(...newRecords);

      // Update indexes for new records
      if (indexManager) {
        newRecords.forEach((record, i) => {
          indexManager.addRecord(this.modelName, record, startIndex + i);
        });
      }

      // Invalidate query cache
      const queryCache = this.client.getQueryCache();
      if (queryCache) {
        queryCache.invalidateModel(this.modelName);
      }

      return { count: newRecords.length };
    }

    const startIndex = store.length;
    store.push(...records);

    // Update indexes for all records
    if (indexManager) {
      records.forEach((record, i) => {
        indexManager.addRecord(this.modelName, record, startIndex + i);
      });
    }

    // Invalidate query cache
    const queryCache = this.client.getQueryCache();
    if (queryCache) {
      queryCache.invalidateModel(this.modelName);
    }

    return { count: records.length };
  }

  /**
   * Updates a single record matching the `where` clause.
   *
   * This method finds the first record matching the `where` clause and updates it
   * with the provided `data`. It automatically:
   * - Validates data with Zod schemas if `validateWithZod` is enabled
   * - Updates the `updatedAt` timestamp
   * - Updates indexes if `enableIndexes` is true
   * - Invalidates query cache for the model
   *
   * **Important:** This method updates only ONE record. If multiple records match
   * the `where` clause, only the first one is updated. Use `updateMany` to update multiple records.
   *
   * @param args - Update arguments
   * @param args.where - Criteria to find the record to update
   * @param args.data - The data to update (partial record data)
   * @returns Promise resolving to the updated record
   * @throws {Error} If no record matches the `where` clause
   * @throws {Error} If Zod validation fails and `validateWithZod` is enabled
   *
   * @example
   * ```typescript
   * // Update user by ID
   * const user = await prisma.user.update({
   *   where: { id: 'user-1' },
   *   data: { name: 'Updated Name' },
   * });
   *
   * // Update user by unique field
   * const user = await prisma.user.update({
   *   where: { email: 'user@example.com' },
   *   data: { name: 'Updated Name' },
   * });
   * ```
   *
   * @see {@link updateMany} for updating multiple records
   */
  async update(args: { where: any; data: any }): Promise<any> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'update',
        args,
      },
      async () => {
        const startTime = Date.now();
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.update`, { args });
        }

    // Optional Zod validation
    let validatedData = args.data;
    if (this.options.validateWithZod) {
      try {
        const schema = this.options.zodSchemaLoader
          ? await this.options.zodSchemaLoader(this.modelName, 'update')
          : await loadZodSchema(this.modelName, 'update', this.options.zodSchemasPath);

        if (schema) {
          validatedData = validateWithZod(schema, args.data, this.modelName, 'update');
        }
      } catch (error: any) {
        // Log validation error but don't fail if validation is optional
        if (this.options.logQueries) {
          this.options.logger?.(
            `[Prismocker] Zod validation warning for ${this.modelName}.update: ${error.message}`
          );
        }
        // If validation fails and it's enabled, throw the error
        if (this.options.validateWithZod) {
          throw error;
        }
      }
    }

    const store = this.client.getStore(this.modelName);
    const index = store.findIndex((record: any) => this.queryEngine.matches(record, args.where));

    if (index === -1) {
      const whereStr = JSON.stringify(args.where, null, 2);
      const totalRecords = store.length;
      const sampleRecords = store.slice(0, 3).map((r: any) => {
        const sample: any = {};
        // Show id and first few fields for debugging
        if (r.id) sample.id = r.id;
        const keys = Object.keys(r).slice(0, 3);
        keys.forEach((key) => {
          if (key !== 'id') sample[key] = r[key];
        });
        return sample;
      });

      throw new Error(
        `Prismocker: Record not found for update in ${this.modelName}.\n\n` +
          `Where clause: ${whereStr}\n` +
          `Total records in ${this.modelName}: ${totalRecords}\n` +
          (sampleRecords.length > 0
            ? `Sample records (first 3):\n${JSON.stringify(sampleRecords, null, 2)}\n\n`
            : `\n`) +
          `This usually means:\n` +
          `  1. No record matches the where clause in your test data\n` +
          `  2. The where clause fields don't match any existing records\n` +
          `  3. You need to seed data before updating\n\n` +
          `To fix:\n` +
          `  - Check that your where clause matches an existing record\n` +
          `  - Seed test data before calling update: prisma.setData('${this.modelName}', [...])` +
          `  - Use findFirst() to verify a matching record exists\n` +
          `  - Consider using upsert() if you want to create or update`
      );
    }

    const oldRecord = store[index];
    const updated = {
      ...oldRecord,
      ...validatedData,
      updatedAt: new Date(),
    };

    // Update indexes
    const indexManager = this.client.getIndexManager();
    if (indexManager) {
      indexManager.updateRecord(this.modelName, index, oldRecord, updated);
    }

    // Invalidate query cache
    const queryCache = this.client.getQueryCache();
    if (queryCache) {
      queryCache.invalidateModel(this.modelName);
    }

        const duration = Date.now() - startTime;
        this.client.recordQuery(this.modelName, 'update', args, 1, duration);
        store[index] = updated;
        return updated;
      }
    );
  }

  /**
   * Updates all records matching the `where` clause.
   *
   * This method finds all records matching the `where` clause and updates them
   * with the provided `data`. Unlike `update`, this method can update multiple records.
   *
   * **Note:** Unlike Prisma's `updateMany`, this method does NOT return the updated records.
   * It only returns a count of how many records were updated.
   *
   * @param args - UpdateMany arguments
   * @param args.where - Criteria to find records to update (optional, updates all if omitted)
   * @param args.data - The data to update (partial record data, merged into existing records)
   * @returns Promise resolving to an object with `count` property indicating how many records were updated
   *
   * @example
   * ```typescript
   * // Update all active users
   * const result = await prisma.user.updateMany({
   *   where: { status: 'active' },
   *   data: { lastLoginAt: new Date() },
   * });
   * console.log(result.count); // Number of updated records
   *
   * // Update all records (no where clause)
   * const result = await prisma.user.updateMany({
   *   data: { updatedAt: new Date() },
   * });
   * ```
   *
   * @see {@link update} for updating a single record
   */
  async updateMany(args: { where?: any; data: any }): Promise<{ count: number }> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.updateMany`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let count = 0;

    const indexManager = this.client.getIndexManager();

    for (let i = 0; i < store.length; i++) {
      if (!args.where || this.queryEngine.matches(store[i], args.where)) {
        const oldRecord = store[i];
        const updated = {
          ...oldRecord,
          ...args.data,
          updatedAt: new Date(),
        };

        // Update indexes
        if (indexManager) {
          indexManager.updateRecord(this.modelName, i, oldRecord, updated);
        }

        store[i] = updated;
        count++;
      }
    }

    // Invalidate query cache
    const queryCache = this.client.getQueryCache();
    if (queryCache && count > 0) {
      queryCache.invalidateModel(this.modelName);
    }

    return { count };
  }

  /**
   * Deletes a single record matching the `where` clause.
   *
   * This method finds the first record matching the `where` clause and deletes it.
   * It automatically:
   * - Updates indexes if `enableIndexes` is true
   * - Invalidates query cache for the model
   *
   * **Important:** This method deletes only ONE record. If multiple records match
   * the `where` clause, only the first one is deleted. Use `deleteMany` to delete multiple records.
   *
   * @param args - Delete arguments
   * @param args.where - Criteria to find the record to delete
   * @returns Promise resolving to the deleted record
   * @throws {Error} If no record matches the `where` clause
   *
   * @example
   * ```typescript
   * // Delete user by ID
   * const deletedUser = await prisma.user.delete({
   *   where: { id: 'user-1' },
   * });
   *
   * // Delete user by unique field
   * const deletedUser = await prisma.user.delete({
   *   where: { email: 'user@example.com' },
   * });
   * ```
   *
   * @see {@link deleteMany} for deleting multiple records
   */
  async delete(args: { where: any }): Promise<any> {
    // Execute with middleware support
    return this.client.executeWithMiddleware(
      {
        model: this.modelName,
        action: 'delete',
        args,
      },
      async () => {
        if (this.options.logQueries) {
          this.options.logger?.(`[Prismocker] ${this.modelName}.delete`, { args });
        }

        const store = this.client.getStore(this.modelName);
    const index = store.findIndex((record: any) => this.queryEngine.matches(record, args.where));

    if (index === -1) {
      const whereStr = JSON.stringify(args.where, null, 2);
      const totalRecords = store.length;
      const sampleRecords = store.slice(0, 3).map((r: any) => {
        const sample: any = {};
        // Show id and first few fields for debugging
        if (r.id) sample.id = r.id;
        const keys = Object.keys(r).slice(0, 3);
        keys.forEach((key) => {
          if (key !== 'id') sample[key] = r[key];
        });
        return sample;
      });

      throw new Error(
        `Prismocker: Record not found for delete in ${this.modelName}.\n\n` +
          `Where clause: ${whereStr}\n` +
          `Total records in ${this.modelName}: ${totalRecords}\n` +
          (sampleRecords.length > 0
            ? `Sample records (first 3):\n${JSON.stringify(sampleRecords, null, 2)}\n\n`
            : `\n`) +
          `This usually means:\n` +
          `  1. No record matches the where clause in your test data\n` +
          `  2. The where clause fields don't match any existing records\n` +
          `  3. You need to seed data before deleting\n\n` +
          `To fix:\n` +
          `  - Check that your where clause matches an existing record\n` +
          `  - Seed test data before calling delete: prisma.setData('${this.modelName}', [...])` +
          `  - Use findFirst() to verify a matching record exists\n` +
          `  - Consider using deleteMany() if you want to delete multiple records`
      );
    }

    const deleted = store[index];

    // Update indexes before removing
    const indexManager = this.client.getIndexManager();
    if (indexManager) {
      indexManager.removeRecord(this.modelName, index, deleted);
      // Rebuild indexes after deletion to fix indices (simplified approach)
      // In production, we'd update indices for all records after the deleted one
      indexManager.buildIndexes(this.modelName, store);
    }

        store.splice(index, 1);

        // Invalidate query cache
        const queryCache = this.client.getQueryCache();
        if (queryCache) {
          queryCache.invalidateModel(this.modelName);
        }

        return deleted;
      }
    );
  }

  /**
   * Deletes all records matching the `where` clause, or all records if no `where` clause is provided.
   *
   * This method is more efficient than calling `delete` multiple times. It supports
   * deleting all records by omitting the `where` clause.
   *
   * **Note:** Unlike Prisma's `deleteMany`, this method does NOT return the deleted records.
   * It only returns a count of how many records were deleted.
   *
   * @param args - DeleteMany arguments (optional)
   * @param args.where - Criteria to find records to delete (optional, deletes all if omitted)
   * @returns Promise resolving to an object with `count` property indicating how many records were deleted
   *
   * @example
   * ```typescript
   * // Delete all inactive users
   * const result = await prisma.user.deleteMany({
   *   where: { status: 'inactive' },
   * });
   * console.log(result.count); // Number of deleted records
   *
   * // Delete all records (no where clause)
   * const result = await prisma.user.deleteMany();
   * console.log(result.count); // Total number of records deleted
   * ```
   *
   * @see {@link delete} for deleting a single record
   */
  async deleteMany(args?: { where?: any }): Promise<{ count: number }> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.deleteMany`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let count = 0;

    if (!args || !args.where) {
      // Delete all
      count = store.length;
      store.length = 0;

      // Invalidate query cache
      const queryCache = this.client.getQueryCache();
      if (queryCache) {
        queryCache.invalidateModel(this.modelName);
      }

      return { count };
    }

    // Delete matching records
    const indexManager = this.client.getIndexManager();
    const indicesToDelete: number[] = [];

    for (let i = store.length - 1; i >= 0; i--) {
      if (this.queryEngine.matches(store[i], args.where)) {
        indicesToDelete.push(i);
      }
    }

    // Delete in reverse order to maintain indices
    for (const index of indicesToDelete.reverse()) {
      const deleted = store[index];
      if (indexManager) {
        indexManager.removeRecord(this.modelName, index, deleted);
      }
      store.splice(index, 1);
      count++;
    }

    // Rebuild indexes after deletions
    if (indexManager && indicesToDelete.length > 0) {
      indexManager.buildIndexes(this.modelName, store);
    }

    // Invalidate query cache
    const queryCache = this.client.getQueryCache();
    if (queryCache && count > 0) {
      queryCache.invalidateModel(this.modelName);
    }

    return { count };
  }

  /**
   * Counts the number of records matching the specified criteria.
   *
   * This method returns the total number of records in the model if no `where` clause
   * is provided, or the number of records matching the `where` clause if provided.
   *
   * @param args - Count arguments (optional)
   * @param args.where - Filter conditions (optional, counts all if omitted)
   * @returns Promise resolving to the number of matching records
   *
   * @example
   * ```typescript
   * // Count all users
   * const totalUsers = await prisma.user.count();
   *
   * // Count active users
   * const activeUsers = await prisma.user.count({
   *   where: { status: 'active' },
   * });
   *
   * // Count with complex where clause
   * const recentUsers = await prisma.user.count({
   *   where: {
   *     status: 'active',
   *     createdAt: { gte: new Date('2024-01-01') },
   *   },
   * });
   * ```
   */
  async count(args?: { where?: any }): Promise<number> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.count`, { args });
    }

    const store = this.client.getStore(this.modelName);

    if (!args || !args.where) {
      return store.length;
    }

    return this.queryEngine.filter(store, args.where).length;
  }

  /**
   * Performs aggregate operations on records matching the specified criteria.
   *
   * This method supports all Prisma aggregate operations:
   * - `_count`: Count of records
   * - `_sum`: Sum of numeric fields
   * - `_avg`: Average of numeric fields
   * - `_min`: Minimum value of numeric or date fields
   * - `_max`: Maximum value of numeric or date fields
   * - `_stddev`: Standard deviation of numeric fields
   * - `_variance`: Variance of numeric fields
   * - `_countDistinct`: Count of distinct values in a field
   *
   * @param args - Aggregate arguments
   * @param args.where - Filter conditions (optional)
   * @param args._count - Count aggregate (boolean or object with field names)
   * @param args._sum - Sum aggregate (object mapping field names to `true`)
   * @param args._avg - Average aggregate (object mapping field names to `true`)
   * @param args._min - Minimum aggregate (object mapping field names to `true`)
   * @param args._max - Maximum aggregate (object mapping field names to `true`)
   * @param args._stddev - Standard deviation aggregate (object mapping field names to `true`)
   * @param args._variance - Variance aggregate (object mapping field names to `true`)
   * @param args._countDistinct - Count distinct aggregate (object mapping field names to `true`)
   * @returns Promise resolving to an object containing the aggregate results
   *
   * @example
   * ```typescript
   * // Count records
   * const result = await prisma.user.aggregate({
   *   _count: true,
   * });
   * console.log(result._count); // Total number of users
   *
   * // Sum and average
   * const result = await prisma.user.aggregate({
   *   where: { status: 'active' },
   *   _sum: { score: true },
   *   _avg: { score: true },
   * });
   * console.log(result._sum.score); // Sum of scores
   * console.log(result._avg.score); // Average score
   *
   * // Min and max
   * const result = await prisma.user.aggregate({
   *   _min: { createdAt: true },
   *   _max: { createdAt: true },
   * });
   *
   * // Advanced: standard deviation and variance
   * const result = await prisma.user.aggregate({
   *   _stddev: { score: true },
   *   _variance: { score: true },
   * });
   *
   * // Count distinct values
   * const result = await prisma.user.aggregate({
   *   _countDistinct: { status: true },
   * });
   * ```
   */
  async aggregate(args?: any): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.aggregate`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let results = [...store];

    if (args?.where) {
      results = this.queryEngine.filter(results, args.where);
    }

    // Aggregate implementation
    const aggregate: any = {};

    if (args?._count) {
      aggregate._count = results.length;
    }

    if (args?._sum) {
      const sum: any = {};
      for (const field in args._sum) {
        if (args._sum[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter((v: any) => v !== null && v !== undefined && typeof v === 'number');
          sum[field] =
            values.length > 0 ? values.reduce((acc: number, val: number) => acc + val, 0) : null;
        }
      }
      // Always set _sum object, even if empty (Prisma always returns _sum object)
      aggregate._sum = Object.keys(sum).length > 0 ? sum : {};
    }

    if (args?._avg) {
      const avg: any = {};
      for (const field in args._avg) {
        if (args._avg[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter((v: any) => v !== null && v !== undefined && typeof v === 'number');
          avg[field] =
            values.length > 0
              ? values.reduce((acc: number, val: number) => acc + val, 0) / values.length
              : null;
        }
      }
      aggregate._avg = avg;
    }

    if (args?._min) {
      const min: any = {};
      for (const field in args._min) {
        if (args._min[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter(
              (v: any) =>
                v !== null && v !== undefined && (typeof v === 'number' || v instanceof Date)
            );
          if (values.length > 0) {
            min[field] = values.reduce((acc: any, val: any) => (val < acc ? val : acc), values[0]);
          } else {
            min[field] = null;
          }
        }
      }
      aggregate._min = min;
    }

    if (args?._max) {
      const max: any = {};
      for (const field in args._max) {
        if (args._max[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter(
              (v: any) =>
                v !== null && v !== undefined && (typeof v === 'number' || v instanceof Date)
            );
          if (values.length > 0) {
            max[field] = values.reduce((acc: any, val: any) => (val > acc ? val : acc), values[0]);
          } else {
            max[field] = null;
          }
        }
      }
      aggregate._max = max;
    }

    if (args?._stddev) {
      const stddev: any = {};
      for (const field in args._stddev) {
        if (args._stddev[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter((v: any) => v !== null && v !== undefined && typeof v === 'number');
          if (values.length > 1) {
            // Calculate mean
            const mean = values.reduce((acc: number, val: number) => acc + val, 0) / values.length;
            // Calculate variance (average of squared differences from mean)
            const variance =
              values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) /
              values.length;
            // Standard deviation is square root of variance
            stddev[field] = Math.sqrt(variance);
          } else if (values.length === 1) {
            // Single value: stddev is 0
            stddev[field] = 0;
          } else {
            stddev[field] = null;
          }
        }
      }
      aggregate._stddev = stddev;
    }

    if (args?._variance) {
      const variance: any = {};
      for (const field in args._variance) {
        if (args._variance[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter((v: any) => v !== null && v !== undefined && typeof v === 'number');
          if (values.length > 1) {
            // Calculate mean
            const mean = values.reduce((acc: number, val: number) => acc + val, 0) / values.length;
            // Calculate variance (average of squared differences from mean)
            variance[field] =
              values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) /
              values.length;
          } else if (values.length === 1) {
            // Single value: variance is 0
            variance[field] = 0;
          } else {
            variance[field] = null;
          }
        }
      }
      aggregate._variance = variance;
    }

    if (args?._countDistinct) {
      const countDistinct: any = {};
      for (const field in args._countDistinct) {
        if (args._countDistinct[field] === true) {
          const values = results
            .map((r: any) => r[field])
            .filter((v: any) => v !== null && v !== undefined);
          // Use Set to get distinct values, then count
          const distinctValues = new Set(values);
          countDistinct[field] = distinctValues.size;
        }
      }
      aggregate._countDistinct = countDistinct;
    }

    return aggregate;
  }

  /**
   * Groups records by specified fields and optionally applies aggregate operations.
   *
   * This method groups records by one or more fields and can optionally calculate
   * aggregate values (like `_count`) for each group.
   *
   * **Supported features:**
   * - Grouping by multiple fields
   * - Filtering with `where` clause before grouping
   * - Sorting with `orderBy` (including ordering by `_count`)
   * - Limiting results with `take`
   * - Counting records in each group with `_count`
   *
   * @param args - GroupBy arguments
   * @param args.by - Array of field names to group by
   * @param args.where - Filter conditions applied before grouping (optional)
   * @param args.orderBy - Sort order for groups (optional, supports `_count` ordering)
   * @param args.take - Maximum number of groups to return (optional)
   * @param args._count - Count aggregate for each group (boolean or object with field names)
   * @returns Promise resolving to an array of group objects, each containing the grouping fields and aggregates
   *
   * @example
   * ```typescript
   * // Group by status
   * const groups = await prisma.user.groupBy({
   *   by: ['status'],
   *   _count: true,
   * });
   * // Returns: [
   * //   { status: 'active', _count: 10 },
   * //   { status: 'inactive', _count: 5 },
   * // ]
   *
   * // Group by multiple fields
   * const groups = await prisma.user.groupBy({
   *   by: ['status', 'role'],
   *   _count: { id: true },
   * });
   *
   * // Group with filtering and sorting
   * const groups = await prisma.user.groupBy({
   *   by: ['status'],
   *   where: { createdAt: { gte: new Date('2024-01-01') } },
   *   orderBy: { _count: { id: 'desc' } },
   *   take: 10,
   * });
   * ```
   */
  async groupBy(args: any): Promise<any[]> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.groupBy`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let results = [...store];

    if (args?.where) {
      results = this.queryEngine.filter(results, args.where);
    }

    // Simple groupBy implementation
    const groups = new Map<string, any[]>();

    for (const record of results) {
      const key = args.by.map((field: string) => record[field]).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    let groupedResults = Array.from(groups.entries()).map(([key, records]) => {
      const group: any = {};
      const keyParts = key.split('|');
      args.by.forEach((field: string, index: number) => {
        group[field] = keyParts[index];
      });

      // Support nested _count objects (e.g., _count: { id: true } -> _count: { id: number })
      if (args._count) {
        if (typeof args._count === 'object' && !Array.isArray(args._count)) {
          // Nested _count object (e.g., { id: true })
          group._count = {};
          for (const field in args._count) {
            if (args._count[field] === true) {
              group._count[field] = records.length;
            }
          }
        } else {
          // Simple _count (number)
          group._count = records.length;
        }
      }

      return group;
    });

    // Apply orderBy if specified
    if (args?.orderBy) {
      if (args.orderBy._count) {
        // Order by _count field (e.g., orderBy: { _count: { id: 'desc' } })
        const countField = Object.keys(args.orderBy._count)[0];
        const direction = args.orderBy._count[countField] === 'desc' ? -1 : 1;
        groupedResults.sort((a, b) => {
          const aCount = a._count?.[countField] ?? a._count ?? 0;
          const bCount = b._count?.[countField] ?? b._count ?? 0;
          return (aCount - bCount) * direction;
        });
      } else {
        // Order by regular field
        groupedResults = this.queryEngine.sort(groupedResults, args.orderBy);
      }
    }

    // Apply take (limit)
    if (args?.take !== undefined) {
      groupedResults = groupedResults.slice(0, args.take);
    }

    return groupedResults;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
