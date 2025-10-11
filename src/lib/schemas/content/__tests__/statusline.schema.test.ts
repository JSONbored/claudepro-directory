/**
 * Statusline Schema Validation Tests
 *
 * Validates all statusline JSON files against the statuslineContentSchema.
 *
 * @see src/lib/schemas/content/statusline.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { statuslineContentSchema } from '../statusline.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'Statusline',
    schema: statuslineContentSchema,
    contentDir: 'content/statuslines',
    category: 'statuslines',
    requiredFields: [
      'slug',
      'description',
      'author',
      'dateAdded',
      'tags',
      'category',
      'statuslineType',
      'configuration',
    ],
    optionalFields: [
      'installation',
      'troubleshooting',
      'requirements',
      'preview',
      'features',
      'useCases',
    ],
    customValidators: [
      {
        name: 'should have valid statuslineType',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          expect([
            'minimal',
            'powerline',
            'custom',
            'rich',
            'git-aware',
            'simple',
            'session-timer',
          ]).toContain(item.statuslineType);
        },
      },
      {
        name: 'should have valid configuration format when present',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          const config = item.configuration as Record<string, unknown>;
          if (config.format) {
            expect(['bash', 'python', 'javascript']).toContain(config.format);
          }
          if (config.refreshInterval !== undefined) {
            expect(config.refreshInterval).toBeGreaterThanOrEqual(100);
            expect(config.refreshInterval).toBeLessThanOrEqual(60000);
          }
          if (config.position) {
            expect(['left', 'center', 'right']).toContain(config.position);
          }
        },
      },
    ],
  },
  describe,
  it,
  expect
);
