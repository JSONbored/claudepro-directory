import { z } from 'zod';
import { ContentErrorBoundary } from '@/components/content-error-boundary';
import { EnhancedGuidesPage } from '@/components/enhanced-guides-page';
import {
  type GuideItemWithCategory,
  type GuidesByCategory,
  guideItemWithCategorySchema,
} from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

export const metadata = {
  title: `Claude Guides & Tutorials - ${APP_CONFIG.name}`,
  description:
    'Comprehensive guides, tutorials, and workflows for Claude AI. Learn how to use MCP servers, agents, and more.',
};

// Enable ISR - revalidate every 4 hours for guide list pages
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

/**
 * Schema for valid guide categories
 */
const guideCategoriesSchema = z.enum([
  'use-cases',
  'tutorials',
  'collections',
  'categories',
  'workflows',
  'comparisons',
  'troubleshooting',
]);

type GuideCategory = z.infer<typeof guideCategoriesSchema>;

/**
 * Load and validate guides from all categories using GitHub API
 */
async function getGuides(): Promise<GuidesByCategory> {
  const categories: GuideCategory[] = [
    'use-cases',
    'tutorials',
    'collections',
    'categories',
    'workflows',
    'comparisons',
    'troubleshooting',
  ];

  const guides: GuidesByCategory = {};

  try {
    // Try cache first
    let seoContent = await contentCache.getSEOContent();

    // Fetch from GitHub API if cache miss
    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();

      // Cache the result
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Convert UnifiedContentItem[] to GuideItemWithCategory[] for each category
    for (const category of categories) {
      guides[category] = [];

      const categoryContent = seoContent?.[category] || [];

      for (const item of categoryContent) {
        // Skip items without required fields
        if (!(item.title && item.description)) {
          continue;
        }

        const slugParts = item.slug.split('/');
        const fileName =
          slugParts[slugParts.length - 1] || item.title.toLowerCase().replace(/\s+/g, '-');

        const guideItem: GuideItemWithCategory = {
          title: item.title,
          description: item.description,
          slug: `/guides/${category}/${fileName}`,
          category,
          dateUpdated: item.dateAdded,
        };

        // Validate the guide item with Zod
        const validatedGuide = guideItemWithCategorySchema.safeParse(guideItem);

        if (validatedGuide.success) {
          guides[category].push(validatedGuide.data);
        } else {
          logger.error(
            'Invalid guide item structure',
            new Error(validatedGuide.error.issues.join(', ')),
            {
              item: item.title,
              category,
            }
          );
        }
      }
    }

    return guides;
  } catch (error) {
    logger.error('Failed to fetch guides content', error as Error);
    return {};
  }
}

export default async function GuidesPage() {
  const guides = await getGuides();
  return (
    <ContentErrorBoundary>
      <EnhancedGuidesPage guides={guides} />
    </ContentErrorBoundary>
  );
}
