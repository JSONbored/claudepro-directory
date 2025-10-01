import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { EnhancedGuidesPage } from '@/components/enhanced-guides-page';
import {
  type GuideItemWithCategory,
  type GuidesByCategory,
  guideItemWithCategorySchema,
  parseFrontmatter,
} from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';

export const metadata = {
  title: `Claude Guides & Tutorials - ${APP_CONFIG.name}`,
  description:
    'Comprehensive guides, tutorials, and workflows for Claude AI. Learn how to use MCP servers, agents, and more.',
  alternates: {
    canonical: `${APP_CONFIG.url}/guides`,
  },
};

// Enable ISR - revalidate every 4 hours for guide list pages
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

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
  return <EnhancedGuidesPage guides={guides} />;
}
