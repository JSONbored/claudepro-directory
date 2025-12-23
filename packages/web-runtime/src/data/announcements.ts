import 'server-only';

import { type Prisma } from '@prisma/client';

import { createDataFunction } from './cached-data-factory.ts';

type announcementsModel = Prisma.announcementsGetPayload<{}>;

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
