/**
 * OpenAPI Specification Generator
 *
 * Generates a complete OpenAPI 3.1.0 specification from registered endpoints.
 * Uses @asteasolutions/zod-to-openapi to convert Zod schemas to OpenAPI format.
 *
 * Output: public/openapi.json (generated at build time via scripts/generate-openapi.ts)
 *
 * Features:
 * - Full OpenAPI 3.1.0 compliance
 * - Auto-generated from Zod schemas with .openapi() metadata
 * - Production-ready API documentation
 * - Compatible with Swagger UI, Redoc, Postman, etc.
 */

import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { endpointRegistry } from './registry';

/**
 * Create OpenAPI Registry
 * Registers all endpoints with their schemas and metadata
 */
export function createOpenAPIRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // Register each endpoint from the registry
  for (const [path, config] of Object.entries(endpointRegistry)) {
    // Parse path and method
    const [method, pathTemplate] = path.split(' ') as [string, string];
    const httpMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

    // Register the path with OpenAPI
    registry.registerPath({
      method: httpMethod,
      path: pathTemplate,
      summary: config.summary,
      description: config.description,
      tags: [...config.tags] as string[],
      operationId: config.operationId,
      request: config.request,
      responses: config.responses,
    });
  }

  return registry;
}

/**
 * OpenAPI 3.1 spec type
 * Modern 2025 pattern: Proper type for OpenAPI spec structure
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: { name?: string; email?: string; url?: string };
    license?: { name?: string; url?: string };
  };
  servers?: Array<{ url: string; description?: string }>;
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
  security?: Array<Record<string, string[]>>;
}

/**
 * Generate OpenAPI 3.1.0 Specification
 *
 * Creates a complete OpenAPI spec document with:
 * - API metadata (title, version, description, contact, license)
 * - Server configurations (production, development, local)
 * - All registered endpoints with request/response schemas
 * - Security schemes (Bearer token authentication)
 * - Tags for endpoint organization
 */
export function generateOpenAPISpec(): OpenAPISpec {
  const registry = createOpenAPIRegistry();

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'ClaudePro Directory API',
      version: '1.0.0',
      description: `
# ClaudePro Directory API Documentation

A comprehensive API for accessing Claude configurations including agents, MCP servers, rules, commands, hooks, and statuslines.

## Features

- **Content Discovery**: Browse and search Claude configurations by category
- **Full-Text Search**: Search across all content with advanced filtering
- **Trending Analytics**: Discover popular and trending content
- **Performance Optimized**: Redis-backed caching with ISR revalidation
- **Type-Safe**: Full TypeScript support with Zod validation

## Base URL

- **Production**: \`https://claudepro.directory\`
- **API Base Path**: \`/api\`

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Authenticated requests**: 1000 requests/hour
- **Anonymous requests**: 100 requests/hour

## Content Categories

The API supports the following content categories:

- \`agents\`: Claude agent configurations
- \`mcp\`: Model Context Protocol (MCP) servers
- \`rules\`: Custom behavior rules for Claude
- \`commands\`: Slash commands for Claude Code CLI
- \`hooks\`: Lifecycle hooks for Claude integrations
- \`statuslines\`: Status bar customizations for Claude Code CLI

## Response Format

All responses follow a consistent JSON format:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
\`\`\`

Error responses include detailed error information:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
\`\`\`
      `.trim(),
      contact: {
        name: 'ClaudePro Directory',
        url: 'https://claudepro.directory',
        email: 'support@claudepro.directory',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://claudepro.directory',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'Content',
        description: 'Endpoints for browsing and retrieving content by category',
      },
      {
        name: 'Search',
        description: 'Full-text search across all content categories',
      },
      {
        name: 'Analytics',
        description: 'Trending content and analytics endpoints',
      },
    ],
    security: [], // No global security requirement - applied per-endpoint
  });
}

/**
 * Export OpenAPI spec as JSON string
 * Used by build script to write public/openapi.json
 */
export function generateOpenAPISpecJSON(): string {
  const spec = generateOpenAPISpec();
  return JSON.stringify(spec, null, 2);
}
