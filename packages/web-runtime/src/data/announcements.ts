import 'server-only';

import { type announcementsModel } from '@heyclaude/database-types/prisma/models';

import { createDataFunction } from './cached-data-factory.ts';

/**
 * Get active announcement
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getActiveAnnouncement = createDataFunction<void, announcementsModel | null>({
  methodName: 'getActiveAnnouncement',
  module: 'data/announcements',
  operation: 'getActiveAnnouncement',
  serviceKey: 'misc',
});
