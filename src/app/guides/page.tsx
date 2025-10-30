/**
 * Guides Index Page - Uses unified RPC approach
 */

import type { Metadata } from 'next';
import { ContentListServer } from '@/src/components/content-list-server';
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/guides');
}

export default async function GuidesPage() {
  const config = UNIFIED_CATEGORY_REGISTRY.guides;
  const items = await getContentByCategory('guides');

  const badges = config.listPage.badges.map((badge) => {
    const processed: { icon?: string; text: string } = {
      text: typeof badge.text === 'function' ? badge.text(items.length) : badge.text,
    };

    if ('icon' in badge && badge.icon) {
      processed.icon = badge.icon;
    }

    return processed;
  });

  logger.info('Guides page rendered', {
    guideCount: items.length,
  });

  return (
    <ContentListServer
      title={config.pluralTitle}
      description={config.description}
      icon={config.icon.displayName?.toLowerCase() || 'book-open'}
      items={items}
      type="guides"
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
