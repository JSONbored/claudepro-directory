'use client';

import { Clock, Star, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import type { ContentItem } from '@/types/content';

export default function TrendingPage() {
  const [_] = useState('week');

  // Combine all content and sort by popularity
  const allContent = useMemo(() => {
    const combined = [...rules, ...mcp, ...agents, ...commands, ...hooks];
    return combined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, []);

  const getConfigType = useMemo(
    () =>
      (config: ContentItem): 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' => {
        if (agents.some((a) => a.id === config.id)) return 'agents';
        if (commands.some((c) => c.id === config.id)) return 'commands';
        if (hooks.some((h) => h.id === config.id)) return 'hooks';
        if (mcp.some((m) => m.id === config.id)) return 'mcp';
        if (rules.some((r) => r.id === config.id)) return 'rules';
        return 'content' in config ? 'rules' : 'mcp';
      },
    []
  );

  const trendingItems = useMemo(() => allContent.slice(0, 12), [allContent]);
  const popularItems = useMemo(() => allContent.slice(0, 9), [allContent]);
  const recentItems = useMemo(() => [...allContent].reverse().slice(0, 9), [allContent]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 border-accent/20 bg-accent/5 text-accent">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              Trending
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">Trending Configurations</h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Updated hourly
              </Badge>
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Community curated
              </Badge>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {allContent.length} total configs
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section className="container mx-auto px-4 py-16">
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
                {trendingItems.map((item, index) => (
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
                {popularItems.map((item) => (
                  <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">🆕 Recently Added</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentItems.map((item) => (
                  <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
