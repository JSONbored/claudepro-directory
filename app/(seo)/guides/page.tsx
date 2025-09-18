import fs from 'fs/promises';
import { BookOpen, FileText, Users, Workflow, Zap } from 'lucide-react';
import Link from 'next/link';
import path from 'path';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

          if (frontmatterMatch) {
            const metadata: any = {};
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
              dateUpdated: metadata.dateUpdated,
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

const categoryInfo = {
  'use-cases': {
    label: 'Use Cases',
    icon: Zap,
    description: 'Practical guides for specific Claude AI use cases',
    color: 'text-blue-500',
  },
  tutorials: {
    label: 'Tutorials',
    icon: BookOpen,
    description: 'Step-by-step tutorials for Claude features',
    color: 'text-green-500',
  },
  collections: {
    label: 'Collections',
    icon: Users,
    description: 'Curated collections of tools and agents',
    color: 'text-purple-500',
  },
  categories: {
    label: 'Category Guides',
    icon: FileText,
    description: 'Comprehensive guides by category',
    color: 'text-orange-500',
  },
  workflows: {
    label: 'Workflows',
    icon: Workflow,
    description: 'Complete workflow guides and strategies',
    color: 'text-pink-500',
  },
};

export default async function GuidesPage() {
  const guides = await getGuides();
  const totalGuides = Object.values(guides).reduce((acc, cat) => acc + cat.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Guides & Tutorials</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to use Claude AI effectively with our comprehensive guides
          </p>
          <div className="mt-4">
            <Badge variant="secondary">{totalGuides} guides available</Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          {Object.entries(categoryInfo).map(([key, info]) => {
            const Icon = info.icon;
            const count = guides[key]?.length || 0;

            return (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${info.color}`} />
                  <div>
                    <p className="font-semibold">{count}</p>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Guides by Category */}
        {Object.entries(guides).map(([category, categoryGuides]) => {
          if (categoryGuides.length === 0) return null;

          const info = categoryInfo[category as keyof typeof categoryInfo];
          const Icon = info.icon;

          return (
            <div key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`h-6 w-6 ${info.color}`} />
                <div>
                  <h2 className="text-2xl font-semibold">{info.label}</h2>
                  <p className="text-muted-foreground">{info.description}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryGuides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug}>
                    <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                      <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 line-clamp-2">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <Badge variant="outline" className="text-xs">
                            {info.label}
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
            </div>
          );
        })}

        {/* CTA */}
        <Card className="p-8 mt-12 text-center bg-accent/10">
          <h2 className="text-2xl font-semibold mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Browse our complete directory or submit your own content
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <button
                type="button"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Browse Directory
              </button>
            </Link>
            <Link href="/submit">
              <button
                type="button"
                className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
              >
                Submit Content
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
