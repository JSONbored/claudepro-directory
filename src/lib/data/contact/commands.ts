'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

type GetContactCommandsReturn =
  Database['public']['Functions']['get_contact_commands']['Returns'][number];

export async function fetchContactCommands(): Promise<GetContactCommandsReturn | null> {
  const result = await fetchCachedRpc<
    'get_contact_commands',
    Database['public']['Functions']['get_contact_commands']['Returns']
  >(undefined as never, {
    rpcName: 'get_contact_commands',
    tags: ['contact'],
    ttlKey: 'cache.contact.ttl_seconds',
    keySuffix: 'contact-commands',
    useAuthClient: false,
    fallback: [],
    logMeta: { source: 'contact.actions' },
  });

  // RPC returns TABLE (array of rows), but we only return one row
  // Extract the first row's commands array
  return result[0] ?? null;
}
