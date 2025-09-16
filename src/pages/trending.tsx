import { Clock, Star, TrendingUp } from 'lucide-react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import type { ContentMetadata } from '@/types/content';

const Trending = () => {
  // Combine all content types and sort by popularity
  const allConfigs: ContentMetadata[] = [
    ...agents.map(item => ({ ...item, type: 'agent' as const })),
    ...commands.map(item => ({ ...item, type: 'command' as const })),
    ...hooks.map(item => ({ ...item, type: 'hook' as const })),
    ...mcp.map(item => ({ ...item, type: 'mcp' as const })),
    ...rules.map(item => ({ ...item, type: 'rule' as const }))
  ].sort((a, b) => b.popularity - a.popularity);
  
  const trendingConfigs = allConfigs.slice(0, 12);

  // Most popular by category
  const topAgents = [...agents].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const topCommands = [...commands].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const topHooks = [...hooks].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const topRules = [...rules].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const topMcps = [...mcp].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  const getConfigType = (config: ContentMetadata & { type?: string }) => {
    if (config.type) return config.type;
    // Fallback detection for backward compatibility
    if ('content' in config) return 'rule';
    return 'mcp';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Trending
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Discover the most popular AI agents, commands, hooks, rules, and MCP servers chosen by the
              community.
            </p>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <Star className="h-3 w-3 mr-1" />
              Top configurations by popularity
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12 space-y-16">
        {/* Top Trending */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top Trending</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <Clock className="h-3 w-3 mr-1" />
              Most popular this week
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingConfigs.map((config, index) => (
              <div key={config.id} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      #{index + 1}
                    </Badge>
                  </div>
                )}
                <ConfigCard {...config} type={getConfigType(config)} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top AI Agents</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Most productive agents
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topAgents.map((agent) => (
              <ConfigCard key={agent.id} {...agent} type="agent" />
            ))}
          </div>
        </div>

        {/* Top Commands */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top Commands</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Most useful commands
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCommands.map((command) => (
              <ConfigCard key={command.id} {...command} type="command" />
            ))}
          </div>
        </div>

        {/* Top Hooks */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top Hooks</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Most effective automation
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topHooks.map((hook) => (
              <ConfigCard key={hook.id} {...hook} type="hook" />
            ))}
          </div>
        </div>

        {/* Top Rules */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top Claude Rules</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Most effective configurations
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRules.map((rule) => (
              <ConfigCard key={rule.id} {...rule} type="rule" />
            ))}
          </div>
        </div>

        {/* Top MCP Servers */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top MCP Servers</h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              Most useful integrations
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMcps.map((mcpItem) => (
              <ConfigCard key={mcpItem.id} {...mcpItem} type="mcp" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Trending;
