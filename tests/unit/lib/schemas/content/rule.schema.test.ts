/**
 * Rule Schema Validation Tests
 *
 * Validates all rule JSON files against the ruleContentSchema.
 *
 * @see src/lib/schemas/content/rule.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { ruleContentSchema } from '@/src/lib/schemas/content/rule.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'Rule',
    schema: ruleContentSchema,
    contentDir: 'content/rules',
    category: 'rules',
    requiredFields: ['slug', 'description', 'author', 'dateAdded', 'tags', 'category'],
    optionalFields: [
      'configuration',
      'githubUrl',
      'requirements',
      'troubleshooting',
      'relatedRules',
      'expertiseAreas',
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
        name: 'should have valid troubleshooting format',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.troubleshooting && Array.isArray(item.troubleshooting)) {
            (item.troubleshooting as unknown[]).forEach((entry) => {
              expect(entry).toHaveProperty('issue');
              expect(entry).toHaveProperty('solution');
            });
          }
        },
      },
      {
        name: 'should have valid relatedRules format',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.relatedRules && Array.isArray(item.relatedRules)) {
            expect(item.relatedRules.length).toBeLessThanOrEqual(20);
            (item.relatedRules as unknown[]).forEach((slug) => {
              expect(typeof slug).toBe('string');
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
