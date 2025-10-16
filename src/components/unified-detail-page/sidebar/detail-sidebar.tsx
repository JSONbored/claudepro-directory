'use client';

/**
 * DetailSidebar - Sidebar orchestrator for detail pages
 *
 * Consolidates sidebar rendering logic from unified-detail-page.tsx (lines 434-507)
 * and custom-sidebars.tsx (renderAgentSidebar, renderMCPSidebar)
 *
 * Uses SidebarCard directly with inline configuration for optimal tree-shaking
 *
 * @see components/unified-detail-page.tsx - Original implementation
 * @see lib/config/custom-sidebars.tsx - Custom sidebar renderers
 */

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { SidebarCard } from '@/src/components/shared/sidebar-card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ExternalLink, Github, Thermometer } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { BADGE_COLORS, type CategoryType, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

/**
 * Props for DetailSidebar
 */
export interface DetailSidebarProps {
  item: UnifiedContentItem;
  relatedItems: UnifiedContentItem[];
  config: {
    typeName: string;
    metadata?:
      | {
          categoryLabel?: string;
          showGitHubLink?: boolean;
          githubPathPrefix?: string;
        }
      | undefined;
  };
  customRenderer?:
    | ((
        item: UnifiedContentItem,
        relatedItems: UnifiedContentItem[],
        router: ReturnType<typeof useRouter>
      ) => React.ReactNode)
    | undefined;
}

/**
 * DetailSidebar Component
 *
 * Orchestrates sidebar rendering using composable sidebar cards.
 * Supports custom renderers for special cases (agents, MCP with extra metadata)
 */
export const DetailSidebar = memo(function DetailSidebar({
  item,
  relatedItems,
  config,
  customRenderer,
}: DetailSidebarProps) {
  const router = useRouter();

  // Use custom renderer if provided
  if (customRenderer) {
    return <div className={UI_CLASSES.SPACE_Y_6}>{customRenderer(item, relatedItems, router)}</div>;
  }

  // Default sidebar using SidebarCard with inline configuration
  const githubUrl = config.metadata?.githubPathPrefix
    ? `https://github.com/JSONbored/claudepro-directory/blob/main/${config.metadata.githubPathPrefix}/${item.slug}.json`
    : item.category
      ? `https://github.com/JSONbored/claudepro-directory/blob/main/content/${item.category}/${item.slug}.json`
      : null;

  const showGitHubLink = config.metadata?.showGitHubLink ?? true;
  const hasConfiguration = 'configuration' in item && typeof item.configuration === 'object';
  const hasPackage = 'package' in item && item.package;
  const hasAuth = 'requiresAuth' in item;
  const hasPermissions = 'permissions' in item && Array.isArray(item.permissions);

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Resources Card */}
      <SidebarCard
        title="Resources"
        contentClassName="space-y-3"
        show={!!(showGitHubLink || item.documentationUrl)}
      >
        {showGitHubLink && githubUrl && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
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
      </SidebarCard>

      {/* Type-specific Details Card */}
      <SidebarCard
        title={`${config.typeName} Details`}
        contentClassName="space-y-4"
        show={!!(hasConfiguration || hasPackage || hasAuth || hasPermissions || item.source)}
      >
        {item.category && (
          <div>
            <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Category</h4>
            <Badge
              variant="default"
              className={`text-xs ${UI_CLASSES.FONT_MEDIUM} ${
                BADGE_COLORS.category[item.category as CategoryType] ||
                BADGE_COLORS.category.default
              }`}
            >
              {item.category === 'mcp'
                ? 'MCP Server'
                : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Badge>
          </div>
        )}

        {hasConfiguration &&
          'temperature' in (item.configuration as object) &&
          typeof (item.configuration as { temperature?: number }).temperature === 'number' && (
            <div>
              <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Temperature</h4>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Thermometer className="h-3 w-3 text-orange-500" />
                <Badge
                  variant="outline"
                  className={`text-xs ${UI_CLASSES.FONT_MEDIUM} bg-orange-500/10 text-orange-600 border-orange-500/30`}
                >
                  {String((item.configuration as { temperature: number }).temperature)}
                </Badge>
              </div>
            </div>
          )}

        {hasPackage && (
          <div>
            <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Package</h4>
            <Badge variant="outline" className="font-mono text-xs">
              {String((item as { package: string }).package)}
            </Badge>
          </div>
        )}

        {hasAuth && (
          <div>
            <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Authentication</h4>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>
              {(item as { requiresAuth: boolean }).requiresAuth ? 'Required' : 'Not required'}
            </p>
          </div>
        )}

        {hasPermissions && (item.permissions as string[]).length > 0 && (
          <div>
            <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {(item.permissions as string[]).map((perm: string) => (
                <Badge key={perm} variant="outline" className={UI_CLASSES.TEXT_XS}>
                  {perm}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {item.source && (
          <div>
            <h4 className={`${UI_CLASSES.FONT_MEDIUM} mb-1`}>Source</h4>
            <Badge variant="outline">{item.source}</Badge>
          </div>
        )}
      </SidebarCard>

      {/* Related Items Card */}
      <SidebarCard
        title={`Related ${config.typeName}s`}
        contentClassName="space-y-3"
        show={relatedItems.length > 0}
      >
        {relatedItems.slice(0, 5).map((relatedItem) => (
          <button
            key={relatedItem.slug}
            type="button"
            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} p-3 rounded-lg border border-border hover:bg-muted/50 ${UI_CLASSES.TRANSITION_COLORS} cursor-pointer w-full text-left`}
            onClick={() => router.push(getContentItemUrl(relatedItem))}
          >
            <div className={`${UI_CLASSES.FLEX_1} ${UI_CLASSES.MIN_W_0}`}>
              <h4 className="font-medium text-sm truncate">{getDisplayTitle(relatedItem)}</h4>
              <p className="text-xs text-muted-foreground truncate">{relatedItem.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </button>
        ))}
      </SidebarCard>
    </div>
  );
});
