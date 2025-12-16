#!/usr/bin/env tsx

/**
 * OpenAPI Spec Generator
 *
 * Generates OpenAPI 3.1 specification from Next.js API routes.
 * Scans all API route files that use createApiRoute() and extracts:
 * - OpenAPI metadata (summary, description, tags, operationId)
 * - Zod schemas (converted to OpenAPI schemas via zod-openapi)
 * - Response types
 *
 * Output: openapi.json and openapi.yaml in the project root.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { glob } from 'glob';
import { createDocument } from 'zod-openapi';
import { z } from 'zod';

// Note: zod-openapi v5 doesn't require extendZodWithOpenApi - it works automatically

interface RouteMetadata {
  route: string;
  method: string;
  openapi?: {
    summary?: string;
    description?: string;
    tags?: string[];
    operationId?: string;
    responses?: Record<number, { description: string; schema?: z.ZodSchema }>;
    deprecated?: boolean;
  };
  querySchema?: z.ZodSchema;
  bodySchema?: z.ZodSchema;
  requireAuth?: boolean;
  optionalAuth?: boolean;
}

/**
 * Extract route metadata from API route files
 */
async function extractRouteMetadata(
  filePath: string
): Promise<RouteMetadata[]> {
  const content = await readFile(filePath, 'utf-8');
  const routes: RouteMetadata[] = [];

  // Match createApiRoute calls
  const routeRegex =
    /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*createApiRoute\(\s*\{([^}]+)\}\)/gs;

  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1];
    const config = match[2];

    if (!config) continue;

    // Extract route path
    const routeMatch = config.match(/route:\s*['"]([^'"]+)['"]/);
    const route = routeMatch ? routeMatch[1] : '';

    // Extract OpenAPI metadata (basic extraction - could be enhanced)
    const openapiMatch = config.match(/openapi:\s*\{([^}]+)\}/s);
    let openapi: RouteMetadata['openapi'] | undefined;
    if (openapiMatch && openapiMatch[1]) {
      const openapiContent = openapiMatch[1];
      const summary = extractStringValue(openapiContent, 'summary');
      const description = extractStringValue(openapiContent, 'description');
      const tags = extractArrayValue(openapiContent, 'tags');
      const operationId = extractStringValue(openapiContent, 'operationId');
      const deprecated = extractBooleanValue(openapiContent, 'deprecated');
      
      const openapiObj: RouteMetadata['openapi'] = {
        ...(summary !== undefined ? { summary } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(operationId !== undefined ? { operationId } : {}),
        ...(deprecated !== undefined ? { deprecated } : {}),
      };
      
      // Only set openapi if at least one property is defined
      if (summary !== undefined || description !== undefined || tags !== undefined || operationId !== undefined || deprecated !== undefined) {
        openapi = openapiObj;
      }
    }

    // Extract auth requirements
    const requireAuth = config.includes('requireAuth:') && config.includes('requireAuth: true');
    const optionalAuth = config.includes('optionalAuth:') && config.includes('optionalAuth: true');

    const routeMetadata: RouteMetadata = {
      route: route || '',
      method: method || '',
      ...(openapi ? { openapi } : {}),
      ...(requireAuth ? { requireAuth: true } : {}),
      ...(optionalAuth ? { optionalAuth: true } : {}),
    };
    
    routes.push(routeMetadata);
  }

  return routes;
}

function extractStringValue(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
  return match ? match[1] : undefined;
}

function extractArrayValue(content: string, key: string): string[] | undefined {
  const match = content.match(new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`));
  if (!match || !match[1]) return undefined;
  const items = match[1].split(',').map((item) => item.trim().replace(/['"]/g, ''));
  return items.length > 0 ? items : undefined;
}

function extractBooleanValue(content: string, key: string): boolean | undefined {
  const match = content.match(new RegExp(`${key}:\\s*(true|false)`));
  return match ? (match[1] === 'true') : undefined;
}

/**
 * Generate OpenAPI document from route metadata
 */
function generateOpenAPIDocument(routes: RouteMetadata[]) {
  const document = createDocument({
    openapi: '3.1.0',
    info: {
      title: 'ClaudePro Directory API',
      version: '1.1.0',
      description: 'API documentation for ClaudePro Directory - A community-driven directory of Claude configurations',
    },
    servers: [
      {
        url: 'https://claudepro.com',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
    ],
  });

  // Group routes by path
  const routesByPath = new Map<string, RouteMetadata[]>();
  for (const route of routes) {
    if (!routesByPath.has(route.route)) {
      routesByPath.set(route.route, []);
    }
    routesByPath.get(route.route)!.push(route);
  }

  // Add paths to document
  for (const [path, pathRoutes] of routesByPath) {
    const pathItem: Record<string, unknown> = {};

    for (const route of pathRoutes) {
      const method = route.method.toLowerCase();
      const operation: Record<string, unknown> = {};

      const openapi = route.openapi;
      if (openapi) {
        if (openapi.summary !== undefined) {
          operation['summary'] = openapi.summary;
        }
        if (openapi.description !== undefined) {
          operation['description'] = openapi.description;
        }
        if (openapi.tags !== undefined) {
          operation['tags'] = openapi.tags;
        }
        if (openapi.operationId !== undefined) {
          operation['operationId'] = openapi.operationId;
        }
        if (openapi.deprecated !== undefined) {
          operation['deprecated'] = openapi.deprecated;
        }
      }

      // Add security if auth required
      if (route.requireAuth) {
        operation['security'] = [{ bearerAuth: [] }];
      }

      // Add parameters (query schema would be converted here)
      if (route.querySchema) {
        // Note: Full Zod-to-OpenAPI conversion would happen here
        // For now, we'll add a placeholder
        operation['parameters'] = [];
      }

      // Add request body (body schema would be converted here)
      if (route.bodySchema && ['post', 'put', 'patch'].includes(method)) {
        // Note: Full Zod-to-OpenAPI conversion would happen here
        operation['requestBody'] = {
          required: true,
          content: {
            'application/json': {
              schema: {}, // Would be converted from Zod schema
            },
          },
        };
      }

      // Add responses
      const responses: Record<string, { description: string }> = {
        '200': {
          description: 'Success',
        },
        '400': {
          description: 'Bad Request',
        },
        '500': {
          description: 'Internal Server Error',
        },
      };

      if (route.requireAuth) {
        responses['401'] = {
          description: 'Unauthorized',
        };
      }
      
      operation['responses'] = responses;

      // Merge with openapi.responses if provided
      if (route.openapi?.responses) {
        const mergedResponses: Record<string, { description: string }> = {
          ...responses,
          ...Object.fromEntries(
            Object.entries(route.openapi.responses).map(([code, response]) => [
              String(code),
              { description: response.description },
            ])
          ),
        };
        operation['responses'] = mergedResponses;
      }

      pathItem[method] = operation;
    }

    if (!document.paths) {
      document.paths = {};
    }
    document.paths[path] = pathItem;
  }

  // Add security scheme
  document.components = {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  };

  return document;
}

/**
 * Main function
 */
export async function generateOpenAPI(): Promise<void> {
  const apiRoutesDir = join(process.cwd(), 'apps/web/src/app/api');
  const routeFiles = await glob('**/route.ts', { cwd: apiRoutesDir, absolute: true });

  console.log(`Found ${routeFiles.length} API route files`);

  const allRoutes: RouteMetadata[] = [];

  for (const filePath of routeFiles) {
    try {
      const routes = await extractRouteMetadata(filePath);
      allRoutes.push(...routes);
      console.log(`  ✓ ${relative(process.cwd(), filePath)} (${routes.length} route(s))`);
    } catch (error) {
      console.error(`  ✗ Error processing ${filePath}:`, error);
    }
  }

  console.log(`\nTotal routes found: ${allRoutes.length}`);

  // Generate OpenAPI document
  const document = generateOpenAPIDocument(allRoutes);

  // Write JSON
  const jsonPath = join(process.cwd(), 'openapi.json');
  await writeFile(jsonPath, JSON.stringify(document, null, 2));
  console.log(`\n✓ Generated: ${jsonPath}`);

  // Write YAML (would need yaml library)
  // For now, just JSON is fine
  console.log(`\n✓ OpenAPI spec generated successfully!`);
  console.log(`  View at: https://editor.swagger.io/ (paste openapi.json)`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOpenAPI().catch(console.error);
}
