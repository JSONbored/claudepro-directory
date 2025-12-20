/**
 * Company Profile API Route
 *
 * Returns company profile data by slug identifier.
 * Used to display company information on company profile pages.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/company?slug=acme-corp
 *
 * // Response (200)
 * {
 *   "id": "...",
 *   "name": "Acme Corp",
 *   "slug": "acme-corp",
 *   ...
 * }
 * ```
 */

import 'server-only';
import {
  createCachedApiRoute,
  createOptionsHandler as createApiOptionsHandler,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { slugSchema } from '@heyclaude/web-runtime/api/schemas';
import {
  companyProfileResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { notFoundResponse } from '@heyclaude/web-runtime/server/not-found-response';
import { z } from 'zod';

/**
 * Query schema for company API
 * Exported for OpenAPI generation
 */
export const companyQuerySchema = z.object({
  slug: slugSchema.describe('Company slug identifier'),
});

/**
 * GET /api/company - Get company profile by slug
 *
 * Returns company profile data by slug identifier.
 * Validates slug parameter and returns company profile with cache headers.
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes
  cacheTags: (query) => ['companies', `company-${query.slug}`],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns company profile data by slug identifier. Used to display company information on company profile pages.',
    operationId: 'getCompanyProfile',
    responses: {
      200: {
        description: 'Company profile retrieved successfully',
        schema: companyProfileResponseSchema,
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'string' },
            description: 'Remaining rate limit requests',
          },
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
          'X-Generated-By': {
            schema: { type: 'string' },
            description: 'Source of the response data',
          },
        },
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corp',
          slug: 'acme-corp',
          description: 'A leading technology company',
          website: 'https://acme.com',
          logo_url: 'https://acme.com/logo.png',
        },
      },
      400: {
        description: 'Missing or invalid slug parameter',
        schema: errorResponseSchema,
        example: {
          error: 'Missing or invalid slug parameter',
          message: 'Slug parameter is required and must be a valid slug format',
        },
      },
      404: {
        description: 'Company not found',
        schema: errorResponseSchema,
        example: {
          error: 'Company not found',
          message: 'No company found with slug "invalid-slug"',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching company profile',
        },
      },
    },
    summary: 'Get company profile by slug',
    tags: ['company', 'profiles'],
  },
  operation: 'CompanyAPI',
  querySchema: companyQuerySchema,
  responseHandler: (
    result: unknown,
    query: { slug: string },
    _body: unknown,
    ctx: RouteHandlerContext<{ slug: string }>
  ) => {
    const { logger } = ctx;
    const profile = result as null | undefined | { [key: string]: unknown; p_slug: string };

    // Check if profile exists
    if (!profile || (typeof profile === 'object' && Object.keys(profile).length === 0)) {
      logger.warn({ slug: query.slug }, 'Company profile not found');
      return notFoundResponse('Company not found', 'Company');
    }

    logger.info({ slug: query.slug }, 'Company profile retrieved');

    return jsonResponse(profile, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'prisma.rpc.get_company_profile',
    });
  },
  route: getVersionedRoute('company'),
  service: {
    methodArgs: (query) => [{ p_slug: query.slug }],
    methodName: 'getCompanyProfile',
    serviceKey: 'companies',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
