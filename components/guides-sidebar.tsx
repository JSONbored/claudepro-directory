'use client';

import {
  AlertTriangle,
  BookOpen,
  FileText,
  GitCompare,
  Search,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface GuidesSidebarProps {
  currentCategory?: string;
  guideCounts?: Record<string, number>;
  showSearch?: boolean;
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
  comparisons: {
    label: 'Comparisons',
    icon: GitCompare,
    description: 'Compare Claude with other development tools',
    color: 'text-red-500',
  },
  troubleshooting: {
    label: 'Troubleshooting',
    icon: AlertTriangle,
    description: 'Solutions for common Claude AI issues',
    color: 'text-yellow-500',
  },
};

export function GuidesSidebar({
  currentCategory,
  guideCounts = {},
  showSearch = true,
}: GuidesSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="sticky top-20 space-y-6">
        {/* Search Section */}
        {showSearch && (
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

        {/* Categories Navigation */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Browse Categories</h3>
          <div className="space-y-2">
            {/* All Guides Link */}
            <Link
              href="/guides"
              className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                !currentCategory ? 'bg-muted/50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium group-hover:text-primary">All Guides</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {Object.values(guideCounts).reduce((acc, count) => acc + count, 0)}
              </Badge>
            </Link>

            {/* Category Links */}
            {Object.entries(categoryInfo).map(([key, info]) => {
              const Icon = info.icon;
              const count = guideCounts[key] || 0;
              const isActive = currentCategory === key;

              return (
                <Link
                  key={key}
                  href={`/guides/${key}`}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                    isActive ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${info.color}`} />
                    <span
                      className={`text-sm font-medium group-hover:text-primary ${
                        isActive ? 'text-primary' : ''
                      }`}
                    >
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
