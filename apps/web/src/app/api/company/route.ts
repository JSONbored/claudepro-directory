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
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { notFoundResponse } from '@heyclaude/web-runtime/server/not-found-response';
import { slugSchema } from '@heyclaude/web-runtime/api/schemas';
import { z } from 'zod';

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
      },
      400: {
        description: 'Missing or invalid slug parameter',
      },
      404: {
        description: 'Company not found',
      },
    },
    summary: 'Get company profile by slug',
    tags: ['company', 'profiles'],
  },
  operation: 'CompanyAPI',
  querySchema: z.object({
    slug: slugSchema.describe('Company slug identifier'),
  }),
  responseHandler: (result: unknown, query: { slug: string }, _body: unknown, ctx: RouteHandlerContext<{ slug: string }, unknown>) => {
    const { logger } = ctx;
    const profile = result as { p_slug: string; [key: string]: unknown } | null | undefined;

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
