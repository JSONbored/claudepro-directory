'use client';

import { Copy, ExternalLink, Github } from 'lucide-react';
import { lazy, memo, Suspense } from 'react';
import { BaseDetailPage } from '@/components/base-detail-page';
import { CardDescription } from '@/components/ui/card';
import type { ContentDetailPageProps, CustomSection } from '@/lib/schemas/component.schema';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import type { ContentItem } from '@/lib/schemas/content.schema';

// Content items that have rich content fields for detail pages
type DetailedContent = ContentItem;

// Use optimized dynamic CodeHighlight with consolidated functionality
import { CodeHighlightDynamic as CodeHighlight } from '@/components/code-highlight';
import { ContentSidebar } from './content-detail-page/sidebar';

// Lazy load ContentViewer for large content
const ContentViewer = lazy(() =>
  import('@/components/content-viewer').then((module) => ({
    default: module.ContentViewer,
  }))
);

// DetailedContent is now imported from content.schema.ts

function ContentDetailPageComponent<T extends UnifiedContentItem>({
  item,
  type,
  typeName,
  relatedItems = [],
  customSections,
}: ContentDetailPageProps<T>) {
  if (!item) {
    return null; // Let BaseDetailPage handle the not found case
  }

  // Type guard to check if item has content properties
  const hasContent = (item: UnifiedContentItem): item is ContentItem => {
    return 'content' in item || 'configuration' in item;
  };

  const contentToCopy = (() => {
    if (!hasContent(item)) return '';

    // Check for content property
    if ('content' in item && typeof item.content === 'string') {
      return item.content;
    }

    // Check for configuration property
    if ('configuration' in item && item.configuration) {
      return typeof item.configuration === 'string'
        ? item.configuration
        : JSON.stringify(item.configuration, null, 2);
    }

    return '';
  })();

  // Get the appropriate language for syntax highlighting
  const getLanguage = () => {
    if (type === 'commands') return 'bash';
    if (type === 'mcp') return 'json';
    return 'markdown';
  };

  // Build custom sections
  const contentCustomSections: CustomSection[] = [];

  // Configuration section (if applicable)
  if (hasContent(item) && 'configuration' in item && item.configuration) {
    contentCustomSections.push({
      title: 'Configuration',
      icon: <Copy className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">
            Recommended settings for this {typeName.toLowerCase()}
          </CardDescription>
          <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
            <CodeHighlight
              code={JSON.stringify((item as Record<string, unknown>).configuration || {}, null, 2)}
              language="json"
              showCopy={true}
            />
          </Suspense>
        </>
      ),
      collapsible: false,
      defaultCollapsed: false,
    });
  }

  // Examples section (for commands)
  if (hasContent(item) && 'examples' in item && item.examples && item.examples.length > 0) {
    contentCustomSections.push({
      title: 'Examples',
      icon: <Copy className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">
            Usage examples for this {typeName.toLowerCase()}
          </CardDescription>
          <div className="space-y-4">
            {(Array.isArray((item as DetailedContent & { examples?: readonly string[] }).examples)
              ? (item as DetailedContent & { examples: readonly string[] }).examples
              : []
            ).map(
              (
                example: string | { title?: string; code: string; description?: string },
                idx: number
              ) => {
                // Handle both string[] and object[] formats
                if (typeof example === 'string') {
                  return (
                    <div key={`example-string-${example.slice(0, 50)}`}>
                      <Suspense
                        fallback={<div className="animate-pulse bg-muted h-16 rounded-md" />}
                      >
                        <CodeHighlight code={example} language="bash" showCopy={true} />
                      </Suspense>
                    </div>
                  );
                }

                return (
                  <div key={example.title || `example-${idx}`}>
                    <h4 className="font-medium mb-2">{example.title}</h4>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-16 rounded-md" />}>
                      <CodeHighlight code={example.code} language="bash" showCopy={true} />
                    </Suspense>
                    {example.description && (
                      <p className="text-sm text-muted-foreground mt-2">{example.description}</p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </>
      ),
      collapsible: false,
      defaultCollapsed: false,
    });
  }

  // Add any custom sections passed from parent
  if (customSections) {
    contentCustomSections.push({
      title: 'Additional Information',
      icon: <Copy className="h-5 w-5" />,
      content: customSections,
      collapsible: false,
      defaultCollapsed: false,
    });
  }

  // Build secondary actions
  const secondaryActions = [];

  // Always show GitHub link to the content file in our repo
  secondaryActions.push({
    label: 'View on GitHub',
    icon: <Github className="h-4 w-4 mr-2" />,
    onClick: () =>
      window.open(
        `https://github.com/JSONbored/claudepro-directory/blob/main/content/${type}/${item.slug}.json`,
        '_blank'
      ),
  });

  // Documentation link if available
  if (
    hasContent(item) &&
    (('documentationUrl' in item && item.documentationUrl) ||
      ('documentation' in item &&
        (item as DetailedContent & { documentation?: string }).documentation))
  ) {
    const docUrl =
      ('documentationUrl' in item && item.documentationUrl) ||
      (item as DetailedContent & { documentation?: string }).documentation;
    secondaryActions.push({
      label: 'Documentation',
      icon: <ExternalLink className="h-4 w-4 mr-2" />,
      onClick: () => window.open(docUrl, '_blank'),
    });
  }

  // Custom content display for BaseDetailPage
  const contentDisplay = (
    <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
      {contentToCopy.length > 3000 ? (
        <ContentViewer content={contentToCopy} language={getLanguage()} maxHeight={600} />
      ) : (
        <CodeHighlight code={contentToCopy} language={getLanguage()} showCopy={true} />
      )}
    </Suspense>
  );

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName={typeName}
      primaryAction={{
        label: 'Copy Content',
        icon: <Copy className="h-4 w-4 mr-2" />,
        onClick: async () => {
          const { copyToClipboard } = await import('@/lib/clipboard-utils');
          await copyToClipboard(contentToCopy, {
            component: 'content-detail-page',
            action: 'copy-content',
          });
        },
      }}
      secondaryActions={secondaryActions}
      customSections={contentCustomSections}
      // Override the default content display with our custom content viewer
      configurationContent={contentDisplay}
      showConfiguration={true}
      customSidebar={
        <ContentSidebar item={item} relatedItems={relatedItems} type={type} typeName={typeName} />
      }
    />
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ContentDetailPage = memo(
  ContentDetailPageComponent
) as typeof ContentDetailPageComponent;
