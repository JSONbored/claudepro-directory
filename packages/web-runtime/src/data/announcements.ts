'use server';

import { MiscService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../cache/fetch-cached.ts';

const ANNOUNCEMENT_TTL_KEY = 'announcements';

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
