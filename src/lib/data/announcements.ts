'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

export async function getActiveAnnouncement(): Promise<
  Database['public']['Tables']['announcements']['Row'] | null
> {
  return fetchCachedRpc<
    'get_active_announcement',
    Database['public']['Tables']['announcements']['Row'] | null
  >(
    {},
    {
      rpcName: 'get_active_announcement',
      tags: ['announcements'],
      ttlKey: 'cache.announcements.ttl_seconds',
      keySuffix: 'active',
      fallback: null,
      logMeta: { source: 'announcement-banner' },
    }
  );
}
