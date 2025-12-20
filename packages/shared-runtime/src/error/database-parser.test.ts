import { describe, expect, it } from 'vitest';
import { isPostgrestError, parseDatabaseError } from './database-parser.ts';
import type { PostgrestError } from '@supabase/supabase-js';

describe('parseDatabaseError', () => {
  describe('constraint violations', () => {
    it('should parse content_slug_pattern constraint', () => {
      const error: PostgrestError = {
        code: '23514',
        message: 'new row for relation "content" violates constraint "content_slug_pattern"',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toContain('Slug must be 3-100 lowercase characters');
    });

    it('should parse content_category_check constraint', () => {
      const error: PostgrestError = {
        code: '23514',
        message: 'new row for relation "content" violates constraint "content_category_check"',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toContain('Invalid category');
    });

    it('should parse profiles_display_name_check constraint', () => {
      const error: PostgrestError = {
        code: '23514',
        message:
          'new row for relation "profiles" violates constraint "profiles_display_name_check"',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toContain('Display name must be 1-100 characters');
    });

    it('should parse bookmarks_notes_length constraint', () => {
      const error: PostgrestError = {
        code: '23514',
        message: 'new row for relation "bookmarks" violates constraint "bookmarks_notes_length"',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toContain('Bookmark notes must be 500 characters or less');
    });
  });

  describe('error code mappings', () => {
    it('should map unique_violation (23505)', () => {
      const error: PostgrestError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('This record already exists');
    });

    it('should map foreign_key_violation (23503)', () => {
      const error: PostgrestError = {
        code: '23503',
        message: 'insert or update on table violates foreign key constraint',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('Referenced record does not exist');
    });

    it('should map check_violation (23514) as fallback', () => {
      const error: PostgrestError = {
        code: '23514',
        message: 'new row violates check constraint "unknown_constraint"',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('Invalid data provided');
    });

    it('should map not_null_violation (23502)', () => {
      const error: PostgrestError = {
        code: '23502',
        message: 'null value in column violates not-null constraint',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('Required field is missing');
    });

    it('should map PGRST116 (No data found)', () => {
      const error: PostgrestError = {
        code: 'PGRST116',
        message: 'No rows found',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('No data found');
    });
  });

  describe('fallback behavior', () => {
    it('should return original error message if no mapping found', () => {
      const error: PostgrestError = {
        code: '99999',
        message: 'Custom error message',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('Custom error message');
    });

    it('should return fallback message if error message is empty', () => {
      const error: PostgrestError = {
        code: '99999',
        message: '',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('should handle error without code', () => {
      const error: PostgrestError = {
        code: null,
        message: 'Some error occurred',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('Some error occurred');
    });
  });

  describe('error object creation', () => {
    it('should return Error instance', () => {
      const error: PostgrestError = {
        code: '23505',
        message: 'duplicate key',
        details: null,
        hint: null,
      };
      const result = parseDatabaseError(error);
      expect(result).toBeInstanceOf(Error);
    });

    it('should preserve error structure', () => {
      const error: PostgrestError = {
        code: '23505',
        message: 'duplicate key',
        details: 'Key (id)=(123) already exists',
        hint: 'Try updating instead',
      };
      const result = parseDatabaseError(error);
      expect(result.message).toBe('This record already exists');
      expect(result).toBeInstanceOf(Error);
    });
  });
});

describe('isPostgrestError', () => {
  it('should return true for PostgrestError objects', () => {
    const error: PostgrestError = {
      code: '23505',
      message: 'duplicate key',
      details: null,
      hint: null,
    };
    expect(isPostgrestError(error)).toBe(true);
  });

  it('should return false for Error objects', () => {
    const error = new Error('test');
    expect(isPostgrestError(error)).toBe(false);
  });

  it('should return false for plain objects without code', () => {
    const obj = { message: 'test' };
    expect(isPostgrestError(obj)).toBe(false);
  });

  it('should return false for plain objects without message', () => {
    const obj = { code: '23505' };
    expect(isPostgrestError(obj)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isPostgrestError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isPostgrestError(undefined)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isPostgrestError('string')).toBe(false);
    expect(isPostgrestError(123)).toBe(false);
    expect(isPostgrestError(true)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isPostgrestError([])).toBe(false);
  });

  it('should return true even if code is null', () => {
    const error: PostgrestError = {
      code: null,
      message: 'test',
      details: null,
      hint: null,
    };
    expect(isPostgrestError(error)).toBe(true);
  });
});
