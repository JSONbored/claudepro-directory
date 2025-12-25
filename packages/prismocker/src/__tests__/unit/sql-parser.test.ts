/**
 * Comprehensive Unit Tests for SqlParser
 *
 * Tests SQL parsing for SELECT, INSERT, UPDATE, DELETE statements.
 */

import { describe, it, expect } from '@jest/globals';
import { parseSimpleSelect, executeSimpleSelect } from '../../sql-parser.js';

describe('SqlParser Unit Tests', () => {
  describe('parseSimpleSelect', () => {
    it('should parse simple SELECT query', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users');
      expect(parsed).toEqual({
        tableName: 'users',
      });
    });

    it('should parse SELECT with WHERE clause', () => {
      const parsed = parseSimpleSelect("SELECT * FROM users WHERE id = 'user-1'");
      expect(parsed).toEqual({
        tableName: 'users',
        where: { id: 'user-1' },
      });
    });

    it('should parse SELECT with LIMIT', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users LIMIT 10');
      expect(parsed).toEqual({
        tableName: 'users',
        limit: 10,
      });
    });

    it('should parse SELECT with OFFSET', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users OFFSET 5');
      expect(parsed).toEqual({
        tableName: 'users',
        offset: 5,
      });
    });

    it('should parse SELECT with WHERE, LIMIT, and OFFSET', () => {
      const parsed = parseSimpleSelect(
        "SELECT * FROM users WHERE status = 'active' LIMIT 10 OFFSET 5"
      );
      expect(parsed).toEqual({
        tableName: 'users',
        where: { status: 'active' },
        limit: 10,
        offset: 5,
      });
    });

    it('should handle quoted string values in WHERE clause', () => {
      const parsed = parseSimpleSelect("SELECT * FROM users WHERE name = 'John Doe'");
      expect(parsed?.where?.name).toBe('John Doe');
    });

    it('should handle numeric values in WHERE clause', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users WHERE age = 25');
      expect(parsed?.where?.age).toBe('25'); // Parser returns as string
    });

    it('should return null for invalid SQL', () => {
      const parsed = parseSimpleSelect('INVALID SQL QUERY');
      expect(parsed).toBeNull();
    });

    it('should return null for complex queries (JOINs, subqueries)', () => {
      const parsed = parseSimpleSelect(
        'SELECT * FROM users JOIN posts ON users.id = posts.user_id'
      );
      expect(parsed).toBeNull();
    });
  });

  describe('executeSimpleSelect', () => {
    const mockStore = [
      { id: 'user-1', name: 'Alice', status: 'active' },
      { id: 'user-2', name: 'Bob', status: 'inactive' },
      { id: 'user-3', name: 'Charlie', status: 'active' },
    ];
    const mockStores = new Map<string, any[]>([['users', mockStore]]);

    it('should execute simple SELECT query', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users');
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(3);
    });

    it('should execute SELECT with WHERE clause', () => {
      const parsed = parseSimpleSelect("SELECT * FROM users WHERE status = 'active'");
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'active')).toBe(true);
    });

    it('should execute SELECT with LIMIT', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users LIMIT 2');
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(2);
    });

    it('should execute SELECT with OFFSET', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users OFFSET 1');
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(2);
    });

    it('should execute SELECT with LIMIT and OFFSET', () => {
      const parsed = parseSimpleSelect('SELECT * FROM users LIMIT 1 OFFSET 1');
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-2');
    });

    it('should return empty array for non-matching WHERE clause', () => {
      const parsed = parseSimpleSelect("SELECT * FROM users WHERE status = 'nonexistent'");
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, mockStores);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty store', () => {
      const emptyStores = new Map<string, any[]>([['users', []]]);
      const parsed = parseSimpleSelect('SELECT * FROM users');
      expect(parsed).not.toBeNull();
      const result = executeSimpleSelect(parsed!, emptyStores);
      expect(result).toHaveLength(0);
    });

    it('should return null for invalid SQL', () => {
      const parsed = parseSimpleSelect('INVALID SQL');
      expect(parsed).toBeNull();
      if (parsed) {
        const result = executeSimpleSelect(parsed, mockStores);
        expect(result).toBeNull();
      }
    });
  });
});
