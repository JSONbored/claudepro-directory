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
import { type content_category } from '@heyclaude/data-layer/prisma';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/core';
import { getContentTemplates } from '@heyclaude/web-runtime/data';
import {
  badRequestResponse,
  buildCacheHeaders,
  categorySchema,
  createApiOptionsHandler,
  createApiRoute,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife, cacheTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/***
 * Cached helper function to fetch content templates
 * Uses Cache Components to reduce function invocations
 * @param {content_category} category
 */
async function getCachedTemplatesForAPI(category: content_category) {
  'use cache';
  cacheTag('templates');
  cacheTag(`templates-${category}`);
  cacheLife('static'); // 5min stale, 1day revalidate, 1week expire

  return getContentTemplates(category);
}

/**
 * GET /api/templates - Get content templates by category
 *
 * Fetches content templates for a specified category.
 * Validates category parameter and returns templates with metadata.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    const { category } = query as {
      category: content_category | null;
    };

    // Handle category: schema transforms "all" to null, but this endpoint requires a specific category
    // If category is null (from "all" transformation), return 400 Bad Request (validation error)
    if (!category || !VALID_CATEGORIES.includes(category)) {
      logger.warn(
        {
          category,
        },
        'Templates API: invalid or missing category'
      );
      return badRequestResponse(
        `Category parameter is required and cannot be "all". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        getOnlyCorsHeaders
      );
    }

    // Type narrowing: category is validated and guaranteed to be content_category
    const validCategory = category;

    // Fetch templates from cached helper (adds page-level caching on top of data layer caching)
    const templates = await getCachedTemplatesForAPI(validCategory);

    // Structured logging with cache tags
    logger.info(
      {
        cacheTags: ['templates', `templates-${validCategory}`],
        category: validCategory,
        count: templates.length,
      },
      'Templates API: success'
    );

    // Return success response with optimized cache headers
    // Using 'config' preset: 1 day TTL, 2 days stale (templates change rarely)
    return NextResponse.json(
      {
        category: validCategory,
        count: templates.length,
        success: true,
        templates,
      },
      {
        headers: {
          ...buildCacheHeaders('config'), // 1 day TTL, 2 days stale
        },
        status: 200,
      }
    );
  },
  method: 'GET',
  openapi: {
    description:
      'Fetches content templates by category for client-side consumption. Used by the wizard to load templates dynamically.',
    operationId: 'getTemplates',
    responses: {
      200: {
        description: 'Templates retrieved successfully',
      },
      400: {
        description: 'Invalid or missing category parameter',
      },
    },
    summary: 'Get content templates by category',
    tags: ['content', 'templates'],
  },
  operation: 'TemplatesAPI',
  querySchema: z.object({
    category: categorySchema,
  }),
  route: '/api/templates',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
