/**
 * ConfigurationSection - Multi-format configuration display section (SERVER COMPONENT)
 *
 * PRODUCTION-GRADE: Server-side Shiki syntax highlighting for all configurations
 * - Zero client-side JavaScript for syntax highlighting
 * - Consistent colored syntax across all formats
 * - Secure: No manual HTML escaping, uses trusted Shiki renderer
 * - Performant: Pre-rendered on server, cached
 *
 * Handles: JSON configs, multi-format MCP configs, hook configs
 */

import { ProductionCodeBlock } from '@/components/shared/production-code-block';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generateFilename,
  generateHookFilename,
  generateMultiFormatFilename,
} from '@/lib/filename-generator';
import { Copy } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import { highlightCode } from '@/lib/syntax-highlighting';
import { UI_CLASSES } from '@/lib/ui-constants';

/**
 * Props for ConfigurationSection
 */
export interface ConfigurationSectionProps {
  item: UnifiedContentItem;
  customRenderer?: ((item: UnifiedContentItem) => React.ReactElement | null) | undefined;
  format?: 'json' | 'multi' | 'hook';
  preHighlightedConfigHtml?: string | undefined;
}

/**
 * ConfigurationSection - ASYNC SERVER COMPONENT
 *
 * Renders configuration with server-side Shiki syntax highlighting:
 * - json: Simple JSON display (commands/agents/rules)
 * - multi: Multiple config sections (MCP: claudeDesktop, claudeCode, http, sse)
 * - hook: Hook-specific config (hookConfig + scriptContent)
 */
export async function ConfigurationSection({
  item,
  customRenderer,
  format = 'json',
  preHighlightedConfigHtml,
}: ConfigurationSectionProps) {
  // Use custom renderer if provided
  if (customRenderer) {
    return customRenderer(item);
  }

  // Check if configuration exists
  if (!('configuration' in item && item.configuration)) return null;

  // Multi-format configuration (MCP servers) - SERVER-SIDE SHIKI
  if (format === 'multi') {
    const config = item.configuration as {
      claudeDesktop?: Record<string, unknown>;
      claudeCode?: Record<string, unknown>;
      http?: Record<string, unknown>;
      sse?: Record<string, unknown>;
    };

    // Pre-render ALL configurations with Shiki on the server
    const highlightedConfigs = await Promise.all(
      Object.entries(config).map(async ([key, value]) => {
        if (!value) return null;

        const code = JSON.stringify(value, null, 2);
        const html = await highlightCode(code, 'json');
        const filename = generateMultiFormatFilename(item, key, 'json');

        return {
          key,
          html,
          code,
          filename,
        };
      })
    );

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
          {highlightedConfigs.map((config) => {
            if (!config) return null;
            return (
              <div key={config.key}>
                <ProductionCodeBlock
                  html={config.html}
                  code={config.code}
                  language="json"
                  filename={config.filename}
                  maxLines={25}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Hook configuration format - SERVER-SIDE SHIKI
  if (format === 'hook') {
    const config = item.configuration as {
      hookConfig?: { hooks?: Record<string, unknown> };
      scriptContent?: string;
    };

    // Pre-render hook config and script with Shiki
    const [highlightedHookConfig, highlightedScript] = await Promise.all([
      config.hookConfig
        ? highlightCode(JSON.stringify(config.hookConfig, null, 2), 'json')
        : Promise.resolve(null),
      config.scriptContent ? highlightCode(config.scriptContent, 'bash') : Promise.resolve(null),
    ]);

    return (
      <Card>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            Hook Configuration
          </CardTitle>
          <CardDescription>Hook setup and script content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlightedHookConfig && (
            <ProductionCodeBlock
              html={highlightedHookConfig}
              code={JSON.stringify(config.hookConfig, null, 2)}
              language="json"
              filename={generateHookFilename(item, 'hookConfig', 'json')}
              maxLines={20}
            />
          )}
          {highlightedScript && config.scriptContent && (
            <ProductionCodeBlock
              html={highlightedScript}
              code={config.scriptContent}
              language="bash"
              filename={generateHookFilename(item, 'scriptContent', 'bash')}
              maxLines={25}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Default JSON configuration - SERVER-SIDE SHIKI
  const code = JSON.stringify(item.configuration, null, 2);
  const html = preHighlightedConfigHtml || (await highlightCode(code, 'json'));

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
        <ProductionCodeBlock
          html={html}
          code={code}
          language="json"
          filename={generateFilename({ item, language: 'json' })}
          maxLines={25}
        />
      </CardContent>
    </Card>
  );
}
