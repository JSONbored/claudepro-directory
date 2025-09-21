'use client';

import { BookOpen, Calendar, FileText, Search, Tag, Users, Workflow, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface GuideCount {
  'use-cases'?: number;
  tutorials?: number;
  collections?: number;
  categories?: number;
  workflows?: number;
}

interface RelatedGuide {
  title: string;
  slug: string;
  category: string;
}

interface UnifiedSidebarProps {
  // For category pages
  currentCategory?: string;
  guideCounts?: GuideCount;
  showSearch?: boolean;

  // For content pages
  mode?: 'category' | 'content';
  contentData?: {
    title?: string;
    description?: string;
    keywords?: string[];
    dateUpdated?: string;
    category?: string;
    content?: string;
  };
  relatedGuides?: RelatedGuide[];
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

const categoryLabels: Record<string, string> = {
  'use-cases': 'Use Case',
  tutorials: 'Tutorial',
  collections: 'Collection',
  categories: 'Category Guide',
  workflows: 'Workflow',
};

export function UnifiedSidebar({
  currentCategory,
  guideCounts = {},
  showSearch = true,
  mode = 'category',
  contentData,
  relatedGuides = [],
}: UnifiedSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Format date if available
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-20 space-y-6">
        {/* Search Section - Show for category mode or when explicitly enabled */}
        {(mode === 'category' || showSearch) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Guides
            </h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guides..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Filter Tags */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Popular Tags</span>
              <div className="flex flex-wrap gap-1">
                {['automation', 'development', 'workflows', 'beginner', 'advanced'].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Content-specific sections for content mode */}
        {mode === 'content' && contentData && (
          <>
            {/* Table of Contents */}
            {contentData.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">On this page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contentData.content.match(/^##\s+(.+)$/gm)?.map((heading) => {
                    const title = heading.replace('## ', '');
                    const id = title.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <a
                        key={id}
                        href={`#${id}`}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {title}
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Content Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Guide Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contentData.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categoryLabels[contentData.category] || contentData.category}
                    </Badge>
                  </div>
                )}
                {contentData.dateUpdated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(contentData.dateUpdated)}</span>
                  </div>
                )}
                {contentData.keywords && contentData.keywords.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {contentData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Related Guides</CardTitle>
                  <CardDescription>
                    More{' '}
                    {contentData.category
                      ? categoryLabels[contentData.category] || contentData.category
                      : 'related'}{' '}
                    guides
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedGuides.map((guide) => (
                    <Link key={guide.slug} href={guide.slug} className="block group">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">
                        {guide.title}
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Categories Navigation - Always show */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Browse by Category</h3>
          <div className="space-y-2">
            {Object.entries(categoryInfo).map(([key, info]) => {
              const Icon = info.icon;
              const count = guideCounts[key as keyof GuideCount] || 0;
              const isActive = currentCategory === key;

              return (
                <Link
                  key={key}
                  href={`/guides/${key}`}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : info.color}`} />
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-primary' : 'group-hover:text-primary'
                      }`}
                    >
                      {info.label}
                    </span>
                  </div>
                  {count > 0 && (
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                      {count}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Recent Guides - Only for category mode */}
        {mode === 'category' && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recent Updates</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>See the latest guides and updates across all categories.</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/guides" className="block">
              <Button
                variant={mode === 'content' ? 'outline' : 'ghost'}
                size="sm"
                className="w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {mode === 'content' ? 'Browse All Guides' : 'All Guides'}
              </Button>
            </Link>
            <Link href="/submit" className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Submit Content
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button
                variant={mode === 'content' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
              >
                {mode === 'content' ? 'Explore Directory' : 'Browse Directory'}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-4 bg-accent/5 border-accent/20">
          <h3 className="font-semibold mb-2 text-sm">Need Help?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Join our community for support and discussions.
          </p>
          <div className="space-y-2 text-xs">
            <a
              href="https://discord.gg/Ax3Py4YDrq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Discord Community →
            </a>
            <a
              href="https://github.com/JSONbored/claudepro-directory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              GitHub Repository →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
