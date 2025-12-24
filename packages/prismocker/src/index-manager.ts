/**
 * IndexManager - Performance optimization for Prismocker queries.
 *
 * The IndexManager maintains in-memory indexes on model fields to dramatically
 * speed up `findUnique` and `findFirst` operations, especially for lookups by
 * primary keys, foreign keys, and frequently filtered fields.
 *
 * **How it works:**
 * - Indexes are built automatically when data is set via `setData()` or when records are created
 * - Indexes map field values to record indices for O(1) lookups
 * - Indexes are automatically updated when records are created, updated, or deleted
 * - Indexes can be configured per-model for fine-grained control
 *
 * **Performance benefits:**
 * - `findUnique` with indexed fields: O(1) lookup instead of O(n) scan
 * - `findFirst` with indexed fields: O(1) lookup instead of O(n) scan
 * - Relation loading: Faster foreign key lookups
 *
 * @example
 * ```typescript
 * const prisma = createPrismocker<PrismaClient>({
 *   enableIndexes: true,
 *   indexConfig: {
 *     companies: {
 *       fields: { id: 'primary', owner_id: 'foreign' },
 *     },
 *   },
 * });
 * ```
 */

/**
 * Configuration for index management per model.
 *
 * Allows fine-grained control over which fields are indexed and how they're categorized.
 */
export interface IndexConfig {
  /**
   * Fields to index for this model
   * Format: { fieldName: 'primary' | 'foreign' | 'filter' }
   */
  fields?: Record<string, 'primary' | 'foreign' | 'filter'>;
  /**
   * Auto-detect primary keys (default: true)
   * Looks for 'id' field or fields ending in '_id' that are unique
   */
  autoDetectPrimaryKeys?: boolean;
  /**
   * Auto-detect foreign keys (default: true)
   * Looks for fields ending in '_id'
   */
  autoDetectForeignKeys?: boolean;
}

export interface IndexEntry {
  value: any;
  recordIndex: number;
}

/**
 * IndexManager - Manages in-memory indexes for fast record lookups.
 *
 * This class provides a way to create and maintain indexes on model fields
 * to speed up `findUnique` and `findFirst` operations, especially for
 * lookups by ID or other unique fields.
 *
 * **Index Structure:**
 * - `Map<modelName, Map<fieldName, Map<fieldValue, Set<recordIndex>>>>`
 * - Allows O(1) lookup: model → field → value → record indices
 *
 * **Automatic Indexing:**
 * - Primary keys (`id` fields) are automatically indexed
 * - Foreign keys (fields ending in `_id`) are automatically indexed
 * - Custom fields can be configured via `IndexConfig`
 *
 * @example
 * ```typescript
 * // Indexes are automatically used by ModelProxy
 * const user = await prisma.user.findUnique({ where: { id: 'user-1' } });
 * // Uses index for O(1) lookup instead of O(n) scan
 * ```
 *
 * @internal This class is used internally by PrismockerClient and ModelProxy
 */
export class IndexManager {
  /**
   * Indexes by model name, then by field name, then by value
   * Format: Map<modelName, Map<fieldName, Map<value, Set<recordIndex>>>>
   */
  private indexes: Map<string, Map<string, Map<any, Set<number>>>> = new Map();

  /**
   * Index configuration per model
   */
  private configs: Map<string, IndexConfig> = new Map();

  /**
   * Configures index settings for a specific model.
   *
   * This method allows you to specify which fields should be indexed and how
   * they should be categorized (primary, foreign, or filter). Configuration
   * is applied when indexes are built (via `buildIndexes()`).
   *
   * @param modelName - The name of the model to configure
   * @param config - Index configuration for the model
   *
   * @example
   * ```typescript
   * indexManager.configureModel('companies', {
   *   fields: {
   *     id: 'primary',
   *     owner_id: 'foreign',
   *     slug: 'filter',
   *   },
   *   autoDetectPrimaryKeys: true,
   *   autoDetectForeignKeys: true,
   * });
   * ```
   */
  configureModel(modelName: string, config: IndexConfig): void {
    this.configs.set(modelName, config);
    // Rebuild indexes if data already exists
    // (This would require access to the data store, so we'll rebuild on next query)
  }

  /**
   * Builds indexes for all records in a model.
   *
   * This method creates indexes for all fields in all records for the specified model.
   * It respects the configuration set via `configureModel()` and automatically detects
   * primary keys and foreign keys if enabled.
   *
   * **When indexes are built:**
   * - Automatically when `setData()` is called
   * - Automatically when records are created via `create()` or `createMany()`
   * - Can be called manually if needed
   *
   * @param modelName - The name of the model
   * @param records - Array of records to index
   *
   * @internal This method is called automatically by PrismockerClient when data is set
   */
  buildIndexes(modelName: string, records: any[]): void {
    const config = this.configs.get(modelName) || {
      autoDetectPrimaryKeys: true,
      autoDetectForeignKeys: true,
    };

    // Clear existing indexes for this model
    if (!this.indexes.has(modelName)) {
      this.indexes.set(modelName, new Map());
    }
    const modelIndexes = this.indexes.get(modelName)!;
    modelIndexes.clear();

    // Build indexes for each record
    records.forEach((record, recordIndex) => {
      // Index all fields that match our criteria
      for (const fieldName in record) {
        const fieldValue = record[fieldName];

        // Skip null/undefined values
        if (fieldValue === null || fieldValue === undefined) {
          continue;
        }

        let shouldIndex = false;
        let indexType: 'primary' | 'foreign' | 'filter' = 'filter';

        // Check explicit configuration
        if (config.fields && fieldName in config.fields) {
          shouldIndex = true;
          indexType = config.fields[fieldName];
        } else {
          // Auto-detect primary keys
          if (config.autoDetectPrimaryKeys && fieldName === 'id') {
            shouldIndex = true;
            indexType = 'primary';
          }
          // Auto-detect foreign keys
          else if (config.autoDetectForeignKeys && fieldName.endsWith('_id')) {
            shouldIndex = true;
            indexType = 'foreign';
          }
        }

        if (shouldIndex) {
          // Initialize field index if needed
          if (!modelIndexes.has(fieldName)) {
            modelIndexes.set(fieldName, new Map());
          }
          const fieldIndex = modelIndexes.get(fieldName)!;

          // Add record index to the value's set
          if (!fieldIndex.has(fieldValue)) {
            fieldIndex.set(fieldValue, new Set());
          }
          fieldIndex.get(fieldValue)!.add(recordIndex);
        }
      }
    });
  }

  /**
   * Gets all record indices for a specific field value lookup.
   *
   * This method performs an O(1) index lookup to find all records that have
   * the specified value for the specified field. Returns `null` if no index
   * exists for the field or if no records match.
   *
   * @param modelName - The name of the model
   * @param fieldName - The name of the field to look up
   * @param value - The value to search for
   * @returns A Set of record indices matching the value, or `null` if no index exists or no matches
   *
   * @internal This method is used by ModelProxy for optimized lookups
   */
  getRecordIndices(modelName: string, fieldName: string, value: any): Set<number> | null {
    const modelIndexes = this.indexes.get(modelName);
    if (!modelIndexes) {
      return null;
    }

    const fieldIndex = modelIndexes.get(fieldName);
    if (!fieldIndex) {
      return null;
    }

    return fieldIndex.get(value) || null;
  }

  /**
   * Adds a single record to the indexes.
   *
   * This method is called automatically when records are created via `create()`
   * or `createMany()`. It indexes all relevant fields according to the model's
   * index configuration.
   *
   * @param modelName - The name of the model
   * @param record - The record to index
   * @param recordIndex - The index of the record in the store array
   *
   * @internal This method is called automatically by ModelProxy when records are created
   */
  addRecord(modelName: string, record: any, recordIndex: number): void {
    const config = this.configs.get(modelName) || {
      autoDetectPrimaryKeys: true,
      autoDetectForeignKeys: true,
    };

    // Ensure model indexes exist
    if (!this.indexes.has(modelName)) {
      this.indexes.set(modelName, new Map());
    }
    const modelIndexes = this.indexes.get(modelName)!;

    // Index all relevant fields
    for (const fieldName in record) {
      const fieldValue = record[fieldName];

      // Skip null/undefined values
      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }

      let shouldIndex = false;

      // Check explicit configuration
      if (config.fields && fieldName in config.fields) {
        shouldIndex = true;
      } else {
        // Auto-detect primary keys
        if (config.autoDetectPrimaryKeys && fieldName === 'id') {
          shouldIndex = true;
        }
        // Auto-detect foreign keys
        else if (config.autoDetectForeignKeys && fieldName.endsWith('_id')) {
          shouldIndex = true;
        }
      }

      if (shouldIndex) {
        // Initialize field index if needed
        if (!modelIndexes.has(fieldName)) {
          modelIndexes.set(fieldName, new Map());
        }
        const fieldIndex = modelIndexes.get(fieldName)!;

        // Add record index to the value's set
        if (!fieldIndex.has(fieldValue)) {
          fieldIndex.set(fieldValue, new Set());
        }
        fieldIndex.get(fieldValue)!.add(recordIndex);
      }
    }
  }

  /**
   * Removes a record from the indexes.
   *
   * This method is called automatically when records are deleted. It removes
   * all index entries for the specified record.
   *
   * **Note:** After removing a record, indexes for subsequent records may need
   * to be rebuilt because record indices shift. This is handled automatically
   * by calling `buildIndexes()` after deletions.
   *
   * @param modelName - The name of the model
   * @param recordIndex - The index of the record being removed
   * @param oldRecord - The record being removed (used to determine which index entries to remove)
   *
   * @internal This method is called automatically by ModelProxy when records are deleted
   */
  removeRecord(modelName: string, recordIndex: number, oldRecord: any): void {
    const modelIndexes = this.indexes.get(modelName);
    if (!modelIndexes) {
      return;
    }

    // Remove from all field indexes
    for (const fieldName in oldRecord) {
      const fieldValue = oldRecord[fieldName];
      const fieldIndex = modelIndexes.get(fieldName);
      if (fieldIndex) {
        const valueSet = fieldIndex.get(fieldValue);
        if (valueSet) {
          valueSet.delete(recordIndex);
          // Clean up empty sets
          if (valueSet.size === 0) {
            fieldIndex.delete(fieldValue);
          }
        }
      }
    }
  }

  /**
   * Updates a record in the indexes by removing old entries and adding new ones.
   *
   * This method is called automatically when records are updated via `update()` or `updateMany()`.
   * It ensures that indexes reflect the current state of the record after the update.
   *
   * @param modelName - The name of the model
   * @param recordIndex - The index of the record being updated
   * @param oldRecord - The record before the update (used to remove old index entries)
   * @param newRecord - The record after the update (used to add new index entries)
   *
   * @internal This method is called automatically by ModelProxy when records are updated
   */
  updateRecord(modelName: string, recordIndex: number, oldRecord: any, newRecord: any): void {
    this.removeRecord(modelName, recordIndex, oldRecord);
    this.addRecord(modelName, newRecord, recordIndex);
  }

  /**
   * Clears all indexes for a specific model.
   *
   * This method removes all index entries for the specified model. Useful for
   * test isolation or when you want to force index rebuilding.
   *
   * @param modelName - The name of the model whose indexes should be cleared
   *
   * @internal This method is called automatically by `clear()` in PrismockerClient
   */
  clearModel(modelName: string): void {
    this.indexes.delete(modelName);
  }

  /**
   * Clears all indexes for all models.
   *
   * This method removes all index entries across all models. Useful for
   * test isolation or when you want to force index rebuilding.
   *
   * @internal This method is called automatically by `reset()` in PrismockerClient
   */
  clear(): void {
    this.indexes.clear();
  }

  /**
   * Gets statistics about the current index state.
   *
   * Returns information about how many models are indexed, how many indexes exist,
   * and details about each model's indexes. Useful for debugging and performance analysis.
   *
   * @returns An object containing index statistics:
   * - `modelCount`: Number of models with indexes
   * - `totalIndexes`: Total number of field indexes across all models
   * - `models`: Record mapping model names to their index statistics
   *
   * @example
   * ```typescript
   * const stats = indexManager.getStats();
   * console.log(`Indexed models: ${stats.modelCount}`);
   * console.log(`Total indexes: ${stats.totalIndexes}`);
   * for (const [modelName, modelStats] of Object.entries(stats.models)) {
   *   console.log(`${modelName}: ${modelStats.fieldCount} fields indexed`);
   * }
   * ```
   */
  getStats(): {
    modelCount: number;
    totalIndexes: number;
    models: Record<
      string,
      {
        fieldCount: number;
        fields: string[];
        totalEntries: number;
      }
    >;
  } {
    const stats = {
      modelCount: this.indexes.size,
      totalIndexes: 0,
      models: {} as Record<
        string,
        {
          fieldCount: number;
          fields: string[];
          totalEntries: number;
        }
      >,
    };

    for (const [modelName, modelIndexes] of this.indexes.entries()) {
      const modelStats = {
        fieldCount: modelIndexes.size,
        fields: Array.from(modelIndexes.keys()),
        totalEntries: 0,
      };

      for (const fieldIndex of modelIndexes.values()) {
        modelStats.totalEntries += fieldIndex.size;
      }

      stats.totalIndexes += modelStats.fieldCount;
      stats.models[modelName] = modelStats;
    }

    return stats;
  }
}
