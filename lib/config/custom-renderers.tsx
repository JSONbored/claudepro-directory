/**
 * Custom Renderers for Content Types
 *
 * Specialized rendering logic for content types with unique display requirements.
 * These renderers handle complex configurations that don't fit the default template.
 *
 * @see lib/config/content-type-configs.tsx - Where these are used
 * @see components/unified-detail-page.tsx - Consumer component
 */

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import type { InstallationSteps } from '@/lib/types/content-type-config';

/**
 * MCP Configuration Renderer
 *
 * Handles multiple configuration formats:
 * - claudeDesktop (stdio transport)
 * - claudeCode (stdio transport)
 * - http (HTTP transport)
 * - sse (Server-Sent Events transport)
 */
export function renderMCPConfiguration(item: UnifiedContentItem): React.ReactElement | null {
  const [copied, setCopied] = useState(false);

  if (!('configuration' in item && item.configuration)) return null;

  const config = item.configuration as {
    claudeDesktop?: Record<string, unknown>;
    claudeCode?: Record<string, unknown>;
    http?: Record<string, unknown>;
    sse?: Record<string, unknown>;
  };

  const handleCopyConfig = async (configType: keyof typeof config) => {
    const configSection = config[configType];
    if (!configSection) return;

    const success = await copyToClipboard(JSON.stringify(configSection, null, 2), {
      component: 'mcp-config-renderer',
      action: `copy-${configType}`,
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
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card data-section="configuration">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Configuration
        </CardTitle>
        <CardDescription>
          Add these configurations to your Claude Desktop or Claude Code setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Claude Desktop Configuration */}
        {config.claudeDesktop && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Claude Desktop</h4>
              <Button size="sm" variant="outline" onClick={() => handleCopyConfig('claudeDesktop')}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <pre className="p-4 overflow-x-auto text-sm font-mono bg-black text-green-400 rounded-md">
                <code>{JSON.stringify(config.claudeDesktop, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Claude Code Configuration */}
        {config.claudeCode && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Claude Code</h4>
              <Button size="sm" variant="outline" onClick={() => handleCopyConfig('claudeCode')}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <pre className="p-4 overflow-x-auto text-sm font-mono bg-black text-green-400 rounded-md">
                <code>{JSON.stringify(config.claudeCode, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* HTTP Transport Configuration */}
        {config.http && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">HTTP Transport</h4>
              <Button size="sm" variant="outline" onClick={() => handleCopyConfig('http')}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <pre className="p-4 overflow-x-auto text-sm font-mono bg-black text-green-400 rounded-md">
                <code>{JSON.stringify(config.http, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SSE Transport Configuration */}
        {config.sse && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">SSE Transport</h4>
              <Button size="sm" variant="outline" onClick={() => handleCopyConfig('sse')}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <pre className="p-4 overflow-x-auto text-sm font-mono bg-black text-green-400 rounded-md">
                <code>{JSON.stringify(config.sse, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook Configuration Renderer
 *
 * Handles hook-specific configuration format:
 * - hookConfig with event-based hooks
 * - scriptContent for inline scripts
 */
export function renderHookConfiguration(item: UnifiedContentItem): React.ReactElement | null {
  const [copied, setCopied] = useState(false);

  if (!('configuration' in item && item.configuration)) return null;

  const config = item.configuration as {
    hookConfig?: {
      hooks?: Record<string, unknown>;
    };
    scriptContent?: string;
  };

  const handleCopyConfig = async () => {
    const success = await copyToClipboard(JSON.stringify(config, null, 2), {
      component: 'hook-config-renderer',
      action: 'copy-config',
    });

    setCopied(true);
    if (success) {
      toast({
        title: 'Copied!',
        description: 'Hook configuration has been copied to your clipboard.',
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard.',
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Hook Configuration
            </CardTitle>
            <CardDescription className="mt-2">Hook setup and script content</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyConfig}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Config'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hook Config */}
        {config.hookConfig && (
          <div>
            <h4 className="font-medium mb-2">Hook Configuration</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(config.hookConfig, null, 2)}
            </pre>
          </div>
        )}

        {/* Script Content */}
        {config.scriptContent && (
          <div>
            <h4 className="font-medium mb-2">Script Content</h4>
            <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-[400px]">
              {config.scriptContent}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook Installation Renderer
 *
 * Special rendering for hook installation with script execution context
 */
export function renderHookInstallation(
  item: UnifiedContentItem,
  installation: InstallationSteps
): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Installation
        </CardTitle>
        <CardDescription>Setup instructions and requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {installation.claudeCode && (
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
                  {Object.entries(installation.claudeCode.configPath).map(([location, path]) => (
                    <div key={location} className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {location}
                      </Badge>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(path)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hook-specific execution context */}
        {'hookType' in item && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Execution Context</h4>
            <p className="text-sm text-muted-foreground">
              Hook Type: <Badge variant="outline">{String(item.hookType)}</Badge>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This hook will execute automatically when the specified event occurs in Claude Code.
            </p>
          </div>
        )}

        {installation.requirements && installation.requirements.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <ul className="space-y-2">
              {installation.requirements.map((requirement: string) => (
                <li key={requirement.slice(0, 50)} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * MCP Security Section Renderer
 *
 * Renders security best practices for MCP servers
 */
export function renderMCPSecurity(item: UnifiedContentItem): React.ReactElement | null {
  if (!('security' in item && Array.isArray(item.security)) || item.security.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Security Best Practices
        </CardTitle>
        <CardDescription>Important security considerations for this MCP server</CardDescription>
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
}

/**
 * MCP Examples Renderer
 *
 * Renders example usage for MCP servers
 */
export function renderMCPExamples(item: UnifiedContentItem): React.ReactElement | null {
  if (!('examples' in item && Array.isArray(item.examples)) || item.examples.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Usage Examples
        </CardTitle>
        <CardDescription>Common queries and interactions with this MCP server</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {(item.examples as string[]).map((example: string) => (
            <li key={example.slice(0, 50)} className="flex items-start gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-sm leading-relaxed font-mono">{example}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
