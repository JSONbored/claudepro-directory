'use client';

import { Clock, Star, TrendingUp } from 'lucide-react';
import { useId } from 'react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import type { ContentItem } from '@/types/content';

interface TrendingContentProps {
  trending: Array<ContentItem & { type?: string; viewCount?: number }>;
  popular: Array<ContentItem & { type?: string; viewCount?: number }>;
  recent: Array<ContentItem & { type?: string; viewCount?: number }>;
}

export function TrendingContent({ trending, popular, recent }: TrendingContentProps) {
  // Generate unique IDs for headings
  const trendingHeadingId = useId();
  const popularHeadingId = useId();
  const recentHeadingId = useId();

  const getConfigType = (
    config: ContentItem & { type?: string }
  ): 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' => {
    if (config.type) return config.type as 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';
    if (agents.some((a) => a.slug === config.slug)) return 'agents';
    if (commands.some((c) => c.slug === config.slug)) return 'commands';
    if (hooks.some((h) => h.slug === config.slug)) return 'hooks';
    if (mcp.some((m) => m.slug === config.slug)) return 'mcp';
    if (rules.some((r) => r.slug === config.slug)) return 'rules';
    return 'content' in config ? 'rules' : 'mcp';
  };

  return (
    <Tabs defaultValue="trending" className="space-y-8">
      <TabsList
        className="grid w-full grid-cols-3 max-w-md mx-auto"
        role="tablist"
        aria-label="Trending content categories"
      >
        <TabsTrigger value="trending" aria-label="View trending configurations">
          <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" />
          Trending
        </TabsTrigger>
        <TabsTrigger value="popular" aria-label="View most popular configurations">
          <Star className="h-4 w-4 mr-2" aria-hidden="true" />
          Popular
        </TabsTrigger>
        <TabsTrigger value="recent" aria-label="View recently added configurations">
          <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
          Recent
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="trending"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={trendingHeadingId}
      >
        <div>
          <h2 id={trendingHeadingId} className="text-2xl font-bold mb-4">
            🔥 Trending This Week
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none">
            {trending.map((item, index) => (
              <li key={item.slug} className="relative">
                {index < 3 && (
                  <Badge
                    className="absolute -top-2 -right-2 z-10"
                    variant="default"
                    aria-label={`Rank ${index + 1}`}
                  >
                    #{index + 1}
                  </Badge>
                )}
                <ConfigCard {...item} type={getConfigType(item)} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent
        value="popular"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={popularHeadingId}
      >
        <div>
          <h2 id={popularHeadingId} className="text-2xl font-bold mb-4">
            ⭐ Most Popular
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none">
            {popular.map((item) => (
              <li key={item.slug}>
                <ConfigCard {...item} type={getConfigType(item)} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent
        value="recent"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={recentHeadingId}
      >
        <div>
          <h2 id={recentHeadingId} className="text-2xl font-bold mb-4">
            🆕 Recently Added
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none">
            {recent.map((item) => (
              <li key={item.slug}>
                <ConfigCard {...item} type={getConfigType(item)} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
