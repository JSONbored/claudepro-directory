/**
 * Templates API Route
 *
 * Fetches content templates by category for client-side consumption.
 * Used by the wizard to load templates dynamically.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { VALID_CATEGORIES } from '@/src/lib/data/config/category';
import { getContentTemplates } from '@/src/lib/data/content/templates';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Validate category
    if (
      !(
        category &&
        VALID_CATEGORIES.includes(category as Database['public']['Enums']['content_category'])
      )
    ) {
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
    logger.error('Templates API error', error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/templates',
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
