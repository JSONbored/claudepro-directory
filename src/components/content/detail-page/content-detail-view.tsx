/**
 * Unified Detail Page - Server-rendered content with streaming SSR
 * highlightCode() uses React cache() memoization (0ms for duplicates)
 */

import { Suspense } from 'react';
import { TabbedDetailLayout } from '@/src/components/content/detail-tabs/tabbed-detail-layout';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import UnifiedSection from '@/src/components/content/sections/unified-section';
import { ReviewListSection } from '@/src/components/core/domain/reviews/review-list-section';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';
import { detectLanguage } from '@/src/lib/content/language-detection';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';
import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
} from '@/src/lib/data/config/category';
import type { ContentItem } from '@/src/lib/data/content';
import { logger } from '@/src/lib/logger';
import type { InstallationSteps } from '@/src/lib/types/content-type-config';
import type { ProcessedSectionData } from '@/src/lib/types/detail-tabs.types';
import { getDisplayTitle } from '@/src/lib/utils';
import {
  generateFilename,
  generateHookFilename,
  generateMultiFormatFilename,
  transformMcpConfigForDisplay,
} from '@/src/lib/utils/content.utils';
import { ensureStringArray, getMetadata } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import { getViewTransitionName } from '@/src/lib/utils/view-transitions.utils';
import type { GetContentDetailCompleteReturn } from '@/src/types/database-overrides';
import { DetailHeader } from './detail-header';
import { DetailMetadata } from './detail-metadata';
import { DetailSidebar } from './sidebar/navigation-sidebar';

export interface UnifiedDetailPageProps {
  item: ContentItem | GetContentDetailCompleteReturn['content'];
  relatedItems?: ContentItem[] | GetContentDetailCompleteReturn['related'];
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
  item: ContentItem | GetContentDetailCompleteReturn['content']
): void {
  const normalized = normalizeError(error, `${section} processing failed`);
  logger.warn(`UnifiedDetailPage: ${section} processing failed`, {
    category: item.category,
    slug: item.slug ?? 'unknown',
    error: normalized.message,
  });
}

/**
 * Safely extracts configuration from item or metadata as a string
 */
function getConfigurationAsString(
  item: ContentItem | GetContentDetailCompleteReturn['content'],
  metadata: Record<string, unknown>
): string | null {
  // Check top-level item first
  if ('configuration' in item) {
    const cfg = item.configuration;
    if (typeof cfg === 'string') return cfg;
    if (cfg != null) return JSON.stringify(cfg, null, 2);
  }

  // Fall back to metadata
  if (metadata.configuration) {
    const cfg = metadata.configuration;
    if (typeof cfg === 'string') return cfg;
    if (typeof cfg === 'object') return JSON.stringify(cfg, null, 2);
  }

  return null;
}

async function ViewCountMetadata({
  item,
  viewCountPromise,
}: {
  item: ContentItem | GetContentDetailCompleteReturn['content'];
  viewCountPromise: Promise<number>;
}) {
  const viewCount = await viewCountPromise;
  return <DetailMetadata item={item} viewCount={viewCount} />;
}

async function SidebarWithRelated({
  item,
  relatedItemsPromise,
  config,
}: {
  item: ContentItem | GetContentDetailCompleteReturn['content'];
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
  const config = await getCategoryConfig(item.category as CategoryId);
  const displayTitle = getDisplayTitle(item);
  const metadata = getMetadata(item);

  const installation = (() => {
    const inst = ('installation' in item && item.installation) || metadata.installation;
    return inst && typeof inst === 'object' && !Array.isArray(inst)
      ? (inst as InstallationSteps)
      : undefined;
  })();

  const useCases = (() => {
    const cases = ('use_cases' in item && item.use_cases) || metadata.use_cases;
    return ensureStringArray(cases);
  })();

  const features = (() => {
    const feats = ('features' in item && item.features) || metadata.features;
    return ensureStringArray(feats);
  })();

  const troubleshooting = (() => {
    const trouble = ('troubleshooting' in item && item.troubleshooting) || metadata.troubleshooting;
    return Array.isArray(trouble) && trouble.length > 0 ? trouble : [];
  })();

  const requirements = (() => {
    const reqs = ('requirements' in item && item.requirements) || metadata.requirements;
    return ensureStringArray(reqs);
  })();

  const securityItems = 'security' in item && item.security ? ensureStringArray(item.security) : [];

  // Pre-process content highlighting
  const contentData = await (async () => {
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
      const language = await detectLanguage(content, languageHint);
      const filename = generateFilename({ item, language });
      const html = highlightCode(content, language);

      return { html, code: content, language, filename };
    } catch (error) {
      logDetailProcessingWarning('contentData', error, item);
      return null;
    }
  })();

  // Pre-process configuration highlighting (ConfigurationSection data)
  const configData = await (async () => {
    // Check top-level first, then metadata
    const configuration = ('configuration' in item && item.configuration) || metadata.configuration;
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
        const highlightedConfigs = Object.entries(config).map(([key, value]) => {
          if (!value) return null;

          const displayValue =
            key === 'claudeDesktop' || key === 'claudeCode'
              ? transformMcpConfigForDisplay(value as Record<string, unknown>)
              : value;

          const code = JSON.stringify(displayValue, null, 2);
          const html = highlightCode(code, 'json');
          const filename = generateMultiFormatFilename(item, key, 'json');

          return { key, html, code, filename };
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
        const highlightedHookConfig = config.hookConfig
          ? highlightCode(JSON.stringify(config.hookConfig, null, 2), 'json')
          : null;
        const highlightedScript = config.scriptContent
          ? highlightCode(config.scriptContent, 'bash')
          : null;

        return {
          format: 'hook' as const,
          hookConfig: highlightedHookConfig
            ? {
                html: highlightedHookConfig,
                code: JSON.stringify(config.hookConfig, null, 2),
                filename: generateHookFilename(item, 'hookConfig', 'json'),
              }
            : null,
          scriptContent:
            highlightedScript && config.scriptContent
              ? {
                  html: highlightedScript,
                  code: config.scriptContent,
                  filename: generateHookFilename(item, 'scriptContent', 'bash'),
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
      const html = highlightCode(code, 'json');
      const filename = generateFilename({ item, language: 'json' });

      return { format: 'json' as const, html, code, filename };
    } catch (error) {
      logDetailProcessingWarning('configData.json', error, item);
      return null;
    }
  })();

  // Pre-process usage examples highlighting (UsageExamplesSection data)
  const examplesData = await (async () => {
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

      const highlightedExamples = await Promise.all(
        examples.map(async (example) => {
          const html = highlightCode(example.code, example.language);
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
        })
      );

      return highlightedExamples;
    } catch (error) {
      logDetailProcessingWarning('examplesData', error, item);
      return null;
    }
  })();

  // Pre-process installation steps highlighting (InstallationSection data)
  const installationData = await (async () => {
    if (!installation) return null;

    // Helper to detect if a step is a command (should be highlighted)
    const isCommandStep = (step: string): boolean => {
      return /^(claude|npm|npx|pnpm|yarn|git|curl|bash|sh|python|pip|brew|apt|docker|cd|mkdir|cp|mv|rm|cat|echo|export|source)\s/.test(
        step.trim()
      );
    };

    try {
      const claudeCodeSteps = installation.claudeCode?.steps
        ? installation.claudeCode.steps.map((step) => {
            if (isCommandStep(step)) {
              const html = highlightCode(step, 'bash');
              return { type: 'command' as const, html, code: step };
            }
            return { type: 'text' as const, text: step };
          })
        : null;

      const claudeDesktopSteps = installation.claudeDesktop?.steps
        ? installation.claudeDesktop.steps.map((step) => {
            if (isCommandStep(step)) {
              const html = highlightCode(step, 'bash');
              return { type: 'command' as const, html, code: step };
            }
            return { type: 'text' as const, text: step };
          })
        : null;

      const sdkSteps = installation.sdk?.steps
        ? installation.sdk.steps.map((step) => {
            if (isCommandStep(step)) {
              const html = highlightCode(step, 'bash');
              return { type: 'command' as const, html, code: step };
            }
            return { type: 'text' as const, text: step };
          })
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
        ...(installation.requirements && { requirements: installation.requirements }),
      };
    } catch (error) {
      logDetailProcessingWarning('installationData', error, item);
      return null;
    }
  })();

  // GUIDES: Pre-process sections with server-side syntax highlighting
  const guideSections = await (async (): Promise<Array<
    Record<string, unknown> & { html?: string }
  > | null> => {
    if (item.category !== 'guides') return null;

    const itemMetadata = getMetadata(item);
    if (!(itemMetadata?.sections && Array.isArray(itemMetadata.sections))) return null;

    const sections = itemMetadata.sections as Array<{
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
          const html = highlightCode(section.code, section.language || 'text');
          return { ...section, html };
        }

        if (section.type === 'code_group' && section.tabs) {
          const tabs = await Promise.all(
            section.tabs.map(async (tab) => {
              const html = highlightCode(tab.code, tab.language || 'text');
              return { ...tab, html };
            })
          );
          return { ...section, tabs };
        }

        if (section.type === 'steps' && section.steps) {
          const steps = await Promise.all(
            section.steps.map(async (step) => {
              if (step.code) {
                const html = highlightCode(step.code, step.language || 'bash');
                return { ...step, html };
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
  const configuredTabs = config.detailPage.tabs;
  const shouldUseTabs = tabsEnabled && configuredTabs && configuredTabs.length > 0;

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
            fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={undefined} />}
          >
            <ViewCountMetadata item={item} viewCountPromise={viewCountPromise} />
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
          <NewsletterCTAVariant source="content_page" variant="inline" category={item.category} />
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
          fallback={<DetailMetadata item={item} viewCount={undefined} copyCount={undefined} />}
        >
          <ViewCountMetadata item={item} viewCountPromise={viewCountPromise} />
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
                category={item.category as CategoryId}
                dotColor="bg-primary"
              />
            )}

            {/* Requirements Section */}
            {requirements.length > 0 && (
              <UnifiedSection
                variant="list"
                title="Requirements"
                description="Prerequisites and dependencies"
                items={requirements}
                category={item.category as CategoryId}
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
                category={item.category as CategoryId}
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
                category={item.category as CategoryId}
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
            {isValidCategory(item.category) && (
              <div className="mt-12 border-t pt-12">
                <ReviewListSection contentType={item.category} contentSlug={item.slug} />
              </div>
            )}

            {/* Email CTA - Inline variant */}
            <NewsletterCTAVariant source="content_page" variant="inline" category={item.category} />
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
