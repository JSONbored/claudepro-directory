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
import { NextResponse } from 'next/server';
import {
  createApiRoute,
  createOptionsHandler as createApiOptionsHandler,
} from '@heyclaude/web-runtime/api/route-factory';
import { errorResponseSchema } from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { buildCacheHeaders } from '@heyclaude/web-runtime/server/api-helpers';

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
  method: 'GET',
  openapi: {
    description:
      'Serves the generated OpenAPI specification JSON file. Used by API documentation tools like Scalar API Reference.',
    operationId: 'getOpenApiSpec',
    responses: {
      200: {
        description: 'OpenAPI specification retrieved successfully',
        headers: {
          'Content-Type': {
            schema: { type: 'string' },
            description: 'Content type (application/json)',
          },
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
        },
        example: {
          openapi: '3.1.0',
          info: {
            title: 'ClaudePro Directory API',
            version: '1.1.0',
            description: 'API documentation for ClaudePro Directory',
          },
          paths: {},
        },
      },
      404: {
        description: 'OpenAPI specification not found. Run: pnpm generate:openapi',
        schema: errorResponseSchema,
        example: {
          error: 'OpenAPI specification not found',
          message: 'OpenAPI specification not found. Run: pnpm generate:openapi',
        },
      },
      500: {
        description: 'Failed to load OpenAPI specification',
        schema: errorResponseSchema,
        example: {
          error: 'Failed to load OpenAPI specification',
          message: 'An unexpected error occurred while loading the OpenAPI specification',
        },
      },
    },
    summary: 'Get OpenAPI specification',
    tags: ['openapi', 'documentation'],
  },
  operation: 'OpenAPISpecAPI',
  route: getVersionedRoute('openapi.json'),
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
          { status: 404, headers: getOnlyCorsHeaders }
        );
      }

      // Other errors - will be handled by factory's error handler
      throw error;
    }
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
