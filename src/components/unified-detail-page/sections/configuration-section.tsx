/**
 * ConfigurationSection - Multi-format configuration display section (SERVER COMPONENT)
 *
 * @server This is a SERVER-ONLY component (async, imports batch.utils → cache.server)
 *
 * PRODUCTION-GRADE: Server-side Shiki syntax highlighting for all configurations
 * - Zero client-side JavaScript for syntax highlighting
 * - Consistent colored syntax across all formats
 * - Secure: No manual HTML escaping, uses trusted Shiki renderer
 * - Performant: Pre-rendered on server, cached
 *
 * **Architecture:**
 * - Server Component: Uses batchMap from batch.utils (imports cache.server)
 * - NOT Storybook-compatible (requires server-side execution)
 * - Correct usage: Server components can import server-only code
 *
 * Handles: JSON configs, multi-format MCP configs, hook configs
 */

import { ProductionCodeBlock } from '@/src/components/shared/production-code-block';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';
import { Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';
import {
  generateFilename,
  generateHookFilename,
  generateMultiFormatFilename,
  transformMcpConfigForDisplay,
} from '@/src/lib/utils/content.utils';

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
    const highlightedConfigs = await batchMap(Object.entries(config), async ([key, value]) => {
      if (!value) return null;

      // Transform MCP config for Claude Desktop display
      // Internal: uses 'mcp', External: transforms to 'mcpServers'
      const displayValue =
        key === 'claudeDesktop' || key === 'claudeCode'
          ? transformMcpConfigForDisplay(value as Record<string, unknown>)
          : value;

      const code = JSON.stringify(displayValue, null, 2);
      const html = await highlightCode(code, 'json');
      const filename = generateMultiFormatFilename(item, key, 'json');

      return {
        key,
        html,
        code,
        filename,
      };
    });

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
    const [highlightedHookConfig, highlightedScript] = await batchFetch([
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
