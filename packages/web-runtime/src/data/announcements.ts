'use server';

import { type announcementsModel } from '@heyclaude/database-types/prisma/models';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';

/**
 * Get active announcement
 *
 * Uses 'use cache' to cache announcement data. This data is public and same for all users.
 * Announcements change periodically, so we use the 'long' cacheLife profile.
 */
export const getActiveAnnouncement = createCachedDataFunction<void, announcementsModel | null>({
  serviceKey: 'misc',
  methodName: 'getActiveAnnouncement',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('announcements'),
  module: 'data/announcements',
  operation: 'getActiveAnnouncement',
});
