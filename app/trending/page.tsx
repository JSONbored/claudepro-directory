import { Clock, Star, TrendingUp, Users } from 'lucide-react';
import { TrendingContent } from '@/components/trending-content';
import { Badge } from '@/components/ui/badge';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { statsRedis } from '@/lib/redis';

// Force dynamic rendering since we're fetching from Redis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTrendingData() {
  // Helper function to get mixed content from categories
  const getMixedContent = (
    categories: { items: any[]; type: string; count: number }[],
    totalCount: number
  ) => {
    const result: any[] = [];
    let currentIndex = 0;

    // Round-robin through categories to ensure variety
    while (result.length < totalCount) {
      for (const category of categories) {
        if (category.items.length > currentIndex && result.length < totalCount) {
          const item = { ...category.items[currentIndex], type: category.type };
          result.push(item);
        }
      }
      currentIndex++;
      // Break if we've exhausted all categories
      if (categories.every((cat) => cat.items.length <= currentIndex)) break;
    }

    return result;
  };

  if (!statsRedis.isEnabled()) {
    // Fallback to static data if Redis is not available
    // Sort each category by popularity
    const sortedRules = [...rules].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedMcp = [...mcp].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedAgents = [...agents].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedCommands = [...commands].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedHooks = [...hooks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Mix categories for trending (12 items total, ~2-3 per category)
    const trending = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 3 },
        { items: sortedMcp, type: 'mcp', count: 3 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 2 },
      ],
      12
    );

    // Popular shows top items from each category (9 items)
    const popular = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 2 },
        { items: sortedMcp, type: 'mcp', count: 2 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 1 },
      ],
      9
    );

    // Recent shows newest from each category (simulate by reversing arrays)
    const recent = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
      ],
      9
    );

    return { trending, popular, recent };
  }

  try {
    // Fetch trending data from Redis for each category
    const [trendingAgents, trendingMcp, trendingRules, trendingCommands, trendingHooks] =
      await Promise.all([
        statsRedis.getTrending('agents', 3),
        statsRedis.getTrending('mcp', 3),
        statsRedis.getTrending('rules', 3),
        statsRedis.getTrending('commands', 3),
        statsRedis.getTrending('hooks', 3),
      ]);

    // Fetch popular data from Redis (all-time views)
    const [popularAgents, popularMcp, popularRules, popularCommands, popularHooks] =
      await Promise.all([
        statsRedis.getPopular('agents', 2),
        statsRedis.getPopular('mcp', 2),
        statsRedis.getPopular('rules', 2),
        statsRedis.getPopular('commands', 2),
        statsRedis.getPopular('hooks', 1),
      ]);

    // Map Redis IDs back to actual content items
    const mapToContent = (
      items: string[] | { slug: string; views?: number }[],
      contentArray: any[],
      type: string
    ) =>
      items
        .map((item) => {
          const slug = typeof item === 'string' ? item : item.slug;
          const views = typeof item === 'object' ? item.views : undefined;
          const content = contentArray.find((c) => c.slug === slug);
          return content ? { ...content, type, viewCount: views } : null;
        })
        .filter(Boolean);

    // Trending - mix from all categories (last 7 days)
    const trending = [
      ...mapToContent(trendingAgents, agents, 'agents'),
      ...mapToContent(trendingMcp, mcp, 'mcp'),
      ...mapToContent(trendingRules, rules, 'rules'),
      ...mapToContent(trendingCommands, commands, 'commands'),
      ...mapToContent(trendingHooks, hooks, 'hooks'),
    ].slice(0, 12);

    // Popular - all-time most viewed
    const popular = [
      ...mapToContent(popularAgents, agents, 'agents'),
      ...mapToContent(popularMcp, mcp, 'mcp'),
      ...mapToContent(popularRules, rules, 'rules'),
      ...mapToContent(popularCommands, commands, 'commands'),
      ...mapToContent(popularHooks, hooks, 'hooks'),
    ].slice(0, 9);

    // Recent - if we don't have enough data, use fallback mixing
    const recentFallback = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
      ],
      9
    );

    return {
      trending: trending.length > 0 ? trending : recentFallback,
      popular: popular.length > 0 ? popular : recentFallback,
      recent: recentFallback,
    };
  } catch (error) {
    console.error('Error fetching trending data:', error);
    // Use same fallback as non-Redis case
    const sortedRules = [...rules].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedMcp = [...mcp].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedAgents = [...agents].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedCommands = [...commands].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const sortedHooks = [...hooks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const trending = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 3 },
        { items: sortedMcp, type: 'mcp', count: 3 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 2 },
      ],
      12
    );

    const popular = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 2 },
        { items: sortedMcp, type: 'mcp', count: 2 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 1 },
      ],
      9
    );

    const recent = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
      ],
      9
    );

    return { trending, popular, recent };
  }
}

export default async function TrendingPage() {
  const { trending, popular, recent } = await getTrendingData();
  const totalCount = rules.length + mcp.length + agents.length + commands.length + hooks.length;

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
                {totalCount} total configs
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section className="container mx-auto px-4 py-16">
        <TrendingContent trending={trending} popular={popular} recent={recent} />
      </section>
    </div>
  );
}
