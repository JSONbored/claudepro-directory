/**
 * QueryEngine - Handles Prisma query filtering, sorting, and relation filtering.
 *
 * This class is responsible for:
 * - Filtering records based on Prisma `where` clauses (supports all Prisma operators)
 * - Sorting records based on Prisma `orderBy` clauses
 * - Handling relation filters (`some`, `every`, `none`) for filtering by related records
 * - Supporting complex query conditions (AND, OR, NOT)
 *
 * QueryEngine is used internally by ModelProxy to process all query operations.
 *
 * @example
 * ```typescript
 * // QueryEngine is used automatically by ModelProxy
 * const users = await prisma.user.findMany({
 *   where: {
 *     status: 'active',
 *     age: { gte: 18 },
 *     posts: { some: { published: true } }, // Relation filter
 *   },
 *   orderBy: { createdAt: 'desc' },
 * });
 * ```
 *
 * @internal This class is used internally by PrismockerClient and ModelProxy
 */
import type { PrismockerOptions } from './types.js';

export class QueryEngine {
  private relationLoader?: (record: any, relationName: string) => any[] | any | null;

  constructor(_options: PrismockerOptions) {
    // Options reserved for future use (logging, etc.)
  }

  /**
   * Sets the relation loader function for relation filters (`some`, `every`, `none`).
   *
   * The relation loader is used when filtering records based on related records.
   * For example, when filtering users by their posts: `{ posts: { some: { published: true } } }`.
   *
   * @param loader - Function that loads related records for a given record and relation name.
   *                 Should return an array for one-to-many relations, a single object for one-to-one,
   *                 or null if no relation exists.
   *
   * @internal This method is called by ModelProxy to enable relation filtering
   */
  setRelationLoader(loader: (record: any, relationName: string) => any[] | any | null): void {
    this.relationLoader = loader;
  }

  /**
   * Filters an array of records based on a Prisma `where` clause.
   *
   * This method supports all Prisma where clause operators including:
   * - Comparison operators: `equals`, `not`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`
   * - String operators: `contains`, `startsWith`, `endsWith`, `search`
   * - Array operators: `array_contains`, `has`
   * - JSON operators: `path` (for navigating JSON fields)
   * - Existence operators: `isSet`
   * - Logical operators: `AND`, `OR`, `NOT`
   * - Relation filters: `some`, `every`, `none`
   *
   * @param records - Array of records to filter
   * @param where - Prisma where clause object (optional, returns all records if omitted)
   * @returns Filtered array of records matching the where clause
   *
   * @example
   * ```typescript
   * const activeUsers = queryEngine.filter(users, {
   *   status: 'active',
   *   age: { gte: 18 },
   * });
   *
   * const usersWithPosts = queryEngine.filter(users, {
   *   posts: { some: { published: true } },
   * });
   * ```
   */
  filter(records: any[], where: any): any[] {
    if (!where) {
      return records;
    }

    return records.filter((record) => this.matches(record, where));
  }

  /**
   * Checks if a single record matches a Prisma `where` clause.
   *
   * This is the core matching logic used by `filter()`. It recursively evaluates
   * all conditions in the where clause, including nested conditions, logical operators,
   * and relation filters.
   *
   * @param record - The record to check
   * @param where - Prisma where clause object (returns `true` if omitted)
   * @returns `true` if the record matches all conditions in the where clause, `false` otherwise
   *
   * @internal This method is used internally by `filter()` and is not typically called directly
   */
  matches(record: any, where: any): boolean {
    if (!where) {
      return true;
    }

    // Handle AND clause (all conditions must match)
    if ('AND' in where && Array.isArray(where.AND)) {
      const andResult = where.AND.every((condition: any) => this.matches(record, condition));
      // AND clause might be combined with other conditions, so we need to check those too
      const otherConditions: any = { ...where };
      delete otherConditions.AND;
      if (Object.keys(otherConditions).length > 0) {
        return andResult && this.matches(record, otherConditions);
      }
      return andResult;
    }

    // Handle OR clause (at least one condition must match)
    // OR is combined with other conditions using AND logic
    if ('OR' in where && Array.isArray(where.OR)) {
      const orResult = where.OR.some((condition: any) => this.matches(record, condition));
      // OR clause is combined with other conditions using AND
      const otherConditions: any = { ...where };
      delete otherConditions.OR;
      if (Object.keys(otherConditions).length > 0) {
        return orResult && this.matches(record, otherConditions);
      }
      return orResult;
    }

    // Handle NOT clause
    if ('NOT' in where) {
      const notResult = !this.matches(record, where.NOT);
      const otherConditions: any = { ...where };
      delete otherConditions.NOT;
      if (Object.keys(otherConditions).length > 0) {
        return notResult && this.matches(record, otherConditions);
      }
      return notResult;
    }

    // Process all conditions (implicit AND)
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) {
        return true;
      }

      // Handle nested objects (relations)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check for JSON path operator first (before other operators)
        if ('path' in value) {
          // JSON path operator - query nested JSON fields
          // Format: { path: ['key1', 'key2', ...], equals: value }
          // or: { path: ['key1', 'key2'], array_contains: value }
          const pathArray = (value as any).path;
          if (!Array.isArray(pathArray) || pathArray.length === 0) {
            return false;
          }
          // Navigate through the JSON path
          let currentValue: any = record[key];
          for (const pathKey of pathArray) {
            if (currentValue === null || currentValue === undefined) {
              return false;
            }
            if (typeof currentValue !== 'object') {
              return false;
            }
            currentValue = currentValue[pathKey];
          }
          // After navigating the path, apply the remaining operators
          // Create a where clause with the remaining operators (excluding path)
          const pathWhere: any = { ...value };
          delete pathWhere.path;
          // If there are no remaining operators, just check if the value exists
          if (Object.keys(pathWhere).length === 0) {
            return currentValue !== null && currentValue !== undefined;
          }
          // Apply the remaining operators to the final value
          // Direct comparison for equals operator (most common case)
          if ('equals' in pathWhere && Object.keys(pathWhere).length === 1) {
            const result = currentValue === pathWhere.equals;
            return result;
          }
          // For other operators, create a temporary record and use matches method
          const tempRecord = { value: currentValue };
          return this.matches(tempRecord, { value: pathWhere });
        }
        // Check for Prisma operators
        if ('equals' in value) {
          return record[key] === value.equals;
        }
        if ('not' in value) {
          return record[key] !== value.not;
        }
        if ('in' in value) {
          return Array.isArray(value.in) && value.in.includes(record[key]);
        }
        if ('notIn' in value) {
          return Array.isArray(value.notIn) && !value.notIn.includes(record[key]);
        }
        if ('lt' in value) {
          return record[key] < (value as any).lt;
        }
        if ('lte' in value) {
          return record[key] <= (value as any).lte;
        }
        if ('gt' in value) {
          return record[key] > (value as any).gt;
        }
        if ('gte' in value) {
          return record[key] >= (value as any).gte;
        }
        if ('contains' in value) {
          return String(record[key]).includes(String((value as any).contains));
        }
        if ('startsWith' in value) {
          return String(record[key]).startsWith(String((value as any).startsWith));
        }
        if ('endsWith' in value) {
          return String(record[key]).endsWith(String((value as any).endsWith));
        }
        if ('mode' in value) {
          // Case-insensitive mode (simplified - just ignore for now)
          return this.matches(record, { [key]: value });
        }
        if ('search' in value) {
          // Full-text search (PostgreSQL) - case-insensitive string matching
          // For mock, we'll do a simple case-insensitive contains search
          const searchTerm = String((value as any).search).toLowerCase();
          const fieldValue = String(record[key] || '').toLowerCase();
          return fieldValue.includes(searchTerm);
        }
        if ('array_contains' in value || 'has' in value) {
          // Array contains operator - check if array field contains a value
          // Supports both 'array_contains' and 'has' (Prisma uses 'has' for PostgreSQL)
          const searchValue = (value as any).array_contains ?? (value as any).has;
          const fieldValue = record[key];
          if (!Array.isArray(fieldValue)) {
            return false;
          }
          return fieldValue.includes(searchValue);
        }
        if ('isSet' in value) {
          // Check if field is set (not null/undefined)
          // Format: { isSet: true } or { isSet: false }
          const isSet = (value as any).isSet === true;
          const fieldValue = record[key];
          const isFieldSet = fieldValue !== null && fieldValue !== undefined;
          return isSet ? isFieldSet : !isFieldSet;
        }

        // Handle relation filters (some, every, none)
        // These are used to filter records based on related records
        // e.g., { jobs: { some: { status: 'active' } } }
        if (this.relationLoader && ('some' in value || 'every' in value || 'none' in value)) {
          const relatedRecords = this.relationLoader(record, key);
          const relatedArray = Array.isArray(relatedRecords)
            ? relatedRecords
            : relatedRecords
              ? [relatedRecords]
              : [];

          if ('some' in value) {
            // At least one related record must match
            return relatedArray.some((relatedRecord: any) =>
              this.matches(relatedRecord, value.some)
            );
          }
          if ('every' in value) {
            // All related records must match (or no related records)
            return (
              relatedArray.length === 0 ||
              relatedArray.every((relatedRecord: any) => this.matches(relatedRecord, value.every))
            );
          }
          if ('none' in value) {
            // No related records must match
            return (
              relatedArray.length === 0 ||
              relatedArray.every((relatedRecord: any) => !this.matches(relatedRecord, value.none))
            );
          }
        }

        // Handle composite unique constraints (e.g., slug_category: { slug: 'test', category: 'agents' })
        // If the key doesn't exist on the record but the nested object's keys do exist,
        // treat it as a composite unique constraint and match those fields directly
        if (!(key in record) && typeof value === 'object' && value !== null) {
          // Check if all nested keys exist on the record
          const nestedKeys = Object.keys(value);
          const allKeysExist = nestedKeys.every((nestedKey) => nestedKey in record);

          if (allKeysExist) {
            // This is a composite unique constraint - match the nested fields directly
            return nestedKeys.every((nestedKey) => {
              const nestedValue = (value as any)[nestedKey];
              return this.matches(record, { [nestedKey]: nestedValue });
            });
          }
        }

        // Nested where clause (AND) - for relations or other nested structures
        return this.matches(record[key], value);
      }

      // Simple equality (treat undefined and null as equivalent for matching)
      const recordValue = record[key];
      if (value === null && (recordValue === null || recordValue === undefined)) {
        return true;
      }
      if (value === undefined && (recordValue === null || recordValue === undefined)) {
        return true;
      }
      return recordValue === value;
    });
  }

  /**
   * Sorts an array of records based on a Prisma `orderBy` clause.
   *
   * This method supports:
   * - Single field sorting: `{ createdAt: 'desc' }`
   * - Multiple field sorting: `[{ createdAt: 'desc' }, { name: 'asc' }]`
   * - Ascending (`'asc'`) and descending (`'desc'`) directions
   * - Sorting by nested fields (for relations)
   *
   * @param records - Array of records to sort
   * @param orderBy - Prisma orderBy clause (single object or array of objects)
   * @returns New sorted array (original array is not modified)
   *
   * @example
   * ```typescript
   * // Sort by single field
   * const sorted = queryEngine.sort(users, { createdAt: 'desc' });
   *
   * // Sort by multiple fields
   * const sorted = queryEngine.sort(users, [
   *   { status: 'asc' },
   *   { createdAt: 'desc' },
   * ]);
   * ```
   */
  sort(records: any[], orderBy: any | any[]): any[] {
    if (!orderBy) {
      return records;
    }

    const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];

    return [...records].sort((a, b) => {
      for (const order of orderByArray) {
        for (const [field, direction] of Object.entries(order)) {
          const aVal = a[field];
          const bVal = b[field];

          if (aVal === bVal) {
            continue;
          }

          const comparison = aVal < bVal ? -1 : 1;
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }
}
