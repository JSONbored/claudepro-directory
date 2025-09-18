import { Clock, Star, TrendingUp, Users } from 'lucide-react';
import { TrendingContent } from '@/components/trending-content';
import { Badge } from '@/components/ui/badge';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { statsRedis } from '@/lib/redis';

async function getTrendingData() {
  if (!statsRedis.isEnabled()) {
    // Fallback to static data if Redis is not available
    const allContent = [...rules, ...mcp, ...agents, ...commands, ...hooks];
    const sorted = allContent.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return {
      trending: sorted.slice(0, 12),
      popular: sorted.slice(0, 9),
      recent: [...allContent].reverse().slice(0, 9),
    };
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

    // Map Redis IDs back to actual content items
    const mapToContent = (
      items: { id: string; views: number }[],
      contentArray: any[],
      type: string
    ) =>
      items
        .map((item) => {
          const content = contentArray.find((c) => c.slug === item.id);
          return content ? { ...content, redisViews: item.views, type } : null;
        })
        .filter(Boolean);

    const trending = [
      ...mapToContent(trendingAgents, agents, 'agents'),
      ...mapToContent(trendingMcp, mcp, 'mcp'),
      ...mapToContent(trendingRules, rules, 'rules'),
      ...mapToContent(trendingCommands, commands, 'commands'),
      ...mapToContent(trendingHooks, hooks, 'hooks'),
    ].slice(0, 12);

    // Fallback for popular and recent (until we have more Redis data)
    const allContent = [...rules, ...mcp, ...agents, ...commands, ...hooks];
    const popular = trending.length > 0 ? trending.slice(0, 9) : allContent.slice(0, 9);
    const recent = [...allContent].reverse().slice(0, 9);

    return { trending, popular, recent };
  } catch (error) {
    console.error('Error fetching trending data:', error);
    // Fallback to static data
    const allContent = [...rules, ...mcp, ...agents, ...commands, ...hooks];
    const sorted = allContent.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return {
      trending: sorted.slice(0, 12),
      popular: sorted.slice(0, 9),
      recent: [...allContent].reverse().slice(0, 9),
    };
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
