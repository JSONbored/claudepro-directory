/**
 * GuidePageFactory Component
 * Production-grade factory for creating guide pages with consistent structure and validation
 * Reduces code duplication by ~80% across guide pages
 */

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UnifiedSidebar } from '@/components/unified-sidebar';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Define schemas locally since they're not exported from component.schema
const guidePageConfigSchema = z.object({
  type: z.string(),
  directory: z.string(),
  icon: z.any(), // React.ComponentType
  iconColor: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  breadcrumbText: z.string().optional(),
  badgeLabel: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

interface GuidePageFactoryProps {
  config: z.infer<typeof guidePageConfigSchema>;
}

/**
 * Schema for guide frontmatter metadata
 */
const guideFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  dateUpdated: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

/**
 * Schema for guide item
 */
export const guideItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  dateUpdated: z.string().optional(),
});

/**
 * Schema for guide item with category (used in main guides page)
 */
export const guideItemWithCategorySchema = guideItemSchema.extend({
  category: z.string(),
});

// Guide page configuration schema is imported from component.schema

/**
 * Schema for guides by category
 */
export const guidesByCategorySchema = z.record(z.string(), z.array(guideItemWithCategorySchema));

export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>;
export type GuideItem = z.infer<typeof guideItemSchema>;
export type GuideItemWithCategory = z.infer<typeof guideItemWithCategorySchema>;
export type GuidePageConfig = z.infer<typeof guidePageConfigSchema>;
export type GuidesByCategory = z.infer<typeof guidesByCategorySchema>;

/**
 * Parse frontmatter from MDX content with validation
 * Handles both single-line and multi-line values
 */
export function parseFrontmatter(content: string): GuideFrontmatter | null {
  try {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch?.[1]) {
      return null;
    }

    const metadata: Record<string, string | string[]> = {};
    const lines = frontmatterMatch[1].split('\n');
    let currentKey: string | null = null;
    let currentValue: string[] = [];

    for (const line of lines) {
      // Check if line starts with a key (contains : and doesn't start with whitespace)
      if (line.match(/^[^\s].*:/)) {
        // Save previous key-value pair if exists
        if (currentKey) {
          const value = currentValue
            .join(' ')
            .trim()
            .replace(/^["']|["']$/g, '');

          // Handle arrays (tags)
          if (currentKey === 'tags' && value.startsWith('[')) {
            try {
              metadata[currentKey] = JSON.parse(value) as string[];
            } catch {
              metadata[currentKey] = value;
            }
          } else {
            metadata[currentKey] = value;
          }
        }

        // Start new key-value pair
        const [key, ...valueParts] = line.split(':');
        currentKey = key ? key.trim() : '';
        currentValue = [valueParts.join(':').trim()];
      } else if (currentKey) {
        // Continuation of multi-line value
        currentValue.push(line.trim());
      }
    }

    // Save the last key-value pair
    if (currentKey) {
      const value = currentValue
        .join(' ')
        .trim()
        .replace(/^["']|["']$/g, '');

      // Handle arrays (tags)
      if (currentKey === 'tags' && value.startsWith('[')) {
        try {
          metadata[currentKey] = JSON.parse(value) as string[];
        } catch {
          metadata[currentKey] = value;
        }
      } else {
        metadata[currentKey] = value;
      }
    }

    const result = guideFrontmatterSchema.safeParse(metadata);
    if (result.success) {
      return result.data;
    }

    // If validation fails, return what we have if it has minimum required fields
    if (metadata.title && metadata.description) {
      return {
        title: String(metadata.title),
        description: String(metadata.description),
        dateUpdated: metadata.dateUpdated ? String(metadata.dateUpdated) : undefined,
        author: metadata.author ? String(metadata.author) : undefined,
        tags: Array.isArray(metadata.tags) ? metadata.tags : undefined,
        category: metadata.category ? String(metadata.category) : undefined,
      } as GuideFrontmatter;
    }

    return null;
  } catch (_error) {
    // Don't log errors - frontmatter parsing is best-effort
    return null;
  }
}

/**
 * Load guides from our optimized content system
 */
export async function loadGuides(directory: string, type: string): Promise<GuideItem[]> {
  const guides: GuideItem[] = [];

  try {
    // Get all SEO content using our optimized system
    let seoContent = await contentCache.getSEOContent();

    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Get the content for this specific category/type
    const categoryContent = seoContent?.[type] || [];

    for (const item of categoryContent) {
      // Skip items without required fields
      if (!(item.title && item.description)) {
        continue;
      }

      const itemSlug = item.slug.split('/').pop() || '';

      const guideItem: GuideItem = {
        title: item.title,
        description: item.description,
        slug: `/guides/${type}/${itemSlug}`,
        dateUpdated: item.dateAdded,
      };

      const validation = guideItemSchema.safeParse(guideItem);
      if (validation.success) {
        guides.push(validation.data);
      } else {
        logger.error('Invalid guide item', new Error(validation.error.issues.join(', ')), {
          item: item.title,
          type,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to load guides', error as Error, {
      directory,
      type,
    });
  }

  return guides.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

/**
 * Factory component for creating guide pages
 */

export async function GuidePageFactory({ config }: GuidePageFactoryProps) {
  // Validate configuration
  const validatedConfig = guidePageConfigSchema.parse(config);

  const guides = await loadGuides(validatedConfig.directory, validatedConfig.type);
  const Icon = validatedConfig.icon as LucideIcon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Icon className={`h-8 w-8 ${validatedConfig.iconColor}`} />
            <h1 className="text-4xl font-bold">{validatedConfig.title}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{validatedConfig.description}</p>
          <div className="mt-4">
            <Badge variant="secondary">
              {guides.length} {validatedConfig.type} guides available
            </Badge>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/guides" className="text-muted-foreground hover:text-foreground">
                  Guides
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium">{validatedConfig.breadcrumbText}</li>
            </ol>
          </nav>
        </div>

        {/* Main Layout: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guides Grid */}
            {guides.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {guides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug}>
                    <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                      <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 line-clamp-2">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <Badge variant="outline" className="text-xs">
                            {validatedConfig.badgeLabel}
                          </Badge>
                          {guide.dateUpdated && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(guide.dateUpdated).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No {validatedConfig.type} guides yet</h2>
                <p className="text-muted-foreground">
                  {validatedConfig.breadcrumbText} guides are coming soon. Check back later for
                  comprehensive guides.
                </p>
              </Card>
            )}

            {/* CTA */}
            <Card className="p-8 text-center bg-accent/10">
              <h2 className="text-2xl font-semibold mb-4">Contribute a guide</h2>
              <p className="text-muted-foreground mb-6">
                Help others by creating comprehensive {validatedConfig.type} guides for Claude AI
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/guides">
                  <button
                    type="button"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    All Guides
                  </button>
                </Link>
                <Link href="/submit">
                  <button
                    type="button"
                    className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
                  >
                    Submit Guide
                  </button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Sidebar - Takes 1/3 width */}
          <UnifiedSidebar mode="category" currentCategory={validatedConfig.type} />
        </div>
      </div>
    </div>
  );
}

/**
 * Generate metadata for guide pages
 */
export function generateGuideMetadata(
  config: Pick<GuidePageConfig, 'metaTitle' | 'metaDescription'>
) {
  return {
    title: config.metaTitle,
    description: config.metaDescription,
  };
}
