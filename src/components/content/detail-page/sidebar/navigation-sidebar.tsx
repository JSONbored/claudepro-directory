'use client';

/**
 * DetailSidebar - Sidebar orchestrator for detail pages
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import type { CategoryId } from '@/src/lib/data/config/category';
import type { ContentItem } from '@/src/lib/data/content';
import { getSocialLinks } from '@/src/lib/data/marketing/contact';
import { ExternalLink, Github, Thermometer } from '@/src/lib/icons';
import { BADGE_COLORS, type CategoryType, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';
import { ensureStringArray } from '@/src/lib/utils/data.utils';
import type { GetContentDetailCompleteReturn } from '@/src/types/database-overrides';

/**
 * Props for DetailSidebar
 */
export interface DetailSidebarProps {
  item: ContentItem | GetContentDetailCompleteReturn['content'];
  relatedItems: ContentItem[] | GetContentDetailCompleteReturn['related'];
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
        item: ContentItem | GetContentDetailCompleteReturn['content'],
        relatedItems: ContentItem[] | GetContentDetailCompleteReturn['related'],
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
const SOCIAL_LINK_SNAPSHOT = getSocialLinks();

export const DetailSidebar = memo(function DetailSidebar({
  item,
  relatedItems,
  config,
  customRenderer,
}: DetailSidebarProps) {
  const router = useRouter();

  // Use custom renderer if provided
  if (customRenderer) {
    return <div className="space-y-6">{customRenderer(item, relatedItems, router)}</div>;
  }

  // Default sidebar using SidebarCard with inline configuration
  const githubUrl = config.metadata?.githubPathPrefix
    ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/${config.metadata.githubPathPrefix}/${item.slug}.json`
    : item.category
      ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/content/${item.category}/${item.slug}.json`
      : null;

  const showGitHubLink = config.metadata?.showGitHubLink ?? true;
  const hasDocumentationUrl = 'documentation_url' in item && item.documentation_url;
  const metadata = ('metadata' in item && (item.metadata as Record<string, unknown>)) || {};
  const hasConfiguration = metadata.configuration && typeof metadata.configuration === 'object';
  const packageName = metadata.package as string | undefined;
  const hasPackage = !!packageName;
  const hasAuth = 'requiresAuth' in metadata;
  const hasPermissions = 'permissions' in metadata;
  const permissions = hasPermissions ? ensureStringArray(metadata.permissions) : [];
  const hasSource = 'source' in item && item.source;

  return (
    <div className="space-y-6">
      {/* Resources Card */}
      {!!(showGitHubLink || hasDocumentationUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {showGitHubLink && githubUrl && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className={UI_CLASSES.ICON_SM_LEADING} />
                  View on GitHub
                </a>
              </Button>
            )}
            {hasDocumentationUrl && 'documentation_url' in item && item.documentation_url && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={item.documentation_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className={UI_CLASSES.ICON_SM_LEADING} />
                  Documentation
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type-specific Details Card */}
      {!!(hasConfiguration || hasPackage || hasAuth || hasPermissions || hasSource) && (
        <Card>
          <CardHeader>
            <CardTitle>{`${config.typeName} Details`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.category && (
              <div>
                <h4 className={'mb-1 font-medium'}>Category</h4>
                <UnifiedBadge
                  variant="base"
                  style="default"
                  className={`font-medium text-xs ${
                    BADGE_COLORS.category[item.category as CategoryType] ||
                    BADGE_COLORS.category.default
                  }`}
                >
                  {item.category === 'mcp'
                    ? 'MCP Server'
                    : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </UnifiedBadge>
              </div>
            )}

            {(() => {
              if (
                !hasConfiguration ||
                typeof metadata.configuration !== 'object' ||
                metadata.configuration === null
              ) {
                return null;
              }
              const config = metadata.configuration as { temperature?: number };
              if (typeof config.temperature !== 'number') {
                return null;
              }
              return (
                <div>
                  <h4 className={'mb-1 font-medium'}>Temperature</h4>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <Thermometer className={`${UI_CLASSES.ICON_XS} text-orange-500`} />
                    <UnifiedBadge
                      variant="base"
                      style="outline"
                      className={
                        'border-orange-500/30 bg-orange-500/10 font-medium text-orange-600 text-xs'
                      }
                    >
                      {String(config.temperature)}
                    </UnifiedBadge>
                  </div>
                </div>
              );
            })()}

            {hasPackage && packageName && (
              <div>
                <h4 className={'mb-1 font-medium'}>Package</h4>
                <UnifiedBadge variant="base" style="outline" className="font-mono text-xs">
                  {packageName}
                </UnifiedBadge>
              </div>
            )}

            {hasAuth && (
              <div>
                <h4 className={'mb-1 font-medium'}>Authentication</h4>
                <p className={UI_CLASSES.TEXT_SM_MUTED}>
                  {(metadata.requiresAuth as boolean) ? 'Required' : 'Not required'}
                </p>
              </div>
            )}

            {hasPermissions && permissions.length > 0 && (
              <div>
                <h4 className={'mb-1 font-medium'}>Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {permissions.map((perm) => (
                    <UnifiedBadge key={perm} variant="base" style="outline" className="text-xs">
                      {perm}
                    </UnifiedBadge>
                  ))}
                </div>
              </div>
            )}

            {hasSource && 'source' in item && item.source && (
              <div>
                <h4 className={'mb-1 font-medium'}>Source</h4>
                <UnifiedBadge variant="base" style="outline">
                  {item.source}
                </UnifiedBadge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Items Card */}
      {relatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{`Related ${config.typeName}s`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedItems.slice(0, 5).map((relatedItem) => {
              const relatedCategory =
                'category' in relatedItem && typeof relatedItem.category === 'string'
                  ? relatedItem.category
                  : '';
              const relatedSlug =
                'slug' in relatedItem && typeof relatedItem.slug === 'string'
                  ? relatedItem.slug
                  : '';
              return (
                <Link
                  key={relatedSlug}
                  href={getContentItemUrl({
                    category: relatedCategory as CategoryId,
                    slug: relatedSlug,
                  })}
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} block w-full cursor-pointer rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50`}
                >
                  <div className={'min-w-0 flex-1'}>
                    <h4 className="truncate font-medium text-sm">{getDisplayTitle(relatedItem)}</h4>
                    <p className="truncate text-muted-foreground text-xs">
                      {'description' in relatedItem && typeof relatedItem.description === 'string'
                        ? relatedItem.description
                        : ''}
                    </p>
                  </div>
                  <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Jobs Promotion */}
      <JobsPromo />
    </div>
  );
});
