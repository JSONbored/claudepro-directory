/**
 * Command Schema Validation Tests
 *
 * Validates all command JSON files against the commandContentSchema.
 *
 * @see src/lib/schemas/content/command.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { commandContentSchema } from '@/src/lib/schemas/content/command.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'Command',
    schema: commandContentSchema,
    contentDir: 'content/commands',
    category: 'commands',
    requiredFields: ['slug', 'description', 'author', 'dateAdded', 'tags', 'category'],
    optionalFields: [
      'name',
      'configuration',
      'githubUrl',
      'installation',
      'features',
      'useCases',
      'examples',
    ],
    customValidators: [
      {
        name: 'should have valid GitHub URL when present',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.githubUrl) {
            expect(item.githubUrl).toMatch(/^https:\/\/(www\.)?github\.com\/.+/);
          }
        },
      },
      {
        name: 'should have valid configuration when present',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.configuration) {
            const config = item.configuration as Record<string, unknown>;
            if (config.temperature !== undefined) {
              expect(config.temperature).toBeGreaterThanOrEqual(0);
              expect(config.temperature).toBeLessThanOrEqual(2);
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
