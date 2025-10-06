import { HomePageClient } from '@/src/components/features/home';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { statsRedis } from '@/src/lib/redis';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { transformForHomePage } from '@/src/lib/utils/transformers';

// Import types for metadata
import type { AgentMetadata } from '@/generated/agents-metadata';
import type { McpMetadata } from '@/generated/mcp-metadata';
import type { RuleMetadata } from '@/generated/rules-metadata';
import type { CommandMetadata } from '@/generated/commands-metadata';
import type { HookMetadata } from '@/generated/hooks-metadata';
import type { StatuslineMetadata } from '@/generated/statuslines-metadata';
import type { CollectionMetadata } from '@/generated/collections-metadata';

type ContentMetadataWithCategory =
  | (AgentMetadata & { category: 'agents' })
  | (McpMetadata & { category: 'mcp' })
  | (RuleMetadata & { category: 'rules' })
  | (CommandMetadata & { category: 'commands' })
  | (HookMetadata & { category: 'hooks' })
  | (StatuslineMetadata & { category: 'statuslines' })
  | (CollectionMetadata & { category: 'collections' });

type EnrichedMetadata = ContentMetadataWithCategory & { viewCount: number };

// Enable ISR - revalidate every 5 minutes for fresh view counts
export const revalidate = 300;

// Server component that loads data
export default async function HomePage() {
  // Load all content server-side for better SEO and initial page load
  const [
    rulesData,
    mcpData,
    agentsData,
    commandsData,
    hooksData,
    statuslinesData,
    collectionsData,
  ] = await Promise.all([
    lazyContentLoaders.rules(),
    lazyContentLoaders.mcp(),
    lazyContentLoaders.agents(),
    lazyContentLoaders.commands(),
    lazyContentLoaders.hooks(),
    lazyContentLoaders.statuslines(),
    lazyContentLoaders.collections(),
  ]);

  // Enrich with view counts from Redis
  const [rules, mcp, agents, commands, hooks, statuslines, collections] = await Promise.all([
    statsRedis.enrichWithViewCounts(
      rulesData.map((item) => ({ ...item, category: 'rules' as const }))
    ),
    statsRedis.enrichWithViewCounts(
      mcpData.map((item) => ({ ...item, category: 'mcp' as const }))
    ),
    statsRedis.enrichWithViewCounts(
      agentsData.map((item) => ({ ...item, category: 'agents' as const }))
    ),
    statsRedis.enrichWithViewCounts(
      commandsData.map((item) => ({
        ...item,
        category: 'commands' as const,
      }))
    ),
    statsRedis.enrichWithViewCounts(
      hooksData.map((item) => ({ ...item, category: 'hooks' as const }))
    ),
    statsRedis.enrichWithViewCounts(
      statuslinesData.map((item) => ({
        ...item,
        category: 'statuslines' as const,
      }))
    ),
    statsRedis.enrichWithViewCounts(
      collectionsData.map((item) => ({
        ...item,
        category: 'collections' as const,
      }))
    ),
  ]);

  // Create stable allConfigs array to prevent infinite re-renders
  // Deduplicate by slug to prevent duplicate keys in React rendering
  const allConfigsWithDuplicates = [
    ...rules,
    ...mcp,
    ...agents,
    ...commands,
    ...hooks,
    ...statuslines,
    ...collections,
  ];

  // Use Map to deduplicate by slug (last occurrence wins)
  const allConfigsMap = new Map(allConfigsWithDuplicates.map((item) => [item.slug, item]));
  const allConfigs = Array.from(allConfigsMap.values());

  // Transform data using transform functions to convert readonly arrays to mutable
  // Metadata arrays contain the core fields needed for display
  const initialData = transformForHomePage({
    rules: rules as RuleMetadata[],
    mcp: mcp as McpMetadata[],
    agents: agents as AgentMetadata[],
    commands: commands as CommandMetadata[],
    hooks: hooks as HookMetadata[],
    statuslines: statuslines as StatuslineMetadata[],
    collections: collections as CollectionMetadata[],
    allConfigs: allConfigs as EnrichedMetadata[],
  });

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Static Hero Section - Server Rendered */}
      <section
        className={`relative overflow-hidden ${UI_CLASSES.BORDER_B} border-border/50`}
        aria-label="Homepage hero"
      >
        <div className={`relative container ${UI_CLASSES.MX_AUTO} px-4 py-10 sm:py-16 lg:py-24`}>
          <div className={`text-center ${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground tracking-tight">
              The home for Claude enthusiasts
            </h1>

            <p
              className={`text-base sm:text-lg lg:text-xl text-muted-foreground ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}
            >
              Discover and share the best Claude configurations. Explore expert rules, browse
              powerful MCP servers, find specialized agents and commands, discover automation hooks,
              and connect with the community building the future of AI.
            </p>
          </div>
        </div>
      </section>

      {/* Client Component for Interactive Features */}
      <HomePageClient
        initialData={initialData}
        stats={{
          rules: rules.length,
          mcp: mcp.length,
          agents: agents.length,
          commands: commands.length,
          hooks: hooks.length,
          statuslines: statuslines.length,
          collections: collections.length,
        }}
      />

      {/* Email CTA - Moved to bottom of page */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="homepage"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
