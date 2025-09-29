import { z } from 'zod';
import { logger } from '../logger';
import type { UnifiedContentItem } from '../schemas/components';
import { githubContentService } from './github-content.service';

export const frontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateUpdated: z.string().optional(),
  author: z.string().optional(),
  version: z.string().optional(),
  featured: z.boolean().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export interface ContentByCategory {
  [category: string]: UnifiedContentItem[];
}

export function parseFrontmatter(content: string): Frontmatter | null {
  try {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch?.[1]) return null;

    const frontmatterText = frontmatterMatch[1];
    const frontmatterObject: Record<string, unknown> = {};

    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      } else if (value === 'true' || value === 'false') {
        frontmatterObject[key] = value === 'true';
        continue;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          frontmatterObject[key] = JSON.parse(value);
          continue;
        } catch {
          // Fall back to string parsing
        }
      }

      frontmatterObject[key] = value;
    }

    const parsed = frontmatterSchema.safeParse(frontmatterObject);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    logger.error('Failed to parse frontmatter', error as Error);
    return null;
  }
}

class ContentProcessor {
  private cache = new Map<string, ContentByCategory>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  private isValidCache(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    return timestamp ? Date.now() - timestamp < this.cacheTimeout : false;
  }

  private setCacheEntry(key: string, data: ContentByCategory): void {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  async getContentDirectory(directoryPath: string): Promise<UnifiedContentItem[]> {
    try {
      const files = await githubContentService.getDirectoryContents(directoryPath);
      const contentItems: UnifiedContentItem[] = [];

      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.mdx')) {
          try {
            const content = await githubContentService.getFileContent(file.path);
            const frontmatter = parseFrontmatter(content);

            if (frontmatter) {
              const slug = `/${directoryPath}/${file.name.replace('.mdx', '')}`;
              const categoryFromPath = directoryPath.split('/').pop() || 'uncategorized';

              const contentItem: UnifiedContentItem = {
                slug,
                description: frontmatter.description,
                category: (frontmatter.category ||
                  categoryFromPath) as UnifiedContentItem['category'],
                author: frontmatter.author || 'Claude Pro Community',
                dateAdded: frontmatter.dateUpdated || new Date().toISOString(),
                tags: frontmatter.tags || [],
                title: frontmatter.title,
                name: frontmatter.title,
                source: 'community',
                featured: frontmatter.featured,
                difficulty: frontmatter.difficulty || 'intermediate',
                features: [],
                useCases: [],
                requirements: [],
                examples: [],
                keywords: [],
                ...(frontmatter.version && { version: frontmatter.version }),
              };

              contentItems.push(contentItem);
            }
          } catch (fileError) {
            logger.error('Failed to process content file', fileError as Error, {
              file: file.name,
              path: directoryPath,
            });
          }
        }
      }

      return contentItems;
    } catch (error) {
      logger.error(`Failed to get content directory: ${directoryPath}`, error as Error);
      return [];
    }
  }

  async getContentCategories(basePath: string, categories: string[]): Promise<ContentByCategory> {
    const cacheKey = `${basePath}:${categories.join(',')}`;

    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) || {};
    }

    const contentByCategory: ContentByCategory = {};

    for (const category of categories) {
      const categoryPath = `${basePath}/${category}`;
      contentByCategory[category] = await this.getContentDirectory(categoryPath);
    }

    this.setCacheEntry(cacheKey, contentByCategory);
    return contentByCategory;
  }

  async getSEOContent(): Promise<ContentByCategory> {
    const seoCategories = [
      'use-cases',
      'tutorials',
      'collections',
      'categories',
      'workflows',
      'comparisons',
      'troubleshooting',
    ];

    return this.getContentCategories('seo', seoCategories);
  }

  async getMainContent(): Promise<ContentByCategory> {
    const mainCategories = ['agents', 'commands', 'hooks', 'mcp', 'rules'];
    return this.getContentCategories('content', mainCategories);
  }

  async getAllContent(): Promise<ContentByCategory> {
    try {
      const [seoContent, mainContent] = await Promise.all([
        this.getSEOContent(),
        this.getMainContent(),
      ]);

      return { ...seoContent, ...mainContent };
    } catch (error) {
      logger.error('Failed to get all content', error as Error);
      return {};
    }
  }

  async getContentByCategory(category: string): Promise<UnifiedContentItem[]> {
    try {
      if (['agents', 'commands', 'hooks', 'mcp', 'rules'].includes(category)) {
        return this.getContentDirectory(`content/${category}`);
      }

      if (
        [
          'use-cases',
          'tutorials',
          'collections',
          'categories',
          'workflows',
          'comparisons',
          'troubleshooting',
        ].includes(category)
      ) {
        return this.getContentDirectory(`seo/${category}`);
      }

      logger.warn(`Unknown content category: ${category}`);
      return [];
    } catch (error) {
      logger.error(`Failed to get content for category: ${category}`, error as Error);
      return [];
    }
  }

  async getContentItemBySlug(category: string, slug: string): Promise<UnifiedContentItem | null> {
    try {
      // Get all items in the category
      const items = await this.getContentByCategory(category);

      // Find the specific item by slug
      const item = items.find((i) => i.slug === slug || i.slug.endsWith(`/${slug}`));

      return item || null;
    } catch (error) {
      logger.error(`Failed to get content item by slug: ${category}/${slug}`, error as Error);
      return null;
    }
  }

  async getFullContentBySlug(category: string, slug: string): Promise<unknown> {
    try {
      // Determine the base path based on category
      let basePath = '';
      if (['agents', 'commands', 'hooks', 'mcp', 'rules'].includes(category)) {
        basePath = `content/${category}`;
      } else if (
        [
          'use-cases',
          'tutorials',
          'collections',
          'categories',
          'workflows',
          'comparisons',
          'troubleshooting',
        ].includes(category)
      ) {
        basePath = `seo/${category}`;
      } else {
        throw new Error(`Unknown category: ${category}`);
      }

      // Fetch the full content from GitHub
      const content = await githubContentService.getFileContent(`${basePath}/${slug}.json`);

      // Parse and validate JSON content
      const parsed = JSON.parse(content);

      // Basic validation to ensure it's an object with expected shape
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error(`Invalid content format for ${category}/${slug}`);
      }

      return parsed;
    } catch (error) {
      // Try with .mdx extension for SEO content
      try {
        if (
          [
            'use-cases',
            'tutorials',
            'collections',
            'categories',
            'workflows',
            'comparisons',
            'troubleshooting',
          ].includes(category)
        ) {
          const content = await githubContentService.getFileContent(`seo/${category}/${slug}.mdx`);
          return content; // Return raw MDX content as string
        }
      } catch {
        // Fall through to error handling
      }

      logger.error(`Failed to get full content by slug: ${category}/${slug}`, error as Error);
      throw error;
    }
  }

  async getComparisonContent(slug: string): Promise<string | null> {
    try {
      // Fetch comparison MDX content from GitHub
      const content = await githubContentService.getFileContent(`seo/comparisons/${slug}.mdx`);
      return content;
    } catch (error) {
      logger.error(`Failed to get comparison content: ${slug}`, error as Error);
      return null;
    }
  }

  async getAllCategories(): Promise<{
    agents: UnifiedContentItem[];
    mcp: UnifiedContentItem[];
    rules: UnifiedContentItem[];
    commands: UnifiedContentItem[];
    hooks: UnifiedContentItem[];
  }> {
    const [agents, mcp, rules, commands, hooks] = await Promise.all([
      this.getContentByCategory('agents'),
      this.getContentByCategory('mcp'),
      this.getContentByCategory('rules'),
      this.getContentByCategory('commands'),
      this.getContentByCategory('hooks'),
    ]);

    return {
      agents: agents || [],
      mcp: mcp || [],
      rules: rules || [],
      commands: commands || [],
      hooks: hooks || [],
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const contentProcessor = new ContentProcessor();
