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

import { memo } from 'react';
import { toast } from 'sonner';
import { CodeHighlight } from '@/components/shared/code-highlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Copy } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

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
  const { copied, copy } = useCopyToClipboard({
    onSuccess: () => {
      toast.success('Copied!', {
        description: 'Configuration has been copied to your clipboard.',
      });
    },
    onError: () => {
      toast.error('Copy failed', {
        description: 'Unable to copy configuration to clipboard.',
      });
    },
    context: {
      component: 'configuration-section',
      action: 'copy-config',
    },
  });

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

    await copy(contentToCopy);
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
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
                <div
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_3}`}
                >
                  <h4 className={UI_CLASSES.FONT_MEDIUM}>{labels[key] || key}</h4>
                  <Button size="sm" variant="outline" onClick={() => handleCopyConfig(value)}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className={`max-h-[400px] ${UI_CLASSES.OVERFLOW_Y_AUTO} rounded-md border`}>
                  <pre
                    className={`${UI_CLASSES.P_4} ${UI_CLASSES.OVERFLOW_X_AUTO} ${UI_CLASSES.TEXT_SM} font-mono bg-black text-green-400 rounded-md`}
                  >
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
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div>
              <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Copy className="h-5 w-5" />
                Hook Configuration
              </CardTitle>
              <CardDescription className={UI_CLASSES.MT_2}>
                Hook setup and script content
              </CardDescription>
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
              <h4 className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.MB_2}`}>Hook Configuration</h4>
              <pre
                className={`bg-muted ${UI_CLASSES.P_4} rounded-lg ${UI_CLASSES.TEXT_SM} ${UI_CLASSES.OVERFLOW_X_AUTO}`}
              >
                {JSON.stringify(config.hookConfig, null, 2)}
              </pre>
            </div>
          )}
          {config.scriptContent && (
            <div>
              <h4 className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.MB_2}`}>Script Content</h4>
              <pre
                className={`bg-black text-green-400 ${UI_CLASSES.P_4} rounded-lg ${UI_CLASSES.TEXT_SM} ${UI_CLASSES.OVERFLOW_X_AUTO} max-h-[400px]`}
              >
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
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
