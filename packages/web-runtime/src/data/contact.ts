'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';
import { generateRequestId } from '../utils/request-id.ts';

type ContactCommandsRow =
  Database['public']['Functions']['get_contact_commands']['Returns'][number];

/**
 * Fetch contact commands
 * Uses 'use cache' to cache contact commands. This data is public and same for all users.
 * Contact commands change periodically, so we use the 'hours' cacheLife profile.
 */
export async function fetchContactCommands(): Promise<ContactCommandsRow | null> {
  'use cache';

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for contact commands (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('contact');

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'fetchContactCommands',
    module: 'data/contact',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new MiscService(client).getContactCommands();

    reqLogger.info('fetchContactCommands: fetched successfully', {
      count: result?.length ?? 0,
    });

    return result?.[0] ?? null;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('fetchContactCommands: failed', errorForLogging);
    return null;
  }
}
