'use server';

import { MiscService } from '@heyclaude/data-layer';
import type { ContactCommandResult } from '@heyclaude/database-types/postgres-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';

type ContactCommandsRow = ContactCommandResult;

/**
 * Fetch contact commands
 * Uses 'use cache' to cache contact commands. This data is public and same for all users.
 * Contact commands change periodically, so we use the 'hours' cacheLife profile.
 */
export async function fetchContactCommands(): Promise<ContactCommandsRow | null> {
  'use cache';

  // Configure cache - use 'static' profile for optimal SEO (1 day stale, 6hr revalidate, 30 days expire)
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTag('contact');

  const reqLogger = logger.child({
    module: 'data/contact',
    operation: 'fetchContactCommands',
  });

  try {
    const service = new MiscService();
    const result = await service.getContactCommands();

    // GetContactCommandsReturns is ContactCommandResult[][] (array of arrays)
    // Return the first array's first element, or null
    reqLogger.info({ count: result?.[0]?.length ?? 0 }, 'fetchContactCommands: fetched successfully');

    return result?.[0]?.[0] ?? null;
  } catch (error) {
    const normalized = normalizeError(error, 'fetchContactCommands failed');
    reqLogger.error({ err: normalized }, 'fetchContactCommands: failed');
    return null;
  }
}
