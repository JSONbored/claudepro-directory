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
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR Configuration - 5 minutes like other category pages
export const revalidate = 300;

/**
 * Page metadata
 */
export const metadata: Metadata = await generatePageMetadata('/guides');

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
          // IMPORTANT: Use guide subcategory as category (tutorials, workflows, etc.)
          // This allows proper URL construction via getContentItemUrl() helper
          // URLs: /guides/[category]/[slug] where category is the guide subcategory
          guides.push({
            title: frontmatter.title || filename,
            description: frontmatter.description || '',
            slug: filename, // Just the filename, not the full path
            category: category as ContentCategory, // Use subcategory as category (tutorials, workflows, etc.)
            author: frontmatter.author || 'ClaudePro Directory',
            tags: [
              category.replace('-', ' '),
              ...(frontmatter.difficulty ? [frontmatter.difficulty] : []),
              ...(frontmatter.keywords || []),
            ].filter(Boolean),
            source: 'official',
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

  // Enrich with view counts from Redis
  const guides = await statsRedis.enrichWithViewCounts(guidesData);

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

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="guides-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </>
  );
}
