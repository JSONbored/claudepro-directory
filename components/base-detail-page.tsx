'use client';

import { ArrowLeft, Calendar, Copy, ExternalLink, Tag, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { formatDate } from '@/lib/date-utils';
import { logger } from '@/lib/logger';
import { getDisplayTitle } from '@/lib/utils';
import type { ContentItem } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

/**
 * Zod schemas for detail page configuration validation
 */
const actionButtonSchema = z.object({
  label: z.string().min(1).max(50),
  icon: z.any().optional(),
  onClick: z.function(),
  variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).optional(),
  disabled: z.boolean().optional(),
});

const customSectionSchema = z.object({
  title: z.string().min(1).max(100),
  icon: z.any().optional(),
  content: z.any(), // ReactNode
  collapsible: z.boolean().optional(),
  defaultCollapsed: z.boolean().optional(),
});

const detailPageConfigSchema = z.object({
  typeName: z.string().min(1).max(50),
  showConfiguration: z.boolean().default(false),
  showInstallation: z.boolean().default(false),
  showUseCases: z.boolean().default(false),
  showRequirements: z.boolean().default(true),
  showMetadata: z.boolean().default(true),
  showTags: z.boolean().default(true),
  showRelatedItems: z.boolean().default(true),
  enableCopyContent: z.boolean().default(true),
  enableShareButton: z.boolean().default(true),
  customSections: z.array(customSectionSchema).default([]),
  primaryAction: actionButtonSchema.optional(),
  secondaryActions: z.array(actionButtonSchema).default([]),
});

export interface BaseDetailPageProps {
  item: ContentItem;
  relatedItems?: ContentItem[];
  typeName: string;
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    disabled?: boolean;
  }>;
  customSections?: Array<{
    title: string;
    icon?: ReactNode;
    content: ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;
  showConfiguration?: boolean;
  showInstallation?: boolean;
  showUseCases?: boolean;
  showRequirements?: boolean;
  showMetadata?: boolean;
  showTags?: boolean;
  showRelatedItems?: boolean;
  enableCopyContent?: boolean;
  enableShareButton?: boolean;
  installationContent?: ReactNode;
  useCasesContent?: ReactNode;
  configurationContent?: ReactNode;
  customSidebar?: ReactNode;
}

export type DetailPageConfig = z.infer<typeof detailPageConfigSchema>;
export type ActionButton = z.infer<typeof actionButtonSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;

export function BaseDetailPage({
  item,
  relatedItems = [],
  typeName,
  primaryAction,
  secondaryActions = [],
  customSections = [],
  showConfiguration = false,
  showInstallation = false,
  showUseCases = false,
  installationContent,
  useCasesContent,
  configurationContent,
  customSidebar,
}: BaseDetailPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const displayTitle = getDisplayTitle({
    title: item.title || '',
    name: item.name || '',
    slug: item.slug,
    category: item.category,
  });

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The requested {typeName.toLowerCase()} could not be found.
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyContent = async () => {
    const contentToCopy = item.content || item.config || '';

    const success = await copyToClipboard(contentToCopy, {
      component: 'base-detail-page',
      action: 'copy-content',
    });

    setCopied(true);
    if (success) {
      toast({
        title: 'Copied!',
        description: `${typeName} content has been copied to your clipboard.`,
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy content to clipboard.',
        variant: 'destructive',
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          {/* Back navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Main content header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="text-xs font-medium">
                  {typeName}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>

              <h1 className="text-4xl font-bold tracking-tight mb-4">{displayTitle}</h1>

              {item.description && (
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {item.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{item.author}</span>
                  </div>
                )}
                {(item.dateAdded || item.createdAt) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.dateAdded || item.createdAt || '')}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {primaryAction && (
                <Button onClick={primaryAction.onClick} className="min-w-0">
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              )}

              {(item.content || item.config) && (
                <Button variant="outline" onClick={handleCopyContent} className="min-w-0">
                  {copied ? (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Content
                    </>
                  )}
                </Button>
              )}

              {secondaryActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={action.onClick}
                  className="min-w-0"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}

              {item.documentation && (
                <Button variant="outline" asChild>
                  <a href={item.documentation} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content/Code section */}
            {(item.content || item.config) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    {typeName} Content
                  </CardTitle>
                  <CardDescription>
                    The main content for this {typeName.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-md" />}>
                    <CodeHighlight
                      code={item.content || item.config || ''}
                      language={
                        ('language' in item ? (item.language as string) : undefined) || 'text'
                      }
                      title={`${typeName} Content`}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Custom sections */}
            {customSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>{section.content}</CardContent>
              </Card>
            ))}

            {/* Configuration section */}
            {showConfiguration && configurationContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>{configurationContent}</CardContent>
              </Card>
            )}

            {/* Installation section */}
            {showInstallation && installationContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Installation
                  </CardTitle>
                </CardHeader>
                <CardContent>{installationContent}</CardContent>
              </Card>
            )}

            {/* Use cases section */}
            {showUseCases && useCasesContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>{useCasesContent}</CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Use custom sidebar if provided, otherwise show default */}
            {customSidebar ? (
              customSidebar
            ) : (
              <>
                {/* Related items */}
                {relatedItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Related {typeName}s</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {relatedItems.slice(0, 5).map((relatedItem) => (
                        <button
                          key={relatedItem.slug}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
                          onClick={() =>
                            router.push(`/${relatedItem.category}/${relatedItem.slug}`)
                          }
                          type="button"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {getDisplayTitle({
                                title: relatedItem.title || '',
                                name: relatedItem.name || '',
                                slug: relatedItem.slug,
                                category: relatedItem.category,
                              })}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {relatedItem.description}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DetailPageFactory - Production-grade factory functions for creating detail pages
 * Validates configuration and provides type-safe detail page creation
 */

/**
 * Create a validated detail page configuration
 */
export function createDetailPageConfig(config: Partial<DetailPageConfig>): DetailPageConfig {
  try {
    return detailPageConfigSchema.parse(config);
  } catch (error) {
    logger.error(
      'Invalid detail page configuration',
      error instanceof Error ? error : new Error(String(error)),
      { configKeysCount: Object.keys(config || {}).length }
    );
    throw new Error('Failed to create detail page configuration');
  }
}

/**
 * Validate action buttons
 */
export function validateActionButton(action: unknown): ActionButton {
  try {
    return actionButtonSchema.parse(action);
  } catch (error) {
    logger.error(
      'Invalid action button configuration',
      error instanceof Error ? error : new Error(String(error)),
      { actionType: typeof action }
    );
    throw new Error('Failed to validate action button');
  }
}

/**
 * Validate custom sections
 */
export function validateCustomSection(section: unknown): CustomSection {
  try {
    return customSectionSchema.parse(section);
  } catch (error) {
    logger.error(
      'Invalid custom section configuration',
      error instanceof Error ? error : new Error(String(error)),
      { sectionType: typeof section }
    );
    throw new Error('Failed to validate custom section');
  }
}

/**
 * Create a content-type specific detail page
 */
export function createContentDetailPage(
  contentType: 'agent' | 'command' | 'hook' | 'mcp' | 'rule'
): DetailPageConfig {
  const configurations: Record<string, Partial<DetailPageConfig>> = {
    agent: {
      typeName: 'Agent',
      showConfiguration: true,
      showInstallation: true,
      showUseCases: true,
      enableCopyContent: true,
    },
    command: {
      typeName: 'Command',
      showConfiguration: true,
      showUseCases: true,
      enableCopyContent: true,
    },
    hook: {
      typeName: 'Hook',
      showConfiguration: true,
      showInstallation: true,
      enableCopyContent: true,
    },
    mcp: {
      typeName: 'MCP Server',
      showConfiguration: true,
      showInstallation: true,
      showRequirements: true,
      enableCopyContent: true,
    },
    rule: {
      typeName: 'Rule',
      showConfiguration: true,
      showUseCases: true,
      enableCopyContent: true,
    },
  };

  const config = configurations[contentType];
  if (!config) {
    throw new Error(`Unknown content type: ${contentType}`);
  }

  return createDetailPageConfig(config);
}

/**
 * Create standardized action buttons for common operations
 */
export const actionButtonTemplates = {
  copy: (content: string): ActionButton => ({
    label: 'Copy',
    icon: undefined,
    onClick: () => {
      copyToClipboard(content);
      toast({ title: 'Copied to clipboard' });
    },
    variant: 'outline' as const,
  }),

  share: (item: ContentItem): ActionButton => ({
    label: 'Share',
    icon: undefined,
    onClick: () => {
      if (navigator?.share) {
        navigator
          .share({
            title: item.title || item.name || 'Shared content',
            text: item.description,
            url: window.location.href,
          })
          .catch(() => {
            // Fallback to clipboard
            copyToClipboard(window.location.href);
            toast({ title: 'Link copied to clipboard' });
          });
      } else {
        copyToClipboard(window.location.href);
        toast({ title: 'Link copied to clipboard' });
      }
    },
    variant: 'ghost' as const,
  }),

  external: (url: string): ActionButton => ({
    label: 'View Source',
    icon: undefined,
    onClick: () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    variant: 'outline' as const,
  }),
};

/**
 * Helper function to create detail pages with validation and error handling
 */
export function createDetailPage(item: ContentItem, config: Partial<DetailPageConfig>) {
  try {
    const validatedConfig = createDetailPageConfig(config);

    return {
      config: validatedConfig,
      render: (props: Omit<BaseDetailPageProps, 'typeName'>) => (
        <BaseDetailPage
          {...props}
          item={item}
          typeName={validatedConfig.typeName}
          showConfiguration={validatedConfig.showConfiguration}
          showInstallation={validatedConfig.showInstallation}
          showUseCases={validatedConfig.showUseCases}
        />
      ),
    };
  } catch (error) {
    logger.error(
      'Failed to create detail page',
      error instanceof Error ? error : new Error(String(error)),
      { itemSlug: item.slug, configKeysCount: Object.keys(config || {}).length }
    );
    throw error;
  }
}
