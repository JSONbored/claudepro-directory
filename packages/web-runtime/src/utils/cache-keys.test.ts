import { describe, expect, it } from 'vitest';
import { sanitizeCacheKey, sanitizeCacheKeyArray, deterministicStringify } from './cache-keys';

describe('cache-keys', () => {
  describe('sanitizeCacheKey', () => {
    it('should preserve alphanumeric, hyphens, underscores, and dots', () => {
      expect(sanitizeCacheKey('abc123')).toBe('abc123');
      expect(sanitizeCacheKey('my-key_123.test')).toBe('my-key_123.test');
    });

    it('should remove unsafe characters', () => {
      expect(sanitizeCacheKey('my key')).toBe('mykey'); // space removed
      expect(sanitizeCacheKey('my@key')).toBe('mykey'); // @ removed
      expect(sanitizeCacheKey('my/key')).toBe('mykey'); // / removed
    });

    it('should limit to 200 characters', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeCacheKey(longString).length).toBe(200);
    });

    it('should handle empty string', () => {
      expect(sanitizeCacheKey('')).toBe('');
    });
  });

  describe('sanitizeCacheKeyArray', () => {
    it('should sanitize and join array of strings', () => {
      expect(sanitizeCacheKeyArray(['a', 'b', 'c'])).toBe('a-b-c');
    });

    it('should use custom separator', () => {
      expect(sanitizeCacheKeyArray(['a', 'b'], '_')).toBe('a_b');
    });

    it('should filter out empty strings', () => {
      expect(sanitizeCacheKeyArray(['a', '', 'b'])).toBe('a-b');
    });

    it('should return "all" for empty array', () => {
      expect(sanitizeCacheKeyArray([])).toBe('all');
    });

    it('should sanitize each element', () => {
      expect(sanitizeCacheKeyArray(['my key', 'test@value'])).toBe('mykey-testvalue');
    });
  });

  describe('deterministicStringify', () => {
    it('should stringify null and undefined', () => {
      expect(deterministicStringify(null)).toBe('null');
      expect(deterministicStringify(undefined)).toBe('null');
    });

    it('should sanitize string inputs', () => {
      expect(deterministicStringify('my key')).toBe('mykey');
      expect(deterministicStringify('test@value')).toBe('testvalue');
    });

    it('should stringify primitives', () => {
      expect(deterministicStringify(123)).toBe('123');
      expect(deterministicStringify(true)).toBe('true');
    });

    it('should stringify arrays', () => {
      // Each number is converted to string and sanitized (numbers pass through sanitizeCacheKey as-is)
      expect(deterministicStringify([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should sort object keys for deterministic output', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };
      expect(deterministicStringify(obj1)).toBe(deterministicStringify(obj2));
    });

    it('should sanitize string values in objects', () => {
      const obj = { key: 'my value', num: 123 };
      const result = deterministicStringify(obj);
      expect(result).toContain('myvalue');
      expect(result).toContain('123');
    });

    it('should handle nested objects', () => {
      const obj = { a: { b: 1, c: 2 } };
      const result = deterministicStringify(obj);
      expect(result).toBeTruthy();
    });
  });
});

