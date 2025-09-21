'use client';

import { Check, Copy, ExternalLink, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { BaseDetailPage } from '@/components/base-detail-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { ContentCategory, ContentItem } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

// Lazy load ContentViewer for large content
const ContentViewer = lazy(() =>
  import('@/components/content-viewer').then((module) => ({
    default: module.ContentViewer,
  }))
);

interface ContentDetailPageProps<T extends ContentItem> {
  item: T | null;
  type: ContentCategory;
  typeName: string;
  relatedItems?: T[];
  customSections?: React.ReactNode;
}

// Helper function to render Content sidebar with resources and details
const renderContentSidebar = <T extends ContentItem>(
  item: T,
  relatedItems: T[],
  router: any,
  type: ContentCategory,
  typeName: string
): React.ReactNode => (
  <div className="space-y-6 sticky top-20 self-start">
    {/* Resources */}
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Always show GitHub link to the Content file in our repo */}
        <Button variant="outline" className="w-full justify-start" asChild>
          <a
            href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/${type}/${item.slug}.json`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4 mr-2" />
            View on GitHub
          </a>
        </Button>
        {(item.documentationUrl || item.documentation) && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <a
              href={item.documentationUrl || item.documentation}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </a>
          </Button>
        )}
      </CardContent>
    </Card>

    {/* Content Details */}
    <Card>
      <CardHeader>
        <CardTitle>Content Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category */}
        {item.category && (
          <div>
            <h4 className="font-medium mb-1">Category</h4>
            <Badge
              variant="default"
              className="text-xs font-medium bg-purple-500/20 text-purple-500 border-purple-500/30"
            >
              {item.category === type ? typeName : item.category}
            </Badge>
          </div>
        )}

        {/* Content Type */}
        {(() => {
          const contentType = (() => {
            if (type === 'commands') return 'Command Script';
            if (type === 'mcp') return 'MCP Configuration';
            if (type === 'hooks') return 'Hook Script';
            if (type === 'rules') return 'System Rule';
            if (type === 'agents') return 'Agent Definition';
            return 'Content';
          })();
          return (
            <div>
              <h4 className="font-medium mb-1">Content Type</h4>
              <Badge variant="outline" className="text-xs">
                {contentType}
              </Badge>
            </div>
          );
        })()}

        {/* Format */}
        {(() => {
          const format = (() => {
            if (item.config) return 'JSON Configuration';
            if (item.content) {
              if (type === 'commands') return 'Bash Script';
              if (type === 'mcp') return 'JSON Configuration';
              return 'Markdown Content';
            }
            return 'Text';
          })();
          return (
            <div>
              <h4 className="font-medium mb-1">Format</h4>
              <Badge variant="outline" className="text-xs font-mono">
                {format}
              </Badge>
            </div>
          );
        })()}

        {/* Language */}
        {(() => {
          const language = (() => {
            if (type === 'commands') return 'bash';
            if (type === 'mcp') return 'json';
            return 'markdown';
          })();
          return (
            <div>
              <h4 className="font-medium mb-1">Language</h4>
              <Badge variant="outline" className="text-xs font-mono">
                {language}
              </Badge>
            </div>
          );
        })()}

        {item.source && (
          <div>
            <h4 className="font-medium mb-1">Source</h4>
            <Badge variant="outline">{item.source}</Badge>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-1">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Related Content */}
    {relatedItems.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Related {typeName}s</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relatedItems.slice(0, 3).map((relatedItem) => (
            <Button
              key={relatedItem.id}
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-left"
              onClick={() => router.push(`/${type}/${relatedItem.slug}`)}
            >
              <div className="text-left w-full min-w-0">
                <div className="font-medium text-sm leading-tight mb-1">
                  {relatedItem.name || relatedItem.title || relatedItem.slug}
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {/* Show primary tags */}
                  {relatedItem.tags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {relatedItem.description}
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);

export function ContentDetailPage<T extends ContentItem>({
  item,
  type,
  typeName,
  relatedItems = [],
  customSections,
}: ContentDetailPageProps<T>) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!item) {
    return null; // Let BaseDetailPage handle the not found case
  }

  const handleCopyContent = async () => {
    const contentToCopy = item.content || item.config || '';

    const success = await copyToClipboard(contentToCopy, {
      component: 'content-detail-page',
      action: 'copy-content',
    });

    setCopied(true);
    if (success) {
      toast({
        title: 'Content copied!',
        description: `The ${typeName.toLowerCase()} ${item.config ? 'configuration' : 'content'} has been copied to your clipboard.`,
      });
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the content to clipboard.',
        variant: 'destructive',
      });
    }

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  // Get the appropriate language for syntax highlighting
  const getLanguage = () => {
    if (type === 'commands') return 'bash';
    if (type === 'mcp') return 'json';
    return 'markdown';
  };

  // Build custom sections
  const contentCustomSections = [];

  // Configuration section (if applicable)
  if (item.configuration) {
    contentCustomSections.push({
      title: 'Configuration',
      icon: <Copy className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">
            Recommended settings for this {typeName.toLowerCase()}
          </CardDescription>
          <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
            <CodeHighlight code={JSON.stringify(item.configuration, null, 2)} language="json" />
          </Suspense>
        </>
      ),
    });
  }

  // Examples section (for commands)
  if (item.examples && item.examples.length > 0) {
    contentCustomSections.push({
      title: 'Examples',
      icon: <Copy className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">
            Usage examples for this {typeName.toLowerCase()}
          </CardDescription>
          <div className="space-y-4">
            {(Array.isArray(item.examples) ? item.examples : []).map(
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
                        <CodeHighlight code={example} language="bash" />
                      </Suspense>
                    </div>
                  );
                }

                return (
                  <div key={example.title || `example-${idx}`}>
                    <h4 className="font-medium mb-2">{example.title}</h4>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-16 rounded-md" />}>
                      <CodeHighlight code={example.code} language="bash" />
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
    });
  }

  // Add any custom sections passed from parent
  if (customSections) {
    contentCustomSections.push({
      title: 'Additional Information',
      icon: <Copy className="h-5 w-5" />,
      content: customSections,
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
  if (item.documentationUrl || item.documentation) {
    secondaryActions.push({
      label: 'Documentation',
      icon: <ExternalLink className="h-4 w-4 mr-2" />,
      onClick: () => window.open(item.documentationUrl || item.documentation, '_blank'),
    });
  }

  // Custom content display for BaseDetailPage
  const contentDisplay = (
    <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
      {(item.content || item.config || '').length > 3000 ? (
        <ContentViewer
          content={item.content || item.config || ''}
          language={getLanguage()}
          maxHeight={600}
        />
      ) : (
        <CodeHighlight code={item.content || item.config || ''} language={getLanguage()} />
      )}
    </Suspense>
  );

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName={typeName}
      primaryAction={{
        label: copied ? 'Copied!' : 'Copy Content',
        icon: copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />,
        onClick: handleCopyContent,
      }}
      secondaryActions={secondaryActions}
      customSections={contentCustomSections}
      // Override the default content display with our custom content viewer
      configurationContent={contentDisplay}
      showConfiguration={true}
      customSidebar={renderContentSidebar(item, relatedItems, router, type, typeName)}
    />
  );
}
