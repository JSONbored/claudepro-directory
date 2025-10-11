/**
 * MCP Server Factory
 *
 * Generates realistic MCP (Model Context Protocol) server configurations.
 *
 * @see src/lib/schemas/content/mcp.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { MCPContent } from '@/src/lib/schemas/content/mcp.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface MCPFactoryTransientParams {
  tagCount?: number;
  exampleCount?: number;
}

export const mcpFactory = Factory.define<MCPContent, MCPFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const { tagCount = faker.number.int({ min: 1, max: 5 }), exampleCount = faker.number.int({ min: 0, max: 3 }) } =
      transientParams;

    const mcpName = faker.helpers.arrayElement([
      'Filesystem MCP',
      'Database MCP',
      'Web Scraper MCP',
      'API Gateway MCP',
      'Git MCP',
      'Cloud Storage MCP',
      'Search MCP',
      'Analytics MCP',
    ]);

    const slug = faker.helpers.slugify(mcpName).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'mcp' as const,
      title: mcpName,
      description: faker.lorem.sentence({ min: 10, max: 25 }),
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        [
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
        { min: tagCount, max: tagCount }
      ),
      content: faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.7 }
      ),
      documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', { probability: 0.5 }),
      features: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () =>
            faker.lorem.sentence({ min: 3, max: 8 })
          ),
        { probability: 0.8 }
      ),
      useCases: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
            faker.lorem.sentence({ min: 4, max: 10 })
          ),
        { probability: 0.7 }
      ),
      usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
      configuration: {
        claudeDesktop: {
          mcpServers: {
            [faker.helpers.slugify(mcpName).toLowerCase()]: {
              command: faker.helpers.arrayElement(['npx', 'node', 'python', 'docker']),
              args: ['-y', faker.helpers.slugify(mcpName).toLowerCase()],
              env: {},
            },
          },
        },
      },
    };
  }
);
