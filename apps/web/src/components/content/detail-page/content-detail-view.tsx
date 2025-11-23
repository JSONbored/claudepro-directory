/**
 * Unified Detail Page - Server-rendered content with streaming SSR
 * Uses edge function for syntax highlighting (cached, fast)
 */

import type { Database } from '@heyclaude/database-types';
import {
  ensureStringArray,
  getMetadata,
  isValidCategory,
  logger,
  normalizeError,
  transformMcpConfigForDisplay,
} from '@heyclaude/web-runtime/core';
import {
  getCategoryConfig,
  highlightCodeEdge,
  processContentEdge,
} from '@heyclaude/web-runtime/data';
import type {
  ContentItem,
  InstallationSteps,
  ProcessedSectionData,
} from '@heyclaude/web-runtime/types/component.types';
import { getDisplayTitle, getViewTransitionName } from '@heyclaude/web-runtime/ui';
import { Suspense } from 'react';
import { TabbedDetailLayout } from '@/src/components/content/detail-tabs/tabbed-detail-layout';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import UnifiedSection from '@/src/components/content/sections/unified-section';
import { ReviewListSection } from '@/src/components/core/domain/reviews/review-list-section';
import { NewsletterScrollTrigger } from '@/src/components/features/growth/newsletter/newsletter-scroll-trigger';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';
import { DetailHeader } from './detail-header';
import { DetailMetadata } from './detail-metadata';
import { DetailSidebar } from './sidebar/navigation-sidebar';

/**
 * UnifiedDetailPage is only used for content detail pages, never for jobs.
 * So we narrow the type to exclude jobs to ensure proper type safety.
 */
export interface UnifiedDetailPageProps {
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']);
  relatedItems?:
    | ContentItem[]
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['related'];
  viewCount?: number;
  copyCount?: number;
  relatedItemsPromise?: Promise<ContentItem[]>;
  viewCountPromise?: Promise<number>;
  collectionSections?: React.ReactNode;
  tabsEnabled?: boolean;
}

function logDetailProcessingWarning(
  section: string,
  error: unknown,
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row'])
): void {
  const normalized = normalizeError(error, `${section} processing failed`);
  logger.warn(`UnifiedDetailPage: ${section} processing failed`, {
    category: item.category ?? 'null',
    slug: item.slug ?? 'unknown',
    error: normalized.message,
  });
}

/**
 * Safely extracts configuration from item or metadata as a string
 */
function getConfigurationAsString(
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']),
  metadata: Record<string, unknown>
): string | null {
  // Use generated type directly (tags/features/use_cases are already text[] in database)
  const contentItem = item as Database['public']['Tables']['content']['Row'];

  // Check top-level item first
  if ('configuration' in contentItem) {
    const cfg = contentItem['configuration'];
    if (typeof cfg === 'string') return cfg;
    if (cfg != null) return JSON.stringify(cfg, null, 2);
  }

  // Fall back to metadata
  if (metadata['configuration']) {
    const cfg = metadata['configuration'];
    if (typeof cfg === 'string') return cfg;
    if (typeof cfg === 'object') return JSON.stringify(cfg, null, 2);
  }

  return null;
}

async function ViewCountMetadata({
  item,
  viewCountPromise,
  copyCount,
}: {
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']);
  viewCountPromise: Promise<number>;
  copyCount?: number;
}) {
  const viewCount = await viewCountPromise;
  return <DetailMetadata item={item} viewCount={viewCount} copyCount={copyCount} />;
}

async function SidebarWithRelated({
  item,
  relatedItemsPromise,
  config,
}: {
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']);
  relatedItemsPromise: Promise<ContentItem[]>;
  config: {
    typeName: string;
    metadata?:
      | {
          categoryLabel?: string;
          showGitHubLink?: boolean;
          githubPathPrefix?: string;
        }
      | undefined;
  };
}) {
  const relatedItems = await relatedItemsPromise;
  return <DetailSidebar item={item} relatedItems={relatedItems} config={config} />;
}

export async function UnifiedDetailPage({
  item,
  relatedItems = [],
  viewCount,
  copyCount,
  relatedItemsPromise,
  viewCountPromise,
  collectionSections,
  tabsEnabled = false,
}: UnifiedDetailPageProps) {
  const category: Database['public']['Enums']['content_category'] = isValidCategory(item.category)
    ? item.category
    : 'agents';
  const config = await getCategoryConfig(category);
  const displayTitle = getDisplayTitle(item);
  const metadata = getMetadata(item);

  // Use generated type directly (tags/features/use_cases are already text[] in database)
  const contentItem = item as Database['public']['Tables']['content']['Row'];

  const installation = (() => {
    const inst =
      ('installation' in contentItem && contentItem['installation']) || metadata['installation'];
    return inst && typeof inst === 'object' && !Array.isArray(inst)
      ? (inst as InstallationSteps)
      : undefined;
  })();

  const useCases = (() => {
    const cases = ('use_cases' in contentItem && contentItem['use_cases']) || metadata['use_cases'];
    return ensureStringArray(cases);
  })();

  const features = (() => {
    const feats = ('features' in contentItem && contentItem['features']) || metadata['features'];
    return ensureStringArray(feats);
  })();

  const troubleshooting = (() => {
    const trouble =
      ('troubleshooting' in contentItem && contentItem['troubleshooting']) ||
      metadata['troubleshooting'];
    return Array.isArray(trouble) && trouble.length > 0 ? trouble : [];
  })();

  const requirements = (() => {
    const reqs =
      ('requirements' in contentItem && contentItem['requirements']) || metadata['requirements'];
    return ensureStringArray(reqs);
  })();

  const securityItems =
    'security' in contentItem && contentItem['security']
      ? ensureStringArray(contentItem['security'])
      : [];

  // Parallelize independent preprocessing blocks to reduce TTFB
  // Start all promises first, then await them together
  const contentDataPromise = (async () => {
    // GUIDES: Skip content processing - structured sections rendered separately
    if (item.category === 'guides') {
      return null;
    }

    // Extract content from item (check top-level first, then metadata)
    let content = '';
    if ('content' in item && typeof (item as { content?: string }).content === 'string') {
      content = (item as { content: string }).content;
    } else {
      const cfg = getConfigurationAsString(item, metadata);
      if (cfg) content = cfg;
    }

    if (!content) return null;

    try {
      const languageHint =
        'language' in item ? (item as { language?: string }).language : undefined;

      // Batched processing: detectLanguage + generateFilename + highlightCodeEdge
      const result = await processContentEdge({
        operation: 'full',
        code: content,
        ...(languageHint && { languageHint }),
        item: {
          category: item.category,
          slug: item.slug ?? null,
          name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
          hook_type:
            'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
        },
      });

      if (!(result.html && result.language && result.filename)) {
        throw new Error('Content processing returned incomplete result');
      }

      return {
        html: result.html,
        code: content,
        language: result.language,
        filename: result.filename,
      };
    } catch (error) {
      logDetailProcessingWarning('contentData', error, item);
      return null;
    }
  })();

  // Pre-process configuration highlighting (ConfigurationSection data)
  const configDataPromise = (async () => {
    // Check top-level first, then metadata
    const configuration =
      ('configuration' in contentItem && contentItem['configuration']) || metadata['configuration'];
    if (!configuration) return null;

    const format = item.category === 'mcp' ? 'multi' : item.category === 'hooks' ? 'hook' : 'json';

    // Multi-format configuration (MCP servers)
    if (format === 'multi') {
      const config = configuration as {
        claudeDesktop?: Record<string, unknown>;
        claudeCode?: Record<string, unknown>;
        http?: Record<string, unknown>;
        sse?: Record<string, unknown>;
      };

      try {
        const highlightedConfigs = await Promise.all(
          Object.entries(config).map(async ([key, value]) => {
            if (!value) return null;

            const displayValue =
              key === 'claudeDesktop' || key === 'claudeCode'
                ? transformMcpConfigForDisplay(value as Record<string, unknown>)
                : value;

            const code = JSON.stringify(displayValue, null, 2);

            // Highlight code and generate filename in parallel
            const [html, filenameResult] = await Promise.all([
              highlightCodeEdge(code, { language: 'json' }),
              processContentEdge({
                operation: 'filename',
                language: 'json',
                item: {
                  category: item.category,
                  slug: item.slug ?? null,
                  name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
                  hook_type:
                    'hook_type' in item
                      ? ((item as { hook_type?: string }).hook_type ?? null)
                      : null,
                },
                format: 'multi',
                sectionKey: key,
              }),
            ]);

            return { key, html, code, filename: filenameResult.filename || 'config.json' };
          })
        );

        return {
          format: 'multi' as const,
          configs: highlightedConfigs.filter(
            (c): c is { key: string; html: string; code: string; filename: string } => c !== null
          ),
        };
      } catch (error) {
        logDetailProcessingWarning('configData.multi', error, item);
        return null;
      }
    }

    // Hook configuration format
    if (format === 'hook') {
      const config = configuration as {
        hookConfig?: { hooks?: Record<string, unknown> };
        scriptContent?: string;
      };

      try {
        const itemData = {
          category: item.category,
          slug: item.slug ?? null,
          name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
          hook_type:
            'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
        };

        const [highlightedHookConfig, highlightedScript, hookConfigFilename, scriptFilename] =
          await Promise.all([
            config.hookConfig
              ? highlightCodeEdge(JSON.stringify(config.hookConfig, null, 2), { language: 'json' })
              : Promise.resolve(null),
            config.scriptContent
              ? highlightCodeEdge(config.scriptContent, { language: 'bash' })
              : Promise.resolve(null),
            config.hookConfig
              ? processContentEdge({
                  operation: 'filename',
                  language: 'json',
                  item: itemData,
                  format: 'hook',
                  contentType: 'hookConfig',
                })
              : Promise.resolve(null),
            config.scriptContent
              ? processContentEdge({
                  operation: 'filename',
                  language: 'bash',
                  item: itemData,
                  format: 'hook',
                  contentType: 'scriptContent',
                })
              : Promise.resolve(null),
          ]);

        return {
          format: 'hook' as const,
          hookConfig: highlightedHookConfig
            ? {
                html: highlightedHookConfig,
                code: JSON.stringify(config.hookConfig, null, 2),
                filename: hookConfigFilename?.filename || 'hook-config.json',
              }
            : null,
          scriptContent:
            highlightedScript && config.scriptContent
              ? {
                  html: highlightedScript,
                  code: config.scriptContent,
                  filename: scriptFilename?.filename || 'hook-script.sh',
                }
              : null,
        };
      } catch (error) {
        logDetailProcessingWarning('configData.hook', error, item);
        return null;
      }
    }

    try {
      const code = JSON.stringify(configuration, null, 2);

      // Highlight code and generate filename in parallel
      const [html, filenameResult] = await Promise.all([
        highlightCodeEdge(code, { language: 'json' }),
        processContentEdge({
          operation: 'filename',
          language: 'json',
          item: {
            category: item.category,
            slug: item.slug ?? null,
            name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
            hook_type:
              'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
          },
        }),
      ]);

      return {
        format: 'json' as const,
        html,
        code,
        filename: filenameResult.filename || 'config.json',
      };
    } catch (error) {
      logDetailProcessingWarning('configData.json', error, item);
      return null;
    }
  })();

  // Pre-process usage examples highlighting (UsageExamplesSection data)
  const examplesDataPromise = (async () => {
    if (
      !('examples' in item && item.examples && Array.isArray(item.examples)) ||
      item.examples.length === 0 ||
      !item.examples.every((ex: unknown) => typeof ex === 'object' && ex !== null && 'code' in ex)
    ) {
      return null;
    }

    try {
      const examples = item.examples as Array<{
        title: string;
        code: string;
        language: string;
        description?: string;
      }>;

      const highlightedExamplesResults = await Promise.all(
        examples.map(async (example) => {
          // Validate required fields before processing
          if (
            typeof example.code !== 'string' ||
            typeof example.language !== 'string' ||
            typeof example.title !== 'string' ||
            example.title.trim().length === 0
          ) {
            logDetailProcessingWarning(
              'examplesData',
              new Error(
                `Invalid example entry: code=${typeof example.code}, language=${typeof example.language}, title=${typeof example.title}`
              ),
              item
            );
            return null;
          }

          try {
            const html = await highlightCodeEdge(example.code, { language: example.language });
            // Generate filename from title
            const filename = `${example.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')}.${
              {
                typescript: 'ts',
                javascript: 'js',
                json: 'json',
                bash: 'sh',
                shell: 'sh',
                python: 'py',
                yaml: 'yml',
                markdown: 'md',
                plaintext: 'txt',
              }[example.language] || 'txt'
            }`;

            return {
              title: example.title,
              ...(example.description && { description: example.description }),
              html,
              code: example.code,
              language: example.language,
              filename,
            };
          } catch (error) {
            logDetailProcessingWarning('examplesData', error, item);
            return null;
          }
        })
      );

      // Filter out null results after Promise.all resolves
      const highlightedExamples = highlightedExamplesResults.filter(
        (r): r is NonNullable<typeof r> => r !== null
      );

      return highlightedExamples;
    } catch (error) {
      logDetailProcessingWarning('examplesData', error, item);
      return null;
    }
  })();

  // Pre-process installation steps highlighting (InstallationSection data)
  const installationDataPromise = (async () => {
    if (!installation) return null;

    // Helper to detect if a step is a command (should be highlighted)
    const isCommandStep = (step: string): boolean => {
      return /^(claude|npm|npx|pnpm|yarn|git|curl|bash|sh|python|pip|brew|apt|docker|cd|mkdir|cp|mv|rm|cat|echo|export|source)\s/.test(
        step.trim()
      );
    };

    try {
      // Auto-generate .mcpb installation steps if mcpb_storage_url exists (even if not in metadata)
      const hasMcpbPackage =
        'mcpb_storage_url' in item &&
        item.mcpb_storage_url &&
        typeof item.mcpb_storage_url === 'string';
      const mcpbStepsFromMetadata = installation.mcpb?.steps || [];
      const shouldAutoGenerateMcpbSteps = hasMcpbPackage && mcpbStepsFromMetadata.length === 0;

      const [claudeCodeSteps, claudeDesktopSteps, sdkSteps, mcpbSteps] = await Promise.all([
        installation.claudeCode?.steps
          ? Promise.all(
              installation.claudeCode.steps.map(async (step) => {
                if (isCommandStep(step)) {
                  const html = await highlightCodeEdge(step, { language: 'bash' });
                  return { type: 'command' as const, html, code: step };
                }
                return { type: 'text' as const, text: step };
              })
            )
          : Promise.resolve(null),
        installation.claudeDesktop?.steps
          ? Promise.all(
              installation.claudeDesktop.steps.map(async (step) => {
                if (isCommandStep(step)) {
                  const html = await highlightCodeEdge(step, { language: 'bash' });
                  return { type: 'command' as const, html, code: step };
                }
                return { type: 'text' as const, text: step };
              })
            )
          : Promise.resolve(null),
        installation.sdk?.steps
          ? Promise.all(
              installation.sdk.steps.map(async (step) => {
                if (isCommandStep(step)) {
                  const html = await highlightCodeEdge(step, { language: 'bash' });
                  return { type: 'command' as const, html, code: step };
                }
                return { type: 'text' as const, text: step };
              })
            )
          : Promise.resolve(null),
        // Process .mcpb steps from metadata OR auto-generate if package exists
        mcpbStepsFromMetadata.length > 0
          ? Promise.all(
              mcpbStepsFromMetadata.map(async (step) => {
                if (isCommandStep(step)) {
                  const html = await highlightCodeEdge(step, { language: 'bash' });
                  return { type: 'command' as const, html, code: step };
                }
                return { type: 'text' as const, text: step };
              })
            )
          : shouldAutoGenerateMcpbSteps
            ? Promise.resolve([
                {
                  type: 'text' as const,
                  text: 'Download the .mcpb package using the button above, then double-click the file to install in Claude Desktop.',
                },
                {
                  type: 'text' as const,
                  text: 'After installation, restart Claude Desktop to activate the MCP server.',
                },
              ])
            : Promise.resolve(null),
      ]);

      return {
        claudeCode: claudeCodeSteps
          ? {
              steps: claudeCodeSteps,
              ...(installation.claudeCode?.configPath && {
                configPath: installation.claudeCode.configPath,
              }),
              ...(installation.claudeCode?.configFormat && {
                configFormat: installation.claudeCode.configFormat,
              }),
            }
          : null,
        claudeDesktop: claudeDesktopSteps
          ? {
              steps: claudeDesktopSteps,
              ...(installation.claudeDesktop?.configPath && {
                configPath: installation.claudeDesktop.configPath,
              }),
            }
          : null,
        sdk: sdkSteps ? { steps: sdkSteps } : null,
        mcpb: mcpbSteps ? { steps: mcpbSteps } : null,
        ...(installation.requirements && { requirements: installation.requirements }),
      };
    } catch (error) {
      logDetailProcessingWarning('installationData', error, item);
      return null;
    }
  })();

  // GUIDES: Pre-process sections with server-side syntax highlighting
  const guideSectionsPromise = (async (): Promise<Array<
    Record<string, unknown> & { html?: string }
  > | null> => {
    if (item.category !== 'guides') return null;

    const itemMetadata = getMetadata(item);
    if (!(itemMetadata?.['sections'] && Array.isArray(itemMetadata['sections']))) return null;

    const sections = itemMetadata['sections'] as Array<{
      type: string;
      code?: string;
      language?: string;
      tabs?: Array<{ code: string; language: string; [key: string]: unknown }>;
      steps?: Array<{ code?: string; language?: string; [key: string]: unknown }>;
      [key: string]: unknown;
    }>;

    return await Promise.all(
      sections.map(async (section) => {
        if (section.type === 'code' && section.code) {
          if (typeof section.code !== 'string') {
            logDetailProcessingWarning(
              'guideSections',
              new Error(`Invalid code section: code is ${typeof section.code}`),
              item
            );
            return section;
          }
          try {
            const html = await highlightCodeEdge(section.code, {
              language: typeof section.language === 'string' ? section.language : 'text',
            });
            return { ...section, html };
          } catch (error) {
            logDetailProcessingWarning('guideSections', error, item);
            return section;
          }
        }

        if (section.type === 'code_group' && section.tabs) {
          const tabs = await Promise.all(
            section.tabs.map(async (tab) => {
              if (typeof tab.code !== 'string') {
                logDetailProcessingWarning(
                  'guideSections',
                  new Error(`Invalid code_group tab: code is ${typeof tab.code}`),
                  item
                );
                return tab;
              }
              try {
                const html = await highlightCodeEdge(tab.code, {
                  language: typeof tab.language === 'string' ? tab.language : 'text',
                });
                return { ...tab, html };
              } catch (error) {
                logDetailProcessingWarning('guideSections', error, item);
                return tab;
              }
            })
          );
          return { ...section, tabs };
        }

        if (section.type === 'steps' && section.steps) {
          const steps = await Promise.all(
            section.steps.map(async (step) => {
              if (step.code) {
                if (typeof step.code !== 'string') {
                  logDetailProcessingWarning(
                    'guideSections',
                    new Error(`Invalid steps step: code is ${typeof step.code}`),
                    item
                  );
                  return step;
                }
                try {
                  const html = await highlightCodeEdge(step.code, {
                    language: typeof step.language === 'string' ? step.language : 'bash',
                  });
                  return { ...step, html };
                } catch (error) {
                  logDetailProcessingWarning('guideSections', error, item);
                  return step;
                }
              }
              return step;
            })
          );
          return { ...section, steps };
        }

        return section;
      })
    );
  })();

  // Await all independent preprocessing operations in parallel
  const [contentData, configData, examplesData, installationData, guideSections] =
    await Promise.all([
      contentDataPromise,
      configDataPromise,
      examplesDataPromise,
      installationDataPromise,
      guideSectionsPromise,
    ]);

  // Handle case where config is not found - AFTER ALL HOOKS
  if (!config) {
    return (
      <div className={'min-h-screen bg-background'}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-2xl">Configuration Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              No configuration found for content type: {item.category}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if we should use tabbed layout
  const configuredTabs = config.detailPage?.tabs;
  const shouldUseTabs = tabsEnabled && Array.isArray(configuredTabs) && configuredTabs.length > 0;

  // If tabs are enabled and configured, use tabbed layout
  if (shouldUseTabs && configuredTabs) {
    const sectionData: ProcessedSectionData = {
      contentData,
      configData,
      installationData,
      examplesData,
      features,
      useCases,
      requirements,
      troubleshooting,
      guideSections,
      collectionSections,
    };

    return (
      <div className={'min-h-screen bg-background'}>
        <DetailHeader displayTitle={displayTitle} item={item} config={config} />
        {viewCountPromise ? (
          <Suspense
            fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={copyCount} />}
          >
            <ViewCountMetadata
              item={item}
              viewCountPromise={viewCountPromise}
              {...(copyCount !== undefined && { copyCount })}
            />
          </Suspense>
        ) : (
          <DetailMetadata item={item} viewCount={viewCount} copyCount={copyCount} />
        )}

        <TabbedDetailLayout
          item={item}
          config={config}
          tabs={configuredTabs}
          sectionData={sectionData}
          relatedItems={relatedItems}
        />

        <div className="container mx-auto px-4 pb-8">
          <NewsletterScrollTrigger
            source="content_page"
            {...(item.category ? { category: item.category } : {})}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Header - Client component for interactivity */}
      <DetailHeader displayTitle={displayTitle} item={item} config={config} />

      {/* Metadata - Stream view count if promise provided */}
      {viewCountPromise ? (
        <Suspense
          fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={copyCount} />}
        >
          <ViewCountMetadata
            item={item}
            viewCountPromise={viewCountPromise}
            {...(copyCount !== undefined && { copyCount })}
          />
        </Suspense>
      ) : (
        <DetailMetadata item={item} viewCount={viewCount} copyCount={copyCount} />
      )}

      {/* Main content */}
      <div
        className="container mx-auto px-4 py-8"
        style={{ viewTransitionName: getViewTransitionName('card', item.slug) }}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Primary content */}
          <div className="space-y-8 lg:col-span-2">
            {/* COLLECTIONS: Render collection-specific sections */}
            {collectionSections}

            {/* GUIDES: Render structured sections from metadata using JSONSectionRenderer */}
            {guideSections && guideSections.length > 0 && (
              <JSONSectionRenderer sections={guideSections} />
            )}

            {/* Content/Code section (non-guides) */}
            {contentData && config && (
              <UnifiedSection
                variant="code"
                title={`${config.typeName} Content`}
                description={`The main content for this ${config.typeName.toLowerCase()}.`}
                html={contentData.html}
                code={contentData.code}
                language={contentData.language}
                filename={contentData.filename}
              />
            )}

            {/* Features Section */}
            {config?.sections.features && features.length > 0 && (
              <UnifiedSection
                variant="list"
                title="Features"
                description="Key capabilities and functionality"
                items={features}
                category={category}
                dotColor="bg-primary"
              />
            )}

            {/* Requirements Section */}
            {config?.sections.requirements && requirements.length > 0 && (
              <UnifiedSection
                variant="list"
                title="Requirements"
                description="Prerequisites and dependencies"
                items={requirements}
                category={category}
                dotColor="bg-orange-500"
              />
            )}

            {/* Installation Section */}
            {config?.sections.installation && installationData && (
              <UnifiedSection
                variant="installation"
                installationData={installationData}
                item={item}
              />
            )}

            {/* Configuration Section */}
            {config?.sections.configuration && configData && (
              <UnifiedSection
                variant="configuration"
                {...(configData.format === 'multi'
                  ? { format: 'multi' as const, configs: configData.configs }
                  : configData.format === 'hook'
                    ? {
                        format: 'hook' as const,
                        hookConfig: configData.hookConfig,
                        scriptContent: configData.scriptContent,
                      }
                    : {
                        format: 'json' as const,
                        html: configData.html,
                        code: configData.code,
                        filename: configData.filename,
                      })}
              />
            )}

            {/* Use Cases Section */}
            {config?.sections.use_cases && useCases.length > 0 && (
              <UnifiedSection
                variant="list"
                title="Use Cases"
                description="Common scenarios and applications"
                items={useCases}
                category={category}
                dotColor="bg-accent"
              />
            )}

            {/* Security Section (MCP-specific) */}
            {config?.sections.security && securityItems.length > 0 && (
              <UnifiedSection
                variant="list"
                title="Security Best Practices"
                description="Important security considerations"
                items={securityItems}
                category={category}
                dotColor="bg-orange-500"
              />
            )}

            {/* Troubleshooting Section */}
            {config?.sections.troubleshooting && troubleshooting.length > 0 && (
              <UnifiedSection
                variant="enhanced-list"
                title="Troubleshooting"
                description="Common issues and solutions"
                items={troubleshooting as Array<string | { issue: string; solution: string }>}
                dotColor="bg-red-500"
              />
            )}

            {/* Usage Examples Section - GitHub-style code snippets with syntax highlighting */}
            {config?.sections.examples && examplesData && examplesData.length > 0 && (
              <UnifiedSection variant="examples" examples={examplesData} />
            )}

            {/* Reviews & Ratings Section */}
            {isValidCategory(item.category) && item.category && item.slug && (
              <div className="mt-12 border-t pt-12">
                <ReviewListSection contentType={item.category} contentSlug={item.slug} />
              </div>
            )}

            {/* Email CTA - Scroll-triggered variant for better engagement */}
            <NewsletterScrollTrigger
              source="content_page"
              {...(item.category ? { category: item.category } : {})}
            />
          </div>

          {/* Sidebars - Related content + Recently Viewed */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Detail Sidebar - Related content */}
            {relatedItemsPromise && config ? (
              <Suspense
                fallback={
                  <DetailSidebar
                    item={item}
                    relatedItems={[]}
                    config={{
                      typeName: config.typeName,
                      metadata: config.metadata,
                    }}
                  />
                }
              >
                <SidebarWithRelated
                  item={item}
                  relatedItemsPromise={relatedItemsPromise}
                  config={{
                    typeName: config.typeName,
                    metadata: config.metadata,
                  }}
                />
              </Suspense>
            ) : config ? (
              <DetailSidebar
                item={item}
                relatedItems={relatedItems}
                config={{
                  typeName: config.typeName,
                  metadata: config.metadata,
                }}
              />
            ) : null}

            {/* Recently Viewed Sidebar */}
            <RecentlyViewedSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
