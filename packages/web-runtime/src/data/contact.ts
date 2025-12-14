'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';

type ContactCommandsRow =
  Database['public']['Functions']['get_contact_commands']['Returns'][number];

/**
 * Fetch contact commands
 * Uses 'use cache' to cache contact commands. This data is public and same for all users.
 * Contact commands change periodically, so we use the 'hours' cacheLife profile.
 */
export async function fetchContactCommands(): Promise<ContactCommandsRow | null> {
  'use cache';

  // Configure cache - use 'hours' profile for contact commands (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('contact');

  const reqLogger = logger.child({
    module: 'data/contact',
    operation: 'fetchContactCommands',
  });

  try {
    const service = new MiscService();
    const result = await service.getContactCommands();

    reqLogger.info({ count: result?.length ?? 0 }, 'fetchContactCommands: fetched successfully');

    return result?.[0] ?? null;
  } catch (error) {
    const normalized = normalizeError(error, 'fetchContactCommands failed');
    reqLogger.error({ err: normalized }, 'fetchContactCommands: failed');
    return null;
  }
}
