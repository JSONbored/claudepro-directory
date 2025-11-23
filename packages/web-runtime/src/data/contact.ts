'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../cache/fetch-cached.ts';
import { MiscService } from '@heyclaude/data-layer';

type ContactCommandsRow =
  Database['public']['Functions']['get_contact_commands']['Returns'][number];

export async function fetchContactCommands(): Promise<ContactCommandsRow | null> {
  const result = await fetchCached(
    (client) => new MiscService(client).getContactCommands(),
    {
      key: 'contact-commands',
      tags: ['contact'],
      ttlKey: 'cache.contact.ttl_seconds',
      fallback: [],
      logMeta: { source: 'contact.actions' },
    }
  );

  return result[0] ?? null;
}
