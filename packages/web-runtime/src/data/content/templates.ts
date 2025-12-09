'use server';

import { type Database } from '@heyclaude/database-types';
import { getEnvVar } from '@heyclaude/shared-runtime';
// Temporarily removed cache imports - will be re-added when caching is re-implemented
// import { cacheLife, cacheTag } from 'next/cache';

import { logger, normalizeError } from '../../logging/server.ts';

type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

/**
 * Get content templates
 * Uses 'use cache' to cache content templates. This data is public and same for all users.
 * Templates change periodically, so we use the 'hours' cacheLife profile.
 * @param category
 */
export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<MergedTemplateItem[]> {
  // Temporarily removed 'use cache' to fix serialization issues during prerendering
  // The issue is that Next.js tries to serialize the entire function closure when using 'use cache',
  // and class instances (Supabase client, ContentService) created inside the function are being captured.
  // TODO: Re-implement caching with a pattern that doesn't capture class instances in the closure.

  // Configure cache - use 'hours' profile for templates (changes every 2 hours)
  // Note: cacheLife/cacheTag require 'use cache', so these are currently no-ops
  // cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  // cacheTag('templates');
  // cacheTag(`templates-${category}`);

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'getContentTemplates',
    route: 'utility-function', // Utility function - no specific route
    module: 'data/content/templates',
  });

  try {
    // Dynamically import all dependencies to avoid class instance serialization issues
    // All imports must be inside the cached function to prevent class instances from being captured
    const [{ createSupabaseAnonClient }, { ContentService }] = await Promise.all([
      import('../../supabase/server-anon.ts'),
      import('@heyclaude/data-layer'),
    ]);

    // Check build time using getEnvVar to avoid direct process.env access
    // Use admin client during build for better performance, anon client at runtime
    // Create client inside try block to ensure it's not captured in closure
    let client;
    const nextPhase = getEnvVar('NEXT_PHASE');
    const isBuild =
      typeof process !== 'undefined' &&
      (nextPhase === 'phase-production-build' || nextPhase === 'phase-production-server');

    if (isBuild) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    // Create ContentService instance and call method - all class instances are local to this scope
    const result = await new ContentService(client).getContentTemplates({ p_category: category });

    if (result === null || result === undefined) {
      return [];
    }

    const templates = result.templates?.filter(Boolean) ?? [];

    const merged = templates.map((template) => {
      const templateData = template.template_data;
      const mergedData =
        typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
          ? (templateData as Record<string, unknown>)
          : {};
      return {
        ...template,
        ...mergedData,
        templateData: template.template_data,
      } as MergedTemplateItem;
    });

    // Serialize for Client Component compatibility - ensure all data is plain objects
    // This handles Date objects, class instances, and any other non-serializable data
    // Use structuredClone where possible, fallback to JSON serialization for complex cases
    let serialized: MergedTemplateItem[];
    try {
      // Try structuredClone first (faster and safer for most cases)
      serialized = structuredClone(merged);
    } catch {
      // Fallback to JSON serialization for complex objects that structuredClone can't handle
      serialized = JSON.parse(
        JSON.stringify(merged, (_key, value) => {
          // Filter out any non-serializable values
          if (value === null || value === undefined) {
            return value;
          }
          // Handle Date objects - check if it's a Date by checking for toISOString method
          if (
            typeof value === 'object' &&
            value !== null &&
            'toISOString' in value &&
            typeof (value as { toISOString?: unknown }).toISOString === 'function'
          ) {
            return (value as Date).toISOString();
          }
          // Handle objects with null prototype (which can't be serialized)
          if (typeof value === 'object' && Object.getPrototypeOf(value) === null) {
            return Object.assign({}, value);
          }
          // Handle class instances (objects with constructor that's not Object)
          if (typeof value === 'object' && value !== null) {
            const proto = Object.getPrototypeOf(value);
            if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
              // Try to extract plain properties using structuredClone
              try {
                return structuredClone(value);
              } catch {
                return null;
              }
            }
          }
          return value;
        })
      ) as MergedTemplateItem[];
    }

    reqLogger.info(
      { category, templateCount: serialized.length },
      'getContentTemplates: fetched successfully'
    );

    return serialized;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch content templates');
    reqLogger.error(
      { err: normalized, category, source: 'getContentTemplates' },
      'getContentTemplates: failed'
    );
    // Return empty array on error to avoid breaking the build
    return [];
  }
}
