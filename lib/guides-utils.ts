import fs from 'fs/promises';
import path from 'path';
import { parseMDXFrontmatter } from './mdx-config';

export interface GuideMetadata {
  title: string;
  description: string;
  slug: string;
  category: string;
  dateUpdated?: string;
  author?: string;
  readingTime?: string;
  difficulty?: string;
  keywords?: string[];
}

const GUIDE_CATEGORIES = [
  'use-cases',
  'tutorials',
  'collections',
  'categories',
  'workflows',
  'comparisons',
  'troubleshooting',
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export async function getAllGuideMetadata(): Promise<GuideMetadata[]> {
  const allGuides: GuideMetadata[] = [];

  for (const category of GUIDE_CATEGORIES) {
    try {
      const dir = path.join(process.cwd(), 'seo', category);
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          try {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const { frontmatter } = parseMDXFrontmatter(content);

            allGuides.push({
              title: frontmatter.title || file.replace('.mdx', ''),
              description: frontmatter.description || '',
              slug: `${category}/${file.replace('.mdx', '')}`,
              category,
              dateUpdated: frontmatter.dateUpdated || '',
              author: frontmatter.author || 'Claude Pro Directory Team',
              readingTime: frontmatter.readingTime || '',
              difficulty: frontmatter.difficulty || '',
              keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
            });
          } catch {
            // Skip invalid MDX files
          }
        }
      }
    } catch {
      // Skip directories that don't exist or can't be read
    }
  }

  return allGuides;
}

export async function getGuideBySlug(slug: string): Promise<GuideMetadata | null> {
  const [category, ...restSlug] = slug.split('/');

  if (!(category && GUIDE_CATEGORIES.includes(category as GuideCategory))) {
    return null;
  }

  const filename = `${restSlug.join('-')}.mdx`;

  try {
    const filePath = path.join(process.cwd(), 'seo', category, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter } = parseMDXFrontmatter(content);

    return {
      title: frontmatter.title || filename.replace('.mdx', ''),
      description: frontmatter.description || '',
      slug,
      category,
      dateUpdated: frontmatter.dateUpdated || '',
      author: frontmatter.author || 'Claude Pro Directory Team',
      readingTime: frontmatter.readingTime || '',
      difficulty: frontmatter.difficulty || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
    };
  } catch {
    return null;
  }
}

export function isValidGuideCategory(category: string): category is GuideCategory {
  return GUIDE_CATEGORIES.includes(category as GuideCategory);
}
