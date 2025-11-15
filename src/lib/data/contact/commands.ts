'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

type ContactCommandsResult = Database['public']['Functions']['get_contact_commands']['Returns'];

export async function fetchContactCommands(): Promise<ContactCommandsResult | null> {
  return fetchCachedRpc<ContactCommandsResult | null>(
    {},
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
