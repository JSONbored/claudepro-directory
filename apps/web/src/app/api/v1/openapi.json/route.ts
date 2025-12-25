/**
 * OpenAPI Specification API Route
 *
 * Serves the generated OpenAPI specification JSON file.
 * Used by API documentation tools like Scalar API Reference.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/v1/openapi.json
 *
 * // Response (200)
 * {
 *   "openapi": "3.1.0",
 *   "info": { ... },
 *   "paths": { ... }
 * }
 * ```
 */

import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { errorResponseSchema } from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler,
  createApiRoute,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import {
  buildCacheHeaders,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { NextResponse } from 'next/server';

const PROJECT_ROOT = process.cwd();
const OPENAPI_JSON_PATH = join(PROJECT_ROOT, 'openapi.json');

/**
 * GET /api/v1/openapi.json - OpenAPI specification endpoint
 *
 * Serves the generated OpenAPI specification JSON file.
 * Used by API documentation tools like Scalar API Reference.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger }) => {
    try {
      // Read the generated OpenAPI spec file
      const openApiSpec = await readFile(OPENAPI_JSON_PATH, 'utf-8');
      const spec = JSON.parse(openApiSpec);

      logger.info(
        {
          path: OPENAPI_JSON_PATH,
          pathsCount: Object.keys(spec.paths || {}).length,
        },
        'OpenAPI spec served'
      );

      // Return as JSON with appropriate headers
      return jsonResponse(spec, 200, getOnlyCorsHeaders, {
        ...buildCacheHeaders('config'), // Cache for 1 day (config preset)
        'Content-Type': 'application/json',
      });
    } catch (error) {
      // If file doesn't exist, return 404
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn(
          {
            path: OPENAPI_JSON_PATH,
          },
          'OpenAPI spec file not found'
        );
        return NextResponse.json(
          { error: 'OpenAPI specification not found. Run: pnpm generate:openapi' },
          { headers: getOnlyCorsHeaders, status: 404 }
        );
      }

      // Other errors - will be handled by factory's error handler
      throw error;
    }
  },
  method: 'GET',
  openapi: {
    description:
      'Serves the generated OpenAPI specification JSON file. Used by API documentation tools like Scalar API Reference.',
    operationId: 'getOpenApiSpec',
    responses: {
      200: {
        description: 'OpenAPI specification retrieved successfully',
        example: {
          info: {
            description: 'API documentation for ClaudePro Directory',
            title: 'ClaudePro Directory API',
            version: '1.1.0',
          },
          openapi: '3.1.0',
          paths: {},
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'Content-Type': {
            description: 'Content type (application/json)',
            schema: { type: 'string' },
          },
        },
      },
      404: {
        description: 'OpenAPI specification not found. Run: pnpm generate:openapi',
        example: {
          error: 'OpenAPI specification not found',
          message: 'OpenAPI specification not found. Run: pnpm generate:openapi',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Failed to load OpenAPI specification',
        example: {
          error: 'Failed to load OpenAPI specification',
          message: 'An unexpected error occurred while loading the OpenAPI specification',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get OpenAPI specification',
    tags: ['openapi', 'documentation'],
  },
  operation: 'OpenAPISpecAPI',
  route: getVersionedRoute('openapi.json'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
