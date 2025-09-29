import { BookOpen, Server, Sparkles } from 'lucide-react';

import HomePageClient from '@/components/home-page-client';
import { lazyContentLoaders } from '@/components/lazy-components';
import { transformForHomePage } from '@/lib/transformers';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

// Use Edge Runtime for better performance
export const runtime = 'edge';

// Server component that loads data
export default async function HomePage() {
  // Load all content server-side for better SEO and initial page load
  const [rules, mcp, agents, commands, hooks] = await Promise.all([
    lazyContentLoaders.rules(),
    lazyContentLoaders.mcp(),
    lazyContentLoaders.agents(),
    lazyContentLoaders.commands(),
    lazyContentLoaders.hooks(),
  ]);

  // Create stable allConfigs array to prevent infinite re-renders
  const allConfigs = [...rules, ...mcp, ...agents, ...commands, ...hooks];

  // Transform data using transform functions to convert readonly arrays to mutable
  const initialData = transformForHomePage({
    rules,
    mcp,
    agents,
    commands,
    hooks,
    allConfigs,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Static Hero Section - Server Rendered */}
      <section
        className="relative overflow-hidden border-b border-border/50"
        aria-label="Homepage hero"
      >
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-foreground tracking-tight">
              The home for Claude enthusiasts
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              Discover and share the best Claude configurations. Explore expert rules, browse
              powerful MCP servers, find specialized agents and commands, discover automation hooks,
              and connect with the community building the future of AI.
            </p>

            {/* Quick Stats - Server Rendered for SEO */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {rules.length} Expert Rules
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                {mcp.length} MCP Servers
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {agents.length} AI Agents
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {commands.length} Commands
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {hooks.length} Automation Hooks
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Component for Interactive Features */}
      <HomePageClient initialData={initialData} />
    </div>
  );
}
