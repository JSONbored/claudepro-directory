import { HomePageClient } from '@/components/features/home';
import { lazyContentLoaders } from '@/components/shared/lazy-content-loaders';
import { BookOpen, Server, Sparkles } from '@/lib/icons';
import { transformForHomePage } from '@/lib/transformers';
import { UI_CLASSES } from '@/lib/ui-constants';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

// Server component that loads data
export default async function HomePage() {
  // Load all content server-side for better SEO and initial page load
  const [rules, mcp, agents, commands, hooks, statuslines] = await Promise.all([
    lazyContentLoaders.rules(),
    lazyContentLoaders.mcp(),
    lazyContentLoaders.agents(),
    lazyContentLoaders.commands(),
    lazyContentLoaders.hooks(),
    lazyContentLoaders.statuslines(),
  ]);

  // Create stable allConfigs array to prevent infinite re-renders
  const allConfigs = [...rules, ...mcp, ...agents, ...commands, ...hooks, ...statuslines];

  // Transform data using transform functions to convert readonly arrays to mutable
  // Metadata arrays contain the core fields needed for display
  const initialData = transformForHomePage({
    rules,
    mcp,
    agents,
    commands,
    hooks,
    statuslines,
    allConfigs,
  });

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Static Hero Section - Server Rendered */}
      <section
        className={`relative overflow-hidden ${UI_CLASSES.BORDER_B} border-border/50`}
        aria-label="Homepage hero"
      >
        <div className={`relative container ${UI_CLASSES.MX_AUTO} px-4 py-20 lg:py-32`}>
          <div className={`text-center ${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-foreground tracking-tight">
              The home for Claude enthusiasts
            </h1>

            <p
              className={`${UI_CLASSES.TEXT_HEADING_LARGE} ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}
            >
              Discover and share the best Claude configurations. Explore expert rules, browse
              powerful MCP servers, find specialized agents and commands, discover automation hooks,
              and connect with the community building the future of AI.
            </p>

            {/* Quick Stats - Server Rendered for SEO */}
            <div
              className={`flex flex-wrap ${UI_CLASSES.JUSTIFY_CENTER} gap-6 text-sm text-muted-foreground mb-8`}
            >
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <BookOpen className="h-4 w-4" />
                {rules.length} Expert Rules
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Server className="h-4 w-4" />
                {mcp.length} MCP Servers
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {agents.length} AI Agents
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {commands.length} Commands
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {hooks.length} Automation Hooks
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {statuslines.length} Statuslines
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
