import fs from 'fs/promises';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import path from 'path';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UnifiedSidebar } from '@/components/unified-sidebar';

export const metadata = {
  title: 'Claude Use Cases - Practical Applications | Claude Pro Directory',
  description:
    'Explore practical Claude AI use cases and applications. Learn how to apply Claude for specific scenarios and problems.',
};

interface GuideItem {
  title: string;
  description: string;
  slug: string;
  dateUpdated?: string;
}

async function getUseCases(): Promise<GuideItem[]> {
  const useCases: GuideItem[] = [];

  try {
    const dir = path.join(process.cwd(), 'seo', 'use-cases');
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

          useCases.push({
            title: metadata.title || file.replace('.mdx', ''),
            description: metadata.description || '',
            slug: `/guides/use-cases/${file.replace('.mdx', '')}`,
            dateUpdated: metadata.dateUpdated || '',
          });
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return useCases.sort((a, b) => a.title.localeCompare(b.title));
}

export default async function UseCasesPage() {
  const useCases = await getUseCases();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold">Claude Use Cases</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Practical guides for specific Claude AI applications and scenarios
          </p>
          <div className="mt-4">
            <Badge variant="secondary">{useCases.length} use cases available</Badge>
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
              <li className="text-foreground font-medium">Use Cases</li>
            </ol>
          </nav>
        </div>

        {/* Main Layout: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Use Cases Grid */}
            {useCases.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {useCases.map((useCase) => (
                  <Link key={useCase.slug} href={useCase.slug}>
                    <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                      <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 line-clamp-2">{useCase.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                          {useCase.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <Badge variant="outline" className="text-xs">
                            Use Case
                          </Badge>
                          {useCase.dateUpdated && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(useCase.dateUpdated).toLocaleDateString()}
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
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No use cases yet</h2>
                <p className="text-muted-foreground">
                  Use case guides are coming soon. Check back later for practical applications.
                </p>
              </Card>
            )}

            {/* CTA */}
            <Card className="p-8 text-center bg-accent/10">
              <h2 className="text-2xl font-semibold mb-4">Share your use case</h2>
              <p className="text-muted-foreground mb-6">
                Help others by documenting your successful Claude AI applications
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
                    Submit Use Case
                  </button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Sidebar - Takes 1/3 width */}
          <UnifiedSidebar mode="category" currentCategory="use-cases" />
        </div>
      </div>
    </div>
  );
}
