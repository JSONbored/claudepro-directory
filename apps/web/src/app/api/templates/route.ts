/**
 * Templates API Route
 *
 * Fetches content templates by category for client-side consumption.
 * Used by the wizard to load templates dynamically.
 *
 * Runtime: Node.js (required for Supabase client with service role)
 */
export const runtime = 'nodejs';

import type { Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  VALID_CATEGORIES,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { getContentTemplates } from '@heyclaude/web-runtime/data';
import { createErrorResponse } from '@heyclaude/web-runtime/utils/error-handler';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  // Generate single requestId for this API request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/api/templates', 'TemplatesAPI');

  const searchParameters = request.nextUrl.searchParams;
  const category = searchParameters.get('category');

  try {
    // Validate category
    if (
      !(
        category &&
        VALID_CATEGORIES.includes(category as Database['public']['Enums']['content_category'])
      )
    ) {
      logger.warn(
        'Templates API: invalid category',
        undefined,
        withDuration(
          {
            ...baseLogContext,
            category,
          },
          startTime
        )
      );
      return NextResponse.json(
        {
          error: 'Invalid category',
          message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Type narrowing: category is validated and guaranteed to be content_category
    const validCategory = category as Database['public']['Enums']['content_category'];

    // Fetch templates from data layer
    const templates = await getContentTemplates(validCategory);

    // Structured logging with cache tags and duration
    logger.info(
      'Templates API: success',
      withDuration(
        {
          ...baseLogContext,
          category: validCategory,
          count: templates.length,
          cacheTags: ['templates', `templates-${validCategory}`],
          cacheTTL: 300,
        },
        startTime
      )
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        templates,
        category: validCategory,
        count: templates.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    return createErrorResponse(error, {
      route: '/api/templates',
      operation: 'TemplatesAPI',
      method: 'GET',
      logContext: category ? { category, duration } : { duration },
    });
  }
}
