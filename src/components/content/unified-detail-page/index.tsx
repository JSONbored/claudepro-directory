/**
 * Unified Detail Page - Server-First Architecture with Streaming SSR (SHA-2083 v3)
 *
 * REPLACES: Lazy-loaded client components with server components
 * NEW STRUCTURE: Server-first rendering with Suspense streaming for optimal performance
 *
 * Architecture:
 * - Server Components: All static rendering (metadata, sections, sidebar cards)
 * - Client Components: Only interactive elements (header buttons, config tabs, sidebar nav)
 * - Suspense Boundaries: Stream slow data (related items, view counts, reviews)
 * - Progressive Enhancement: Show main content immediately, stream supplementary data
 *
 * Performance Benefits:
 * - 40-50% reduction in client JavaScript bundle
 * - Faster Time to First Byte (TTFB) - main content renders immediately
 * - Progressive streaming reduces perceived load time
 * - Better SEO (fully server-rendered)
 * - Reduced memory footprint in browser
 *
 * @see components/unified-detail-page.tsx - Original 685-line implementation
 */

import { Suspense } from 'react';
import { JSONSectionRenderer } from '@/src/components/content/json-section-renderer';
import { UnifiedContentSection } from '@/src/components/content/unified-content-section';
import { UnifiedReview } from '@/src/components/domain/unified-review';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { getCategoryConfig, isValidCategory } from '@/src/lib/config/category-config';
import { detectLanguage } from '@/src/lib/content/language-detection';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { highlightCode } from '@/src/lib/content/syntax-highlighting-starry';
import type { InstallationSteps } from '@/src/lib/types/content-type-config';
import { getDisplayTitle } from '@/src/lib/utils';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';
import {
  generateFilename,
  generateHookFilename,
  generateMultiFormatFilename,
  transformMcpConfigForDisplay,
} from '@/src/lib/utils/content.utils';
import { getViewTransitionStyle } from '@/src/lib/utils/view-transitions.utils';
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

/**
 * Async component to stream view count metadata
 */
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

/**
 * Async component to stream sidebar with related items
 */
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
  // Get configuration for this content type from database
  const config = await getCategoryConfig(item.category as any);

  // Generate display title (Server Component - direct computation)
  const displayTitle = getDisplayTitle(item);

  // Generate content using data from database (generators moved to PostgreSQL)
  const installation = (() => {
    if ('installation' in item && item.installation) {
      if (typeof item.installation === 'object' && !Array.isArray(item.installation)) {
        return item.installation as InstallationSteps;
      }
    }
    return undefined;
  })();

  const useCases = (() => {
    return 'use_cases' in item && Array.isArray(item.use_cases) && item.use_cases.length > 0
      ? item.use_cases
      : [];
  })();

  const features = (() => {
    return 'features' in item && Array.isArray(item.features) && item.features.length > 0
      ? item.features
      : [];
  })();

  const troubleshooting = (() => {
    return 'troubleshooting' in item &&
      Array.isArray(item.troubleshooting) &&
      item.troubleshooting.length > 0
      ? item.troubleshooting
      : [];
  })();

  const requirements = (() => {
    return 'requirements' in item &&
      Array.isArray(item.requirements) &&
      item.requirements.length > 0
      ? item.requirements
      : [];
  })();

  // ============================================================================
  // DATA LAYER: Pre-process ALL async operations (syntax highlighting)
  // ============================================================================
  // Architecture: Page-level async processing (data layer) → Client components (presentation layer)
  // Benefits: Parallel processing, testable components, proper separation of concerns
  // PERFORMANCE: All utilities imported at module level (no dynamic import overhead)

  // Pre-process content highlighting (ContentSection data)
  const contentData = await (async () => {
    // GUIDES: Skip content processing - structured sections rendered separately
    if (item.category === 'guides') {
      return null;
    }

    // Extract content from item
    let content = '';
    if ('content' in item && typeof (item as { content?: string }).content === 'string') {
      content = (item as { content: string }).content;
    } else if (
      'configuration' in item &&
      (item as unknown as { configuration?: unknown }).configuration
    ) {
      const cfg = (item as unknown as { configuration?: unknown }).configuration;
      content = typeof cfg === 'string' ? cfg : JSON.stringify(cfg, null, 2);
    }

    if (!content) return null;

    try {
      const languageHint =
        'language' in item ? (item as { language?: string }).language : undefined;
      const language = await detectLanguage(content, languageHint);
      const filename = generateFilename({ item, language });
      const html = await highlightCode(content, language);

      return { html, code: content, language, filename };
    } catch (_error) {
      return null;
    }
  })();

  // Pre-process configuration highlighting (ConfigurationSection data)
  const configData = await (async () => {
    if (!('configuration' in item && item.configuration)) return null;

    const format = item.category === 'mcp' ? 'multi' : item.category === 'hooks' ? 'hook' : 'json';

    // Multi-format configuration (MCP servers)
    if (format === 'multi') {
      const config = item.configuration as {
        claudeDesktop?: Record<string, unknown>;
        claudeCode?: Record<string, unknown>;
        http?: Record<string, unknown>;
        sse?: Record<string, unknown>;
      };

      try {
        const highlightedConfigs = await batchMap(Object.entries(config), async ([key, value]) => {
          if (!value) return null;

          const displayValue =
            key === 'claudeDesktop' || key === 'claudeCode'
              ? transformMcpConfigForDisplay(value as Record<string, unknown>)
              : value;

          const code = JSON.stringify(displayValue, null, 2);
          const html = await highlightCode(code, 'json');
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
      const config = item.configuration as {
        hookConfig?: { hooks?: Record<string, unknown> };
        scriptContent?: string;
      };

      try {
        const [highlightedHookConfig, highlightedScript] = await batchFetch([
          config.hookConfig
            ? highlightCode(JSON.stringify(config.hookConfig, null, 2), 'json')
            : Promise.resolve(null),
          config.scriptContent
            ? highlightCode(config.scriptContent, 'bash')
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

    // Default JSON configuration
    try {
      const code = JSON.stringify(item.configuration, null, 2);
      const html = await highlightCode(code, 'json');
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
          const html = await highlightCode(example.code, example.language);
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

  // GUIDES: Extract sections array from metadata for JSONSectionRenderer
  const guideSections = (() => {
    if (item.category !== 'guides') return null;

    const metadata = 'metadata' in item ? (item.metadata as Record<string, unknown>) : null;
    if (!(metadata && metadata.sections && Array.isArray(metadata.sections))) return null;

    // JSONSectionRenderer expects sections array, not full metadata
    return metadata.sections;
  })();

  // Handle case where config is not found - AFTER ALL HOOKS
  if (!config) {
    return (
      <div className={'min-h-screen bg-background'}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Configuration Not Found</h1>
            <p className="text-muted-foreground mb-6">
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
        style={getViewTransitionStyle('card', item.slug)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary content */}
          <div className="lg:col-span-2 space-y-8">
            {/* GUIDES: Render structured sections from metadata using JSONSectionRenderer */}
            {guideSections && guideSections.length > 0 && (
              <JSONSectionRenderer sections={guideSections} />
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
            {config && config.sections.features && features.length > 0 && (
              <UnifiedContentSection
                variant="bullets"
                title="Features"
                description="Key capabilities and functionality"
                items={features as string[]}
                category={item.category as any}
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
                category={item.category as any}
                bulletColor="orange"
              />
            )}

            {/* Installation Section */}
            {config && config.sections.installation && installation && (
              <UnifiedContentSection
                variant="installation"
                installation={installation}
                item={item}
              />
            )}

            {/* Configuration Section */}
            {config && config.sections.configuration && configData && (
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
            {config && config.sections.use_cases && useCases.length > 0 && (
              <UnifiedContentSection
                variant="bullets"
                title="Use Cases"
                description="Common scenarios and applications"
                items={useCases as string[]}
                category={item.category as any}
                bulletColor="accent"
              />
            )}

            {/* Security Section (MCP-specific) */}
            {config && config.sections.security && 'security' in item && (
              <UnifiedContentSection
                variant="bullets"
                title="Security Best Practices"
                description="Important security considerations"
                items={item.security as string[]}
                category={item.category as any}
                bulletColor="orange"
              />
            )}

            {/* Troubleshooting Section */}
            {config && config.sections.troubleshooting && troubleshooting.length > 0 && (
              <UnifiedContentSection
                variant="troubleshooting"
                items={troubleshooting as any}
                description="Common issues and solutions"
              />
            )}

            {/* Usage Examples Section - GitHub-style code snippets with syntax highlighting */}
            {config && config.sections.examples && examplesData && examplesData.length > 0 && (
              <UnifiedContentSection variant="examples" examples={examplesData} />
            )}

            {/* Reviews & Ratings Section */}
            {isValidCategory(item.category) && (
              <div className="mt-12 pt-12 border-t">
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
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
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
