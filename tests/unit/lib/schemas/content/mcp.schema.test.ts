/**
 * MCP Schema Validation Tests
 *
 * Validates all MCP server JSON files against the mcpContentSchema.
 *
 * @see src/lib/schemas/content/mcp.schema.ts
 */

import { describe, expect, it } from 'vitest';
import { mcpContentSchema } from '@/src/lib/schemas/content/mcp.schema';
import { generateSchemaTests } from './schema-test-generator';

generateSchemaTests(
  {
    schemaName: 'MCP Server',
    schema: mcpContentSchema,
    contentDir: 'content/mcp',
    category: 'mcp',
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
      'features',
      'useCases',
      'security',
      'troubleshooting',
      'requiresAuth',
      'authType',
      'mcpVersion',
      'serverType',
    ],
    customValidators: [
      {
        name: 'should have valid MCP configuration structure',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.configuration) {
            const config = item.configuration as Record<string, unknown>;
            // At least one of claudeDesktop or claudeCode should be present
            expect(config.claudeDesktop !== undefined || config.claudeCode !== undefined).toBe(
              true
            );
          }
        },
      },
      {
        name: 'should have valid authType when requiresAuth is true',
        test: (data: unknown) => {
          const item = data as Record<string, unknown>;
          if (item.requiresAuth === true && item.authType !== undefined) {
            expect(['api_key', 'oauth', 'connection_string', 'basic_auth']).toContain(
              item.authType
            );
          }
        },
      },
    ],
  },
  describe,
  it,
  expect
);
