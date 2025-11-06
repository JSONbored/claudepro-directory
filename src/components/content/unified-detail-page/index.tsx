/**
 * Unified Detail Page - Server-rendered content with streaming SSR
 * highlightCode() uses React cache() memoization (0ms for duplicates)
 */

import { Suspense } from 'react';
import { JSONSectionRenderer } from '@/src/components/content/json-section-renderer';
import { UnifiedContentSection } from '@/src/components/content/unified-content-section';
import { UnifiedReview } from '@/src/components/domain/unified-review';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
} from '@/src/lib/config/category-config';
import { detectLanguage } from '@/src/lib/content/language-detection';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';
import type { InstallationSteps } from '@/src/lib/types/content-type-config';
import { getDisplayTitle } from '@/src/lib/utils';
import {
  generateFilename,
  generateHookFilename,
  generateMultiFormatFilename,
  transformMcpConfigForDisplay,
} from '@/src/lib/utils/content.utils';
import { getViewTransitionName } from '@/src/lib/utils/view-transitions.utils';
import type { Database } from '@/src/types/database.types';
import { DetailHeader } from './detail-header';
import { DetailMetadata } from './detail-metadata';
import { DetailSidebar } from './sidebar/detail-sidebar';

export interface UnifiedDetailPageProps {
  item: ContentItem;
  relatedItems?: ContentItem[];
  viewCount?: number;
  relatedItemsPromise?: Promise<ContentItem[]>;
  viewCountPromise?: Promise<number>;
}

async function ViewCountMetadata({
  item,
  viewCountPromise,
}: {
  item: ContentItem;
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
  item: ContentItem;
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
  relatedItemsPromise,
  viewCountPromise,
}: UnifiedDetailPageProps) {
  const config = await getCategoryConfig(item.category as CategoryId);
  const displayTitle = getDisplayTitle(item);
  const metadata =
    'metadata' in item && item.metadata ? (item.metadata as Record<string, unknown>) : {};

  const installation = (() => {
    const inst = ('installation' in item && item.installation) || metadata.installation;
    return inst && typeof inst === 'object' && !Array.isArray(inst)
      ? (inst as InstallationSteps)
      : undefined;
  })();

  const useCases = (() => {
    const cases = ('use_cases' in item && item.use_cases) || metadata.use_cases;
    return Array.isArray(cases) && cases.length > 0 ? cases : [];
  })();

  const features = (() => {
    const feats = ('features' in item && item.features) || metadata.features;
    return Array.isArray(feats) && feats.length > 0 ? feats : [];
  })();

  const troubleshooting = (() => {
    const trouble = ('troubleshooting' in item && item.troubleshooting) || metadata.troubleshooting;
    return Array.isArray(trouble) && trouble.length > 0 ? trouble : [];
  })();

  const requirements = (() => {
    const reqs = ('requirements' in item && item.requirements) || metadata.requirements;
    return Array.isArray(reqs) && reqs.length > 0 ? reqs : [];
  })();

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
    } else if (
      ('configuration' in item && (item as unknown as { configuration?: unknown }).configuration) ||
      metadata.configuration
    ) {
      const cfg =
        ('configuration' in item &&
          (item as unknown as { configuration?: unknown }).configuration) ||
        metadata.configuration;
      content = typeof cfg === 'string' ? cfg : JSON.stringify(cfg, null, 2);
    }

    if (!content) return null;

    try {
      const languageHint =
        'language' in item ? (item as { language?: string }).language : undefined;
      const language = await detectLanguage(content, languageHint);
      const filename = generateFilename({ item, language });
      const html = highlightCode(content, language);

      return { html, code: content, language, filename };
    } catch (_error) {
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
      } catch (_error) {
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
        const [highlightedHookConfig, highlightedScript] = await Promise.all([
          config.hookConfig
            ? Promise.resolve(highlightCode(JSON.stringify(config.hookConfig, null, 2), 'json'))
            : Promise.resolve(null),
          config.scriptContent
            ? Promise.resolve(highlightCode(config.scriptContent, 'bash'))
            : Promise.resolve(null),
        ]);

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
      } catch (_error) {
        return null;
      }
    }

    try {
      const code = JSON.stringify(configuration, null, 2);
      const html = highlightCode(code, 'json');
      const filename = generateFilename({ item, language: 'json' });

      return { format: 'json' as const, html, code, filename };
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
      return null;
    }
  })();

  // GUIDES: Pre-process sections with server-side syntax highlighting
  const guideSections = await (async () => {
    if (item.category !== 'guides') return null;

    const metadata = 'metadata' in item ? (item.metadata as Record<string, unknown>) : null;
    if (!(metadata?.sections && Array.isArray(metadata.sections))) return null;

    const sections = metadata.sections as Array<{
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

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Header - Client component for interactivity */}
      <DetailHeader displayTitle={displayTitle} item={item} config={config} />

      {/* Metadata - Stream view count if promise provided */}
      {viewCountPromise ? (
        <Suspense fallback={<DetailMetadata item={item} viewCount={undefined} />}>
          <ViewCountMetadata item={item} viewCountPromise={viewCountPromise} />
        </Suspense>
      ) : (
        <DetailMetadata item={item} viewCount={viewCount} />
      )}

      {/* Main content */}
      <div
        className="container mx-auto px-4 py-8"
        style={{ viewTransitionName: getViewTransitionName('card', item.slug) }}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Primary content */}
          <div className="space-y-8 lg:col-span-2">
            {/* GUIDES: Render structured sections from metadata using JSONSectionRenderer */}
            {guideSections && guideSections.length > 0 && (
              <JSONSectionRenderer
                sections={
                  guideSections as unknown as Database['public']['Tables']['content']['Row']['metadata']
                }
              />
            )}

            {/* Content/Code section (non-guides) */}
            {contentData && config && (
              <UnifiedContentSection
                variant="content"
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
              <UnifiedContentSection
                variant="bullets"
                title="Features"
                description="Key capabilities and functionality"
                items={features as string[]}
                category={item.category as CategoryId}
                bulletColor="primary"
              />
            )}

            {/* Requirements Section */}
            {requirements.length > 0 && (
              <UnifiedContentSection
                variant="bullets"
                title="Requirements"
                description="Prerequisites and dependencies"
                items={requirements as string[]}
                category={item.category as CategoryId}
                bulletColor="orange"
              />
            )}

            {/* Installation Section */}
            {config?.sections.installation && installationData && (
              <UnifiedContentSection
                variant="installation"
                installationData={installationData}
                item={item}
              />
            )}

            {/* Configuration Section */}
            {config?.sections.configuration && configData && (
              <UnifiedContentSection
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
              <UnifiedContentSection
                variant="bullets"
                title="Use Cases"
                description="Common scenarios and applications"
                items={useCases as string[]}
                category={item.category as CategoryId}
                bulletColor="accent"
              />
            )}

            {/* Security Section (MCP-specific) */}
            {config?.sections.security && 'security' in item && (
              <UnifiedContentSection
                variant="bullets"
                title="Security Best Practices"
                description="Important security considerations"
                items={item.security as string[]}
                category={item.category as CategoryId}
                bulletColor="orange"
              />
            )}

            {/* Troubleshooting Section */}
            {config?.sections.troubleshooting && troubleshooting.length > 0 && (
              <UnifiedContentSection
                variant="troubleshooting"
                items={troubleshooting as Array<string | { issue: string; solution: string }>}
                description="Common issues and solutions"
              />
            )}

            {/* Usage Examples Section - GitHub-style code snippets with syntax highlighting */}
            {config?.sections.examples && examplesData && examplesData.length > 0 && (
              <UnifiedContentSection variant="examples" examples={examplesData} />
            )}

            {/* Reviews & Ratings Section */}
            {isValidCategory(item.category) && (
              <div className="mt-12 border-t pt-12">
                <UnifiedReview
                  variant="section"
                  contentType={item.category}
                  contentSlug={item.slug}
                />
              </div>
            )}

            {/* Email CTA - Inline variant */}
            <UnifiedNewsletterCapture
              source="content_page"
              variant="inline"
              context="content-detail"
              category={item.category}
            />
          </div>

          {/* Sidebar - Stream related items if promise provided */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
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
          </aside>
        </div>
      </div>
    </div>
  );
}
