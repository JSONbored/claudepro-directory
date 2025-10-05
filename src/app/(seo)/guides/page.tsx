import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { EnhancedGuidesPage } from '@/src/components/enhanced-guides-page';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import {
  type GuideItemWithCategory,
  type GuidesByCategory,
  guideItemWithCategorySchema,
  parseFrontmatter,
} from '@/src/lib/utils/guide-helpers';

export const metadata = await generatePageMetadata('/guides');

// Enable ISR - revalidate every 5 minutes for fresh view counts
export const revalidate = 300;

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
 * Load and validate guides from all categories
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

  for (const category of categories) {
    guides[category] = [];

    try {
      const dir = path.join(process.cwd(), 'content', 'guides', category);
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          try {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const metadata = parseFrontmatter(content);

            const guideItem: GuideItemWithCategory = {
              title: metadata?.title || file.replace('.mdx', ''),
              description: metadata?.description || '',
              slug: `/guides/${category}/${file.replace('.mdx', '')}`,
              category,
              dateUpdated: metadata?.dateUpdated || '',
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
                  file,
                  category,
                }
              );
            }
          } catch (fileError) {
            logger.error('Failed to process guide file', fileError as Error, {
              file,
              category,
            });
          }
        }
      }
    } catch (dirError) {
      // Directory doesn't exist - this is acceptable
      logger.warn('Guide directory not found', {
        category,
        error: String(dirError),
      });
    }
  }

  return guides;
}

export default async function GuidesPage() {
  const guides = await getGuides();

  // Enrich all guides with view counts from Redis
  const enrichedGuides: GuidesByCategory = {};

  for (const [category, categoryGuides] of Object.entries(guides)) {
    // Map guide slugs to Redis format: remove /guides/ prefix
    const guidesForEnrichment = categoryGuides.map((guide) => ({
      ...guide,
      category: 'guides' as const,
      slug: guide.slug.replace('/guides/', ''), // e.g., "tutorials/desktop-mcp-setup"
    }));

    // Batch fetch view counts
    const enriched = await statsRedis.enrichWithViewCounts(guidesForEnrichment);

    // Restore original category field and slug format
    enrichedGuides[category] = enriched.map((guide, index) => ({
      ...guide,
      category,
      slug: categoryGuides[index]?.slug || guide.slug,
    }));
  }

  return <EnhancedGuidesPage guides={enrichedGuides} />;
}
