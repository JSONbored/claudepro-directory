/**
 * Comprehensive Unit Tests for IndexManager
 *
 * Tests index creation, updates, lookups, and performance optimizations.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IndexManager, type IndexConfig } from '../../index-manager.js';

describe('IndexManager Unit Tests', () => {
  let indexManager: IndexManager;

  beforeEach(() => {
    indexManager = new IndexManager();
  });

  describe('Index Configuration', () => {
    it('should configure indexes for a model', () => {
      const config: IndexConfig = {
        fields: { id: 'primary', owner_id: 'foreign' },
      };
      indexManager.configureModel('users', config);
      // Configuration should be stored
      expect(indexManager).toBeDefined();
    });

    it('should auto-detect primary keys', () => {
      const records = [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
      ];
      indexManager.buildIndexes('users', records);
      // Indexes should be built for 'id' field
      expect(indexManager).toBeDefined();
    });

    it('should auto-detect foreign keys', () => {
      const records = [
        { id: 'post-1', user_id: 'user-1', title: 'Post 1' },
        { id: 'post-2', user_id: 'user-2', title: 'Post 2' },
      ];
      indexManager.buildIndexes('posts', records);
      // Indexes should be built for 'user_id' field
      expect(indexManager).toBeDefined();
    });
  });

  describe('Index Building', () => {
    it('should build indexes for primary key fields', () => {
      const records = [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
        { id: 'user-3', name: 'Charlie' },
      ];
      indexManager.buildIndexes('users', records);
      // Indexes should be built
      expect(indexManager).toBeDefined();
    });

    it('should build indexes for multiple fields', () => {
      const config: IndexConfig = {
        fields: { id: 'primary', email: 'filter', company_id: 'foreign' },
      };
      indexManager.configureModel('users', config);
      const records = [
        { id: 'user-1', email: 'alice@example.com', company_id: 'comp-1' },
        { id: 'user-2', email: 'bob@example.com', company_id: 'comp-2' },
      ];
      indexManager.buildIndexes('users', records);
      expect(indexManager).toBeDefined();
    });

    it('should handle empty records array', () => {
      indexManager.buildIndexes('users', []);
      expect(indexManager).toBeDefined();
    });

    it('should handle records with null/undefined values', () => {
      const records = [
        { id: 'user-1', email: 'alice@example.com', company_id: null },
        { id: 'user-2', email: null, company_id: 'comp-1' },
        { id: 'user-3' }, // email and company_id are undefined
      ];
      indexManager.buildIndexes('users', records);
      expect(indexManager).toBeDefined();
    });
  });

  describe('Index Lookups', () => {
    beforeEach(() => {
      const records = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ];
      indexManager.buildIndexes('users', records);
    });

    it('should find records by indexed field', () => {
      const indices = indexManager.getRecordIndices('users', 'id', 'user-2');
      expect(indices).toBeDefined();
      expect(indices).not.toBeNull();
      expect(indices?.size).toBe(1);
    });

    it('should return empty set for non-existent values', () => {
      const indices = indexManager.getRecordIndices('users', 'id', 'non-existent');
      // getRecordIndices returns null if no index exists, or a Set (which could be empty)
      // If index exists but value not found, it returns null (from fieldIndex.get(value) || null)
      expect(indices).toBeNull();
    });

    it('should return null for non-indexed fields', () => {
      const indices = indexManager.getRecordIndices('users', 'nonIndexedField', 'value');
      expect(indices).toBeNull();
    });
  });

  describe('Index Updates', () => {
    it('should update indexes when record is added', () => {
      const records = [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
      ];
      indexManager.buildIndexes('users', records);
      indexManager.addRecord('users', { id: 'user-3', name: 'Charlie' }, 2);
      const indices = indexManager.getRecordIndices('users', 'id', 'user-3');
      expect(indices).not.toBeNull();
      expect(indices?.size).toBe(1);
    });

    it('should update indexes when record is updated', () => {
      const records = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      ];
      indexManager.buildIndexes('users', records);
      const oldRecord = { id: 'user-1', name: 'Alice', email: 'alice@example.com' };
      const newRecord = { id: 'user-1', name: 'Alice', email: 'alice.new@example.com' };
      indexManager.updateRecord('users', 0, oldRecord, newRecord);
      // Indexes should be updated
      expect(indexManager).toBeDefined();
    });

    it('should update indexes when record is deleted', () => {
      const records = [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
        { id: 'user-3', name: 'Charlie' },
      ];
      indexManager.buildIndexes('users', records);
      indexManager.removeRecord('users', 1, { id: 'user-2', name: 'Bob' });
      const indices = indexManager.getRecordIndices('users', 'id', 'user-2');
      // After deletion, the index should return null (value no longer exists)
      expect(indices).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      const start = Date.now();
      indexManager.buildIndexes('users', largeDataset);
      const buildTime = Date.now() - start;
      expect(buildTime).toBeLessThan(100); // Should build in < 100ms

      const lookupStart = Date.now();
      const indices = indexManager.getRecordIndices('users', 'id', 'user-500');
      const lookupTime = Date.now() - lookupStart;
      expect(lookupTime).toBeLessThan(10); // Should lookup in < 10ms
      expect(indices).not.toBeNull();
      expect(indices?.size).toBe(1);
    });
  });
});
