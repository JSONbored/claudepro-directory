'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetContactCommandsReturn } from '@/src/types/database-overrides';

export async function fetchContactCommands(): Promise<GetContactCommandsReturn | null> {
  return fetchCachedRpc<'get_contact_commands', GetContactCommandsReturn | null>(
    undefined as never,
    {
      rpcName: 'get_contact_commands',
      tags: ['contact'],
      ttlKey: 'cache.contact.ttl_seconds',
      keySuffix: 'contact-commands',
      useAuthClient: false,
      fallback: null,
      logMeta: { source: 'contact.actions' },
    }
  );
}
