/**
 * ModelProxy - Proxy for Prisma model operations
 *
 * Provides findMany, findUnique, create, update, delete, etc.
 * for a specific model.
 */

import type { PrismockerOptions } from './types.js';
import { QueryEngine } from './query-engine.js';

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
  }

  /**
   * Find many records
   */
  async findMany(args?: any): Promise<any[]> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findMany`, { args });
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
      return results.map((record) => this.applySelect(record, args.select));
    }

    return results;
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
        if (key in record) {
          selected[key] = record[key];
        }
      }
      // Relation selection (object with nested select)
      else if (selectValue && typeof selectValue === 'object' && !Array.isArray(selectValue)) {
        const relationData = this.loadRelation(record, key, selectValue);
        if (relationData !== undefined) {
          selected[key] = relationData;
        }
      }
    }
    
    return selected;
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
    const relatedModelName = relationName;

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
      const commonSuffixes = ['_item', '_items', '_collection', '_collections', '_user', '_users', '_job', '_jobs', '_content', '_contents'];
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
        const commonWords = ['item', 'items', 'collection', 'collections', 'user', 'users', 'job', 'jobs', 'content', 'contents'];
        const lastWord = words[words.length - 1];
        if (commonWords.includes(lastWord)) {
          const withoutLastWord = words.slice(0, -1).join('_');
          if (withoutLastWord && withoutLastWord !== snakeCaseFrom) {
            candidates.push(`${withoutLastWord}_id`);
          }
        }
      }
      
      return candidates;
    };
    
    // Determine relation direction:
    // - If relation name is plural, it's usually one-to-many (foreign key on related model)
    // - BUT: some one-to-one relations have plural names (e.g., jobs.companies)
    // - Check if foreign key exists on THIS model first (reverse direction) - if so, it's one-to-one
    const isOneToMany = relationName.endsWith('s') && relationName.length > 1 && !record[reverseForeignKey];
    
    if (isOneToMany) {
      // One-to-many: find all related records where foreign key matches this record's id
      // e.g., for companies.jobs: find all jobs where jobs.company_id === company.id
      // Try multiple foreign key patterns
      const forwardCandidates = generateForeignKeyCandidates(this.modelName, relatedModelName);
      const actualForwardKey = findActualForeignKey(forwardCandidates) || forwardForeignKey;
      
      const relatedRecords = relatedStore.filter((relatedRecord: any) => {
        return relatedRecord[actualForwardKey] === record.id;
      });
      
      // Apply nested select to related records
      if (relationSelect.select) {
        return relatedRecords.map((relatedRecord: any) => 
          this.applySelect(relatedRecord, relationSelect.select)
        );
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
          return relatedRecord;
        }
      }
      
      // Try forward: foreign key on related model pointing to this model
      // e.g., for users.profile: find profile where profile.user_id === user.id
      // Try multiple foreign key patterns
      const forwardCandidates = generateForeignKeyCandidates(this.modelName, relatedModelName);
      const actualForwardKey = findActualForeignKey(forwardCandidates) || forwardForeignKey;
      
      const relatedRecord = relatedStore.find((relatedRecord: any) => {
        return relatedRecord[actualForwardKey] === record.id;
      });
      
      if (relatedRecord) {
        if (relationSelect.select) {
          return this.applySelect(relatedRecord, relationSelect.select);
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
   * Find unique record
   */
  async findUnique(args: { where: any; select?: any }): Promise<any | null> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findUnique`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let results = this.queryEngine.filter(store, args.where);

    if (results.length === 0) {
      return null;
    }

    if (results.length > 1) {
      throw new Error(
        `Prismocker: findUnique found ${results.length} records. Unique constraint violation.`
      );
    }

    let result = results[0] || null;

    // Apply select (with relation support)
    if (args?.select && result) {
      result = this.applySelect(result, args.select);
    }

    return result;
  }

  /**
   * Find first record
   */
  async findFirst(args?: any): Promise<any | null> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.findFirst`, { args });
    }

    const results = await this.findMany(args);
    return results[0] || null;
  }

  /**
   * Upsert a record (create or update)
   */
  async upsert(args: { where: any; create: any; update: any }): Promise<any> {
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
          ...Object.fromEntries(
            Object.entries(args.where).map(([key, value]) => [key, value])
          ),
        },
      });
    }
  }

  /**
   * Create a record
   */
  async create(args: { data: any }): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.create`, { args });
    }

    const store = this.client.getStore(this.modelName);
    const record = {
      ...args.data,
      id: args.data.id || this.generateId(),
      createdAt: args.data.createdAt || new Date(),
      updatedAt: args.data.updatedAt || new Date(),
    };

    store.push(record);
    return record;
  }

  /**
   * Create many records
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

    if (args.skipDuplicates) {
      // Simple duplicate check based on id
      const existingIds = new Set(store.map((r: any) => r.id));
      const newRecords = records.filter((r) => !existingIds.has(r.id));
      store.push(...newRecords);
      return { count: newRecords.length };
    }

    store.push(...records);
    return { count: records.length };
  }

  /**
   * Update a record
   */
  async update(args: { where: any; data: any }): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.update`, { args });
    }

    const store = this.client.getStore(this.modelName);
    const index = store.findIndex((record: any) =>
      this.queryEngine.matches(record, args.where)
    );

    if (index === -1) {
      throw new Error(`Prismocker: Record not found for update in ${this.modelName}`);
    }

    const updated = {
      ...store[index],
      ...args.data,
      updatedAt: new Date(),
    };

    store[index] = updated;
    return updated;
  }

  /**
   * Update many records
   */
  async updateMany(args: { where?: any; data: any }): Promise<{ count: number }> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.updateMany`, { args });
    }

    const store = this.client.getStore(this.modelName);
    let count = 0;

    for (let i = 0; i < store.length; i++) {
      if (!args.where || this.queryEngine.matches(store[i], args.where)) {
        store[i] = {
          ...store[i],
          ...args.data,
          updatedAt: new Date(),
        };
        count++;
      }
    }

    return { count };
  }

  /**
   * Delete a record
   */
  async delete(args: { where: any }): Promise<any> {
    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker] ${this.modelName}.delete`, { args });
    }

    const store = this.client.getStore(this.modelName);
    const index = store.findIndex((record: any) =>
      this.queryEngine.matches(record, args.where)
    );

    if (index === -1) {
      throw new Error(`Prismocker: Record not found for delete in ${this.modelName}`);
    }

    const deleted = store[index];
    store.splice(index, 1);
    return deleted;
  }

  /**
   * Delete many records
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
      return { count };
    }

    // Delete matching records
    for (let i = store.length - 1; i >= 0; i--) {
      if (this.queryEngine.matches(store[i], args.where)) {
        store.splice(i, 1);
        count++;
      }
    }

    return { count };
  }

  /**
   * Count records
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
   * Aggregate operations
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
          sum[field] = values.length > 0 ? values.reduce((acc: number, val: number) => acc + val, 0) : null;
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
          avg[field] = values.length > 0 ? values.reduce((acc: number, val: number) => acc + val, 0) / values.length : null;
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
            .filter((v: any) => v !== null && v !== undefined && (typeof v === 'number' || v instanceof Date));
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
            .filter((v: any) => v !== null && v !== undefined && (typeof v === 'number' || v instanceof Date));
          if (values.length > 0) {
            max[field] = values.reduce((acc: any, val: any) => (val > acc ? val : acc), values[0]);
          } else {
            max[field] = null;
          }
        }
      }
      aggregate._max = max;
    }

    return aggregate;
  }

  /**
   * Group by operations
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

