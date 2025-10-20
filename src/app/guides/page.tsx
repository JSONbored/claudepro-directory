/**
 * Guides Index Page
 *
 * Unified guides listing page following the same pattern as category pages.
 * Uses ContentListServer for consistent search, filtering, and card display.
 */

import fs from 'fs/promises';
import type { Metadata } from 'next';
import path from 'path';
import { ContentListServer } from '@/src/components/content-list-server';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

/**
 * ISR Configuration - Guides listing page
 * Documentation content updates occasionally - revalidate every 30 minutes
 */
export const revalidate = 1800;

/**
 * Page metadata
 */
export const metadata: Metadata = generatePageMetadata('/guides');

/**
 * Guide categories
 */
const GUIDE_CATEGORIES = [
  'tutorials',
  'use-cases',
  'workflows',
  'troubleshooting',
  'comparisons',
] as const;

/**
 * Load all guides and transform to UnifiedContentItem format
 */
async function getAllGuides(): Promise<UnifiedContentItem[]> {
  const guides: UnifiedContentItem[] = [];
  const guidesDir = path.join(process.cwd(), 'content', 'guides');

  try {
    for (const category of GUIDE_CATEGORIES) {
      const categoryPath = path.join(guidesDir, category);

      try {
        const files = await fs.readdir(categoryPath);

        for (const file of files) {
          if (!file.endsWith('.mdx')) continue;

          const filePath = path.join(categoryPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { frontmatter } = parseMDXFrontmatter(content);

          const filename = file.replace('.mdx', '');

          // Transform to UnifiedContentItem format
          // IMPORTANT: Set category='guides' with subcategory field
          // This allows proper URL construction via getContentItemUrl() helper
          // URLs: /guides/{subcategory}/{slug} where subcategory is tutorials, comparisons, etc.
          //
          // CRITICAL: slug must include subcategory prefix for Redis key matching
          // Redis keys: views:guides:{category}/{slug}
          // Example: views:guides:tutorials/desktop-mcp-setup
          guides.push({
            title: frontmatter.title || filename,
            description: frontmatter.description || '',
            slug: `${category}/${filename}`, // Include subcategory for Redis key matching
            category: 'guides' as CategoryId, // Always 'guides' for parent category
            subcategory: category as
              | 'tutorials'
              | 'comparisons'
              | 'workflows'
              | 'use-cases'
              | 'troubleshooting', // Actual subcategory
            author: frontmatter.author || 'ClaudePro Directory',
            tags: [
              category.replace('-', ' '),
              ...(frontmatter.difficulty ? [frontmatter.difficulty] : []),
              ...(frontmatter.keywords || []),
            ].filter(Boolean),
            source: 'community',
            popularity: 85, // Default popularity for guides
          });
        }
      } catch (categoryError) {
        logger.warn(`Failed to load guides from category: ${category}`, {
          error: categoryError instanceof Error ? categoryError.message : String(categoryError),
        });
      }
    }

    logger.info('Loaded guides', { count: guides.length });
    return guides;
  } catch (error) {
    logger.error(
      'Failed to load guides',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Guides Index Page
 */
export default async function GuidesPage() {
  // Load all guides
  const guidesData = await getAllGuides();

  // OPTIMIZATION: Removed server-side Redis enrichment
  // View counts will be loaded client-side via cached API
  const guides = guidesData.map((guide) => ({
    ...guide,
    viewCount: 0, // Will be loaded client-side
    copyCount: 0, // Will be loaded client-side
  }));

  logger.info('Guides page rendered', {
    guideCount: guides.length,
  });

  return (
    <>
      <ContentListServer
        title="Guides"
        description="Comprehensive guides, tutorials, and best practices for getting the most out of Claude and MCP servers"
        icon="book-open"
        items={guides}
        type="guides"
        searchPlaceholder="Search guides..."
        badges={[
          { icon: 'book-open', text: `${guides.length} Guides Available` },
          { text: 'Production Ready' },
          { text: 'Community Driven' },
        ]}
      />
      {/* Newsletter CTA already included in ContentListServer component */}
    </>
  );
}
