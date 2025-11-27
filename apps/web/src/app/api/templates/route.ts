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
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/core';
import { getContentTemplates } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Generate single requestId for this API request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'TemplatesAPI',
    route: '/api/templates',
    module: 'apps/web/src/app/api/templates',
  });

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
      reqLogger.warn('Templates API: invalid category', {
        category,
      });
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

    // Structured logging with cache tags
    reqLogger.info('Templates API: success', {
      category: validCategory,
      count: templates.length,
      cacheTags: ['templates', `templates-${validCategory}`],
      cacheTTL: 300,
    });

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
    const normalized = normalizeError(error, 'Templates API error');
    reqLogger.error('Templates API error', normalized, {
      section: 'error-handling',
      ...(category && { category }),
    });
    return createErrorResponse(error, {
      route: '/api/templates',
      operation: 'TemplatesAPI',
      method: 'GET',
      logContext: category ? { category } : {},
    });
  }
}
