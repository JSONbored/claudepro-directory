/**
 * Unified Detail Page - Server-rendered content with streaming SSR
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { Constants, type Database } from '@heyclaude/database-types';
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
} from '@heyclaude/web-runtime/data';
import { 
  highlightCode,
  detectLanguage,
  generateFilename,
  generateHookFilename,
  extractMarkdownHeadings,
} from '@heyclaude/shared-runtime';
import { extractCodeBlocksFromMarkdown, type ExtractedCodeBlock } from '@heyclaude/web-runtime';
import type {
  ContentItem,
  ContentHeadingMetadata,
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
import { DetailQuickActionsBar } from './detail-quick-actions-bar';
import { DetailToc } from './detail-toc';
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
  relatedItemsPromise?: Promise<
    | ContentItem[]
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['related']
  >;
  viewCountPromise?: Promise<number>;
  copyCountPromise?: Promise<number>;
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
  copyCountPromise,
}: {
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']);
  viewCountPromise: Promise<number>;
  copyCount?: number;
  copyCountPromise?: Promise<number>;
}) {
  const [viewCount, resolvedCopyCount] = await Promise.all([
    viewCountPromise,
    copyCountPromise ? copyCountPromise : Promise.resolve(copyCount),
  ]);
  return <DetailMetadata item={item} viewCount={viewCount} copyCount={resolvedCopyCount} />;
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
  relatedItemsPromise: Promise<
    | ContentItem[]
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['related']
  >;
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
  copyCountPromise,
  collectionSections,
  tabsEnabled = false,
}: UnifiedDetailPageProps) {
  const category: Database['public']['Enums']['content_category'] = isValidCategory(item.category)
    ? item.category
    : Constants.public.Enums.content_category[0]; // 'agents'
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

  const quickActionsPackageName =
    typeof metadata['package'] === 'string' ? (metadata['package'] as string) : null;
  const quickActionsMcpServers =
    metadata['mcpServers'] && typeof metadata['mcpServers'] === 'object'
      ? (metadata['mcpServers'] as Record<string, unknown>)
      : null;
  const quickActionsConfiguration =
    metadata['configuration'] && typeof metadata['configuration'] === 'object'
      ? (metadata['configuration'] as Record<string, unknown>)
      : null;
  const shouldRenderQuickActionsBar =
    Boolean(quickActionsPackageName) ||
    Boolean(quickActionsMcpServers) ||
    Boolean(quickActionsConfiguration);

  // Parallelize independent preprocessing blocks to reduce TTFB
  // Start all promises first, then await them together
  const contentDataPromise = (async (): Promise<
    | {
        html: string;
        code: string;
        language: string;
        filename: string;
        headings?: ContentHeadingMetadata[];
        markdownBefore?: string;
        markdownAfter?: string;
      }
    | Array<{
        html: string;
        code: string;
        language: string;
        filename: string;
        headings?: ContentHeadingMetadata[];
        markdownBefore?: string;
        markdownAfter?: string;
      }>
    | null
  > => {
    // GUIDES: Skip content processing - structured sections rendered separately
    if (item.category === Constants.public.Enums.content_category[7]) { // 'guides'
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
      // Parse markdown to extract individual code blocks
      const codeBlocks = extractCodeBlocksFromMarkdown(content);
      
      // If we found code blocks, process each separately using shared-runtime utilities
      if (codeBlocks.length > 0) {
        const processedBlocks = codeBlocks.map((block: ExtractedCodeBlock, index: number) => {
          try {
            // Use shared-runtime utilities directly (no edge function call)
            const detectedLanguage = detectLanguage(
              block.code,
              block.language !== 'text' ? block.language : undefined
            );
            const generatedFilename = generateFilename({
              item: {
                category: item.category,
                slug: item.slug ?? null,
                name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
                hook_type:
                  'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
              },
              language: detectedLanguage,
            });
            const highlightedHtml = highlightCode(block.code, detectedLanguage, {
              showLineNumbers: true,
            });
            const headings = extractMarkdownHeadings(block.code);
            // Map HeadingMetadata to ContentHeadingMetadata (same structure)
            const contentHeadings: ContentHeadingMetadata[] | undefined = headings.length > 0 ? headings.map(h => ({
              id: h.id,
              anchor: h.anchor,
              title: h.title,
              level: h.level,
            })) : undefined;

            return {
              html: highlightedHtml,
              code: block.code,
              language: detectedLanguage,
              filename: generatedFilename || `${item.slug || 'code'}-${index + 1}.txt`,
              ...(contentHeadings && { headings: contentHeadings }),
              markdownBefore: block.markdownBefore,
              markdownAfter: block.markdownAfter,
            };
          } catch (error) {
            logDetailProcessingWarning('contentData.codeBlock', error, item);
            return null;
          }
        });

        // Filter out null results and return array
        const validBlocks = processedBlocks.filter(
          (block: typeof processedBlocks[0] | null): block is NonNullable<typeof processedBlocks[0]> => block !== null
        );

        return validBlocks.length > 0 ? (validBlocks as Array<{
          html: string;
          code: string;
          language: string;
          filename: string;
          headings?: ContentHeadingMetadata[];
          markdownBefore?: string;
          markdownAfter?: string;
        }>) : null;
      }

      // Fallback: If no code blocks found, process entire content as single block
      const languageHint =
        'language' in item ? (item as { language?: string }).language : undefined;

      // Use shared-runtime utilities directly (no edge function call)
      const detectedLanguage = detectLanguage(content, languageHint);
      const generatedFilename = generateFilename({
        item: {
          category: item.category,
          slug: item.slug ?? null,
          name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
          hook_type:
            'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
        },
        language: detectedLanguage,
      });
      const highlightedHtml = highlightCode(content, detectedLanguage, {
        showLineNumbers: true,
      });
      const headings = extractMarkdownHeadings(content);
      // Map HeadingMetadata to ContentHeadingMetadata (same structure)
      const contentHeadings: ContentHeadingMetadata[] | undefined = headings.length > 0 ? headings.map(h => ({
        id: h.id,
        anchor: h.anchor,
        title: h.title,
        level: h.level,
      })) : undefined;

      return {
        html: highlightedHtml,
        code: content,
        language: detectedLanguage,
        filename: generatedFilename || `${item.slug || 'code'}.txt`,
        ...(contentHeadings && { headings: contentHeadings }),
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

    const format =
      item.category === Constants.public.Enums.content_category[1] // 'mcp'
        ? 'multi'
        : item.category === Constants.public.Enums.content_category[4] // 'hooks'
          ? 'hook'
          : 'json';

    // Multi-format configuration (MCP servers)
    if (format === 'multi') {
      const config = configuration as {
        claudeDesktop?: Record<string, unknown>;
        claudeCode?: Record<string, unknown>;
        http?: Record<string, unknown>;
        sse?: Record<string, unknown>;
      };

      try {
        const highlightedConfigs = Object.entries(config).map(([key, value]) => {
          if (!value) return null;

          const displayValue =
            key === 'claudeDesktop' || key === 'claudeCode'
              ? transformMcpConfigForDisplay(value as Record<string, unknown>)
              : value;

          const code = JSON.stringify(displayValue, null, 2);

          // Use shared-runtime utilities directly
          const html = highlightCode(code, 'json', { showLineNumbers: true });
          const generatedFilename = generateFilename({
            item: {
              category: item.category,
              slug: item.slug ?? null,
              name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
              hook_type:
                'hook_type' in item
                  ? ((item as { hook_type?: string }).hook_type ?? null)
                  : null,
            },
            language: 'json',
            format: 'multi',
            section: key,
          });

          return { key, html, code, filename: generatedFilename || 'config.json' };
        });

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

        // Use shared-runtime utilities directly
        const highlightedHookConfig = config.hookConfig
          ? highlightCode(JSON.stringify(config.hookConfig, null, 2), 'json', { showLineNumbers: true })
          : null;
        const highlightedScript = config.scriptContent
          ? highlightCode(config.scriptContent, 'bash', { showLineNumbers: true })
          : null;
        const hookConfigFilename = config.hookConfig
          ? generateHookFilename(itemData, 'hookConfig', 'json')
          : null;
        const scriptFilename = config.scriptContent
          ? generateHookFilename(itemData, 'scriptContent', 'bash')
          : null;

        return {
          format: 'hook' as const,
          hookConfig: highlightedHookConfig
            ? {
                html: highlightedHookConfig,
                code: JSON.stringify(config.hookConfig, null, 2),
                filename: hookConfigFilename || 'hook-config.json',
              }
            : null,
          scriptContent:
            highlightedScript && config.scriptContent
              ? {
                  html: highlightedScript,
                  code: config.scriptContent,
                  filename: scriptFilename || 'hook-script.sh',
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

      // Use shared-runtime utilities directly
      const html = highlightCode(code, 'json', { showLineNumbers: true });
      const generatedFilename = generateFilename({
        item: {
          category: item.category,
          slug: item.slug ?? null,
          name: 'name' in item ? ((item as { name?: string }).name ?? null) : null,
          hook_type:
            'hook_type' in item ? ((item as { hook_type?: string }).hook_type ?? null) : null,
        },
        language: 'json',
      });

      return {
        format: 'json' as const,
        html,
        code,
        filename: generatedFilename || 'config.json',
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

      const highlightedExamplesResults = examples.map((example) => {
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
          // Use shared-runtime utilities directly
          const html = highlightCode(example.code, example.language, { showLineNumbers: true });
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
      });

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

        // Use shared-runtime utilities directly (synchronous, no Promise.all needed)
        const claudeCodeSteps = installation.claudeCode?.steps
          ? installation.claudeCode.steps.map((step) => {
              if (isCommandStep(step)) {
                const html = highlightCode(step, 'bash', { showLineNumbers: true });
                return { type: 'command' as const, html, code: step };
              }
              return { type: 'text' as const, text: step };
            })
          : null;
        const claudeDesktopSteps = installation.claudeDesktop?.steps
          ? installation.claudeDesktop.steps.map((step) => {
              if (isCommandStep(step)) {
                const html = highlightCode(step, 'bash', { showLineNumbers: true });
                return { type: 'command' as const, html, code: step };
              }
              return { type: 'text' as const, text: step };
            })
          : null;
        const sdkSteps = installation.sdk?.steps
          ? installation.sdk.steps.map((step) => {
              if (isCommandStep(step)) {
                const html = highlightCode(step, 'bash', { showLineNumbers: true });
                return { type: 'command' as const, html, code: step };
              }
              return { type: 'text' as const, text: step };
            })
          : null;
        // Process .mcpb steps from metadata OR auto-generate if package exists
        const mcpbSteps = mcpbStepsFromMetadata.length > 0
          ? mcpbStepsFromMetadata.map((step) => {
              if (isCommandStep(step)) {
                const html = highlightCode(step, 'bash', { showLineNumbers: true });
                return { type: 'command' as const, html, code: step };
              }
              return { type: 'text' as const, text: step };
            })
          : shouldAutoGenerateMcpbSteps
            ? [
                {
                  type: 'text' as const,
                  text: 'Download the .mcpb package using the button above, then double-click the file to install in Claude Desktop.',
                },
                {
                  type: 'text' as const,
                  text: 'After installation, restart Claude Desktop to activate the MCP server.',
                },
              ]
            : null;

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
    if (item.category !== Constants.public.Enums.content_category[7]) return null; // 'guides'

    const itemMetadata = getMetadata(item);
    if (!(itemMetadata?.['sections'] && Array.isArray(itemMetadata['sections']))) {
      // Log warning if sections are missing for guides
      logger.warn('Guides content missing sections in metadata', {
        category: item.category,
        slug: item.slug,
        hasMetadata: !!itemMetadata,
        sectionsType: itemMetadata?.['sections'] ? typeof itemMetadata['sections'] : 'undefined',
      });
      return null;
    }

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
            // Use shared-runtime utilities directly
            const html = highlightCode(
              section.code,
              typeof section.language === 'string' ? section.language : 'text',
              { showLineNumbers: true }
            );
            return { ...section, html };
          } catch (error) {
            logDetailProcessingWarning('guideSections', error, item);
            return section;
          }
        }

        if (section.type === 'code_group' && section.tabs) {
          const tabs = section.tabs.map((tab) => {
            if (typeof tab.code !== 'string') {
              logDetailProcessingWarning(
                'guideSections',
                new Error(`Invalid code_group tab: code is ${typeof tab.code}`),
                item
              );
              return tab;
            }
            try {
              // Use shared-runtime utilities directly
              const html = highlightCode(
                tab.code,
                typeof tab.language === 'string' ? tab.language : 'text',
                { showLineNumbers: true }
              );
              return { ...tab, html };
            } catch (error) {
              logDetailProcessingWarning('guideSections', error, item);
              return tab;
            }
          });
          return { ...section, tabs };
        }

        if (section.type === 'steps' && section.steps) {
          const steps = section.steps.map((step) => {
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
                // Use shared-runtime utilities directly
                const html = highlightCode(
                  step.code,
                  typeof step.language === 'string' ? step.language : 'bash',
                  { showLineNumbers: true }
                );
                return { ...step, html };
              } catch (error) {
                logDetailProcessingWarning('guideSections', error, item);
                return step;
              }
            }
            return step;
          });
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

  // Extract headings from contentData (handle both single and array)
  const headingMetadata = Array.isArray(contentData)
    ? contentData.flatMap((block) => block.headings || [])
    : contentData?.headings ?? null;
  const shouldRenderDetailToc = Array.isArray(headingMetadata) && headingMetadata.length >= 3;

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

    // Extract only serializable fields from config for client components
    // The icon field is a React component and cannot be serialized
    const serializableConfig = {
      typeName: config.typeName,
      sections: config.sections,
      primaryAction: config.primaryAction,
      secondaryActions: config.secondaryActions,
    };

    return (
      <div className={'min-h-screen bg-background'}>
        <DetailHeader displayTitle={displayTitle} item={item} config={serializableConfig as typeof config} />
        {viewCountPromise ? (
          <Suspense
            fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={copyCount} />}
          >
            <ViewCountMetadata
              item={item}
              viewCountPromise={viewCountPromise}
              {...(copyCount !== undefined && { copyCount })}
              {...(copyCountPromise && { copyCountPromise })}
            />
          </Suspense>
        ) : (
          <DetailMetadata item={item} viewCount={viewCount} copyCount={copyCount} />
        )}

        {/* Main content with sidebar */}
        <div
          className="container mx-auto px-4 py-8"
          style={{ viewTransitionName: getViewTransitionName('card', item.slug) }}
        >
          <div id="detail-main-content" className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Primary content */}
            <div className="lg:col-span-2">
              <TabbedDetailLayout
                item={item}
                config={serializableConfig as typeof config}
                tabs={configuredTabs}
                sectionData={sectionData}
                relatedItems={relatedItems}
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

        <div className="container mx-auto px-4 pb-8">
          <NewsletterScrollTrigger
            source="content_page"
            {...(item.category ? { category: item.category } : {})}
          />
        </div>
      </div>
    );
  }

  // Extract only serializable fields from config for client components
  // The icon field is a React component and cannot be serialized
  const serializableConfig = {
    typeName: config.typeName,
    sections: config.sections,
    primaryAction: config.primaryAction,
    secondaryActions: config.secondaryActions,
  };

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Header - Client component for interactivity */}
      <DetailHeader displayTitle={displayTitle} item={item} config={serializableConfig as typeof config} />

      {/* Metadata - Stream view count if promise provided */}
      {viewCountPromise ? (
        <Suspense
          fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={copyCount} />}
        >
          <ViewCountMetadata
            item={item}
            viewCountPromise={viewCountPromise}
            {...(copyCount !== undefined && { copyCount })}
            {...(copyCountPromise && { copyCountPromise })}
          />
        </Suspense>
      ) : (
        <DetailMetadata item={item} viewCount={viewCount} copyCount={copyCount} />
      )}

      {shouldRenderQuickActionsBar && (
        <div className="container mx-auto px-4 pt-4">
          <DetailQuickActionsBar
            item={contentItem}
            metadata={metadata}
            packageName={quickActionsPackageName}
            configurationObject={quickActionsConfiguration}
            mcpServers={quickActionsMcpServers}
          />
        </div>
      )}

      {/* Main content */}
      <div
        className="container mx-auto px-4 py-8"
        style={{ viewTransitionName: getViewTransitionName('card', item.slug) }}
      >
        <div id="detail-main-content" className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Primary content */}
          <div className="space-y-8 lg:col-span-2">
            {shouldRenderDetailToc && <DetailToc headings={headingMetadata} />}
            {/* COLLECTIONS: Render collection-specific sections */}
            {collectionSections}

            {/* GUIDES: Render structured sections from metadata using JSONSectionRenderer */}
            {guideSections && guideSections.length > 0 && (
              <JSONSectionRenderer sections={guideSections} />
            )}

            {/* Content/Code section (non-guides) */}
            {contentData && config && (
              <>
                {Array.isArray(contentData) ? (
                  // Render multiple code blocks from markdown
                  contentData.map((block, index) => (
                    <UnifiedSection
                      key={`content-block-${index}`}
                      variant="code"
                      title={
                        index === 0
                          ? `${config.typeName} Content`
                          : `${config.typeName} Content (${index + 1})`
                      }
                      description={
                        index === 0
                          ? `The main content for this ${config.typeName.toLowerCase()}.`
                          : `Additional code example for this ${config.typeName.toLowerCase()}.`
                      }
                      html={block.html}
                      code={block.code}
                      language={block.language}
                      filename={block.filename}
                    />
                  ))
                ) : (
                  // Render single code block
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
              </>
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
