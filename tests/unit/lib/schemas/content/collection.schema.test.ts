/**
 * Collection Schema Validation Tests
 *
 * Validates all collection JSON files against the collectionContentSchema.
 *
 * @see src/lib/schemas/content/collection.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { collectionContentSchema } from '@/src/lib/schemas/content/collection.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'Collection',
    schema: collectionContentSchema,
    contentDir: 'content/collections',
    category: 'collections',
    requiredFields: [
      'slug',
      'description',
      'author',
      'dateAdded',
      'tags',
      'category',
      'collectionType',
      'difficulty',
      'items',
    ],
    optionalFields: [
      'installationOrder',
      'prerequisites',
      'estimatedSetupTime',
      'compatibility',
      'features',
      'useCases',
    ],
    customValidators: [
      {
        name: 'should have valid collectionType',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          expect(['starter-kit', 'workflow', 'advanced-system', 'use-case']).toContain(
            item.collectionType
          );
        },
      },
      {
        name: 'should have valid difficulty level',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          expect(['beginner', 'intermediate', 'advanced']).toContain(item.difficulty);
        },
      },
      {
        name: 'should have at least 2 items and max 20 items',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          expect(item.items).toBeDefined();
          const items = item.items as unknown[];
          expect(items.length).toBeGreaterThanOrEqual(2);
          expect(items.length).toBeLessThanOrEqual(20);
        },
      },
      {
        name: 'should have valid item references',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          const items = item.items as Array<Record<string, unknown>>;
          items.forEach((ref) => {
            expect(ref).toHaveProperty('category');
            expect(ref).toHaveProperty('slug');
            expect(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines']).toContain(
              ref.category
            );
          });
        },
      },
      {
        name: 'should have valid compatibility when present',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.compatibility) {
            const compat = item.compatibility as Record<string, unknown>;
            if (compat.claudeDesktop !== undefined) {
              expect(typeof compat.claudeDesktop).toBe('boolean');
            }
            if (compat.claudeCode !== undefined) {
              expect(typeof compat.claudeCode).toBe('boolean');
            }
          }
        },
      },
    ],
  },
  describe,
  it,
  expect
);
