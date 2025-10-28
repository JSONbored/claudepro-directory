/**
 * Guides Index Page - Database-First Architecture
 * All guides loaded from Supabase `guides` table, not local files.
 */

import type { Metadata } from 'next';
import { ContentListServer } from '@/src/components/content-list-server';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';

export const metadata: Metadata = generatePageMetadata('/guides');

type GuideRow = Tables<'guides'>;

/**
 * Guide item with analytics
 * Extends database guide row with view/copy counts
 */
interface GuideWithAnalytics extends GuideRow {
  viewCount?: number;
  copyCount?: number;
}

export default async function GuidesPage() {
  const supabase = await createClient();

  // Load all guides from database
  const { data: guidesData, error: guidesError } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (guidesError) {
    logger.error('Failed to load guides', guidesError);
    return (
      <ContentListServer
        title="Guides"
        description="Comprehensive guides, tutorials, and best practices for getting the most out of Claude and MCP servers"
        icon="book-open"
        items={[]}
        type="guides"
        searchPlaceholder="Search guides..."
        badges={[{ icon: 'book-open', text: '0 Guides Available' }]}
      />
    );
  }

  // Enrich with view and copy counts from mv_analytics_summary
  const { data: analyticsData } = await supabase
    .from('mv_analytics_summary')
    .select('slug, view_count, copy_count')
    .eq('category', 'guides');

  const analyticsMap = new Map<string, { viewCount: number; copyCount: number }>();
  if (analyticsData) {
    for (const row of analyticsData) {
      if (row.slug) {
        analyticsMap.set(row.slug, {
          viewCount: row.view_count ?? 0,
          copyCount: row.copy_count ?? 0,
        });
      }
    }
  }

  const guides: GuideWithAnalytics[] = (guidesData || []).map((guide) => {
    const analytics = analyticsMap.get(guide.slug) ?? { viewCount: 0, copyCount: 0 };
    return { ...guide, viewCount: analytics.viewCount, copyCount: analytics.copyCount };
  });

  logger.info('Guides page rendered', {
    guideCount: guides.length,
  });

  return (
    <ContentListServer
      title="Guides"
      description="Comprehensive guides, tutorials, and best practices for getting the most out of Claude and MCP servers"
      icon="book-open"
      items={guides as any}
      type="guides"
      searchPlaceholder="Search guides..."
      badges={[
        { icon: 'book-open', text: `${guides.length} Guides Available` },
        { text: 'Production Ready' },
        { text: 'Community Driven' },
      ]}
    />
  );
}
