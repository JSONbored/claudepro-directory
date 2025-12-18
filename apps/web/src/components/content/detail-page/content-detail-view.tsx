/**
 * Unified Detail Page - Server-rendered content with streaming SSR
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { ContentCategory } from '@heyclaude/data-layer/prisma';
import type { contentModel, content_category } from '@heyclaude/data-layer/prisma';
import type { GetContentDetailCompleteReturns } from '@heyclaude/database-types/postgres-types';
import {
  highlightCode,
  detectLanguage,
  generateFilename,
  generateHookFilename,
  extractMarkdownHeadings,
} from '@heyclaude/shared-runtime';
import { extractCodeBlocksFromMarkdown, type ExtractedCodeBlock } from '@heyclaude/web-runtime/utils/markdown-code-extractor';
import {
  ensureStringArray,
  getMetadata,
} from '@heyclaude/web-runtime/utils/content-helpers';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { transformMcpConfigForDisplay } from '@heyclaude/web-runtime/content';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  type ContentItem,
  type ContentHeadingMetadata,
  type InstallationSteps,
  type ProcessedSectionData,
} from '@heyclaude/web-runtime/types/component.types';
import { getDisplayTitle, getViewTransitionName } from '@heyclaude/web-runtime/ui';
import { Suspense } from 'react';

import { TabbedDetailLayout } from '@/src/components/content/detail-tabs/tabbed-detail-layout';
import type { SerializableActionType } from '@/src/components/content/detail-page/detail-header-actions';
import dynamic from 'next/dynamic';

// Lazy load large components to reduce initial bundle size
const JSONSectionRenderer = dynamic(
  () => import('@/src/components/content/json-to-sections').then((mod) => ({ default: mod.JSONSectionRenderer })),
  { ssr: true }
);

const UnifiedSection = dynamic(
  () => import('@/src/components/content/sections/unified-section'),
  { ssr: true }
);
// Dynamic import for ReviewListSection (624 lines) - lazy load for code splitting
const ReviewListSection = dynamic(
  () => import('@/src/components/core/domain/reviews/review-list-section').then((mod) => ({ default: mod.ReviewListSection })),
  { ssr: true }
);
import { NewsletterScrollTrigger } from '@/src/components/features/growth/newsletter/newsletter-scroll-trigger';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';

import { DetailHeader } from './detail-header';
import { DetailMetadata } from './detail-metadata';
import { DetailQuickActionsBar } from './detail-quick-actions-bar';
// Dynamic import for DetailSidebar (557 lines) - lazy load for code splitting
const DetailSidebar = dynamic(
  () => import('./sidebar/navigation-sidebar').then((mod) => ({ default: mod.DetailSidebar })),
  { ssr: true }
);
import { SidebarToc } from './sidebar-toc';
import { ScrollAwareToc } from './scroll-aware-toc';

/**
 * UnifiedDetailPage is only used for content detail pages, never for jobs.
 * So we narrow the type to exclude jobs to ensure proper type safety.
 */
export interface UnifiedDetailPageProps {
  collectionSections?: React.ReactNode;
  copyCount?: number;
  copyCountPromise?: Promise<number>;
  item:
    | (GetContentDetailCompleteReturns['content'] & contentModel)
    | contentModel;
  relatedItems?:
    | ContentItem[]
    | GetContentDetailCompleteReturns['related'];
  relatedItemsPromise?: Promise<
    | ContentItem[]
    | GetContentDetailCompleteReturns['related']
  >;
  tabsEnabled?: boolean;
  viewCount?: number;
  viewCountPromise?: Promise<number>;
}

/**
 * Log a standardized warning when processing of a detail page section fails.
 *
 * Normalizes the provided error and emits a warning with the section name, the item's category and slug, and the normalized error message.
 *
 * @param section - Human-readable name of the section that failed (e.g., "configuration", "examples")
 * @param error - The original error thrown or received during processing
 * @param item - Content item being processed; used to include `category` and `slug` in the log context
 *
 * @see normalizeError
 * @see logger
 * @see UnifiedDetailPage
 */
function logDetailProcessingWarning(
  section: string,
  error: unknown,
  item:
    | (GetContentDetailCompleteReturns['content'] & contentModel)
    | contentModel
): void {
  const normalized = normalizeError(error, `${section} processing failed`);
  logger.warn(
    {
      category: item.category ?? 'null',
      slug: item.slug ?? 'unknown',
      err: normalized,
    },
    `UnifiedDetailPage: ${section} processing failed`
  );
}

/**
 * Retrieve the configuration value from a content item or its metadata as a string.
 *
 * Checks the top-level `configuration` field on the provided `item` first; if present and not a string,
 * it JSON-stringifies the value with 2-space indentation. If not found on the item, it attempts the same
 * extraction from `metadata.configuration`. Returns `null` when no configuration is present.
 *
 * @param item - Content row (either a fully-joined content result or a plain content table row) to read `configuration` from
 * @param metadata - Associated metadata object which may contain a `configuration` entry
 * @returns The configuration serialized as a string, or `null` if no configuration is available
 */
function getConfigurationAsString(
  item:
    | (GetContentDetailCompleteReturns['content'] & contentModel)
    | contentModel,
  metadata: Record<string, unknown>
): null | string {
  // Type narrowing: Both union members have 'configuration' property
  // Check top-level item first
  if ('configuration' in item) {
    const cfg = item['configuration'];
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

/**
 * Renders DetailMetadata after resolving the view count and optional copy count.
 *
 * Awaits `viewCountPromise` and either `copyCountPromise` or the provided `copyCount`, then returns a DetailMetadata element with those resolved counts.
 *
 * @param item - Content row data used to render metadata (can be the expanded content return type or a raw content table row).
 * @param viewCountPromise - Promise resolving to the number of views for the content item.
 * @param copyCount - Optional pre-resolved number of times the content was copied; used if `copyCountPromise` is not provided.
 * @param copyCountPromise - Optional promise resolving to the copy count; takes precedence over `copyCount` when provided.
 * @returns The DetailMetadata React element populated with `viewCount` and `copyCount`.
 *
 * @see DetailMetadata
 */
async function ViewCountMetadata({
  item,
  viewCountPromise,
  copyCount,
  copyCountPromise,
}: {
  copyCount?: number;
  copyCountPromise?: Promise<number>;
  item:
    | (GetContentDetailCompleteReturns['content'] & contentModel)
    | contentModel;
  viewCountPromise: Promise<number>;
}) {
  const [viewCount, resolvedCopyCount] = await Promise.all([
    viewCountPromise,
    copyCountPromise ? copyCountPromise : Promise.resolve(copyCount),
  ]);
  return <DetailMetadata item={item} viewCount={viewCount} copyCount={resolvedCopyCount} />;
}

/**
 * Render a DetailSidebar for a content item after resolving its related items.
 *
 * @param item - The content row or expanded content detail to display in the sidebar.
 * @param relatedItemsPromise - Promise that resolves to the list of related content items.
 * @param config - Sidebar configuration including `typeName` and optional display metadata:
 *                 `categoryLabel`, `showGitHubLink`, and `githubPathPrefix`.
 * @returns The DetailSidebar React node populated with the resolved related items.
 *
 * @see DetailSidebar
 */
async function SidebarWithRelated({
  item,
  relatedItemsPromise,
  config,
}: {
  config: {
    metadata?:
      | undefined
      | {
          categoryLabel?: string;
          githubPathPrefix?: string;
          showGitHubLink?: boolean;
        };
    typeName: string;
  };
  item:
    | (GetContentDetailCompleteReturns['content'] & contentModel)
    | contentModel;
  relatedItemsPromise: Promise<
    | ContentItem[]
    | GetContentDetailCompleteReturns['related']
  >;
}) {
  const relatedItems = await relatedItemsPromise;
  return (
    <Suspense fallback={<div className="h-64" />}>
      <DetailSidebar item={item} relatedItems={relatedItems} config={config} />
    </Suspense>
  );
}

/**
 * Render the detail page for a content item, composing header, metadata, main content sections, and sidebars.
 *
 * @param props.item - Content row or expanded content detail used to build the page; used to derive title, metadata, content, and configuration.
 * @param props.relatedItems - Eagerly provided related items to display in the sidebar.
 * @param props.viewCount - Optional pre-fetched view count to render immediately in metadata.
 * @param props.copyCount - Optional pre-fetched copy count to render immediately in metadata.
 * @param props.relatedItemsPromise - Optional promise resolving to related items for streaming into the sidebar.
 * @param props.viewCountPromise - Optional promise resolving to the view count for streaming into metadata.
 * @param props.copyCountPromise - Optional promise resolving to the copy count for streaming into metadata.
 * @param props.collectionSections - Optional React node containing collection-specific sections to include in the main content.
 * @param props.tabsEnabled - When true and the category configuration defines tabs, render the tabbed layout instead of the default linear layout.
 * @returns The JSX element for the rendered detail page for the provided content item.
 *
 * @see getCategoryConfig
 * @see highlightCode
 * @see extractCodeBlocksFromMarkdown
 */
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
  const category: content_category = isValidCategory(item.category)
    ? item.category
    : ContentCategory.agents; // 'agents'
  const config = await getCategoryConfig(category);
  const displayTitle = getDisplayTitle(item);
  const metadata = getMetadata(item);

  // Type narrowing: Both union members are compatible, no assertion needed
  // TypeScript can infer the correct type from property access

  // Helper: Extract field from item or metadata with type safety
  const getField = <T,>(field: string, transform: (val: unknown) => T): T => {
    const value = (field in item && item[field as keyof typeof item]) || metadata[field];
    return transform(value);
  };

  // Extract all data fields efficiently (replaces 6 IIFEs with cleaner helper)
  const installation = getField<InstallationSteps | undefined>('installation', (val) => 
    val && typeof val === 'object' && !Array.isArray(val) ? val as InstallationSteps : undefined
  );
  const useCases = getField<string[]>('use_cases', ensureStringArray);
  const features = getField<string[]>('features', ensureStringArray);
  const troubleshooting = getField<Array<string | { answer: string; question: string } | { issue: string; solution: string }>>('troubleshooting', (val) => 
    Array.isArray(val) && val.length > 0 ? val as Array<string | { answer: string; question: string } | { issue: string; solution: string }> : []
  );
  const requirements = getField<string[]>('requirements', ensureStringArray);
  const securityItems = getField<string[]>('security', ensureStringArray);

  const quickActionsPackageName =
    typeof metadata['package'] === 'string' ? metadata['package'] : null;
  // Type narrowing: Check if metadata values are objects (Record<string, unknown>)
  // Type guard function to safely convert to Record<string, unknown>
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  
  const quickActionsMcpServers = isRecord(metadata['mcpServers']) ? metadata['mcpServers'] : null;
  const quickActionsConfiguration = isRecord(metadata['configuration']) ? metadata['configuration'] : null;
  const shouldRenderQuickActionsBar =
    Boolean(quickActionsPackageName) ||
    Boolean(quickActionsMcpServers) ||
    Boolean(quickActionsConfiguration);

  // Parallelize independent preprocessing blocks to reduce TTFB
  // Start all promises first, then await them together
  const contentDataPromise = (async (): Promise<
    | Array<{
        code: string;
        filename: string;
        headings?: ContentHeadingMetadata[];
        html: string;
        language: string;
        markdownAfter?: string;
        markdownBefore?: string;
      }>
    | null
    | {
        code: string;
        filename: string;
        headings?: ContentHeadingMetadata[];
        html: string;
        language: string;
        markdownAfter?: string;
        markdownBefore?: string;
      }
  > => {
    // GUIDES: Skip content processing - structured sections rendered separately
    if (item.category === ContentCategory.guides) {
      // 'guides'
      return null;
    }

    // Extract content from item (check top-level first, then metadata)
    let content = '';
    // Type narrowing: Check if item has content property and it's a string
    if ('content' in item && typeof item.content === 'string') {
      content = item.content;
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
        const processedBlocks = await Promise.all(
          codeBlocks.map(async (block: ExtractedCodeBlock, index: number) => {
            try {
              // Use shared-runtime utilities directly (no edge function call)
              const detectedLanguage = detectLanguage(
                block.code,
                block.language === 'text' ? undefined : block.language
              );
              const generatedFilename = generateFilename({
                item: {
                  category: item.category,
                  slug: item.slug ?? null,
                  name: ('name' in item && typeof item['name'] === 'string') ? item['name'] : null,
                  hook_type: ('hook_type' in item && typeof item['hook_type'] === 'string') ? item['hook_type'] : null,
                },
                language: detectedLanguage,
              });
              const highlightedHtml = await highlightCode(block.code, detectedLanguage, {
                showLineNumbers: true,
              });
              const headings = extractMarkdownHeadings(block.code);
              // Map HeadingMetadata to ContentHeadingMetadata (same structure)
              const contentHeadings: ContentHeadingMetadata[] | undefined =
                headings.length > 0
                  ? headings.map((h: { id: string; anchor: string; title: string; level: number }) => ({
                      id: h.id,
                      anchor: h.anchor,
                      title: h.title,
                      level: h.level,
                    }))
                  : undefined;

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
          })
        );

        // Filter out null results and return array
        const validBlocks = processedBlocks.filter(
          (
            block: (typeof processedBlocks)[0] | null
          ): block is NonNullable<(typeof processedBlocks)[0]> => block !== null
        );

        // Type narrowing: validBlocks is already filtered to non-null and properly typed
        // Map to ensure correct type structure matching ProcessedSectionData['contentData']
        type ProcessedBlock = {
          code: string;
          filename: string;
          headings?: ContentHeadingMetadata[];
          html: string;
          language: string;
          markdownAfter?: string;
          markdownBefore?: string;
        };
        const typedBlocks: ProcessedBlock[] = validBlocks.map((block: NonNullable<(typeof processedBlocks)[0]>) => {
          const result: ProcessedBlock = {
            code: block.code,
            filename: block.filename,
            html: block.html,
            language: block.language,
          };
          if (block.headings !== undefined && block.headings !== null) {
            result.headings = block.headings;
          }
          if (block.markdownAfter !== undefined && block.markdownAfter !== null) {
            result.markdownAfter = block.markdownAfter;
          }
          if (block.markdownBefore !== undefined && block.markdownBefore !== null) {
            result.markdownBefore = block.markdownBefore;
          }
          return result;
        });
        // Return type must match ProcessedSectionData['contentData'] which is a union
        // of single object, array, or null
        if (typedBlocks.length === 0) {
          return null;
        }
        // Type assertion needed here because TypeScript can't narrow the union properly
        // but we know the types match exactly
        if (typedBlocks.length === 1) {
          return typedBlocks[0]! satisfies ProcessedSectionData['contentData'];
        }
        return typedBlocks satisfies ProcessedSectionData['contentData'];
      }

      // Fallback: If no code blocks found, process entire content as single block
      const languageHint = ('language' in item && typeof item['language'] === 'string') ? item['language'] : undefined;

      // Use shared-runtime utilities directly (no edge function call)
      const detectedLanguage = detectLanguage(content, languageHint);
      const generatedFilename = generateFilename({
        item: {
          category: item.category,
          slug: item.slug ?? null,
                  name: ('name' in item && typeof item['name'] === 'string') ? item['name'] : null,
                  hook_type: ('hook_type' in item && typeof item['hook_type'] === 'string') ? item['hook_type'] : null,
        },
        language: detectedLanguage,
      });
      const highlightedHtml = await highlightCode(content, detectedLanguage, {
        showLineNumbers: true,
      });
      const headings = extractMarkdownHeadings(content);
      // Map HeadingMetadata to ContentHeadingMetadata (same structure)
      const contentHeadings: ContentHeadingMetadata[] | undefined =
        headings.length > 0
          ? headings.map((h: { id: string; anchor: string; title: string; level: number }) => ({
              id: h.id,
              anchor: h.anchor,
              title: h.title,
              level: h.level,
            }))
          : undefined;

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
      ('configuration' in item && item['configuration']) || metadata['configuration'];
    if (!configuration) return null;

    const format =
      item.category === ContentCategory.mcp // 'mcp'
        ? 'multi'
        : item.category === ContentCategory.hooks // 'hooks'
          ? 'hook'
          : 'json';

    // Multi-format configuration (MCP servers)
    if (format === 'multi') {
      // Type narrowing: configuration is already validated as object
      const config = configuration satisfies {
        claudeCode?: Record<string, unknown>;
        claudeDesktop?: Record<string, unknown>;
        http?: Record<string, unknown>;
        sse?: Record<string, unknown>;
      };

      try {
        const highlightedConfigs = await Promise.all(
          Object.entries(config).map(async ([key, value]) => {
            if (!value) return null;

            const displayValue =
              key === 'claudeDesktop' || key === 'claudeCode'
                ? transformMcpConfigForDisplay(value)
                : value;

            const code = JSON.stringify(displayValue, null, 2);

            // Use shared-runtime utilities directly
            const html = await highlightCode(code, 'json', { showLineNumbers: true });
            const generatedFilename = generateFilename({
              item: {
                category: item.category,
                slug: item.slug ?? null,
                  name: ('name' in item && typeof item['name'] === 'string') ? item['name'] : null,
                  hook_type: ('hook_type' in item && typeof item['hook_type'] === 'string') ? item['hook_type'] : null,
              },
              language: 'json',
              format: 'multi',
              section: key,
            });

            return { key, html, code, filename: generatedFilename || 'config.json' };
          })
        );

        return {
          format: 'multi' as const,
          configs: highlightedConfigs.filter(
            (c): c is { code: string; filename: string; html: string; key: string } => c !== null
          ),
        };
      } catch (error) {
        logDetailProcessingWarning('configData.multi', error, item);
        return null;
      }
    }

    // Hook configuration format
    if (format === 'hook') {
      // Type narrowing: configuration is already validated as object
      // Extract properties safely - need to check configuration is object before using 'in'
      const hookConfigRaw = typeof configuration === 'object' && configuration !== null && !Array.isArray(configuration) && 'hookConfig' in configuration
        ? configuration['hookConfig']
        : undefined;
      const scriptContentRaw = typeof configuration === 'object' && configuration !== null && !Array.isArray(configuration) && 'scriptContent' in configuration && typeof configuration['scriptContent'] === 'string'
        ? configuration['scriptContent']
        : undefined;
      
      // Type guard for hookConfig
      function isHookConfig(value: unknown): value is { hooks?: Record<string, unknown> } {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      }
      const hookConfig = isHookConfig(hookConfigRaw) ? hookConfigRaw : undefined;

      try {
        const itemData = {
          category: item.category,
          slug: item.slug ?? null,
                  name: ('name' in item && typeof item['name'] === 'string') ? item['name'] : null,
                  hook_type: ('hook_type' in item && typeof item['hook_type'] === 'string') ? item['hook_type'] : null,
        };

        // Use shared-runtime utilities directly
        const [highlightedHookConfig, highlightedScript] = await Promise.all([
          hookConfig
            ? highlightCode(JSON.stringify(hookConfig, null, 2), 'json', {
                showLineNumbers: true,
              })
            : Promise.resolve(null),
          scriptContentRaw
            ? highlightCode(scriptContentRaw, 'bash', { showLineNumbers: true })
            : Promise.resolve(null),
        ]);
        const hookConfigFilename = hookConfig
          ? generateHookFilename(itemData, 'hookConfig', 'json')
          : null;
        const scriptFilename = scriptContentRaw
          ? generateHookFilename(itemData, 'scriptContent', 'bash')
          : null;

        return {
          format: 'hook' as const,
          hookConfig: highlightedHookConfig && hookConfig
            ? {
                html: highlightedHookConfig,
                code: JSON.stringify(hookConfig, null, 2),
                filename: hookConfigFilename || 'hook-config.json',
              }
            : null,
          scriptContent:
            highlightedScript && scriptContentRaw
              ? {
                  html: highlightedScript,
                  code: scriptContentRaw,
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
      const html = await highlightCode(code, 'json', { showLineNumbers: true });
      const generatedFilename = generateFilename({
        item: {
          category: item.category,
          slug: item.slug ?? null,
                  name: ('name' in item && typeof item['name'] === 'string') ? item['name'] : null,
                  hook_type: ('hook_type' in item && typeof item['hook_type'] === 'string') ? item['hook_type'] : null,
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
  // item.examples is PrismaJson.ContentExamples | null, which is Array<{ title, code, language, description? }>
  const examplesDataPromise = (async () => {
    if (
      !('examples' in item && item.examples && Array.isArray(item.examples)) ||
      item.examples.length === 0 ||
      !item.examples.every((ex: unknown) => typeof ex === 'object' && ex !== null && 'code' in ex)
    ) {
      return null;
    }

    try {
      // Type narrowing: examples is validated as array, further validation in map()
      if (!Array.isArray(item.examples)) {
        return null;
      }
      // Type narrowing: examples is validated as array, further validation in map()
      if (!Array.isArray(item.examples)) {
        return null;
      }
      const examples = item.examples;

      // Type guard for example objects
      type ValidExample = {
        code: string;
        language: string;
        title: string;
        description?: string;
      };
      function isValidExample(value: unknown): value is ValidExample {
        return (
          typeof value === 'object' &&
          value !== null &&
          'code' in value &&
          typeof value.code === 'string' &&
          'language' in value &&
          typeof value.language === 'string' &&
          'title' in value &&
          typeof value.title === 'string' &&
          value.title.trim().length > 0 &&
          (!('description' in value) || typeof value.description === 'string')
        );
      }

      const highlightedExamplesResults = await Promise.all(
        examples.map(async (example) => {
          // Validate required fields before processing
          if (!isValidExample(example)) {
            // Type guard for error message - example is already validated as object in isValidExample
            const exampleRecord: Record<string, unknown> = typeof example === 'object' && example !== null && !Array.isArray(example) ? example : {};
            logDetailProcessingWarning(
              'examplesData',
              new Error(
                `Invalid example entry: code=${typeof exampleRecord['code']}, language=${typeof exampleRecord['language']}, title=${typeof exampleRecord['title']}`
              ),
              item
            );
            return null;
          }

          try {
            // Use shared-runtime utilities directly
            const html = await highlightCode(example.code, example.language, { showLineNumbers: true });
            // Generate filename from title
            const languageExtensionMap: Record<string, string> = {
              typescript: 'ts',
              javascript: 'js',
              json: 'json',
              bash: 'sh',
              shell: 'sh',
              python: 'py',
              yaml: 'yml',
              markdown: 'md',
              plaintext: 'txt',
            };
            const extension = languageExtensionMap[example.language] || 'txt';
            const filename = `${example.title
              .toLowerCase()
              .replaceAll(/[^a-z0-9]+/g, '-')
              .replaceAll(/^-+|-+$/g, '')}.${extension}`;

            return {
              // Type narrowing: Already validated above that these are strings
              title: example.title,
              ...(example.description && typeof example.description === 'string' ? { description: example.description } : {}),
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
        (r: unknown): r is NonNullable<typeof highlightedExamplesResults[0]> => r !== null
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
      const mcpbStepsFromMetadata = ('mcpb' in installation && installation.mcpb && typeof installation.mcpb === 'object' && !Array.isArray(installation.mcpb) && 'steps' in installation.mcpb && Array.isArray(installation.mcpb.steps))
        ? installation.mcpb.steps
        : [];
      const shouldAutoGenerateMcpbSteps = hasMcpbPackage && mcpbStepsFromMetadata.length === 0;

      // Use shared-runtime utilities directly (async, need Promise.all)
      const processSteps = async (steps: string[]) => {
        return Promise.all(
          steps.map(async (step) => {
            if (isCommandStep(step)) {
              const html = await highlightCode(step, 'bash', { showLineNumbers: true });
              return { type: 'command' as const, html, code: step };
            }
            return { type: 'text' as const, text: step };
          })
        );
      };

      // Type guards for installation properties
      const claudeCodeStepsRaw = ('claudeCode' in installation && installation.claudeCode && typeof installation.claudeCode === 'object' && !Array.isArray(installation.claudeCode) && 'steps' in installation.claudeCode && Array.isArray(installation.claudeCode.steps))
        ? installation.claudeCode.steps
        : null;
      const claudeDesktopStepsRaw = ('claudeDesktop' in installation && installation.claudeDesktop && typeof installation.claudeDesktop === 'object' && !Array.isArray(installation.claudeDesktop) && 'steps' in installation.claudeDesktop && Array.isArray(installation.claudeDesktop.steps))
        ? installation.claudeDesktop.steps
        : null;
      const sdkStepsRaw = ('sdk' in installation && installation.sdk && typeof installation.sdk === 'object' && !Array.isArray(installation.sdk) && 'steps' in installation.sdk && Array.isArray(installation.sdk.steps))
        ? installation.sdk.steps
        : null;

      const [claudeCodeSteps, claudeDesktopSteps, sdkSteps, mcpbSteps] = await Promise.all([
        claudeCodeStepsRaw ? processSteps(claudeCodeStepsRaw) : Promise.resolve(null),
        claudeDesktopStepsRaw ? processSteps(claudeDesktopStepsRaw) : Promise.resolve(null),
        sdkStepsRaw ? processSteps(sdkStepsRaw) : Promise.resolve(null),
        mcpbStepsFromMetadata.length > 0
          ? processSteps(mcpbStepsFromMetadata)
          : Promise.resolve(
              shouldAutoGenerateMcpbSteps
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
                : null
            ),
      ]);

      // Extract optional properties with type guards
      function isRecordStringString(value: unknown): value is Record<string, string> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      }
      const claudeCodeConfigPath = ('claudeCode' in installation && installation.claudeCode && typeof installation.claudeCode === 'object' && !Array.isArray(installation.claudeCode) && 'configPath' in installation.claudeCode && isRecordStringString(installation.claudeCode.configPath))
        ? installation.claudeCode.configPath
        : undefined;
      const claudeCodeConfigFormat = ('claudeCode' in installation && installation.claudeCode && typeof installation.claudeCode === 'object' && !Array.isArray(installation.claudeCode) && 'configFormat' in installation.claudeCode && typeof installation.claudeCode.configFormat === 'string')
        ? installation.claudeCode.configFormat
        : undefined;
      const claudeDesktopConfigPath = ('claudeDesktop' in installation && installation.claudeDesktop && typeof installation.claudeDesktop === 'object' && !Array.isArray(installation.claudeDesktop) && 'configPath' in installation.claudeDesktop && isRecordStringString(installation.claudeDesktop.configPath))
        ? installation.claudeDesktop.configPath
        : undefined;
      const installationRequirements = ('requirements' in installation && installation.requirements)
        ? installation.requirements
        : undefined;

      // Build return object matching ProcessedSectionData['installationData'] type
      const result: NonNullable<ProcessedSectionData['installationData']> = {
        claudeCode: claudeCodeSteps
          ? {
              steps: claudeCodeSteps,
              ...(claudeCodeConfigPath !== undefined && { configPath: claudeCodeConfigPath }),
              ...(claudeCodeConfigFormat !== undefined && { configFormat: claudeCodeConfigFormat }),
            }
          : null,
        claudeDesktop: claudeDesktopSteps
          ? {
              steps: claudeDesktopSteps,
              ...(claudeDesktopConfigPath !== undefined && { configPath: claudeDesktopConfigPath }),
            }
          : null,
        sdk: sdkSteps ? { steps: sdkSteps } : null,
        ...(mcpbSteps !== null && { mcpb: { steps: mcpbSteps } }),
        ...(installationRequirements !== undefined && Array.isArray(installationRequirements) && { requirements: installationRequirements }),
      };
      return result;
    } catch (error) {
      logDetailProcessingWarning('installationData', error, item);
      return null;
    }
  })();

  // GUIDES: Pre-process sections with server-side syntax highlighting
  const guideSectionsPromise = (async (): Promise<Array<
    Record<string, unknown> & { html?: string }
  > | null> => {
    if (item.category !== ContentCategory.guides) return null; // 'guides'

    const itemMetadata = getMetadata(item);
    if (!(itemMetadata?.['sections'] && Array.isArray(itemMetadata['sections']))) {
      // Log warning if sections are missing for guides
      logger.warn({ 
        category: item.category,
        slug: item.slug,
        hasMetadata: !!itemMetadata,
        sectionsType: itemMetadata?.['sections'] ? typeof itemMetadata['sections'] : 'undefined',
        },
        'Guides content missing sections in metadata'
      );
      return null;
    }

    // Type narrowing: sections is array from metadata
    if (!Array.isArray(itemMetadata['sections'])) {
      return null;
    }
    // Type guard for sections array items
    type SectionItem = {
      [key: string]: unknown;
      code?: string;
      language?: string;
      steps?: Array<{ [key: string]: unknown; code?: string; language?: string }>;
      tabs?: Array<{ [key: string]: unknown; code: string; language: string }>;
      type: string;
    };
    function isSectionItem(value: unknown): value is SectionItem {
      return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string'
      );
    }
    const sectionsRaw = itemMetadata['sections'];
    const sections: SectionItem[] = Array.isArray(sectionsRaw)
      ? sectionsRaw.filter(isSectionItem)
      : [];

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
            const html = await highlightCode(
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
                // Use shared-runtime utilities directly
                const html = await highlightCode(
                  tab.code,
                  typeof tab.language === 'string' ? tab.language : 'text',
                  { showLineNumbers: true }
                );
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
                  // Use shared-runtime utilities directly
                  const html = await highlightCode(
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

  // Extract headings from contentData (handle both single and array)
  const headingMetadata = Array.isArray(contentData)
    ? contentData.flatMap((block) => block.headings || [])
    : (contentData?.headings ?? null);
  const shouldRenderDetailToc = Array.isArray(headingMetadata) && headingMetadata.length >= 3;

  // Handle case where config is not found - AFTER ALL HOOKS
  if (!config) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Configuration Not Found</h1>
            <p className="text-muted-foreground mb-6">
              No configuration found for content type: {item.category}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ARCHITECTURAL FIX: Extract only the serializable data TabbedDetailLayout actually needs
  // TabbedDetailLayout is a client component, so we can only pass serializable props
  // It only uses: typeName (string) and sections (plain object)
  // We don't pass the entire config (which contains React components and functions)
  const tabbedLayoutConfig: {
    typeName: string;
    sections: {
      description: boolean;
      features: boolean;
      installation: boolean;
      use_cases: boolean;
      configuration: boolean;
      security: boolean;
      troubleshooting: boolean;
      examples: boolean;
      requirements: boolean;
    };
  } = {
    typeName: config.typeName,
    sections: config.sections,
  };

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
      securityItems,
      troubleshooting,
      guideSections,
      collectionSections,
    };

    return (
      <div className="bg-background min-h-screen">
        <DetailHeader
          displayTitle={displayTitle}
          item={item}
          // ARCHITECTURAL FIX: Only pass serializable data DetailHeader actually needs
          // Convert primary_action_type to SerializableActionType (they're compatible)
          config={{
            typeName: config.typeName,
            primaryAction: {
              label: config.primaryAction.label,
              type: config.primaryAction.type as SerializableActionType,
            },
            ...(config.secondaryActions && {
              secondaryActions: config.secondaryActions.map((action) => ({
                label: action.label,
                type: action.type as SerializableActionType,
              })),
            }),
          }}
        />
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
          <div id="detail-main-content" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Primary content */}
            <div className="lg:col-span-2">
              <TabbedDetailLayout
                item={item}
                config={tabbedLayoutConfig}
                tabs={configuredTabs}
                sectionData={sectionData}
                relatedItems={relatedItems}
              />
            </div>

          {/* Sidebars - TOC + Related content + Recently Viewed */}
          <aside className="space-y-6 lg:self-start">
            {/* On This Page - Scroll-aware TOC (hides on scroll down, shows on scroll up) */}
            {headingMetadata && headingMetadata.length >= 2 ? (
              <ScrollAwareToc>
                <SidebarToc headings={headingMetadata} />
              </ScrollAwareToc>
            ) : null}

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
                <Suspense fallback={<div className="h-64" />}>
                  <DetailSidebar
                    item={item}
                    relatedItems={relatedItems}
                    config={{
                      typeName: config.typeName,
                      metadata: config.metadata,
                    }}
                  />
                </Suspense>
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

  return (
    <div className="bg-background min-h-screen">
      {/* Header - Client component for interactivity */}
      <DetailHeader
        displayTitle={displayTitle}
        item={item}
        // ARCHITECTURAL FIX: Only pass serializable data DetailHeader actually needs
        // Convert primary_action_type to SerializableActionType (they're compatible)
        config={{
          typeName: config.typeName,
          primaryAction: {
            label: config.primaryAction.label,
            type: config.primaryAction.type as SerializableActionType,
          },
          ...(config.secondaryActions && {
            secondaryActions: config.secondaryActions.map((action) => ({
              label: action.label,
              type: action.type as SerializableActionType,
            })),
          }),
        }}
      />

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

      {shouldRenderQuickActionsBar ? (
        <div className="container mx-auto px-4 pt-4">
          <DetailQuickActionsBar
            item={item}
            metadata={metadata}
            packageName={quickActionsPackageName}
            configurationObject={quickActionsConfiguration}
            mcpServers={quickActionsMcpServers}
          />
        </div>
      ) : null}

      {/* Main content */}
      <div
        className="container mx-auto px-4 py-8"
        style={{ viewTransitionName: getViewTransitionName('card', item.slug) }}
      >
        <div id="detail-main-content" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Primary content */}
          <div className="space-y-8 lg:col-span-2">
            {/* COLLECTIONS: Render collection-specific sections */}
            {collectionSections}

            {/* GUIDES: Render structured sections from metadata using JSONSectionRenderer */}
            {guideSections && guideSections.length > 0 ? (
              <JSONSectionRenderer sections={guideSections} />
            ) : null}

            {/* Content/Code section (non-guides) */}
            {contentData && config ? (
              <>
                {Array.isArray(contentData) ? (
                  // Smart grouping: Merge adjacent code blocks into code_group sections
                  (() => {
                    // Type for grouped sections with explicit optional handling
                    interface GroupedSection {
                      blocks: typeof contentData;
                      markdownBefore: null | string;
                      type: 'group' | 'single';
                    }

                    const groupedSections: GroupedSection[] = [];
                    let currentGroup: typeof contentData = [];
                    let groupMarkdownBefore: null | string = null;

                    for (const block of contentData) {
                      if (!block) continue;

                      // Check if this block has substantial markdown before it (>50 chars of actual content)
                      const hasSubstantialMarkdownBefore =
                        block.markdownBefore &&
                        block.markdownBefore.replaceAll(/\s+/g, ' ').trim().length > 50;

                      if (hasSubstantialMarkdownBefore && currentGroup.length > 0) {
                        // End current group and start new one
                        groupedSections.push({
                          type: currentGroup.length > 1 ? 'group' : 'single',
                          blocks: [...currentGroup],
                          markdownBefore: groupMarkdownBefore,
                        });
                        currentGroup = [block];
                        groupMarkdownBefore = block.markdownBefore ?? null;
                      } else {
                        // Add to current group
                        if (currentGroup.length === 0 && block.markdownBefore) {
                          groupMarkdownBefore = block.markdownBefore;
                        }
                        currentGroup.push(block);
                      }
                    }

                    // Don't forget the last group
                    if (currentGroup.length > 0) {
                      groupedSections.push({
                        type: currentGroup.length > 1 ? 'group' : 'single',
                        blocks: currentGroup,
                        markdownBefore: groupMarkdownBefore,
                      });
                    }

                    // Render grouped sections
                    return groupedSections.map((section, sectionIndex) => (
                      <div key={`content-section-${sectionIndex}`} className="space-y-4">
                        {/* Render markdown context before the section */}
                        {section.markdownBefore ? (
                          <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none">
                            <p>{section.markdownBefore}</p>
                          </div>
                        ) : null}

                        {section.type === 'group' ? (
                          // Render as tabbed code group
                          <UnifiedSection
                            variant="code-group"
                            title={
                              sectionIndex === 0
                                ? `${config.typeName} Content`
                                : `${config.typeName} Examples`
                            }
                            description={`Code examples for this ${config.typeName.toLowerCase()}.`}
                            codeBlocks={section.blocks.map((block, blockIndex) => ({
                              html: block.html,
                              code: block.code,
                              language: block.language,
                              ...(block.filename ? { filename: block.filename } : {}),
                              label: block.filename || `Example ${blockIndex + 1}`,
                            }))}
                          />
                        ) : (
                          // Render as single code block
                          <UnifiedSection
                            variant="code"
                            title={
                              sectionIndex === 0
                                ? `${config.typeName} Content`
                                : `${config.typeName} Example`
                            }
                            description={
                              sectionIndex === 0
                                ? `The main content for this ${config.typeName.toLowerCase()}.`
                                : `Code example for this ${config.typeName.toLowerCase()}.`
                            }
                            html={section.blocks[0]?.html ?? ''}
                            code={section.blocks[0]?.code ?? ''}
                            language={section.blocks[0]?.language ?? 'text'}
                            {...(section.blocks[0]?.filename
                              ? { filename: section.blocks[0].filename }
                              : {})}
                          />
                        )}
                      </div>
                    ));
                  })()
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
            ) : null}

            {/* Features Section */}
            {config?.sections.features && features.length > 0 ? (
              <UnifiedSection
                variant="list"
                title="Features"
                description="Key capabilities and functionality"
                items={features}
                category={category}
                dotColor="bg-primary"
              />
            ) : null}

            {/* Requirements Section */}
            {config?.sections.requirements && requirements.length > 0 ? (
              <UnifiedSection
                variant="list"
                title="Requirements"
                description="Prerequisites and dependencies"
                items={requirements}
                category={category}
                dotColor="bg-orange-500"
              />
            ) : null}

            {/* Installation Section */}
            {config?.sections.installation && installationData ? (
              <UnifiedSection
                variant="installation"
                installationData={installationData}
                item={item}
              />
            ) : null}

            {/* Configuration Section */}
            {config?.sections.configuration && configData ? (
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
            ) : null}

            {/* Use Cases Section */}
            {config?.sections.use_cases && useCases.length > 0 ? (
              <UnifiedSection
                variant="list"
                title="Use Cases"
                description="Common scenarios and applications"
                items={useCases}
                category={category}
                dotColor="bg-accent"
              />
            ) : null}

            {/* Security Section (MCP-specific) */}
            {config?.sections.security && securityItems.length > 0 ? (
              <UnifiedSection
                variant="list"
                title="Security Best Practices"
                description="Important security considerations"
                items={securityItems}
                category={category}
                dotColor="bg-orange-500"
              />
            ) : null}

            {/* Troubleshooting Section */}
            {config?.sections.troubleshooting && troubleshooting.length > 0 ? (
              <UnifiedSection
                variant="enhanced-list"
                title="Troubleshooting"
                description="Common issues and solutions"
                items={troubleshooting}
                dotColor="bg-red-500"
              />
            ) : null}

            {/* Usage Examples Section - GitHub-style code snippets with syntax highlighting */}
            {config?.sections.examples && examplesData && examplesData.length > 0 ? (
              <UnifiedSection variant="examples" examples={examplesData} />
            ) : null}

            {/* Reviews & Ratings Section */}
            {isValidCategory(item.category) && item.category && item.slug ? (
              <div className="mt-4 border-t pt-4">
                <Suspense fallback={<div className="h-32" />}>
                  <ReviewListSection contentType={item.category} contentSlug={item.slug} />
                </Suspense>
              </div>
            ) : null}

            {/* Email CTA - Scroll-triggered variant for better engagement */}
            <NewsletterScrollTrigger
              source="content_page"
              {...(item.category ? { category: item.category } : {})}
            />
          </div>

          {/* Sidebars - TOC + Related content + Recently Viewed */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* On This Page - Supabase-style minimal TOC */}
            {shouldRenderDetailToc && headingMetadata && headingMetadata.length >= 2 ? (
              <SidebarToc headings={headingMetadata} />
            ) : null}

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