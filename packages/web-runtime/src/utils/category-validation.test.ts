import { describe, expect, it } from '@jest/globals';
import { isValidCategory, VALID_CATEGORIES } from './category-validation';
import type { content_category } from '../types/client-safe-enums';

describe('category-validation', () => {
  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('agents')).toBe(true);
      expect(isValidCategory('mcp')).toBe(true);
      expect(isValidCategory('rules')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(undefined)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidCategory(123 as any)).toBe(false);
      expect(isValidCategory({} as any)).toBe(false);
      expect(isValidCategory([] as any)).toBe(false);
    });

    it('should work as type guard', () => {
      const value: string | null = 'agents';
      if (isValidCategory(value)) {
        const category: content_category = value;
        expect(category).toBe('agents');
      }
    });
  });

  describe('VALID_CATEGORIES', () => {
    it('should export valid categories array', () => {
      expect(Array.isArray(VALID_CATEGORIES)).toBe(true);
      expect(VALID_CATEGORIES.length).toBeGreaterThan(0);
      expect(VALID_CATEGORIES).toContain('agents');
      expect(VALID_CATEGORIES).toContain('mcp');
      expect(VALID_CATEGORIES).toContain('rules');
    });
  });
});
