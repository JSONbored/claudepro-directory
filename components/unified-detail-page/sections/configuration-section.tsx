'use client';

/**
 * ConfigurationSection - Multi-format configuration display section
 *
 * REFACTORED: Removed lazy loading of CodeHighlight for better performance
 * - Direct import instead of lazy() reduces bundle complexity
 * - Removed Suspense boundary (no longer needed without lazy loading)
 * - Client component remains for copy button interactivity
 *
 * Consolidates configuration rendering from:
 * - unified-detail-page.tsx (renderConfiguration lines 274-304)
 * - custom-renderers.tsx (renderMCPConfiguration lines 30-149)
 * - custom-renderers.tsx (renderHookConfiguration lines 159-230)
 *
 * Handles: JSON configs, multi-format MCP configs, hook configs
 *
 * @see components/unified-detail-page.tsx - Original implementation
 * @see lib/config/custom-renderers.tsx - Custom renderers
 */

import { Copy } from 'lucide-react';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { CodeHighlight } from '@/components/code-highlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { UnifiedContentItem } from '@/lib/schemas';

/**
 * Props for ConfigurationSection
 */
export interface ConfigurationSectionProps {
  item: UnifiedContentItem;
  customRenderer?: ((item: UnifiedContentItem) => React.ReactElement | null) | undefined;
  format?: 'json' | 'multi' | 'hook';
}

/**
 * ConfigurationSection Component
 *
 * Renders configuration with support for multiple formats:
 * - json: Simple JSON display (default, commands/agents/rules)
 * - multi: Multiple config sections (MCP: claudeDesktop, claudeCode, http, sse)
 * - hook: Hook-specific config (hookConfig + scriptContent)
 */
export const ConfigurationSection = memo(function ConfigurationSection({
  item,
  customRenderer,
  format = 'json',
}: ConfigurationSectionProps) {
  const [copied, setCopied] = useState(false);

  // Use custom renderer if provided
  if (customRenderer) {
    return customRenderer(item);
  }

  // Check if configuration exists
  if (!('configuration' in item && item.configuration)) return null;

  const handleCopyConfig = async (configSection?: unknown) => {
    const contentToCopy = configSection
      ? JSON.stringify(configSection, null, 2)
      : JSON.stringify(item.configuration, null, 2);

    const success = await copyToClipboard(contentToCopy, {
      component: 'configuration-section',
      action: 'copy-config',
    });

    setCopied(true);
    if (success) {
      toast.success('Copied!', {
        description: 'Configuration has been copied to your clipboard.',
      });
    } else {
      toast.error('Copy failed', {
        description: 'Unable to copy configuration to clipboard.',
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // Multi-format configuration (MCP servers)
  if (format === 'multi') {
    const config = item.configuration as {
      claudeDesktop?: Record<string, unknown>;
      claudeCode?: Record<string, unknown>;
      http?: Record<string, unknown>;
      sse?: Record<string, unknown>;
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
          {Object.entries(config).map(([key, value]) => {
            if (!value) return null;
            const labels: Record<string, string> = {
              claudeDesktop: 'Claude Desktop',
              claudeCode: 'Claude Code',
              http: 'HTTP Transport',
              sse: 'SSE Transport',
            };

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{labels[key] || key}</h4>
                  <Button size="sm" variant="outline" onClick={() => handleCopyConfig(value)}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto rounded-md border">
                  <pre className="p-4 overflow-x-auto text-sm font-mono bg-black text-green-400 rounded-md">
                    <code>{JSON.stringify(value, null, 2)}</code>
                  </pre>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Hook configuration format
  if (format === 'hook') {
    const config = item.configuration as {
      hookConfig?: { hooks?: Record<string, unknown> };
      scriptContent?: string;
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
            <Button size="sm" variant="outline" onClick={() => handleCopyConfig()}>
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Config'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.hookConfig && (
            <div>
              <h4 className="font-medium mb-2">Hook Configuration</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(config.hookConfig, null, 2)}
              </pre>
            </div>
          )}
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

  // Default JSON configuration
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
        <CodeHighlight
          code={JSON.stringify(item.configuration, null, 2)}
          language="json"
          showCopy={true}
        />
      </CardContent>
    </Card>
  );
});
