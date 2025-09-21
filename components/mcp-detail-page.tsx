'use client';

import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Github,
  Lightbulb,
  PlayCircle,
  Server,
  Settings,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { BaseDetailPage } from '@/components/base-detail-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
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

// Helper function to render MCP features section
const renderMCPFeatures = (features: string[]): ReactNode => (
  <ul className="space-y-2">
    {features.map((feature: string) => (
      <li key={feature.slice(0, 50)} className="flex items-start gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
        <span className="text-sm leading-relaxed">{feature}</span>
      </li>
    ))}
  </ul>
);

// Helper function to render MCP configuration section
const renderMCPConfiguration = (
  item: MCPServer,
  handleCopyConfiguration: (configType: 'claudeDesktop' | 'claudeCode') => Promise<void>,
  copied: boolean
): ReactNode => {
  if (!item.configuration) return null;

  return (
    <div className="space-y-6">
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
            <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
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
            <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
              <CodeHighlight
                code={JSON.stringify(item.configuration.claudeCode, null, 2)}
                language="json"
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to render MCP installation section
const renderMCPInstallation = (item: MCPServer): ReactNode => {
  if (!item.installation) return null;

  return (
    <div className="space-y-4">
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
                {Object.entries(item.installation.claudeDesktop.configPath).map(([type, path]) => (
                  <div key={type} className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {type}
                    </Badge>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(path)}</code>
                  </div>
                ))}
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
    </div>
  );
};

// Helper function to render MCP use cases section
const renderMCPUseCases = (useCases: string[]): ReactNode => (
  <ul className="space-y-2">
    {useCases.map((useCase: string) => (
      <li key={useCase.slice(0, 50)} className="flex items-start gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
        <span className="text-sm leading-relaxed">{useCase}</span>
      </li>
    ))}
  </ul>
);

// Helper function to render MCP security section
const renderMCPSecurity = (security: string[]): ReactNode => (
  <ul className="space-y-2">
    {security.map((securityItem: string) => (
      <li key={securityItem.slice(0, 50)} className="flex items-start gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
        <span className="text-sm leading-relaxed">{securityItem}</span>
      </li>
    ))}
  </ul>
);

// Helper function to render MCP troubleshooting section
const renderMCPTroubleshooting = (
  troubleshooting: Array<string | { issue: string; solution: string }>
): ReactNode => (
  <ul className="space-y-4">
    {troubleshooting.map((trouble: string | { issue: string; solution: string }) => {
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
                  <div className="font-medium text-red-600">Issue: {trouble.issue}</div>
                  <div>Solution: {trouble.solution}</div>
                </div>
              )}
            </div>
          </div>
        </li>
      );
    })}
  </ul>
);

// Helper function to render MCP examples section
const renderMCPExamples = (
  examples: Array<string | { title?: string; code: string; description?: string }>
): ReactNode => (
  <ul className="space-y-2">
    {examples.map((example: string | { title?: string; code: string; description?: string }) => {
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
                {example.title && <div className="font-medium">{example.title}</div>}
                <code className="block bg-muted px-2 py-1 rounded text-xs overflow-x-auto">
                  {example.code}
                </code>
                {example.description && (
                  <div className="text-muted-foreground text-xs">{example.description}</div>
                )}
              </div>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);

// Helper function to render MCP sidebar with resources and details
const renderMCPSidebar = (item: MCPServer, relatedItems: ContentItem[], router: any): ReactNode => (
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
              {typeof item.package === 'string' ? item.package : JSON.stringify(item.package)}
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

export function MCPDetailPage({ item, relatedItems = [] }: MCPDetailPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyConfiguration = async (configType: 'claudeDesktop' | 'claudeCode') => {
    const config = item.configuration?.[configType];
    if (!config) return;

    const success = await copyToClipboard(JSON.stringify(config, null, 2), {
      component: 'mcp-detail-page',
      action: `copy-${configType}-config`,
    });

    setCopied(true);
    if (success) {
      toast({
        title: 'Copied!',
        description: `${configType} configuration has been copied to your clipboard.`,
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard.',
        variant: 'destructive',
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInstallation = async () => {
    if (!item.installation) return;

    const installText = JSON.stringify(item.installation, null, 2);
    const success = await copyToClipboard(installText, {
      component: 'mcp-detail-page',
      action: 'copy-installation',
    });

    if (success) {
      toast({
        title: 'Installation steps copied!',
        description: 'Installation instructions have been copied to your clipboard.',
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy installation steps to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Build custom sections for MCP-specific content
  const customSections: Array<{
    title: string;
    icon?: ReactNode;
    content: ReactNode;
  }> = [];

  // Features section
  if (item.features && item.features.length > 0) {
    customSections.push({
      title: 'Features',
      icon: <Lightbulb className="h-5 w-5" />,
      content: renderMCPFeatures(item.features),
    });
  }

  // Overview section
  if (item.content) {
    customSections.push({
      title: 'Overview',
      icon: <Server className="h-5 w-5" />,
      content: <p className="text-sm leading-relaxed">{item.content}</p>,
    });
  }

  // Security section
  if (item.security && item.security.length > 0) {
    customSections.push({
      title: 'Security',
      icon: <Shield className="h-5 w-5" />,
      content: renderMCPSecurity(item.security),
    });
  }

  // Troubleshooting section
  if (item.troubleshooting && item.troubleshooting.length > 0) {
    customSections.push({
      title: 'Troubleshooting',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: renderMCPTroubleshooting(item.troubleshooting),
    });
  }

  // Examples section
  if (item.examples && item.examples.length > 0) {
    customSections.push({
      title: 'Examples',
      icon: <PlayCircle className="h-5 w-5" />,
      content: renderMCPExamples(item.examples),
    });
  }

  // Secondary actions
  const secondaryActions = [];

  if (item.installation) {
    secondaryActions.push({
      label: 'Copy Installation',
      icon: <Copy className="h-4 w-4 mr-2" />,
      onClick: handleCopyInstallation,
    });
  }

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="MCP Server"
      primaryAction={{
        label: 'View Configuration',
        icon: <Settings className="h-4 w-4 mr-2" />,
        onClick: () => {
          // Scroll to configuration section
          const configSection = document.querySelector('[data-section="configuration"]');
          configSection?.scrollIntoView({ behavior: 'smooth' });
        },
      }}
      secondaryActions={secondaryActions}
      customSections={customSections}
      showConfiguration={!!item.configuration}
      showInstallation={!!item.installation}
      showUseCases={!!(item.useCases && item.useCases.length > 0)}
      configurationContent={
        item.configuration ? (
          <div data-section="configuration">
            <CardDescription className="mb-6">
              Add these configurations to your Claude Desktop or Claude Code setup
            </CardDescription>
            {renderMCPConfiguration(item, handleCopyConfiguration, copied)}
          </div>
        ) : null
      }
      installationContent={item.installation ? renderMCPInstallation(item) : null}
      useCasesContent={
        item.useCases && item.useCases.length > 0 ? renderMCPUseCases(item.useCases) : null
      }
      customSidebar={renderMCPSidebar(item, relatedItems, router)}
    />
  );
}
