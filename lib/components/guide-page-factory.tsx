/**
 * GuidePageFactory Component
 * Production-grade factory for creating guide pages with consistent structure and validation
 * Reduces code duplication by ~80% across guide pages
 */

import fs from 'fs/promises';
import Link from 'next/link';
import path from 'path';
import { z } from 'zod';
import { UnifiedSidebar } from '@/components/layout/sidebar/unified-sidebar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from '@/lib/icons';
import { logger } from '@/lib/logger';
import { UI_CLASSES } from '@/lib/ui-constants';

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
 * Load guides from directory with validation
 */
export async function loadGuides(directory: string, type: string): Promise<GuideItem[]> {
  const guides: GuideItem[] = [];

  try {
    const dir = path.join(process.cwd(), directory);
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (file.endsWith('.mdx')) {
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const metadata = parseFrontmatter(content);

          const guideItem: GuideItem = {
            title: metadata?.title || file.replace('.mdx', ''),
            description: metadata?.description || '',
            slug: `/guides/${type}/${file.replace('.mdx', '')}`,
            dateUpdated: metadata?.dateUpdated || '',
          };

          const validation = guideItemSchema.safeParse(guideItem);
          if (validation.success) {
            guides.push(validation.data);
          } else {
            logger.error('Invalid guide item', new Error(validation.error.issues.join(', ')), {
              file,
              directory,
            });
          }
        } catch (fileError) {
          logger.error('Failed to process guide file', fileError as Error, {
            file,
            directory,
          });
        }
      }
    }
  } catch (dirError) {
    // Directory doesn't exist - this is acceptable
    logger.warn('Guide directory not found', {
      directory,
      error: String(dirError),
    });
  }

  return guides.sort((a, b) => a.title.localeCompare(b.title));
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
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={UI_CLASSES.MB_8}>
          <div className={`${UI_CLASSES.FLEX} items-center ${UI_CLASSES.GAP_3} ${UI_CLASSES.MB_4}`}>
            <Icon className={`h-8 w-8 ${validatedConfig.iconColor}`} />
            <h1 className="text-4xl font-bold">{validatedConfig.title}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{validatedConfig.description}</p>
          <div className={UI_CLASSES.MT_4}>
            <Badge variant="secondary">
              {guides.length} {validatedConfig.type} guides available
            </Badge>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className={UI_CLASSES.MB_6}>
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
        <div className={`${UI_CLASSES.GRID} grid-cols-1 lg:grid-cols-3 ${UI_CLASSES.GAP_8}`}>
          {/* Main Content - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guides Grid */}
            {guides.length > 0 ? (
              <div
                className={`${UI_CLASSES.GRID} ${UI_CLASSES.GAP_6} md:grid-cols-2 lg:grid-cols-2`}
              >
                {guides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug}>
                    <Card
                      className={`${UI_CLASSES.P_6} h-full ${UI_CLASSES.HOVER_BG_ACCENT_10} ${UI_CLASSES.TRANSITION_COLORS}`}
                    >
                      <div className={`${UI_CLASSES.FLEX_COL} h-full`}>
                        <h3
                          className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2} ${UI_CLASSES.LINE_CLAMP_2}`}
                        >
                          {guide.title}
                        </h3>
                        <p
                          className={`${UI_CLASSES.TEXT_SM} text-muted-foreground ${UI_CLASSES.MB_4} ${UI_CLASSES.LINE_CLAMP_3} ${UI_CLASSES.FLEX_GROW}`}
                        >
                          {guide.description}
                        </p>
                        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mt-auto`}>
                          <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
                            {validatedConfig.badgeLabel}
                          </Badge>
                          {guide.dateUpdated && (
                            <span className={UI_CLASSES.TEXT_XS_MUTED}>
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
              <Card className={`${UI_CLASSES.P_8} text-center`}>
                <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className={`text-xl ${UI_CLASSES.FONT_SEMIBOLD} mb-2`}>
                  No {validatedConfig.type} guides yet
                </h2>
                <p className="text-muted-foreground">
                  {validatedConfig.breadcrumbText} guides are coming soon. Check back later for
                  comprehensive guides.
                </p>
              </Card>
            )}

            {/* CTA */}
            <Card className={`${UI_CLASSES.P_8} text-center bg-accent/10`}>
              <h2 className={`text-2xl ${UI_CLASSES.FONT_SEMIBOLD} mb-4`}>Contribute a guide</h2>
              <p className="text-muted-foreground mb-6">
                Help others by creating comprehensive {validatedConfig.type} guides for Claude AI
              </p>
              <div
                className={`${UI_CLASSES.FLEX} ${UI_CLASSES.GAP_4} ${UI_CLASSES.JUSTIFY_CENTER}`}
              >
                <Link href="/guides">
                  <button
                    type="button"
                    className={`${UI_CLASSES.PX_6} ${UI_CLASSES.PY_2} bg-primary text-primary-foreground ${UI_CLASSES.ROUNDED_LG} hover:bg-primary/90`}
                  >
                    All Guides
                  </button>
                </Link>
                <Link href="/submit">
                  <button
                    type="button"
                    className={`${UI_CLASSES.PX_6} ${UI_CLASSES.PY_2} border border-border ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.HOVER_BG_ACCENT}`}
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
