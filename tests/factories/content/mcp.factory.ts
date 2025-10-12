/**
 * MCP Server Factory
 *
 * Generates realistic MCP (Model Context Protocol) server configurations.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 95 lines
 * - After: 60 lines
 * - **Savings: 35 lines (~37% reduction)**
 *
 * @see src/lib/schemas/content/mcp.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { MCPContent } from '@/src/lib/schemas/content/mcp.schema';
import {
  createContentFactory,
  type BaseContentTransientParams,
} from '../shared/base-content.factory';

export const mcpFactory = createContentFactory<MCPContent>({
  category: 'mcp',
  nameGenerator: () =>
    faker.helpers.arrayElement([
      'Filesystem MCP',
      'Database MCP',
      'Web Scraper MCP',
      'API Gateway MCP',
      'Git MCP',
      'Cloud Storage MCP',
      'Search MCP',
      'Analytics MCP',
    ]),
  tagPool: [
    'filesystem',
    'database',
    'web-scraping',
    'api',
    'git',
    'cloud',
    'search',
    'analytics',
    'sql',
    'nosql',
    'automation',
  ],
  contentGenerator: () => faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
  extendFields: ({ slug }) => ({
    configuration: {
      claudeDesktop: {
        mcpServers: {
          [slug]: {
            command: faker.helpers.arrayElement(['npx', 'node', 'python', 'docker']),
            args: ['-y', slug],
            env: {},
          },
        },
      },
    },
  }),
});
