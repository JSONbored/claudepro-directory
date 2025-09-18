'use client';

import { Clock, Star, TrendingUp } from 'lucide-react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import type { ContentItem } from '@/types/content';

interface TrendingContentProps {
  trending: any[];
  popular: any[];
  recent: any[];
}

export function TrendingContent({ trending, popular, recent }: TrendingContentProps) {
  const getConfigType = (
    config: ContentItem
  ): 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' => {
    if (config.type) return config.type as any;
    if (agents.some((a) => a.id === config.id)) return 'agents';
    if (commands.some((c) => c.id === config.id)) return 'commands';
    if (hooks.some((h) => h.id === config.id)) return 'hooks';
    if (mcp.some((m) => m.id === config.id)) return 'mcp';
    if (rules.some((r) => r.id === config.id)) return 'rules';
    return 'content' in config ? 'rules' : 'mcp';
  };

  return (
    <Tabs defaultValue="trending" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
        <TabsTrigger value="trending">
          <TrendingUp className="h-4 w-4 mr-2" />
          Trending
        </TabsTrigger>
        <TabsTrigger value="popular">
          <Star className="h-4 w-4 mr-2" />
          Popular
        </TabsTrigger>
        <TabsTrigger value="recent">
          <Clock className="h-4 w-4 mr-2" />
          Recent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">🔥 Trending This Week</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trending.map((item, index) => (
              <div key={item.id} className="relative">
                {index < 3 && (
                  <Badge className="absolute -top-2 -right-2 z-10" variant="default">
                    #{index + 1}
                  </Badge>
                )}
                <ConfigCard {...item} type={getConfigType(item)} />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="popular" className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">⭐ Most Popular</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popular.map((item) => (
              <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recent" className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">🆕 Recently Added</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
