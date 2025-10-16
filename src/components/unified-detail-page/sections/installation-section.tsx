/**
 * InstallationSection - Server Component for installation instructions
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of installation steps, config paths, and requirements
 *
 * Consolidates installation rendering from unified-detail-page.tsx (lines 154-211)
 * and custom-renderers.tsx (renderHookInstallation lines 237-310)
 *
 * Handles: claudeCode/claudeDesktop formats, config paths, requirements
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see components/unified-detail-page.tsx - Original implementation
 * @see lib/config/custom-renderers.tsx - Custom hook renderer
 */

import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import type { InstallationSteps } from '@/src/lib/types/content-type-config';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for InstallationSection
 */
export interface InstallationSectionProps {
  installation: InstallationSteps;
  item: UnifiedContentItem;
  customRenderer?:
    | ((item: UnifiedContentItem, installation: InstallationSteps) => React.ReactElement)
    | undefined;
}

/**
 * InstallationSection Component (Server Component)
 *
 * Renders installation instructions with steps, config paths, and requirements.
 * Supports custom renderers for special cases (hooks, MCP, etc.)
 * No React.memo needed - server components don't re-render
 */
export function InstallationSection({
  installation,
  item,
  customRenderer,
}: InstallationSectionProps) {
  // Use custom renderer if provided
  if (customRenderer) {
    return customRenderer(item, installation);
  }

  // Default installation renderer
  return (
    <Card>
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
                <h4 className={'font-medium mb-2'}>Claude Code Setup</h4>
                <ol className={'list-decimal list-inside space-y-1 text-sm'}>
                  {installation.claudeCode.steps?.map((step: string) => (
                    <li key={step.slice(0, 50)} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              {installation.claudeCode.configPath && (
                <div>
                  <h4 className={'font-medium mb-2'}>Configuration Paths</h4>
                  <div className={'space-y-1 text-sm'}>
                    {Object.entries(installation.claudeCode.configPath).map(([location, path]) => (
                      <div key={location} className={UI_CLASSES.FLEX_GAP_2}>
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

        {/* Claude Desktop installation (for MCP servers) */}
        {typeof installation === 'object' &&
          'claudeDesktop' in installation &&
          installation.claudeDesktop && (
            <div className="space-y-4">
              <div>
                <h4 className={'font-medium mb-2'}>Claude Desktop Setup</h4>
                <ol className={'list-decimal list-inside space-y-1 text-sm'}>
                  {installation.claudeDesktop.steps?.map((step: string) => (
                    <li key={step.slice(0, 50)} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              {installation.claudeDesktop.configPath && (
                <div>
                  <h4 className={'font-medium mb-2'}>Configuration Paths</h4>
                  <div className={'space-y-1 text-sm'}>
                    {Object.entries(installation.claudeDesktop.configPath).map(
                      ([platform, path]) => (
                        <div key={platform} className={UI_CLASSES.FLEX_GAP_2}>
                          <Badge variant="outline" className="capitalize">
                            {platform}
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

        {/* Requirements */}
        {installation.requirements && installation.requirements.length > 0 && (
          <div className="mt-4">
            <h4 className={'font-medium mb-2'}>Requirements</h4>
            <ul className="space-y-2">
              {installation.requirements.map((requirement: string) => (
                <li key={requirement.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span className={'text-sm leading-relaxed'}>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
