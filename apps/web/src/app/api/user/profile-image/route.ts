/**
 * User Profile Image API Route
 *
 * Returns the authenticated user's profile image URL from the database.
 * Uses server-side caching with 'use cache: private' for user-specific data.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/user/profile-image
 *
 * // Response (200)
 * {
 *   "imageUrl": "https://..." | null
 * }
 * ```
 */

import 'server-only';

import { getUserProfileImage } from '@heyclaude/web-runtime/actions/user';
import {
  errorResponseSchema,
  userProfileImageResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { createOptionsHandler, createApiRoute } from '@heyclaude/web-runtime/api/route-factory';
import { jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { connection } from 'next/server';

/**
 * GET /api/user/profile-image - Get authenticated user's profile image
 *
 * Returns the user's profile image URL from the database.
 * Requires authentication via authedAction and uses HTTP cache headers for client-side caching.
 */
export const GET = createApiRoute({
  cors: 'auth',
  handler: async ({ cors, logger }) => {
    await connection();

    logger.info({}, 'GetUserProfileImage: profile image request');

    // Call server action - authedAction handles authentication
    const result = await getUserProfileImage();

    // Handle authentication errors (authedAction returns serverError for auth failures)
    if (
      result &&
      typeof result === 'object' &&
      'serverError' in result &&
      (result as { serverError?: string }).serverError
    ) {
      const serverError =
        (result as { serverError?: string }).serverError || 'Internal server error';

      // Check if this is an authentication error
      if (serverError.includes('Unauthorized') || serverError.includes('sign in')) {
        logger.warn({ serverError }, 'Authentication failed');
        return jsonResponse(
          {
            error: 'Unauthorized',
            message: 'Authentication required. Please sign in to continue.',
          },
          401,
          cors
        );
      }

      // Other server errors
      logger.error({ serverError }, 'Action returned serverError');
      return jsonResponse({ error: serverError }, 500, cors);
    }

    // Success - return the action result (SafeActionResult structure)
    // Extract imageUrl for logging
    const actionData =
      result && typeof result === 'object' && 'data' in result
        ? (result as { data?: { imageUrl: string | null } }).data
        : null;
    const imageUrl = actionData?.imageUrl ?? null;

    logger.info(
      {
        hasImage: !!imageUrl,
        section: 'data-fetch',
      },
      'GetUserProfileImage: profile image fetched'
    );

    // Return SafeActionResult with cache headers (5 minutes TTL for user-specific data)
    return jsonResponse(result, 200, cors, {
      'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=60',
      'X-Generated-By': 'getUserProfileImage action',
    });
  },
  method: 'GET',
  openapi: {
    description:
      "Returns the authenticated user's profile image URL from the database. Used by the user menu and other components to display the user's profile picture. Requires authentication via authedAction.",
    operationId: 'getUserProfileImage',
    responses: {
      200: {
        description: 'Profile image URL retrieved successfully',
        example: {
          imageUrl: 'https://supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg',
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive (private, 5 minutes TTL)',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
        },
        schema: userProfileImageResponseSchema,
      },
      401: {
        description: 'Authentication required',
        example: {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to continue.',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'Failed to fetch user profile image',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get user profile image',
    tags: ['user', 'profile'],
  },
  operation: 'GetUserProfileImage',
  route: '/api/user/profile-image',
});

export const OPTIONS = createOptionsHandler('auth');
