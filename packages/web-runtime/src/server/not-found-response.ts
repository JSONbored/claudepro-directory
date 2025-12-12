/**
 * Standardized 404 Not Found Response Utility
 * 
 * Creates consistent 404 responses across all API routes.
 * 
 * @module web-runtime/server/not-found-response
 */

import { NextResponse } from 'next/server';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { ApiErrorCode } from '../utils/api-error-codes';

/**
 * Create a standardized 404 Not Found response
 * 
 * @param message - Optional custom message (defaults to "Resource not found")
 * @param resourceType - Optional resource type for context (e.g., "Content", "Company")
 * @returns NextResponse with 404 status and standardized error format
 */
export function notFoundResponse(
  message?: string,
  resourceType?: string
): NextResponse {
  const defaultMessage = resourceType
    ? `${resourceType} not found`
    : 'Resource not found';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ApiErrorCode.NOT_FOUND,
        message: message || defaultMessage,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 404,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...buildSecurityHeaders(),
      },
    }
  );
}
