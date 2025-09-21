import fs from 'fs/promises';
import path from 'path';
import { EnhancedGuidesPage } from '@/components/enhanced-guides-page';

export const metadata = {
  title: 'Claude Guides & Tutorials - Claude Pro Directory',
  description:
    'Comprehensive guides, tutorials, and workflows for Claude AI. Learn how to use MCP servers, agents, and more.',
};

interface GuideItem {
  title: string;
  description: string;
  slug: string;
  category: string;
  dateUpdated?: string;
}

async function getGuides(): Promise<Record<string, GuideItem[]>> {
  const categories = ['use-cases', 'tutorials', 'collections', 'categories', 'workflows'];
  const guides: Record<string, GuideItem[]> = {};

  for (const category of categories) {
    guides[category] = [];

    try {
      const dir = path.join(process.cwd(), 'seo', category);
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

          if (frontmatterMatch?.[1]) {
            const metadata: Record<string, string> = {};
            frontmatterMatch[1].split('\n').forEach((line) => {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length) {
                const value = valueParts
                  .join(':')
                  .trim()
                  .replace(/^["']|["']$/g, '');
                metadata[key.trim()] = value;
              }
            });

            guides[category].push({
              title: metadata.title || file.replace('.mdx', ''),
              description: metadata.description || '',
              slug: `/guides/${category}/${file.replace('.mdx', '')}`,
              category,
              dateUpdated: metadata.dateUpdated || '',
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return guides;
}

export default async function GuidesPage() {
  const guides = await getGuides();

  return <EnhancedGuidesPage guides={guides} />;
}
