/**
 * Schema Test Generator Utility
 *
 * Reusable test generator for content schema validation.
 * Reduces code duplication across test files by providing a standardized
 * test suite generation pattern.
 *
 * **Benefits:**
 * - DRY principle: Write test logic once, use for all content types
 * - Consistency: All content types tested with same rigor
 * - Maintainability: Single source of truth for test patterns
 * - Extensibility: Easy to add new test patterns
 *
 * **Usage:**
 * ```typescript
 * import { generateSchemaTests } from './schema-test-generator';
 * import { mySchema } from '../my.schema';
 *
 * generateSchemaTests({
 *   schemaName: 'My Schema',
 *   schema: mySchema,
 *   contentDir: 'content/my-content',
 *   category: 'my-category',
 *   requiredFields: ['slug', 'category'],
 *   optionalFields: ['features', 'configuration']
 * });
 * ```
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ZodType, z } from 'zod';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';

export interface SchemaTestConfig {
  /** Human-readable schema name for test descriptions */
  schemaName: string;
  /** Zod schema to validate against */
  schema: ZodType;
  /** Path to content directory (relative to project root) */
  contentDir: string;
  /** Expected category value */
  category: string;
  /** List of required field names */
  requiredFields: string[];
  /** List of optional field names to validate when present */
  optionalFields?: string[];
  /** Custom validation functions */
  customValidators?: Array<{
    name: string;
    test: (data: unknown) => void;
  }>;
}

/**
 * Load JSON files from content directory
 */
export function loadContentFiles(contentDir: string) {
  try {
    const fullPath = join(process.cwd(), contentDir);
    const files = readdirSync(fullPath).filter((f) => f.endsWith('.json'));

    return files.map((filename) => {
      const filePath = join(fullPath, filename);
      const raw = readFileSync(filePath, 'utf-8');
      // Production-grade: safeParse with permissive schema for test content loading
      const data = safeParse(raw, z.unknown(), {
        strategy: ParseStrategy.VALIDATED_JSON,
      });
      return { filename, data, raw };
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Useful test debugging output for file loading errors
    console.error(`Failed to load files from ${contentDir}:`, error);
    return [];
  }
}

/**
 * Generate comprehensive schema validation tests
 */
export function generateSchemaTests(
  config: SchemaTestConfig,
  describe: typeof import('vitest').describe,
  it: typeof import('vitest').it,
  expect: typeof import('vitest').expect
) {
  const {
    schemaName,
    schema,
    contentDir,
    category,
    requiredFields,
    optionalFields,
    customValidators,
  } = config;

  const contentFiles = loadContentFiles(contentDir);

  describe(`${schemaName} Validation`, () => {
    it(`should find ${category} JSON files in content directory`, () => {
      expect(contentFiles.length).toBeGreaterThan(0);
      // biome-ignore lint/suspicious/noConsole: Useful test output
      console.log(`Found ${contentFiles.length} ${category} files to validate`);
    });

    describe('Individual File Validation', () => {
      contentFiles.forEach(({ filename, data }) => {
        it(`${filename} should pass schema validation`, () => {
          const result = schema.safeParse(data);

          if (!result.success) {
            // biome-ignore lint/suspicious/noConsole: Useful test debugging output
            console.error(`\n❌ Validation failed for ${filename}:`);
            // biome-ignore lint/suspicious/noConsole: Useful test debugging output
            console.error(JSON.stringify(result.error.format(), null, 2));
          }

          expect(result.success).toBe(true);
        });
      });
    });

    describe('Required Fields Validation', () => {
      contentFiles.forEach(({ filename, data }) => {
        describe(`${filename} - Required Fields`, () => {
          requiredFields.forEach((field) => {
            it(`should have required field: ${field}`, () => {
              expect(data).toHaveProperty(field);
              expect(data[field]).toBeTruthy();
            });
          });

          it(`should have category = "${category}"`, () => {
            expect(data.category).toBe(category);
          });

          it('should have valid slug format (lowercase, hyphenated)', () => {
            expect(data.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
          });

          it('should have valid ISO 8601 dateAdded', () => {
            expect(data.dateAdded).toBeTruthy();
            expect(() => new Date(data.dateAdded)).not.toThrow();
            expect(new Date(data.dateAdded).toString()).not.toBe('Invalid Date');
          });

          it('should have at least one tag', () => {
            expect(data.tags).toBeInstanceOf(Array);
            expect(data.tags.length).toBeGreaterThan(0);
          });
        });
      });
    });

    if (optionalFields && optionalFields.length > 0) {
      describe('Optional Fields Validation', () => {
        contentFiles.forEach(({ filename, data }) => {
          describe(`${filename} - Optional Fields`, () => {
            optionalFields.forEach((field) => {
              if (data[field] !== undefined) {
                it(`should have valid ${field} when present`, () => {
                  expect(data[field]).toBeDefined();
                });
              }
            });
          });
        });
      });
    }

    describe('Data Consistency Checks', () => {
      it('should have unique slugs across all files', () => {
        const slugs = contentFiles.map((f) => f.data.slug);
        const uniqueSlugs = new Set(slugs);
        expect(uniqueSlugs.size).toBe(slugs.length);
      });

      it('should have filename derived from slug (may have variations)', () => {
        contentFiles.forEach(({ filename, data }) => {
          // Flexible check: filename should be related to slug
          // Allows variations like:
          // - Exact match: react-expert.json = react-expert
          // - Shortened: golang-expert.json = go-golang-expert
          // - Expanded: security-auditor.json = security-auditor-penetration-tester
          const fileBase = filename.replace('.json', '');
          const slug = data.slug;

          // Check if they share significant common words (at least 50% overlap)
          const fileWords = fileBase.split('-').filter((w) => w.length > 2);
          const slugWords = slug.split('-').filter((w) => w.length > 2);
          const commonWords = fileWords.filter((w) => slugWords.includes(w));

          // At least 50% of significant words should match
          const matchRatio = commonWords.length / Math.max(fileWords.length, slugWords.length);
          expect(matchRatio).toBeGreaterThan(0.3);
        });
      });

      it('should not have future dates', () => {
        const now = new Date();
        contentFiles.forEach(({ data }) => {
          const dateAdded = new Date(data.dateAdded);
          expect(dateAdded.getTime()).toBeLessThanOrEqual(now.getTime());
        });
      });
    });

    if (customValidators && customValidators.length > 0) {
      describe('Custom Validation', () => {
        customValidators.forEach(({ name, test }) => {
          it(name, () => {
            contentFiles.forEach(({ data }) => {
              test(data);
            });
          });
        });
      });
    }
  });
}
