/**
 * Announcement Banner Server Wrapper
 *
 * Server component that fetches announcement from database and passes to client.
 * Database-first: Uses generated Tables<'announcements'> type directly
 *
 * Migration: Phase 3 Week 1
 */

import { cache } from 'react';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';
import { AnnouncementBannerClient } from './announcement-banner-client';

/**
 * Get active announcement from database
 * Cached per request with React cache
 */
const getActiveAnnouncement = cache(async (): Promise<Tables<'announcements'> | null> => {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load announcement:', error);
      return null;
    }

    return data;
  } catch (error) {
    // Mock client or connection error - silently fail
    return null;
  }
});

/**
 * Server Component Wrapper
 * Fetches announcement from database and passes to client component
 */
export async function AnnouncementBanner() {
  const announcement = await getActiveAnnouncement();

  if (!announcement) {
    return null;
  }

  return <AnnouncementBannerClient announcement={announcement} />;
}
