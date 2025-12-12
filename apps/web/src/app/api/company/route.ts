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
import { CompaniesService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { createApiRoute, createApiOptionsHandler, slugSchema } from '@heyclaude/web-runtime/server';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
  notFoundResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

/**
 * Cached helper function to fetch company profile by slug.
 * The slug parameter becomes part of the cache key, so different companies have different cache entries.
 *
 * @param {string} slug - Company slug identifier
 * @returns Promise resolving to an object with the company profile data
 */
async function getCachedCompanyProfile(slug: string): Promise<{
  data: DatabaseGenerated['public']['Functions']['get_company_profile']['Returns'];
}> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new CompaniesService(supabase);
  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];

  const data = await service.getCompanyProfile(rpcArgs);
  return { data };
}

/**
 * GET /api/company - Get company profile by slug
 * 
 * Returns company profile data by slug identifier.
 * Validates slug parameter and returns company profile with cache headers.
 */
export const GET = createApiRoute({
  route: '/api/company',
  operation: 'CompanyAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: z.object({
    slug: slugSchema.describe('Company slug identifier'),
  }),
  openapi: {
    summary: 'Get company profile by slug',
    description: 'Returns company profile data by slug identifier. Used to display company information on company profile pages.',
    tags: ['company', 'profiles'],
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
  },
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types
    const { slug } = query;

    logger.info({ slug }, 'Company request received');

    let profile;
    try {
      const result = await getCachedCompanyProfile(slug);
      profile = result.data;
    } catch (error) {
      const normalizedError = normalizeError(error, 'Company profile RPC error');
      logger.error(
        {
          err: normalizedError,
          rpcName: 'get_company_profile',
          slug,
        },
        'Company profile RPC error'
      );
      throw normalizedError; // Factory will handle error response
    }

    // Check if profile exists
    if (!profile || (typeof profile === 'object' && Object.keys(profile).length === 0)) {
      logger.warn({ slug }, 'Company profile not found');
      return notFoundResponse('Company not found', 'Company');
    }

    logger.info({ slug }, 'Company profile retrieved');

    return jsonResponse(profile, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'supabase.rpc.get_company_profile',
      ...buildCacheHeaders('company_profile'),
    });
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
