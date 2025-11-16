'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetGetContactCommandsReturn } from '@/src/types/database-overrides';

export async function fetchContactCommands(): Promise<GetGetContactCommandsReturn | null> {
  return fetchCachedRpc<'get_contact_commands', GetGetContactCommandsReturn | null>(
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
