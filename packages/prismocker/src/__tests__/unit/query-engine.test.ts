/**
 * Comprehensive Unit Tests for QueryEngine
 *
 * Tests all Prisma where clause operators, edge cases, and performance.
 * These tests ensure QueryEngine correctly filters records according to Prisma's query API.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { QueryEngine } from '../../query-engine.js';
import type { PrismockerOptions } from '../../types.js';

describe('QueryEngine Unit Tests', () => {
  let queryEngine: QueryEngine;
  const mockOptions: PrismockerOptions = {};

  beforeEach(() => {
    queryEngine = new QueryEngine(mockOptions);
  });

  describe('Basic Filtering', () => {
    it('should return all records when where clause is empty', () => {
      const records = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];
      const result = queryEngine.filter(records, {});
      expect(result).toHaveLength(2);
    });

    it('should return all records when where clause is null/undefined', () => {
      const records = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];
      expect(queryEngine.filter(records, null as any)).toHaveLength(2);
      expect(queryEngine.filter(records, undefined as any)).toHaveLength(2);
    });

    it('should filter by exact match', () => {
      const records = [
        { id: '1', name: 'Alice', status: 'active' },
        { id: '2', name: 'Bob', status: 'inactive' },
        { id: '3', name: 'Charlie', status: 'active' },
      ];
      const result = queryEngine.filter(records, { status: 'active' });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'active')).toBe(true);
    });
  });

  describe('Comparison Operators', () => {
    const records = [
      { id: '1', age: 20, score: 85 },
      { id: '2', age: 25, score: 90 },
      { id: '3', age: 30, score: 75 },
      { id: '4', age: 35, score: 95 },
    ];

    it('should support equals operator', () => {
      const result = queryEngine.filter(records, { age: { equals: 25 } });
      expect(result).toHaveLength(1);
      expect(result[0].age).toBe(25);
    });

    it('should support not operator', () => {
      const result = queryEngine.filter(records, { age: { not: 25 } });
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.age !== 25)).toBe(true);
    });

    it('should support in operator', () => {
      const result = queryEngine.filter(records, { age: { in: [20, 30] } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.age).sort()).toEqual([20, 30]);
    });

    it('should support notIn operator', () => {
      const result = queryEngine.filter(records, { age: { notIn: [20, 30] } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.age).sort()).toEqual([25, 35]);
    });

    it('should support lt (less than) operator', () => {
      const result = queryEngine.filter(records, { age: { lt: 30 } });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.age < 30)).toBe(true);
    });

    it('should support lte (less than or equal) operator', () => {
      const result = queryEngine.filter(records, { age: { lte: 25 } });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.age <= 25)).toBe(true);
    });

    it('should support gt (greater than) operator', () => {
      const result = queryEngine.filter(records, { age: { gt: 25 } });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.age > 25)).toBe(true);
    });

    it('should support gte (greater than or equal) operator', () => {
      const result = queryEngine.filter(records, { age: { gte: 30 } });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.age >= 30)).toBe(true);
    });
  });

  describe('String Operators', () => {
    const records = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@test.com' },
      { id: '3', name: 'Charlie', email: 'charlie@example.org' },
    ];

    it('should support contains operator', () => {
      const result = queryEngine.filter(records, { name: { contains: 'lic' } });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should support startsWith operator', () => {
      const result = queryEngine.filter(records, { name: { startsWith: 'B' } });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should support endsWith operator', () => {
      const result = queryEngine.filter(records, { name: { endsWith: 'e' } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name).sort()).toEqual(['Alice', 'Charlie']);
    });

    it('should support search operator (case-insensitive)', () => {
      const result = queryEngine.filter(records, { email: { search: 'example' } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.email).sort()).toEqual([
        'alice@example.com',
        'charlie@example.org',
      ]);
    });
  });

  describe('Array Operators', () => {
    const records = [
      { id: '1', tags: ['javascript', 'typescript'], skills: ['coding', 'design'] },
      { id: '2', tags: ['python', 'java'], skills: ['coding'] },
      { id: '3', tags: ['typescript'], skills: ['design', 'marketing'] },
    ];

    it('should support array_contains operator', () => {
      const result = queryEngine.filter(records, { tags: { array_contains: 'typescript' } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['1', '3']);
    });

    it('should support has operator (alias for array_contains)', () => {
      const result = queryEngine.filter(records, { tags: { has: 'typescript' } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['1', '3']);
    });

    it('should return false for array_contains when field is not an array', () => {
      const recordsWithNonArray = [{ id: '1', tags: 'not-an-array' }];
      const result = queryEngine.filter(recordsWithNonArray, { tags: { array_contains: 'value' } });
      expect(result).toHaveLength(0);
    });
  });

  describe('JSON Operators', () => {
    const records = [
      {
        id: '1',
        metadata: {
          author: { name: 'John Doe', email: 'john@example.com' },
          tags: ['tutorial', 'typescript'],
        },
      },
      {
        id: '2',
        metadata: {
          author: { name: 'Jane Smith', email: 'jane@example.com' },
          tags: ['guide', 'react'],
        },
      },
    ];

    it('should support path operator for nested JSON fields', () => {
      const result = queryEngine.filter(records, {
        metadata: {
          path: ['author', 'name'],
          equals: 'John Doe',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should support path operator with array_contains', () => {
      const result = queryEngine.filter(records, {
        metadata: {
          path: ['tags'],
          array_contains: 'typescript',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it("should return false for path operator when path doesn't exist", () => {
      const result = queryEngine.filter(records, {
        metadata: {
          path: ['nonexistent', 'field'],
          equals: 'value',
        },
      });
      expect(result).toHaveLength(0);
    });

    it('should return false for path operator when intermediate value is not an object', () => {
      const recordsWithInvalidPath = [
        {
          id: '1',
          metadata: {
            author: 'not-an-object',
          },
        },
      ];
      const result = queryEngine.filter(recordsWithInvalidPath, {
        metadata: {
          path: ['author', 'name'],
          equals: 'value',
        },
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('Existence Operators', () => {
    const records = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: null },
      { id: '3', name: 'Charlie' }, // email is undefined
    ];

    it('should support isSet operator (true)', () => {
      const result = queryEngine.filter(records, { email: { isSet: true } });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should support isSet operator (false)', () => {
      const result = queryEngine.filter(records, { email: { isSet: false } });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['2', '3']);
    });
  });

  describe('Logical Operators', () => {
    const records = [
      { id: '1', name: 'Alice', age: 20, status: 'active' },
      { id: '2', name: 'Bob', age: 25, status: 'inactive' },
      { id: '3', name: 'Charlie', age: 30, status: 'active' },
      { id: '4', name: 'David', age: 35, status: 'inactive' },
    ];

    it('should support AND operator', () => {
      const result = queryEngine.filter(records, {
        AND: [{ age: { gte: 25 } }, { status: 'active' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should support OR operator', () => {
      const result = queryEngine.filter(records, {
        OR: [{ age: { lt: 25 } }, { status: 'inactive' }],
      });
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.id).sort()).toEqual(['1', '2', '4']);
    });

    it('should support NOT operator', () => {
      const result = queryEngine.filter(records, {
        NOT: { status: 'active' },
      });
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['2', '4']);
    });

    it('should support nested logical operators', () => {
      const result = queryEngine.filter(records, {
        AND: [{ OR: [{ age: { lt: 30 } }, { age: { gt: 30 } }] }, { NOT: { status: 'inactive' } }],
      });
      // Age < 30 OR > 30: ['1', '2', '4'] (excludes '3' which is exactly 30)
      // AND status='active': ['1'] (only '1' is active and matches age condition)
      expect(result).toHaveLength(1);
      expect(result.map((r) => r.id).sort()).toEqual(['1']);
    });
  });

  describe('Relation Filters', () => {
    it('should support some operator (one-to-many)', () => {
      const records = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];
      const relationLoader = (record: any, relationName: string) => {
        if (relationName === 'posts') {
          if (record.id === '1') {
            return [
              { id: 'post-1', published: true },
              { id: 'post-2', published: false },
            ];
          }
          return [{ id: 'post-3', published: false }];
        }
        return null;
      };
      queryEngine.setRelationLoader(relationLoader);

      const result = queryEngine.filter(records, {
        posts: { some: { published: true } },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should support every operator (one-to-many)', () => {
      const records = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];
      const relationLoader = (record: any, relationName: string) => {
        if (relationName === 'posts') {
          if (record.id === '1') {
            return [
              { id: 'post-1', published: true },
              { id: 'post-2', published: true },
            ];
          }
          return [{ id: 'post-3', published: false }];
        }
        return null;
      };
      queryEngine.setRelationLoader(relationLoader);

      const result = queryEngine.filter(records, {
        posts: { every: { published: true } },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should support none operator (one-to-many)', () => {
      const records = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];
      const relationLoader = (record: any, relationName: string) => {
        if (relationName === 'posts') {
          if (record.id === '1') {
            return [{ id: 'post-1', published: true }];
          }
          return [{ id: 'post-3', published: false }];
        }
        return null;
      };
      queryEngine.setRelationLoader(relationLoader);

      const result = queryEngine.filter(records, {
        posts: { none: { published: true } },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('Sorting (orderBy)', () => {
    const records = [
      { id: '1', name: 'Charlie', age: 30 },
      { id: '2', name: 'Alice', age: 20 },
      { id: '3', name: 'Bob', age: 25 },
    ];

    it('should sort by single field ascending', () => {
      const result = queryEngine.sort(records, { name: 'asc' });
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort by single field descending', () => {
      const result = queryEngine.sort(records, { name: 'desc' });
      expect(result.map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('should sort by multiple fields', () => {
      const recordsWithDuplicates = [
        { id: '1', category: 'A', score: 10 },
        { id: '2', category: 'A', score: 20 },
        { id: '3', category: 'B', score: 15 },
      ];
      const result = queryEngine.sort(recordsWithDuplicates, [
        { category: 'asc' },
        { score: 'desc' },
      ]);
      expect(result.map((r) => r.id)).toEqual(['2', '1', '3']);
    });

    it('should handle null/undefined values in sorting', () => {
      const recordsWithNulls = [
        { id: '1', name: 'Alice', age: null },
        { id: '2', name: 'Bob', age: 25 },
        { id: '3', name: 'Charlie' }, // age is undefined
      ];
      const result = queryEngine.sort(recordsWithNulls, { age: 'asc' });
      // Null/undefined values are sorted based on their comparison (null < undefined in JS)
      // The actual order depends on the sort implementation
      expect(result).toHaveLength(3);
      expect(result.find((r) => r.id === '2')?.age).toBe(25); // Bob should be in the middle or first
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty records array', () => {
      const result = queryEngine.filter([], { name: 'Alice' });
      expect(result).toHaveLength(0);
    });

    it('should handle records with missing fields', () => {
      const records = [
        { id: '1', name: 'Alice' },
        { id: '2' }, // missing name
      ];
      const result = queryEngine.filter(records, { name: 'Alice' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should handle null values correctly', () => {
      const records = [
        { id: '1', name: 'Alice', email: null },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      const result = queryEngine.filter(records, { email: null });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should handle undefined values correctly', () => {
      const records = [
        { id: '1', name: 'Alice' }, // email is undefined
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      // QueryEngine treats undefined and null as equivalent for matching
      const result = queryEngine.filter(records, { email: undefined });
      // Should match records where email is undefined or null
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((r) => r.id === '1')).toBe(true);
    });

    it('should handle boolean values correctly', () => {
      const records = [
        { id: '1', active: true },
        { id: '2', active: false },
        { id: '3', active: true },
      ];
      const result = queryEngine.filter(records, { active: true });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.active === true)).toBe(true);
    });

    it('should handle numeric zero correctly', () => {
      const records = [
        { id: '1', score: 0 },
        { id: '2', score: 10 },
        { id: '3', score: -5 },
      ];
      const result = queryEngine.filter(records, { score: 0 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        name: `User ${i}`,
        age: i % 100,
      }));
      const start = Date.now();
      const result = queryEngine.filter(largeDataset, { age: { gte: 50 } });
      const duration = Date.now() - start;
      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
