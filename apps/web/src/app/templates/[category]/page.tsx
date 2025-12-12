/**
 * Dynamic Templates Route
 *
 * Returns templates for a given category as JSON (API-compatible endpoint).
 * This route is dynamic to avoid static generation issues and to ensure fresh data.
 *
 * Route: /templates/[category]
 * Rendering: Dynamic (runs at request time)
 * Cache: Handled by getContentTemplates data layer function
 */

import { type Database } from '@heyclaude/database-types';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/core';
import { getContentTemplates } from '@heyclaude/web-runtime/data';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';

/**
 * Dynamic templates page route
 *
 * Returns JSON response matching the API route format for backward compatibility.
 * This route is dynamic to ensure fresh template data and avoid build-time fetch cancellation issues.
 * @param root0
 * @param root0.params
 */
export default async function TemplatesPage({ params }: { params: Promise<{ category: string }> }) {
  const reqLogger = logger.child({
    module: 'app/templates/[category]/page.tsx',
    operation: 'TemplatesPage',
    route: 'templates/[category]',
  });

  const { category } = await params;

  // Validate category
  if (
    !category ||
    !VALID_CATEGORIES.includes(category as Database['public']['Enums']['content_category'])
  ) {
    notFound();
  }

  const validCategory = category as Database['public']['Enums']['content_category'];

  let templates: Awaited<ReturnType<typeof getContentTemplates>> = [];
  try {
    templates = await getContentTemplates(validCategory);
  } catch (error) {
    // Log error but return empty array to avoid breaking the API
    // The data layer function already handles errors gracefully
    const normalized = normalizeError(error, 'Failed to fetch templates');
    reqLogger.error({ err: normalized, section: 'data-fetch' }, 'Failed to fetch templates');
    templates = [];
  }

  // Pino serializers handle Date objects automatically via JSON.stringify
  // But for Client Components, we need plain objects - use JSON round-trip
  const serializedTemplates = structuredClone(templates);

  return NextResponse.json({
    category: validCategory,
    count: serializedTemplates.length,
    success: true,
    templates: serializedTemplates,
  });
}
