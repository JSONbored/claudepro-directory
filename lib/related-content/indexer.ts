/**
 * Content Indexing Service
 * Builds searchable index from all content at build time
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import { CONTENT_PATHS, MAIN_CONTENT_CATEGORIES } from '@/lib/constants';
import { logger } from '../logger';
import { basicErrorSchema } from '../schemas/error.schema';
import { logContextSchema } from '../schemas/logger.schema';
import type { ContentCategory } from '../schemas/shared.schema';
import type { CategorizedContentIndex, ContentIndex, ContentItem } from './service';

const CONTENT_DIRECTORIES = {
  // Main content (JSON files)
  agents: CONTENT_PATHS.agents,
  mcp: CONTENT_PATHS.mcp,
  rules: CONTENT_PATHS.rules,
  commands: CONTENT_PATHS.commands,
  hooks: CONTENT_PATHS.hooks,

  // Guide content (MDX files)
  tutorials: CONTENT_PATHS.tutorials,
  comparisons: CONTENT_PATHS.comparisons,
  workflows: CONTENT_PATHS.workflows,
  'use-cases': CONTENT_PATHS['use-cases'],
  troubleshooting: CONTENT_PATHS.troubleshooting,
};

export class ContentIndexer {
  /**
   * Build complete content index
   */
  async buildIndex(): Promise<ContentIndex> {
    const items: ContentItem[] = [];
    // Initialize all possible categories with empty arrays
    const categories: Record<ContentCategory, ContentItem[]> = {
      agents: [],
      mcp: [],
      rules: [],
      commands: [],
      hooks: [],
      guides: [],
      jobs: [],
      tutorials: [],
      comparisons: [],
      workflows: [],
      'use-cases': [],
      troubleshooting: [],
      categories: [],
      collections: [],
    };
    const tags: Record<string, ContentItem[]> = {};
    const keywords: Record<string, ContentItem[]> = {};

    // Process each content directory
    for (const [category, dirPath] of Object.entries(CONTENT_DIRECTORIES)) {
      const categoryItems = await this.indexDirectory(category as ContentCategory, dirPath);

      items.push(...categoryItems);
      categories[category as ContentCategory].push(...categoryItems);

      // Build tag and keyword indexes
      for (const item of categoryItems) {
        // Index tags
        if (item.tags) {
          for (const tag of item.tags) {
            if (!tags[tag]) tags[tag] = [];
            tags[tag].push(item);
          }
        }

        // Index keywords
        if (item.keywords) {
          for (const keyword of item.keywords) {
            if (!keywords[keyword]) keywords[keyword] = [];
            keywords[keyword].push(item);
          }
        }
      }
    }

    return {
      items,
      categories,
      tags,
      keywords,
      generated: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Index a single directory
   */
  private async indexDirectory(category: ContentCategory, dirPath: string): Promise<ContentItem[]> {
    const items: ContentItem[] = [];
    const fullPath = path.join(process.cwd(), dirPath);

    try {
      const files = await fs.readdir(fullPath);

      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.mdx')) {
          const item = await this.processFile(category, fullPath, file);
          if (item) items.push(item);
        }
      }
    } catch (error) {
      const errorData = basicErrorSchema.parse({
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
      });

      const context = logContextSchema.parse({
        dirPath,
        operation: 'indexDirectory',
        errorName: errorData.name,
      });

      logger.warn(`Failed to index directory ${dirPath}`, context);
    }

    return items;
  }

  /**
   * Process a single content file
   */
  private async processFile(
    category: ContentCategory,
    dirPath: string,
    fileName: string
  ): Promise<ContentItem | null> {
    const filePath = path.join(dirPath, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const slug = fileName.replace(/\.(json|mdx)$/, '');

      if (fileName.endsWith('.json')) {
        return this.processJsonFile(category, slug, content);
      }
      if (fileName.endsWith('.mdx')) {
        return this.processMdxFile(category, slug, content);
      }
    } catch (error) {
      const errorData = basicErrorSchema.parse({
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
      });

      const context = logContextSchema.parse({
        fileName,
        category,
        operation: 'processFile',
        errorName: errorData.name,
      });

      logger.warn(`Failed to process file ${fileName}`, context);
    }

    return null;
  }

  /**
   * Process JSON content file
   */
  private processJsonFile(
    category: ContentCategory,
    slug: string,
    content: string
  ): ContentItem | null {
    try {
      const data = JSON.parse(content);

      return {
        slug,
        title: data.title || data.name || slug,
        description: data.description || '',
        category,
        author: data.author || 'Community',
        dateAdded: data.dateUpdated || data.dateAdded || new Date().toISOString(),
        tags: data.tags || [],
        featured: data.featured ?? false,
      };
    } catch (error) {
      const errorData = basicErrorSchema.parse({
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
      });

      const context = logContextSchema.parse({
        slug,
        category,
        operation: 'parseJsonFile',
        errorName: errorData.name,
      });

      logger.warn(`Failed to parse JSON for ${slug}`, context);
      return null;
    }
  }

  /**
   * Process MDX content file
   */
  private processMdxFile(
    category: ContentCategory,
    slug: string,
    content: string
  ): ContentItem | null {
    try {
      const { data } = matter(content);

      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        category,
        author: data.author || 'Community',
        dateAdded: data.dateUpdated || data.dateAdded || new Date().toISOString(),
        tags: this.parseArrayField(data.tags),
        featured: data.featured ?? false,
      };
    } catch (error) {
      const errorData = basicErrorSchema.parse({
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
      });

      const context = logContextSchema.parse({
        slug,
        category,
        operation: 'parseMdxFile',
        errorName: errorData.name,
      });

      logger.warn(`Failed to parse MDX for ${slug}`, context);
      return null;
    }
  }

  /**
   * Parse array field from frontmatter
   */
  private parseArrayField(field: string | string[] | null | undefined): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') return field.split(',').map((s) => s.trim());
    return [];
  }

  /**
   * Save index to file system
   */
  async saveIndex(index: ContentIndex): Promise<void> {
    const outputPath = path.join(process.cwd(), 'generated', 'content-index.json');

    await fs.writeFile(outputPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Save split index files by category for better performance
   * This reduces the monolithic 526KB file into smaller, category-specific files
   * CONSOLIDATION: Accepts both ContentIndex and CategorizedContentIndex for flexibility
   */
  async saveSplitIndex(index: ContentIndex | CategorizedContentIndex): Promise<void> {
    const generatedDir = path.join(process.cwd(), 'generated');

    // CONSOLIDATION: Transform flat items into categorized structure if needed
    let categories: Record<string, ContentItem[]>;
    if ('categories' in index && index.categories) {
      categories = index.categories as Record<string, ContentItem[]>;
    } else {
      // Transform flat items array into categorized structure
      categories = index.items.reduce(
        (acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category]?.push(item);
          return acc;
        },
        {} as Record<string, ContentItem[]>
      );
    }

    // CONSOLIDATION: Use centralized category constants instead of hardcoded list
    const mainCategories = MAIN_CONTENT_CATEGORIES;

    // Save category-specific index files
    const savePromises = mainCategories.map(async (category) => {
      const categoryItems = categories[category] || [];
      const categoryIndex = {
        items: categoryItems,
        category,
        count: categoryItems.length,
        generated: index.generated,
        version: index.version,
      };

      const outputPath = path.join(generatedDir, `content-index-${category}.json`);
      await fs.writeFile(outputPath, JSON.stringify(categoryIndex, null, 2), 'utf-8');

      logger.info(`Generated ${category} index: ${categoryItems.length} items`, {
        category,
        count: categoryItems.length,
        filePath: outputPath,
      });
    });

    // Save remaining categories in a single "other" file
    const otherCategories = Object.keys(categories).filter(
      (cat) => !mainCategories.includes(cat as (typeof mainCategories)[number])
    );

    const otherItems = otherCategories.flatMap((cat) => categories[cat as ContentCategory] || []);
    if (otherItems.length > 0) {
      const otherIndex = {
        items: otherItems,
        categories: otherCategories,
        count: otherItems.length,
        generated: index.generated,
        version: index.version,
      };

      const otherPath = path.join(generatedDir, 'content-index-other.json');
      savePromises.push(fs.writeFile(otherPath, JSON.stringify(otherIndex, null, 2), 'utf-8'));
    }

    // Save a lightweight summary index for quick navigation
    const summaryIndex = {
      categories: Object.keys(categories).map((category) => ({
        category,
        count: categories[category as ContentCategory]?.length || 0,
      })),
      totalItems: index.items.length,
      generated: index.generated,
      version: index.version,
    };

    const summaryPath = path.join(generatedDir, 'content-index-summary.json');
    savePromises.push(fs.writeFile(summaryPath, JSON.stringify(summaryIndex, null, 2), 'utf-8'));

    // Execute all saves in parallel
    await Promise.all(savePromises);

    logger.info('Split content index generation completed', {
      totalFiles: savePromises.length,
      mainCategories: mainCategories.length,
      otherCategories: otherCategories.length,
    });
  }

  /**
   * Load index from file system
   */
  async loadIndex(): Promise<ContentIndex | null> {
    const indexPath = path.join(process.cwd(), 'generated', 'content-index.json');

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      const errorData = basicErrorSchema.parse({
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
      });

      const context = logContextSchema.parse({
        indexPath,
        operation: 'loadIndex',
        errorName: errorData.name,
      });

      logger.warn('Failed to load content index', context);
      return null;
    }
  }
}

// Export singleton instance
export const contentIndexer = new ContentIndexer();
