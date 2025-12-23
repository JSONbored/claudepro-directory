/**
 * Templates API Route
 *
 * Fetches content templates by category for client-side consumption.
 * Used by the wizard to load templates dynamically.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/templates?category=skills
 *
 * // Response (200)
 * {
 *   "success": true,
 *   "category": "skills",
 *   "count": 25,
 *   "templates": [
 *     { "id": "...", "title": "...", ... }
 *   ]
 * }
 * ```
 */
import 'server-only';
import {
  errorResponseSchema,
  templatesResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createCachedApiRoute, createOptionsHandler as createApiOptionsHandler, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { categorySchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import {
  badRequestResponse,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/utils/category-validation';
import { type content_category } from '@prisma/client';
import { z } from 'zod';

/**
 * Query schema for templates API
 * Exported for OpenAPI generation
 */
export const templatesQuerySchema = z.object({
  category: categorySchema,
});

// Shared category validator
function validateCategory(category: content_category | null | undefined): content_category {
  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Category parameter is required and cannot be "all". Valid categories: ${VALID_CATEGORIES.join(', ')}`
    );
  }
  return category;
}

/**
 * GET /api/templates - Get content templates by category
 *
 * Fetches content templates for a specified category.
 * Validates category parameter and returns templates with metadata.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (query) => {
    const category = query.category as content_category | null;
    return category ? ['templates', `templates-${category}`] : ['templates'];
  },
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Fetches content templates by category for client-side consumption. Used by the wizard to load templates dynamically.',
    operationId: 'getTemplates',
    responses: {
      200: {
        description: 'Templates retrieved successfully',
        example: {
          category: 'skills',
          count: 25,
          success: true,
          templates: [
            {
              category: 'skills',
              description: 'An example template for demonstration',
              id: 'template-1',
              title: 'Example Template',
            },
          ],
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: templatesResponseSchema,
      },
      400: {
        description: 'Invalid or missing category parameter',
        example: {
          error: 'Invalid category parameter',
          message:
            'Category parameter is required and cannot be "all". Valid categories: agents, mcp, rules, commands, hooks, statuslines, skills, collections, guides, jobs, changelog',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching templates',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get content templates by category',
    tags: ['content', 'templates'],
  },
  operation: 'TemplatesAPI',
  querySchema: templatesQuerySchema,
  responseHandler: (
    result: unknown,
    query: { category: content_category | null },
    _body: unknown,
    ctx: RouteHandlerContext<{ category: content_category | null }>
  ) => {
    const { logger } = ctx;
    const { category } = query;

    // Validate category (schema transforms "all" to null, but this endpoint requires a specific category)
    let validCategory: content_category;
    try {
      validCategory = validateCategory(category);
    } catch (error) {
      logger.warn({ category }, 'Templates API: invalid or missing category');
      return badRequestResponse(
        error instanceof Error ? error.message : 'Invalid category parameter',
        getOnlyCorsHeaders
      );
    }
    const serviceResult = result as null | undefined | { templates?: unknown[] };
    const templates = serviceResult?.templates?.filter(Boolean) ?? [];

    // Structured logging with cache tags
    logger.info(
      {
        cacheTags: ['templates', `templates-${validCategory}`],
        category: validCategory,
        count: templates.length,
      },
      'Templates API: success'
    );

    return jsonResponse(
      {
        category: validCategory,
        count: templates.length,
        success: true,
        templates,
      },
      200,
      getOnlyCorsHeaders
    );
  },
  route: getVersionedRoute('templates'),
  service: {
    methodArgs: (query) => {
      const category = validateCategory(query.category as content_category | null);
      return [{ p_category: category }];
    },
    methodName: 'getContentTemplates',
    serviceKey: 'content',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
