'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get similar content
 * Uses 'use cache' to cache similar content. This data is public and same for all users.
 * Similar content changes periodically, so we use the 'hours' cacheLife profile.
 */
export async function getSimilarContent(input: {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  limit?: number;
}): Promise<Database['public']['Functions']['get_similar_content']['Returns'] | null> {
  'use cache';

  const { contentType, contentSlug, limit = 6 } = input;

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'hours' profile for similar content
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('content');
  cacheTag('similar');
  cacheTag(`content-${contentSlug}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getSimilarContent',
    module: 'data/content/similar',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getSimilarContent({
      p_content_type: contentType,
      p_content_slug: contentSlug,
      p_limit: limit,
    });

    reqLogger.info('getSimilarContent: fetched successfully', {
      contentType,
      contentSlug,
      limit,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error('getSimilarContent: failed', errorForLogging, {
      contentType,
      contentSlug,
      limit,
    });
    return null;
  }
}
