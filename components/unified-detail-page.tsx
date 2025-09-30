'use client';

/**
 * Unified Detail Page Component
 *
 * Single component that handles all content types (agents, commands, hooks, mcp, rules).
 * Uses type-specific configurations to customize rendering for each content type.
 *
 * @see lib/config/content-type-configs.tsx - Content type configurations
 * @see lib/types/content-type-config.ts - Type definitions
 */

import { ArrowLeft, Calendar, Copy, ExternalLink, Github, Tag, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { getContentTypeConfig } from '@/lib/config/content-type-configs';
import { formatDate } from '@/lib/date-utils';
import type { UnifiedContentItem } from '@/lib/schemas';
import type { InstallationSteps } from '@/lib/types/content-type-config';
import { getDisplayTitle } from '@/lib/utils';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

export interface UnifiedDetailPageProps {
  item: UnifiedContentItem;
  relatedItems?: UnifiedContentItem[];
}

export function UnifiedDetailPage({ item, relatedItems = [] }: UnifiedDetailPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Get configuration for this content type
  const config = useMemo(() => getContentTypeConfig(item.category), [item.category]);

  // Generate display title
  const displayTitle = useMemo(
    () =>
      getDisplayTitle({
        title: item.title || '',
        name: item.name || '',
        slug: item.slug,
        category: item.category,
      }),
    [item.title, item.name, item.slug, item.category]
  );

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
  // Generate content using generators
  const installation = useMemo(() => {
    if (!config) return undefined;
    if ('installation' in item && item.installation) {
      // Ensure it's the correct type
      if (typeof item.installation === 'object' && !Array.isArray(item.installation)) {
        return item.installation as InstallationSteps;
      }
    }
    return config.generators.installation?.(item);
  }, [item, config]);

  const useCases = useMemo(() => {
    if (!config) return [];
    return 'useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0
      ? item.useCases
      : // biome-ignore lint/correctness/useHookAtTopLevel: This is a generator function, not a React hook
        config.generators.useCases?.(item) || [];
  }, [item, config]);

  const features = useMemo(() => {
    if (!config) return [];
    return 'features' in item && Array.isArray(item.features) && item.features.length > 0
      ? item.features
      : config.generators.features?.(item) || [];
  }, [item, config]);

  const troubleshooting = useMemo(() => {
    if (!config) return [];
    return 'troubleshooting' in item &&
      Array.isArray(item.troubleshooting) &&
      item.troubleshooting.length > 0
      ? item.troubleshooting
      : config.generators.troubleshooting?.(item) || [];
  }, [item, config]);

  const requirements = useMemo(() => {
    if (!config) return [];
    return 'requirements' in item &&
      Array.isArray(item.requirements) &&
      item.requirements.length > 0
      ? item.requirements
      : config.generators.requirements?.(item) || [];
  }, [item, config]);

  // Handle case where config is not found - AFTER ALL HOOKS
  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Configuration Not Found</h1>
            <p className="text-muted-foreground mb-6">
              No configuration found for content type: {item.category}
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

  // Handle copy content
  const handleCopyContent = async () => {
    const contentToCopy =
      ('content' in item ? (item as { content?: string }).content : '') ??
      ('configuration' in item
        ? typeof (item as unknown as { configuration?: unknown }).configuration === 'string'
          ? (item as unknown as { configuration?: string }).configuration
          : JSON.stringify((item as unknown as { configuration?: unknown }).configuration, null, 2)
        : '') ??
      '';

    const success = await copyToClipboard(contentToCopy, {
      component: 'unified-detail-page',
      action: 'copy-content',
    });

    setCopied(true);
    if (success) {
      toast.success('Copied!', {
        description: `${config.typeName} content has been copied to your clipboard.`,
      });
    } else {
      toast.error('Copy failed', {
        description: 'Unable to copy content to clipboard.',
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // Render installation section
  const renderInstallation = () => {
    if (!(config.sections.installation && installation)) return null;

    // Use custom renderer if provided
    if (config.renderers?.installationRenderer) {
      return config.renderers.installationRenderer(item, installation);
    }

    // Default installation renderer
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Installation
          </CardTitle>
          <CardDescription>Setup instructions and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {typeof installation === 'object' &&
            'claudeCode' in installation &&
            installation.claudeCode && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Claude Code Setup</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {installation.claudeCode.steps?.map((step: string) => (
                      <li key={step.slice(0, 50)} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {installation.claudeCode.configPath && (
                  <div>
                    <h4 className="font-medium mb-2">Configuration Paths</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(installation.claudeCode.configPath).map(
                        ([location, path]) => (
                          <div key={location} className="flex gap-2">
                            <Badge variant="outline" className="capitalize">
                              {location}
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
        </CardContent>
      </Card>
    );
  };

  // Render features section
  const renderFeatures = () => {
    if (!config.sections.features || features.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            Features
          </CardTitle>
          <CardDescription>Key capabilities and functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((feature: string) => (
              <li key={feature.slice(0, 50)} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render use cases section
  const renderUseCases = () => {
    if (!config.sections.useCases || useCases.length === 0) return null;

    // Use custom renderer if provided
    if (config.renderers?.useCasesRenderer) {
      // biome-ignore lint/correctness/useHookAtTopLevel: This is a renderer function, not a React hook
      return config.renderers.useCasesRenderer(item, useCases);
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Use Cases
          </CardTitle>
          <CardDescription>Common scenarios and applications</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {useCases.map((useCase: string) => (
              <li key={useCase.slice(0, 50)} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{useCase}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render configuration section
  const renderConfiguration = () => {
    if (!(config.sections.configuration && 'configuration' in item && item.configuration))
      return null;

    // Use custom renderer if provided
    if (config.renderers?.configRenderer) {
      return config.renderers.configRenderer(item);
    }

    // Default configuration renderer
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription>Configuration settings and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
            <CodeHighlight
              code={JSON.stringify(item.configuration, null, 2)}
              language="json"
              showCopy={true}
            />
          </Suspense>
        </CardContent>
      </Card>
    );
  };

  // Render troubleshooting section
  const renderTroubleshooting = () => {
    if (!config.sections.troubleshooting || troubleshooting.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {troubleshooting.map((trouble: { issue: string; solution: string } | string) => {
              if (typeof trouble === 'string') {
                return (
                  <li key={trouble.slice(0, 50)} className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{trouble}</span>
                  </li>
                );
              }
              return (
                <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{trouble.issue}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {trouble.solution}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render requirements section
  const renderRequirements = () => {
    if (requirements.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Requirements
          </CardTitle>
          <CardDescription>Prerequisites and dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {requirements.map((requirement: string) => (
              <li key={requirement.slice(0, 50)} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{requirement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render security section (MCP-specific)
  const renderSecurity = () => {
    if (!(config.sections.security && 'security' in item && Array.isArray(item.security)))
      return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
          <CardDescription>Important security considerations</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(item.security as string[]).map((securityItem: string) => (
              <li key={securityItem.slice(0, 50)} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{securityItem}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render examples section (MCP-specific)
  const renderExamples = () => {
    if (!(config.sections.examples && 'examples' in item && Array.isArray(item.examples)))
      return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Usage Examples
          </CardTitle>
          <CardDescription>Common queries and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(item.examples as string[]).map((example: string) => (
              <li key={example.slice(0, 50)} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed font-mono text-xs">{example}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render sidebar
  const renderSidebar = () => {
    // Use custom sidebar renderer if provided
    if (config.renderers?.sidebarRenderer) {
      return config.renderers.sidebarRenderer(item, relatedItems, router);
    }

    // Default sidebar
    return (
      <div className="space-y-6">
        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.metadata?.showGitHubLink && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a
                  href={`https://github.com/JSONbored/claudepro-directory/blob/main/${config.metadata.githubPathPrefix}/${item.slug}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
            )}
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

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related {config.typeName}s</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedItems.slice(0, 5).map((relatedItem) => (
                <button
                  key={relatedItem.slug}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
                  onClick={() => router.push(`/${relatedItem.category}/${relatedItem.slug}`)}
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
      </div>
    );
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
                  {config.typeName}
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
                {item.dateAdded && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.dateAdded)}</span>
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
              <Button onClick={() => config.primaryAction.handler(item)} className="min-w-0">
                {config.primaryAction.icon}
                {config.primaryAction.label}
              </Button>

              {(('content' in item && typeof (item as { content?: string }).content === 'string') ||
                ('configuration' in item &&
                  (item as { configuration?: object }).configuration)) && (
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

              {config.secondaryActions?.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={() => action.handler(item)}
                  className="min-w-0"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
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
            {(('content' in item && typeof (item as { content?: string }).content === 'string') ||
              ('configuration' in item && (item as { configuration?: object }).configuration)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    {config.typeName} Content
                  </CardTitle>
                  <CardDescription>
                    The main content for this {config.typeName.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-md" />}>
                    <CodeHighlight
                      code={
                        ('content' in item &&
                        typeof (item as { content?: string }).content === 'string'
                          ? (item as { content: string }).content
                          : '') ||
                        ('configuration' in item &&
                        (item as unknown as { configuration?: unknown }).configuration
                          ? typeof (item as unknown as { configuration?: unknown })
                              .configuration === 'string'
                            ? (item as unknown as { configuration: string }).configuration
                            : JSON.stringify(
                                (item as unknown as { configuration: object }).configuration,
                                null,
                                2
                              )
                          : '') ||
                        ''
                      }
                      language={
                        ('language' in item
                          ? (item as { language?: string }).language
                          : undefined) ?? 'text'
                      }
                      title={`${config.typeName} Content`}
                      showCopy={true}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Dynamic sections based on config */}
            {renderFeatures()}
            {renderInstallation()}
            {renderUseCases()}
            {renderConfiguration()}
            {renderRequirements()}
            {renderSecurity()}
            {renderTroubleshooting()}
            {renderExamples()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">{renderSidebar()}</div>
        </div>
      </div>
    </div>
  );
}
