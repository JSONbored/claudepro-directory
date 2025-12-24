import { describe, expect, it } from '@jest/globals';
import { timingSafeEqual } from './crypto-utils.ts';

describe('timingSafeEqual', () => {
  describe('equal strings', () => {
    it('should return true for identical strings', () => {
      const result = timingSafeEqual('hello', 'hello');
      expect(result).toBe(true);
    });

    it('should return true for empty strings', () => {
      const result = timingSafeEqual('', '');
      expect(result).toBe(true);
    });

    it('should return true for long identical strings', () => {
      const longString = 'a'.repeat(1000);
      const result = timingSafeEqual(longString, longString);
      expect(result).toBe(true);
    });

    it('should handle strings with special characters', () => {
      const result = timingSafeEqual('hello@world#123', 'hello@world#123');
      expect(result).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = timingSafeEqual('héllo', 'héllo');
      expect(result).toBe(true);
    });
  });

  describe('unequal strings', () => {
    it('should return false for different strings', () => {
      const result = timingSafeEqual('hello', 'world');
      expect(result).toBe(false);
    });

    it('should return false for strings with different lengths', () => {
      const result = timingSafeEqual('hello', 'hello!');
      expect(result).toBe(false);
    });

    it('should return false when first string is longer', () => {
      const result = timingSafeEqual('hello', 'hell');
      expect(result).toBe(false);
    });

    it('should return false when second string is longer', () => {
      const result = timingSafeEqual('hell', 'hello');
      expect(result).toBe(false);
    });

    it('should return false for strings differing at start', () => {
      const result = timingSafeEqual('hello', 'xello');
      expect(result).toBe(false);
    });

    it('should return false for strings differing at end', () => {
      const result = timingSafeEqual('hello', 'hellx');
      expect(result).toBe(false);
    });

    it('should return false for strings differing in middle', () => {
      const result = timingSafeEqual('hello', 'helxo');
      expect(result).toBe(false);
    });

    it('should return false for case differences', () => {
      const result = timingSafeEqual('hello', 'Hello');
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle single character strings', () => {
      expect(timingSafeEqual('a', 'a')).toBe(true);
      expect(timingSafeEqual('a', 'b')).toBe(false);
    });

    it('should handle strings with null bytes', () => {
      const result = timingSafeEqual('hello\0', 'hello\0');
      expect(result).toBe(true);
    });

    it('should handle strings with newlines', () => {
      const result = timingSafeEqual('hello\n', 'hello\n');
      expect(result).toBe(true);
    });

    it('should handle very long strings', () => {
      const longString1 = 'a'.repeat(10000);
      const longString2 = 'a'.repeat(10000);
      const result = timingSafeEqual(longString1, longString2);
      expect(result).toBe(true);
    });

    it('should return false for very long strings with one difference', () => {
      const longString1 = 'a'.repeat(10000) + 'b';
      const longString2 = 'a'.repeat(10000) + 'c';
      const result = timingSafeEqual(longString1, longString2);
      expect(result).toBe(false);
    });
  });

  describe('timing attack prevention', () => {
    it('should take similar time for strings differing at start vs end', () => {
      // This test verifies the function exists and works
      // Actual timing tests would require more sophisticated setup
      const start1 = 'x' + 'a'.repeat(100);
      const end1 = 'a'.repeat(100) + 'x';
      const target = 'a'.repeat(101);

      const result1 = timingSafeEqual(start1, target);
      const result2 = timingSafeEqual(end1, target);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      // Both should return false, but the timing should be similar
    });

    it('should return false immediately for different lengths', () => {
      // Different lengths should return false immediately (fast path)
      const result = timingSafeEqual('short', 'very long string');
      expect(result).toBe(false);
    });
  });
});
