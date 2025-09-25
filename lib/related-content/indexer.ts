/**
 * Content Indexing Service
 * Builds searchable index from all content at build time
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import type { ContentCategory, ContentIndex, ContentItem } from './types';

const CONTENT_DIRECTORIES = {
  // Main content
  agents: 'content/agents',
  mcp: 'content/mcp',
  rules: 'content/rules',
  commands: 'content/commands',
  hooks: 'content/hooks',

  // SEO content
  tutorials: 'seo/tutorials',
  comparisons: 'seo/comparisons',
  workflows: 'seo/workflows',
  'use-cases': 'seo/use-cases',
  troubleshooting: 'seo/troubleshooting',
};

export class ContentIndexer {
  /**
   * Build complete content index
   */
  async buildIndex(): Promise<ContentIndex> {
    const items: ContentItem[] = [];
    const categories: Record<ContentCategory, ContentItem[]> = {} as any;
    const tags: Record<string, ContentItem[]> = {};
    const keywords: Record<string, ContentItem[]> = {};

    // Process each content directory
    for (const [category, dirPath] of Object.entries(CONTENT_DIRECTORIES)) {
      const categoryItems = await this.indexDirectory(category as ContentCategory, dirPath);

      items.push(...categoryItems);
      categories[category as ContentCategory] = categoryItems;

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
      metadata: {
        totalItems: items.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      },
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
      console.warn(`Failed to index directory ${dirPath}:`, error);
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
      } else if (fileName.endsWith('.mdx')) {
        return this.processMdxFile(category, slug, content);
      }
    } catch (error) {
      console.warn(`Failed to process file ${fileName}:`, error);
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
        tags: data.tags || [],
        keywords: data.keywords || [],
        url: this.generateUrl(category, slug),
        dateUpdated: data.dateUpdated,
        featured: data.featured || false,
      };
    } catch (error) {
      console.warn(`Failed to parse JSON for ${slug}:`, error);
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
        tags: this.parseArrayField(data.tags),
        keywords: this.parseArrayField(data.keywords),
        url: this.generateUrl(category, slug),
        dateUpdated: data.dateUpdated,
        featured: data.featured || false,
      };
    } catch (error) {
      console.warn(`Failed to parse MDX for ${slug}:`, error);
      return null;
    }
  }

  /**
   * Parse array field from frontmatter
   */
  private parseArrayField(field: any): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') return field.split(',').map((s) => s.trim());
    return [];
  }

  /**
   * Generate URL for content item
   */
  private generateUrl(category: ContentCategory, slug: string): string {
    // Map categories to URL paths
    const urlPaths: Record<ContentCategory, string> = {
      agents: '/agents',
      mcp: '/mcp',
      rules: '/rules',
      commands: '/commands',
      hooks: '/hooks',
      tutorials: '/guides/tutorials',
      comparisons: '/guides/comparisons',
      workflows: '/guides/workflows',
      'use-cases': '/guides/use-cases',
      troubleshooting: '/guides/troubleshooting',
    };

    return `${urlPaths[category]}/${slug}`;
  }

  /**
   * Save index to file system
   */
  async saveIndex(index: ContentIndex): Promise<void> {
    const outputPath = path.join(process.cwd(), 'generated', 'content-index.json');

    await fs.writeFile(outputPath, JSON.stringify(index, null, 2), 'utf-8');
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
      console.warn('Failed to load content index:', error);
      return null;
    }
  }
}

// Export singleton instance
export const contentIndexer = new ContentIndexer();
