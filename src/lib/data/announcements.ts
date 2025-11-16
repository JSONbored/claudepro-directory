'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Tables } from '@/src/types/database-overrides';

export async function getActiveAnnouncement(): Promise<Tables<'announcements'> | null> {
  return fetchCachedRpc<'get_active_announcement', Tables<'announcements'> | null>(
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
