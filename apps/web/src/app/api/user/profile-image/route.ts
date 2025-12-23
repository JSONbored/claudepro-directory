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

import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/api/route-factory';
import {
  userProfileImageResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';

/**
 * GET /api/user/profile-image - Get authenticated user's profile image
 *
 * Returns the user's profile image URL from the database.
 * Requires authentication and uses HTTP cache headers for client-side caching.
 */
export const GET = createApiRoute({
  route: '/api/user/profile-image',
  operation: 'GetUserProfileImage',
  method: 'GET',
  cors: 'auth',
  requireAuth: true,
  openapi: {
    summary: 'Get user profile image',
    description:
      'Returns the authenticated user\'s profile image URL from the database. Used by the user menu and other components to display the user\'s profile picture.',
    tags: ['user', 'profile'],
    operationId: 'getUserProfileImage',
    responses: {
      200: {
        description: 'Profile image URL retrieved successfully',
        schema: userProfileImageResponseSchema,
        headers: {
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive (private, 5 minutes TTL)',
          },
          'X-Generated-By': {
            schema: { type: 'string' },
            description: 'Source of the response data',
          },
        },
        example: {
          imageUrl: 'https://supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg',
        },
      },
      401: {
        description: 'Authentication required',
        schema: errorResponseSchema,
        example: {
          error: 'Unauthorized',
          message: 'Authentication required to access user profile image',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'Failed to fetch user profile image',
        },
      },
    },
  },
  handler: async ({ user, logger }) => {
    try {
      // Fetch only the image field from database
      const userProfile = await prisma.users.findUnique({
        where: { id: user.id },
        select: { image: true },
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
      return jsonResponse(
        { imageUrl },
        200,
        getOnlyCorsHeaders,
        {
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=60',
          'X-Generated-By': 'prisma.users.findUnique',
        }
      );
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
});

export const OPTIONS = createApiOptionsHandler('auth');

