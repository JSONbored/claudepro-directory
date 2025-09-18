'use client';

import * as Icons from 'lucide-react';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Github,
  type LucideIcon,
  Tag,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { ContentCategory, ContentItem } from '@/types/content';

// Helper function to get icon component by name
function getIconByName(iconName: string): LucideIcon {
  const formattedName =
    iconName.charAt(0).toUpperCase() +
    iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  // Type assertion through unknown for safe type conversion
  const icon = (Icons as unknown as Record<string, LucideIcon>)[formattedName];
  return icon || Icons.HelpCircle;
}

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
  icon: string;
  typeName: string;
  relatedItems?: T[];
  customSections?: React.ReactNode;
}

export function ContentDetailPage<T extends ContentItem>({
  item,
  type,
  icon,
  typeName,
  relatedItems = [],
  customSections,
}: ContentDetailPageProps<T>) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{typeName} Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested {typeName.toLowerCase()} could not be found.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyContent = async () => {
    try {
      const contentToCopy = item.content || item.config || '';
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast({
        title: 'Content copied!',
        description: `The ${typeName.toLowerCase()} ${item.config ? 'configuration' : 'content'} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the content to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Format date if available
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          {/* Modern back navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${type}`)}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {typeName}s
            </Button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                {(() => {
                  const IconComponent = getIconByName(icon);
                  return <IconComponent className="h-6 w-6 text-primary" />;
                })()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{item.title || item.name}</h1>
                <p className="text-lg text-muted-foreground">{item.description}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {item.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{item.author}</span>
                  {item.githubUsername && (
                    <a
                      href={`https://github.com/${item.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1"
                    >
                      <Github className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {(item.dateAdded || item.createdAt) && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(item.dateAdded || item.createdAt || '')}</span>
                </div>
              )}
              {item.category && <Badge variant="secondary">{item.category}</Badge>}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{type === 'mcp' ? 'Configuration' : 'Content'}</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleCopyContent}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
                  {(item.content || item.config || '').length > 3000 ? (
                    <ContentViewer
                      content={item.content || item.config || ''}
                      language={type === 'commands' ? 'bash' : type === 'mcp' ? 'json' : 'markdown'}
                      maxHeight={600}
                    />
                  ) : (
                    <CodeHighlight
                      code={item.content || item.config || ''}
                      language={type === 'commands' ? 'bash' : type === 'mcp' ? 'json' : 'markdown'}
                    />
                  )}
                </Suspense>
              </CardContent>
            </Card>

            {/* Custom Sections */}
            {customSections}

            {/* Configuration Section (if applicable) */}
            {item.configuration && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>
                    Recommended settings for this {typeName.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeHighlight
                    code={JSON.stringify(item.configuration, null, 2)}
                    language="json"
                  />
                </CardContent>
              </Card>
            )}

            {/* Examples Section (for commands) */}
            {item.examples && item.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                  <CardDescription>
                    Usage examples for this {typeName.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.examples.map(
                    (
                      example: { title?: string; code: string; description?: string },
                      idx: number
                    ) => (
                      <div key={example.title || `example-${idx}`}>
                        <h4 className="font-medium mb-2">{example.title}</h4>
                        <CodeHighlight code={example.code} language="bash" />
                        {example.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {example.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={handleCopyContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </Button>
                {(item.githubUrl || item.repository) && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={item.githubUrl || item.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                )}
                {(item.documentationUrl || item.documentation) && (
                  <Button className="w-full" variant="outline" asChild>
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

            {/* Stats */}
            {(item.views || item.stars || item.forks) && (
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {item.views && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views</span>
                        <span className="font-medium">{item.views.toLocaleString()}</span>
                      </div>
                    )}
                    {item.stars && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stars</span>
                        <span className="font-medium">{item.stars.toLocaleString()}</span>
                      </div>
                    )}
                    {item.forks && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Forks</span>
                        <span className="font-medium">{item.forks.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Items - Below main content */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related {typeName}s</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title || item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/${type}/${item.slug}`)}
                    >
                      View {typeName}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
