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

import { prisma } from '@heyclaude/data-layer/prisma/client';
import {
  errorResponseSchema,
  userProfileImageResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { createApiOptionsHandler, createApiRoute } from '@heyclaude/web-runtime/api/route-factory';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * GET /api/user/profile-image - Get authenticated user's profile image
 *
 * Returns the user's profile image URL from the database.
 * Requires authentication and uses HTTP cache headers for client-side caching.
 */
export const GET = createApiRoute({
  cors: 'auth',
  handler: async ({ logger, user }) => {
    try {
      // Fetch only the image field from database
      const userProfile = await prisma.users.findUnique({
        select: { image: true },
        where: { id: user.id },
      });

      const imageUrl = userProfile?.image ?? null;

      logger.info(
        {
          hasImage: !!imageUrl,
          section: 'data-fetch',
        },
        'GetUserProfileImage: profile image fetched'
      );

      // Return with cache headers (5 minutes TTL for user-specific data)
      return jsonResponse({ imageUrl }, 200, getOnlyCorsHeaders, {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=60',
        'X-Generated-By': 'prisma.users.findUnique',
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch user profile image');
      logger.error(
        {
          err: normalized,
          section: 'data-fetch',
        },
        'GetUserProfileImage: error fetching profile image'
      );
      return jsonResponse(
        { error: 'Internal server error', message: normalized.message },
        500,
        getOnlyCorsHeaders
      );
    }
  },
  method: 'GET',
  openapi: {
    description:
      "Returns the authenticated user's profile image URL from the database. Used by the user menu and other components to display the user's profile picture.",
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
          message: 'Authentication required to access user profile image',
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
  requireAuth: true,
  route: '/api/user/profile-image',
});

export const OPTIONS = createApiOptionsHandler('auth');
