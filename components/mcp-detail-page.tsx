'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Copy,
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
import { getDisplayTitle } from '@/lib/utils';
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

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">MCP Server Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested MCP server could not be found.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyConfiguration = async (configType: 'claudeDesktop' | 'claudeCode') => {
    try {
      const config = item.configuration?.[configType];
      if (!config) return;

      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      toast({
        title: 'Copied!',
        description: `${configType} configuration has been copied to your clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b">
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
                <h1 className="text-3xl font-bold mb-2">{getDisplayTitle(item)}</h1>
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
            {/* Features Section */}
            {item.features && item.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Features
                  </CardTitle>
                  <CardDescription>Key capabilities and functionality</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.features.map((feature: string) => (
                      <li key={feature.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Overview Section */}
            {item.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Overview
                  </CardTitle>
                  <CardDescription>About this MCP server</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{item.content}</p>
                </CardContent>
              </Card>
            )}

            {/* Configuration Section */}
            {item.configuration && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration
                  </CardTitle>
                  <CardDescription>
                    Add these configurations to your Claude Desktop or Claude Code setup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Claude Desktop Configuration */}
                  {item.configuration.claudeDesktop && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Claude Desktop</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyConfiguration('claudeDesktop')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto rounded-md border">
                        <Suspense
                          fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}
                        >
                          <CodeHighlight
                            code={JSON.stringify(item.configuration.claudeDesktop, null, 2)}
                            language="json"
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}

                  {/* Claude Code Configuration */}
                  {item.configuration.claudeCode && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Claude Code</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyConfiguration('claudeCode')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto rounded-md border">
                        <Suspense
                          fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}
                        >
                          <CodeHighlight
                            code={JSON.stringify(item.configuration.claudeCode, null, 2)}
                            language="json"
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Installation Section */}
            {item.installation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Installation
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const installText = JSON.stringify(item.installation, null, 2);
                        navigator.clipboard.writeText(installText);
                        toast({
                          title: 'Installation steps copied!',
                          description:
                            'Installation instructions have been copied to your clipboard.',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Steps
                    </Button>
                  </div>
                  <CardDescription>Setup instructions and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.installation.claudeDesktop && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Claude Desktop Setup</h4>
                        {item.installation.claudeDesktop.steps && (
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {item.installation.claudeDesktop.steps.map((step: string) => (
                              <li key={step.slice(0, 50)} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                      {item.installation.claudeDesktop.configPath && (
                        <div>
                          <h4 className="font-medium mb-2">Configuration Paths</h4>
                          <div className="space-y-1 text-sm">
                            {Object.entries(item.installation.claudeDesktop.configPath).map(
                              ([type, path]) => (
                                <div key={type} className="flex gap-2">
                                  <Badge variant="outline" className="capitalize">
                                    {type}
                                  </Badge>
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {String(path)}
                                  </code>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {item.installation.claudeCode && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Claude Code Setup</h4>
                        <p className="text-sm text-muted-foreground">
                          {typeof item.installation.claudeCode === 'string'
                            ? item.installation.claudeCode
                            : JSON.stringify(item.installation.claudeCode, null, 2)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Use Cases Section */}
            {item.useCases && item.useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                  <CardDescription>Common scenarios and applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.useCases.map((useCase: string) => (
                      <li key={useCase.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {item.security && item.security.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>Security considerations and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.security.map((securityItem: string) => (
                      <li key={securityItem.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{securityItem}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Troubleshooting Section */}
            {item.troubleshooting && item.troubleshooting.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Troubleshooting
                  </CardTitle>
                  <CardDescription>Common issues and solutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {item.troubleshooting.map(
                      (trouble: string | { issue: string; solution: string }) => {
                        const key =
                          typeof trouble === 'string'
                            ? trouble.slice(0, 50)
                            : `${trouble.issue}-${trouble.solution}`.slice(0, 50);
                        return (
                          <li key={key} className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              <div className="text-sm leading-relaxed">
                                {typeof trouble === 'string' ? (
                                  trouble
                                ) : (
                                  <div className="space-y-1">
                                    <div className="font-medium text-red-600">
                                      Issue: {trouble.issue}
                                    </div>
                                    <div>Solution: {trouble.solution}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Examples Section */}
            {item.examples && item.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Examples
                  </CardTitle>
                  <CardDescription>Common usage examples</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.examples.map(
                      (
                        example: string | { title?: string; code: string; description?: string }
                      ) => {
                        const key =
                          typeof example === 'string'
                            ? example.slice(0, 50)
                            : `${example.title || ''}-${example.code}`.slice(0, 50);
                        return (
                          <li key={key} className="flex items-start gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                            <div className="text-sm leading-relaxed">
                              {typeof example === 'string' ? (
                                <code className="bg-muted px-1 py-0.5 rounded">{example}</code>
                              ) : (
                                <div className="space-y-1">
                                  {example.title && (
                                    <div className="font-medium">{example.title}</div>
                                  )}
                                  <code className="block bg-muted px-2 py-1 rounded text-xs overflow-x-auto">
                                    {example.code}
                                  </code>
                                  {example.description && (
                                    <div className="text-muted-foreground text-xs">
                                      {example.description}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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
            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Always show GitHub link to the MCP file in our repo */}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a
                    href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/mcp/${item.slug}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
                {item.documentationUrl && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={item.documentationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* MCP Server Details */}
            <Card>
              <CardHeader>
                <CardTitle>MCP Server Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                {item.category && (
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <Badge
                      variant="default"
                      className="text-xs font-medium bg-green-500/20 text-green-500 border-green-500/30"
                    >
                      {item.category === 'mcp' ? 'MCP Server' : item.category}
                    </Badge>
                  </div>
                )}

                {item.source && (
                  <div>
                    <h4 className="font-medium mb-1">Source</h4>
                    <Badge variant="outline">{item.source}</Badge>
                  </div>
                )}

                {item.package && (
                  <div>
                    <h4 className="font-medium mb-1">Package</h4>
                    <Badge variant="outline" className="font-mono">
                      {typeof item.package === 'string'
                        ? item.package
                        : JSON.stringify(item.package)}
                    </Badge>
                  </div>
                )}

                {item.requiresAuth !== undefined && (
                  <div>
                    <h4 className="font-medium mb-1">Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.requiresAuth ? 'Required' : 'Not required'}
                    </p>
                  </div>
                )}

                {item.permissions && item.permissions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.permissions.map((perm: string) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.dateAdded && (
                  <div>
                    <h4 className="font-medium mb-1">Date Added</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(item.dateAdded)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related MCP Servers */}
            {relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related MCP Servers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedItems.slice(0, 3).map((relatedItem) => (
                    <Button
                      key={relatedItem.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => router.push(`/mcp/${relatedItem.slug}`)}
                    >
                      <div className="text-left w-full min-w-0">
                        <div className="font-medium text-sm leading-tight mb-1">
                          {getDisplayTitle(relatedItem)}
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
        </div>
      </div>
    </div>
  );
}
