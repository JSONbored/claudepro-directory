'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../cache/fetch-cached.ts';
import { MiscService } from '@heyclaude/data-layer';

const ANNOUNCEMENT_TTL_KEY = 'cache.announcements.ttl_seconds';

export async function getActiveAnnouncement(): Promise<
  Database['public']['Tables']['announcements']['Row'] | null
> {
  return fetchCached(
    (client) => new MiscService(client).getActiveAnnouncement(),
    {
      keyParts: ['announcements', 'active'],
      tags: ['announcements'],
      ttlKey: ANNOUNCEMENT_TTL_KEY,
      fallback: null,
      logMeta: { source: 'announcement-banner' },
    }
  );
}
