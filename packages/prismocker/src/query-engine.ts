/**
 * QueryEngine - Handles Prisma query filtering and sorting
 */

import type { PrismockerOptions } from './types.js';

export class QueryEngine {
  constructor(_options: PrismockerOptions) {
    // Options reserved for future use (logging, etc.)
  }

  /**
   * Filter records based on Prisma where clause
   */
  filter(records: any[], where: any): any[] {
    if (!where) {
      return records;
    }

    return records.filter((record) => this.matches(record, where));
  }

  /**
   * Check if a record matches a where clause
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
   * Sort records based on Prisma orderBy clause
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

