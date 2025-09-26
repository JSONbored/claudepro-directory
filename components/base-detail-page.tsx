'use client';

import { ArrowLeft, Calendar, Copy, ExternalLink, Tag, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { formatDate } from '@/lib/date-utils';
import { getDisplayTitle } from '@/lib/utils';
import type { ContentItem } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

export interface BaseDetailPageProps {
  item: ContentItem;
  relatedItems?: ContentItem[];
  typeName: string;
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  }>;
  customSections?: Array<{
    title: string;
    icon?: ReactNode;
    content: ReactNode;
  }>;
  showConfiguration?: boolean;
  showInstallation?: boolean;
  showUseCases?: boolean;
  installationContent?: ReactNode;
  useCasesContent?: ReactNode;
  configurationContent?: ReactNode;
  customSidebar?: ReactNode;
}

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
