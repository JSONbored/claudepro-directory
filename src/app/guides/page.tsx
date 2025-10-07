/**
 * Guides Index Page
 *
 * Displays all available guides organized by category.
 * Lists tutorials, use cases, workflows, troubleshooting, and comparisons.
 */

import fs from 'fs/promises';
import type { Metadata } from 'next';
import Link from 'next/link';
import path from 'path';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { BookOpen, ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR Configuration
export const revalidate = 3600; // Revalidate every hour

/**
 * Page metadata
 */
export const metadata: Metadata = await generatePageMetadata('/guides');

/**
 * Guide metadata extracted from frontmatter
 */
interface GuideMetadata {
  title: string;
  description: string;
  category: string;
  slug: string;
  difficulty?: string;
  readingTime?: string;
}

/**
 * Category display configuration
 */
const CATEGORIES = [
  {
    slug: 'tutorials',
    title: 'Tutorials',
    description: 'Step-by-step guides to get started and master Claude features',
    icon: '📚',
  },
  {
    slug: 'use-cases',
    title: 'Use Cases',
    description: 'Industry-specific guides and real-world applications',
    icon: '💼',
  },
  {
    slug: 'workflows',
    title: 'Workflows',
    description: 'Optimized workflows and best practices',
    icon: '⚡',
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: '🔧',
  },
  {
    slug: 'comparisons',
    title: 'Comparisons',
    description: 'Compare Claude with other AI tools',
    icon: '⚖️',
  },
];

/**
 * Load all guides from file system
 */
async function getAllGuides(): Promise<GuideMetadata[]> {
  const guides: GuideMetadata[] = [];
  const guidesDir = path.join(process.cwd(), 'content', 'guides');

  try {
    for (const category of CATEGORIES) {
      const categoryPath = path.join(guidesDir, category.slug);

      try {
        const files = await fs.readdir(categoryPath);

        for (const file of files) {
          if (!file.endsWith('.mdx')) continue;

          const filePath = path.join(categoryPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { frontmatter } = parseMDXFrontmatter(content);

          const guide: GuideMetadata = {
            title: frontmatter.title || file.replace('.mdx', ''),
            description: frontmatter.description || '',
            category: category.slug,
            slug: file.replace('.mdx', ''),
          };

          if (frontmatter.difficulty) {
            guide.difficulty = frontmatter.difficulty;
          }
          if (frontmatter.readingTime) {
            guide.readingTime = frontmatter.readingTime;
          }

          guides.push(guide);
        }
      } catch (categoryError) {
        logger.warn(`Failed to load guides from category: ${category.slug}`, {
          error: categoryError instanceof Error ? categoryError.message : String(categoryError),
        });
      }
    }

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
  const allGuides = await getAllGuides();

  // Group guides by category
  const guidesByCategory = CATEGORIES.map((category) => ({
    ...category,
    guides: allGuides.filter((guide) => guide.category === category.slug),
  }));

  const totalGuides = allGuides.length;

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Guides</h1>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">
              Comprehensive guides, tutorials, and best practices for getting the most out of Claude
              and MCP servers.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
                {totalGuides} {totalGuides === 1 ? 'guide' : 'guides'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {CATEGORIES.length} categories
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {guidesByCategory.map((category) => (
            <section key={category.slug} className={UI_CLASSES.SPACE_Y_6}>
              {/* Category Header */}
              <div className="flex items-start gap-4">
                <span className="text-4xl" aria-hidden="true">
                  {category.icon}
                </span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {category.guides.length} {category.guides.length === 1 ? 'guide' : 'guides'}
                  </Badge>
                </div>
              </div>

              {/* Guides Grid */}
              {category.guides.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {category.guides.map((guide) => (
                    <Link key={guide.slug} href={`/guides/${category.slug}/${guide.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-2">{guide.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {guide.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {guide.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                {guide.difficulty}
                              </Badge>
                            )}
                            {guide.readingTime && (
                              <Badge variant="secondary" className="text-xs">
                                {guide.readingTime}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No guides available yet in this category
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
