/**
 * SidebarDetailsCard - Server Component for type-specific metadata
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of agent/MCP/content-specific metadata
 *
 * Consolidates type-specific metadata from:
 * - custom-sidebars.tsx (renderAgentSidebar lines 55-97)
 * - custom-sidebars.tsx (renderMCPSidebar lines 170-227)
 *
 * Handles: Agent details (temperature, tools), MCP details (package, auth, permissions)
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see lib/config/custom-sidebars.tsx - Original implementations
 */

import { Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UnifiedContentItem } from '@/lib/schemas';

/**
 * Props for SidebarDetailsCard
 */
export interface SidebarDetailsCardProps {
  item: UnifiedContentItem;
  title?: string;
}

/**
 * SidebarDetailsCard Component (Server Component)
 *
 * Renders type-specific metadata based on content category.
 * Automatically detects and displays relevant fields (temperature, package, auth, etc.)
 * No React.memo needed - server components don't re-render
 */
export function SidebarDetailsCard({ item, title = 'Details' }: SidebarDetailsCardProps) {
  // Check if there's any metadata to show
  const hasConfiguration = 'configuration' in item && typeof item.configuration === 'object';
  const hasPackage = 'package' in item && item.package;
  const hasAuth = 'requiresAuth' in item;
  const hasPermissions = 'permissions' in item && Array.isArray(item.permissions);
  const hasSource = item.source;

  // Don't render if no metadata
  if (!(hasConfiguration || hasPackage || hasAuth || hasPermissions || hasSource)) return null;

  const getColorClass = (category: string) => {
    const colorMap: Record<string, string> = {
      agents: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      mcp: 'bg-green-500/20 text-green-500 border-green-500/30',
      commands: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      hooks: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      rules: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    };
    return colorMap[category] || 'bg-primary/20 text-primary border-primary/30';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Badge */}
        {item.category && (
          <div>
            <h4 className="font-medium mb-1">Category</h4>
            <Badge
              variant="default"
              className={`text-xs font-medium ${getColorClass(item.category)}`}
            >
              {item.category === 'mcp'
                ? 'MCP Server'
                : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Badge>
          </div>
        )}

        {/* Temperature (Agents) */}
        {hasConfiguration &&
          'temperature' in (item.configuration as object) &&
          typeof (item.configuration as { temperature?: number }).temperature === 'number' && (
            <div>
              <h4 className="font-medium mb-1">Temperature</h4>
              <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-orange-500" />
                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-orange-500/10 text-orange-600 border-orange-500/30"
                >
                  {String((item.configuration as { temperature: number }).temperature)}
                </Badge>
              </div>
            </div>
          )}

        {/* Package (MCP Servers) */}
        {hasPackage && (
          <div>
            <h4 className="font-medium mb-1">Package</h4>
            <Badge variant="outline" className="font-mono text-xs">
              {String((item as { package: string }).package)}
            </Badge>
          </div>
        )}

        {/* Authentication (MCP Servers) */}
        {hasAuth && (
          <div>
            <h4 className="font-medium mb-1">Authentication</h4>
            <p className="text-sm text-muted-foreground">
              {(item as { requiresAuth: boolean }).requiresAuth ? 'Required' : 'Not required'}
            </p>
          </div>
        )}

        {/* Permissions (MCP Servers) */}
        {hasPermissions && (item.permissions as string[]).length > 0 && (
          <div>
            <h4 className="font-medium mb-1">Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {(item.permissions as string[]).map((perm: string) => (
                <Badge key={perm} variant="outline" className="text-xs">
                  {perm}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        {hasSource && (
          <div>
            <h4 className="font-medium mb-1">Source</h4>
            <Badge variant="outline">{item.source}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
