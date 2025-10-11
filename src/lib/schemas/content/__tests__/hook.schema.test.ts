/**
 * Hook Schema Validation Tests
 *
 * Validates all hook JSON files against the hookContentSchema.
 *
 * @see src/lib/schemas/content/hook.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { hookContentSchema } from '../hook.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'Hook',
    schema: hookContentSchema,
    contentDir: 'content/hooks',
    category: 'hooks',
    requiredFields: [
      'slug',
      'description',
      'author',
      'dateAdded',
      'tags',
      'category',
      'configuration',
    ],
    optionalFields: [
      'installation',
      'requirements',
      'troubleshooting',
      'features',
      'useCases',
      'examples',
    ],
    customValidators: [
      {
        name: 'should have valid hook configuration structure',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          expect(item.configuration).toBeDefined();
          const config = item.configuration as Record<string, unknown>;
          expect(config.hookConfig).toBeDefined();
        },
      },
      {
        name: 'should have valid troubleshooting format when present',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.troubleshooting && Array.isArray(item.troubleshooting)) {
            expect(item.troubleshooting.length).toBeLessThanOrEqual(20);
            (item.troubleshooting as unknown[]).forEach((entry) => {
              expect(entry).toHaveProperty('issue');
              expect(entry).toHaveProperty('solution');
            });
          }
        },
      },
    ],
  },
  describe,
  it,
  expect
);
