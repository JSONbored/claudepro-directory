// Import types for metadata

import dynamic from 'next/dynamic';
import type { AgentMetadata } from '@/generated/agents-metadata';
import type { CollectionMetadata } from '@/generated/collections-metadata';
import type { CommandMetadata } from '@/generated/commands-metadata';
import type { HookMetadata } from '@/generated/hooks-metadata';
import type { McpMetadata } from '@/generated/mcp-metadata';
import type { RuleMetadata } from '@/generated/rules-metadata';
import type { StatuslineMetadata } from '@/generated/statuslines-metadata';
import { HomePageClient } from '@/src/components/features/home';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { RollingText } from '@/src/components/ui/magic/rolling-text';

// Lazy load Meteors animation to improve LCP (decorative only, not critical)
// The component handles client-side rendering internally via useEffect
const Meteors = dynamic(
  () => import('@/src/components/ui/magic/meteors').then((mod) => ({ default: mod.Meteors })),
  {
    loading: () => null, // No loading state needed for decorative animation
  }
);

import { statsRedis } from '@/src/lib/cache';
import { REVALIDATE_HOMEPAGE } from '@/src/lib/config/rate-limits.config';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { featuredService } from '@/src/lib/services/featured.service';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchFetch } from '@/src/lib/utils/batch.utils';
import { transformForHomePage } from '@/src/lib/utils/content.utils';

type ContentMetadataWithCategory =
  | (AgentMetadata & { category: 'agents' })
  | (McpMetadata & { category: 'mcp' })
  | (RuleMetadata & { category: 'rules' })
  | (CommandMetadata & { category: 'commands' })
  | (HookMetadata & { category: 'hooks' })
  | (StatuslineMetadata & { category: 'statuslines' })
  | (CollectionMetadata & { category: 'collections' });

type EnrichedMetadata = ContentMetadataWithCategory & { viewCount: number; copyCount: number };

/**
 * ISR Configuration - Homepage
 * Revalidate every 10 minutes - balance between freshness and performance
 * Homepage has mixed content with high traffic, optimized for user experience
 */
export const revalidate = REVALIDATE_HOMEPAGE;

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

// Server component that loads data
export default async function HomePage({ searchParams }: HomePageProps) {
  // Extract and sanitize search query from URL
  const resolvedParams = await searchParams;
  const initialSearchQuery = resolvedParams.q || '';

  // Load all content server-side for better SEO and initial page load
  // Also load weekly featured content by category (replaces static alphabetical featured)
  let rulesData: RuleMetadata[] = [];
  let mcpData: McpMetadata[] = [];
  let agentsData: AgentMetadata[] = [];
  let commandsData: CommandMetadata[] = [];
  let hooksData: HookMetadata[] = [];
  let statuslinesData: StatuslineMetadata[] = [];
  let collectionsData: CollectionMetadata[] = [];
  let featuredByCategory:
    | Record<string, readonly UnifiedContentItem[]>
    | Record<string, UnifiedContentItem[]> = {};

  try {
    [
      rulesData,
      mcpData,
      agentsData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
      featuredByCategory,
    ] = await batchFetch([
      lazyContentLoaders.rules(),
      lazyContentLoaders.mcp(),
      lazyContentLoaders.agents(),
      lazyContentLoaders.commands(),
      lazyContentLoaders.hooks(),
      lazyContentLoaders.statuslines(),
      lazyContentLoaders.collections(),
      featuredService.loadCurrentFeaturedContentByCategory(),
    ]);
  } catch (error) {
    // Log error but continue with empty fallbacks to prevent page crash
    logger.error(
      'Failed to load homepage content',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'loadContentMetadata',
      }
    );

    // Graceful degradation: page will render with empty content
    // Featured content defaults to empty object, other arrays to empty
  }

  // Enrich with view and copy counts from Redis (parallel batch operation)
  let rules: EnrichedMetadata[] = [];
  let mcp: EnrichedMetadata[] = [];
  let agents: EnrichedMetadata[] = [];
  let commands: EnrichedMetadata[] = [];
  let hooks: EnrichedMetadata[] = [];
  let statuslines: EnrichedMetadata[] = [];
  let collections: EnrichedMetadata[] = [];
  let enrichedFeaturedByCategory: Record<string, UnifiedContentItem[]> = {};

  try {
    [rules, mcp, agents, commands, hooks, statuslines, collections] = await batchFetch([
      statsRedis.enrichWithAllCounts(
        rulesData.map((item: RuleMetadata) => ({ ...item, category: 'rules' as const }))
      ),
      statsRedis.enrichWithAllCounts(
        mcpData.map((item: McpMetadata) => ({ ...item, category: 'mcp' as const }))
      ),
      statsRedis.enrichWithAllCounts(
        agentsData.map((item: AgentMetadata) => ({ ...item, category: 'agents' as const }))
      ),
      statsRedis.enrichWithAllCounts(
        commandsData.map((item: CommandMetadata) => ({
          ...item,
          category: 'commands' as const,
        }))
      ),
      statsRedis.enrichWithAllCounts(
        hooksData.map((item: HookMetadata) => ({ ...item, category: 'hooks' as const }))
      ),
      statsRedis.enrichWithAllCounts(
        statuslinesData.map((item: StatuslineMetadata) => ({
          ...item,
          category: 'statuslines' as const,
        }))
      ),
      statsRedis.enrichWithAllCounts(
        collectionsData.map((item: CollectionMetadata) => ({
          ...item,
          category: 'collections' as const,
        }))
      ),
    ]);

    // Enrich featured content with view/copy counts
    // Featured items need Redis stats just like the main category arrays
    for (const [category, items] of Object.entries(featuredByCategory)) {
      const enrichedItems = await statsRedis.enrichWithAllCounts(items as UnifiedContentItem[]);
      enrichedFeaturedByCategory[category] = enrichedItems as UnifiedContentItem[];
    }
  } catch (error) {
    // Log error and fallback to data without enrichment
    logger.error(
      'Failed to enrich content with stats',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'enrichWithStats',
      }
    );

    // Fallback for featured content - use unenriched data
    enrichedFeaturedByCategory = featuredByCategory as Record<string, UnifiedContentItem[]>;

    // Graceful degradation: use base metadata with default counts (0)
    rules = rulesData.map((item) => ({
      ...item,
      category: 'rules' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    mcp = mcpData.map((item) => ({
      ...item,
      category: 'mcp' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    agents = agentsData.map((item) => ({
      ...item,
      category: 'agents' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    commands = commandsData.map((item) => ({
      ...item,
      category: 'commands' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    hooks = hooksData.map((item) => ({
      ...item,
      category: 'hooks' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    statuslines = statuslinesData.map((item) => ({
      ...item,
      category: 'statuslines' as const,
      viewCount: 0,
      copyCount: 0,
    }));
    collections = collectionsData.map((item) => ({
      ...item,
      category: 'collections' as const,
      viewCount: 0,
      copyCount: 0,
    }));
  }

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
  const allConfigsMap = new Map(
    allConfigsWithDuplicates.map((item: { slug: string }) => [item.slug, item])
  );
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
      {/* Hero + Search Section */}
      <div className="relative overflow-hidden">
        {/* Meteors Background Layer - Constrained to viewport height */}
        <div className="absolute inset-0 max-h-screen pointer-events-none z-[1]">
          <Meteors
            number={20}
            minDelay={0}
            maxDelay={3}
            minDuration={3}
            maxDuration={8}
            angle={35}
          />
        </div>

        {/* Static Hero Section - Server Rendered */}
        <section
          className={`relative ${UI_CLASSES.Z_10} ${UI_CLASSES.BORDER_B} border-border/50`}
          aria-label="Homepage hero"
        >
          {/* Content Layer - Above meteors */}
          <div className={`relative container ${UI_CLASSES.MX_AUTO} px-4 py-10 sm:py-16 lg:py-24`}>
            <div className={`text-center ${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground tracking-tight">
                The home for Claude{' '}
                <RollingText
                  words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                  duration={3000}
                  className="text-accent"
                />
              </h1>

              <p
                className={`text-base sm:text-lg lg:text-xl text-muted-foreground ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}
              >
                Discover and share the best Claude configurations. Explore expert rules, browse
                powerful MCP servers, find specialized agents and commands, discover automation
                hooks, and connect with the community building the future of AI.
              </p>
            </div>
          </div>
        </section>

        {/* Client Component for Interactive Features (Search, etc) */}
        <div className={`relative ${UI_CLASSES.Z_10}`}>
          <HomePageClient
            initialData={initialData}
            initialSearchQuery={initialSearchQuery}
            featuredByCategory={enrichedFeaturedByCategory}
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
        </div>
      </div>

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
