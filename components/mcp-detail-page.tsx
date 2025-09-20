'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Github,
  Lightbulb,
  PlayCircle,
  Server,
  Settings,
  Shield,
  Tag,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { slugToTitle } from '@/lib/utils';
import type { ContentItem, MCPServer } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

interface MCPDetailPageProps {
  item: MCPServer;
  relatedItems?: ContentItem[];
}

export function MCPDetailPage({ item, relatedItems = [] }: MCPDetailPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Type guard for installation structure
  const isValidInstallation = (
    inst: unknown
  ): inst is {
    claudeDesktop?: {
      steps?: string[];
      configPath?: Record<string, string>;
    };
  } => {
    return typeof inst === 'object' && inst !== null;
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">MCP Server Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested MCP server could not be found.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyConfiguration = async () => {
    try {
      const configToCopy = JSON.stringify(item.configuration, null, 2);
      await navigator.clipboard.writeText(configToCopy);
      setCopied(true);
      toast({
        title: 'Configuration copied!',
        description: 'The MCP server configuration has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the configuration to clipboard.',
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
              onClick={() => router.push('/mcp')}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              MCP Servers
            </Button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {item.title || item.name || slugToTitle(item.slug)}
                </h1>
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
              {item.source && <Badge variant="outline">{item.source}</Badge>}
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
            {/* Overview */}
            {item.content && (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.content}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {item.features && item.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Installation */}
            {item.installation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Installation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isValidInstallation(item.installation) && item.installation.claudeDesktop && (
                    <div>
                      <h4 className="font-semibold mb-3">For Claude Desktop</h4>
                      {item.installation.claudeDesktop?.steps && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Steps:</h5>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            {item.installation.claudeDesktop.steps.map((step: string) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {item.installation.claudeDesktop?.configPath && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">
                            Configuration File Locations:
                          </h5>
                          <div className="text-sm space-y-1">
                            {item.installation.claudeDesktop?.configPath?.macOS && (
                              <div>
                                <strong>macOS:</strong>{' '}
                                <code className="bg-muted px-1 rounded">
                                  {item.installation.claudeDesktop.configPath.macOS}
                                </code>
                              </div>
                            )}
                            {item.installation.claudeDesktop?.configPath?.windows && (
                              <div>
                                <strong>Windows:</strong>{' '}
                                <code className="bg-muted px-1 rounded">
                                  {item.installation.claudeDesktop.configPath.windows}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {item.installation.claudeCode !== undefined &&
                    item.installation.claudeCode !== null && (
                      <div>
                        <h4 className="font-semibold mb-2">For Claude Code</h4>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const claudeCode = item.installation.claudeCode;
                            if (typeof claudeCode === 'string') {
                              return claudeCode;
                            }
                            if (claudeCode !== null && claudeCode !== undefined) {
                              return JSON.stringify(claudeCode, null, 2);
                            }
                            return '';
                          })()}
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Configuration */}
            {item.configuration && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuration
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleCopyConfiguration}>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Config
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    Add this configuration to your Claude Desktop or Claude Code setup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
                    <CodeHighlight
                      code={JSON.stringify(item.configuration, null, 2)}
                      language="json"
                    />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Use Cases */}
            {item.useCases && item.useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.useCases.map((useCase: string) => (
                      <li key={useCase} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {item.security && item.security.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.security.map((securityItem: string) => (
                      <li key={securityItem} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{securityItem}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Examples */}
            {item.examples && item.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Examples</CardTitle>
                  <CardDescription>Common ways to interact with this MCP server</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.examples.map(
                      (
                        example: string | { title?: string; code: string; description?: string },
                        idx: number
                      ) => {
                        const key = typeof example === 'string' ? example : `example-${idx}`;
                        const content = typeof example === 'string' ? example : example.code;
                        return (
                          <li key={key} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                            <code className="text-sm bg-muted px-1 rounded">{content}</code>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Troubleshooting */}
            {item.troubleshooting && item.troubleshooting.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Troubleshooting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.troubleshooting.map(
                      (tip: string | { issue: string; solution: string }, idx: number) => {
                        const key = typeof tip === 'string' ? tip : `tip-${idx}`;
                        const content =
                          typeof tip === 'string' ? tip : `${tip.issue}: ${tip.solution}`;
                        return (
                          <li key={key} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <span>{content}</span>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sticky top-20 self-start">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={handleCopyConfiguration}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Configuration
                </Button>
                {/* Always show GitHub link to the MCP file in our repo */}
                <Button className="w-full" variant="outline" asChild>
                  <a
                    href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/mcp/${item.slug}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
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

            {/* Package Info */}
            {item.package && (
              <Card>
                <CardHeader>
                  <CardTitle>Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <code className="text-xs bg-muted px-1 rounded">
                        {typeof item.package === 'string'
                          ? item.package
                          : JSON.stringify(item.package)}
                      </code>
                    </div>
                    {item.requiresAuth !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requires Auth</span>
                        <span className="font-medium">{item.requiresAuth ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {item.permissions && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Permissions</span>
                        <div className="flex flex-wrap gap-1">
                          {item.permissions.map((perm: string) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {item.views && (
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">{item.views.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Items - Below main content */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related MCP Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {item.title || item.name || slugToTitle(item.slug)}
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/mcp/${item.slug}`)}
                    >
                      View MCP Server
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
