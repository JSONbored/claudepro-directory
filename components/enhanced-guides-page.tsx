'use client';

import { BookOpen, FileText, Search, Users, Workflow, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface GuideItem {
  title: string;
  description: string;
  slug: string;
  category: string;
  dateUpdated?: string;
}

interface EnhancedGuidesPageProps {
  guides: Record<string, GuideItem[]>;
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

export function EnhancedGuidesPage({ guides }: EnhancedGuidesPageProps) {
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

        {/* Main Layout: Content + Persistent Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-5">
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

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
          </div>

          {/* Persistent Search Sidebar - Takes 1/3 width */}
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
              {/* Embedded Search */}
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
                    onChange={(e) => {
                      // TODO: Implement real-time search
                      console.log('Search:', e.target.value);
                    }}
                  />
                </div>

                {/* Quick Filter Tags */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Popular Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {['automation', 'development', 'workflows', 'beginner', 'advanced'].map(
                      (tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent"
                        >
                          #{tag}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </Card>

              {/* Categories */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Browse by Category</h3>
                <div className="space-y-2">
                  {Object.entries(categoryInfo).map(([key, info]) => {
                    const Icon = info.icon;
                    const count = guides[key]?.length || 0;

                    if (count === 0) return null;

                    return (
                      <Link
                        key={key}
                        href={`/guides/${key}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${info.color}`} />
                          <span className="text-sm font-medium group-hover:text-primary">
                            {info.label}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </Card>

              {/* Recent Guides */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Recent Guides</h3>
                <div className="space-y-2">
                  {Object.values(guides)
                    .flat()
                    .filter((guide) => guide.dateUpdated)
                    .sort(
                      (a, b) =>
                        new Date(b.dateUpdated || '').getTime() -
                        new Date(a.dateUpdated || '').getTime()
                    )
                    .slice(0, 5)
                    .map((guide) => (
                      <Link
                        key={guide.slug}
                        href={guide.slug}
                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="text-sm font-medium group-hover:text-primary line-clamp-2 mb-1">
                          {guide.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {guide.dateUpdated && new Date(guide.dateUpdated).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="block w-full text-left p-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Browse Directory
                  </Link>
                  <Link
                    href="/submit"
                    className="block w-full text-left p-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Submit Content
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>

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
