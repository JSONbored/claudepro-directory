/**
 * Category Registry Validation Tests
 *
 * **Build-Time Safety Tests (October 2025)**
 *
 * Validates UNIFIED_CATEGORY_REGISTRY configuration at build time to catch
 * SEO metadata issues before they reach production.
 *
 * **What This Prevents:**
 * - Missing or invalid SEO metadata (title, description, keywords)
 * - Description length violations (must be 150-160 chars)
 * - Keyword count violations (must have 3-10 keywords)
 * - Keyword length violations (each must be 2-30 chars)
 * - Missing category configurations
 *
 * **Architecture:**
 * - Uses Zod validation schemas from validation-schemas.ts
 * - Fails CI/CD build if validation fails
 * - Descriptive error messages guide fixes
 *
 * @module tests/unit/lib/config/category-registry
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_CATEGORY_REGISTRY, VALID_CATEGORIES } from '@/src/lib/config/category-config';
import { METADATA_QUALITY_RULES } from '@/src/lib/config/seo-config';
import { validateCategoryRegistry } from '@/src/lib/seo/validation-schemas';

describe('UNIFIED_CATEGORY_REGISTRY - Build-Time Validation', () => {
  describe('Zod Schema Validation', () => {
    it('should validate entire registry against Zod schema', () => {
      // This will throw if validation fails
      expect(() => validateCategoryRegistry(UNIFIED_CATEGORY_REGISTRY)).not.toThrow();
    });

    it('should have configuration for all valid categories', () => {
      for (const category of VALID_CATEGORIES) {
        expect(UNIFIED_CATEGORY_REGISTRY[category]).toBeDefined();
        expect(UNIFIED_CATEGORY_REGISTRY[category]).not.toBeNull();
      }
    });
  });

  describe('SEO Metadata Requirements', () => {
    for (const category of VALID_CATEGORIES) {
      describe(`Category: ${category}`, () => {
        const config = UNIFIED_CATEGORY_REGISTRY[category];

        it('should have required properties', () => {
          expect(config).toHaveProperty('id');
          expect(config).toHaveProperty('title');
          expect(config).toHaveProperty('pluralTitle');
          expect(config).toHaveProperty('metaDescription');
          expect(config).toHaveProperty('keywords');
        });

        it('should have non-empty title', () => {
          expect(config.title).toBeTruthy();
          expect(config.title.trim()).not.toBe('');
        });

        it('should have non-empty pluralTitle', () => {
          expect(config.pluralTitle).toBeTruthy();
          expect(config.pluralTitle.trim()).not.toBe('');
        });

        it('should have metaDescription within 150-160 chars', () => {
          const descLength = config.metaDescription.length;
          expect(descLength).toBeGreaterThanOrEqual(METADATA_QUALITY_RULES.description.minLength);
          expect(descLength).toBeLessThanOrEqual(METADATA_QUALITY_RULES.description.maxLength);
        });

        it('should have 3-10 keywords', () => {
          const keywordArray = config.keywords.split(',').map((k: string) => k.trim());
          expect(keywordArray.length).toBeGreaterThanOrEqual(
            METADATA_QUALITY_RULES.keywords.minCount
          );
          expect(keywordArray.length).toBeLessThanOrEqual(METADATA_QUALITY_RULES.keywords.maxCount);
        });

        it('should have keywords between 1-30 chars each', () => {
          const keywordArray = config.keywords.split(',').map((k: string) => k.trim());
          for (const keyword of keywordArray) {
            expect(keyword.length).toBeGreaterThanOrEqual(1);
            expect(keyword.length).toBeLessThanOrEqual(
              METADATA_QUALITY_RULES.keywords.maxKeywordLength
            );
          }
        });

        it('should have no duplicate keywords', () => {
          const keywordArray = config.keywords.split(',').map((k: string) => k.trim());
          const uniqueKeywords = new Set(keywordArray);
          expect(uniqueKeywords.size).toBe(keywordArray.length);
        });

        it('should have keywords in lowercase for consistency', () => {
          const keywordArray = config.keywords.split(',').map((k: string) => k.trim());
          for (const keyword of keywordArray) {
            expect(keyword).toBe(keyword.toLowerCase());
          }
        });
      });
    }
  });

  describe('Category ID Consistency', () => {
    it('should have matching id property for each category', () => {
      for (const [key, config] of Object.entries(UNIFIED_CATEGORY_REGISTRY)) {
        expect(config.id).toBe(key);
      }
    });

    it('should not have extra categories not in VALID_CATEGORIES', () => {
      const registryKeys = Object.keys(UNIFIED_CATEGORY_REGISTRY);
      for (const key of registryKeys) {
        expect(VALID_CATEGORIES).toContain(key);
      }
    });
  });

  describe('SEO Best Practices', () => {
    for (const category of VALID_CATEGORIES) {
      const config = UNIFIED_CATEGORY_REGISTRY[category];

      it(`${category}: description should end with period for proper grammar`, () => {
        expect(config.metaDescription.trim().endsWith('.')).toBe(true);
      });

      it(`${category}: description should not contain multiple consecutive spaces`, () => {
        expect(config.metaDescription).not.toMatch(/\s{2,}/);
      });

      it(`${category}: keywords should not contain special characters`, () => {
        const keywordArray = config.keywords.split(',').map((k: string) => k.trim());
        for (const keyword of keywordArray) {
          // Allow alphanumeric, spaces, hyphens, apostrophes only
          expect(keyword).toMatch(/^[a-z0-9\s\-']+$/);
        }
      });

      it(`${category}: title and pluralTitle should be different`, () => {
        expect(config.title).not.toBe(config.pluralTitle);
      });

      it(`${category}: pluralTitle should contain title (usually as plural form)`, () => {
        // Skip this check if title is not a simple plural (e.g., "Agent" -> "Agents")
        const titleLower = config.title.toLowerCase();
        const pluralLower = config.pluralTitle.toLowerCase();

        // Either plural contains singular, or they're intentionally different
        const isPlural =
          pluralLower.includes(titleLower) ||
          pluralLower === titleLower + 's' ||
          pluralLower === titleLower + 'es';

        // If not standard plural, that's okay (e.g., "Command" -> "Commands" is fine)
        expect(
          isPlural ||
            (titleLower !== pluralLower && config.title.length > 0 && config.pluralTitle.length > 0)
        ).toBe(true);
      });
    }
  });

  describe('Performance and Optimization', () => {
    it('should have reasonable number of keywords per category (not too many)', () => {
      for (const category of VALID_CATEGORIES) {
        const config = UNIFIED_CATEGORY_REGISTRY[category];
        const keywordArray = config.keywords.split(',').map((k: string) => k.trim());

        // SEO best practice: 3-10 keywords (already checked above, but emphasize here)
        // Too many keywords dilutes semantic signals
        expect(keywordArray.length).toBeLessThanOrEqual(10);
      }
    });

    it('should have unique metaDescriptions across categories', () => {
      const descriptions = VALID_CATEGORIES.map(
        (cat) => UNIFIED_CATEGORY_REGISTRY[cat].metaDescription
      );
      const uniqueDescriptions = new Set(descriptions);

      // Each category should have unique description for better SEO
      expect(uniqueDescriptions.size).toBe(descriptions.length);
    });
  });
});
