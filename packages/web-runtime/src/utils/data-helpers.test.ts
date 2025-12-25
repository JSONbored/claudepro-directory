import { describe, expect, it } from '@jest/globals';
import { ensureStringArray, getMetadata } from './data-helpers';

describe('data-helpers', () => {
  describe('ensureStringArray', () => {
    it('should return array for valid string array', () => {
      const input = ['a', 'b', 'c'];
      const result = ensureStringArray(input);
      expect(result).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(input); // Should be a copy
    });

    it('should return fallback for non-array', () => {
      const result = ensureStringArray('not-array');
      expect(result).toEqual([]);
    });

    it('should return fallback for array with non-strings', () => {
      const result = ensureStringArray([1, 2, 3]);
      expect(result).toEqual([]);
    });

    it('should return fallback for mixed array', () => {
      const result = ensureStringArray(['a', 1, 'b']);
      expect(result).toEqual([]);
    });

    it('should use custom fallback', () => {
      const result = ensureStringArray(null, ['default']);
      expect(result).toEqual(['default']);
    });

    it('should handle empty array', () => {
      const result = ensureStringArray([]);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined', () => {
      expect(ensureStringArray(null)).toEqual([]);
      expect(ensureStringArray(undefined)).toEqual([]);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata object when present', () => {
      const item = {
        id: '1',
        metadata: { key: 'value', nested: { data: 'test' } },
      };
      const result = getMetadata(item);
      expect(result).toEqual({ key: 'value', nested: { data: 'test' } });
    });

    it('should return empty object for null metadata', () => {
      const item = { id: '1', metadata: null };
      const result = getMetadata(item);
      expect(result).toEqual({});
    });

    it('should return empty object for undefined metadata', () => {
      const item = { id: '1' };
      const result = getMetadata(item);
      expect(result).toEqual({});
    });

    it('should return empty object for non-object metadata', () => {
      const item = { id: '1', metadata: 'string' };
      const result = getMetadata(item);
      expect(result).toEqual({});
    });

    it('should return empty object for array metadata', () => {
      const item = { id: '1', metadata: ['array'] };
      const result = getMetadata(item);
      expect(result).toEqual({});
    });

    it('should handle items without metadata property', () => {
      const item = { id: '1', name: 'test' };
      const result = getMetadata(item);
      expect(result).toEqual({});
    });
  });
});
