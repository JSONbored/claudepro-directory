import fs from 'fs/promises';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import path from 'path';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UnifiedSidebar } from '@/components/unified-sidebar';

export const metadata = {
  title: 'Claude Troubleshooting - Fix Common Issues | Claude Pro Directory',
  description:
    'Troubleshoot common Claude AI issues and errors. Find solutions to installation, configuration, and usage problems.',
};

interface GuideItem {
  title: string;
  description: string;
  slug: string;
  dateUpdated?: string;
}

async function getTroubleshooting(): Promise<GuideItem[]> {
  const troubleshooting: GuideItem[] = [];

  try {
    const dir = path.join(process.cwd(), 'seo', 'troubleshooting');
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

          troubleshooting.push({
            title: metadata.title || file.replace('.mdx', ''),
            description: metadata.description || '',
            slug: `/guides/troubleshooting/${file.replace('.mdx', '')}`,
            dateUpdated: metadata.dateUpdated || '',
          });
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return troubleshooting.sort((a, b) => a.title.localeCompare(b.title));
}

export default async function TroubleshootingPage() {
  const troubleshooting = await getTroubleshooting();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">Claude Troubleshooting</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Solutions for common Claude AI issues and error fixes
          </p>
          <div className="mt-4">
            <Badge variant="secondary">{troubleshooting.length} guides available</Badge>
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
              <li className="text-foreground font-medium">Troubleshooting</li>
            </ol>
          </nav>
        </div>

        {/* Main Layout: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Troubleshooting Grid */}
            {troubleshooting.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {troubleshooting.map((guide) => (
                  <Link key={guide.slug} href={guide.slug}>
                    <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                      <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 line-clamp-2">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <Badge variant="outline" className="text-xs">
                            Troubleshooting
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
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No troubleshooting guides yet</h2>
                <p className="text-muted-foreground">
                  Troubleshooting guides are coming soon. Check back later for solutions.
                </p>
              </Card>
            )}

            {/* CTA */}
            <Card className="p-8 text-center bg-accent/10">
              <h2 className="text-2xl font-semibold mb-4">Report an issue</h2>
              <p className="text-muted-foreground mb-6">
                Help others by documenting solutions to problems you've encountered
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
                    Submit Solution
                  </button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Sidebar - Takes 1/3 width */}
          <UnifiedSidebar mode="category" currentCategory="troubleshooting" />
        </div>
      </div>
    </div>
  );
}
