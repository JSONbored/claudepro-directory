'use client';

/**
 * DetailSidebar - Sidebar orchestrator for detail pages
 */

import type { Database } from '@heyclaude/database-types';
import {
  type CategoryType,
  ensureStringArray,
  getContentItemUrl,
  getMetadata,
  getSocialLinks,
  isValidCategory,
  logger,
  logUnhandledPromise,
  sanitizeSlug,
} from '@heyclaude/web-runtime/core';
import { useCopyToClipboard, usePulse } from '@heyclaude/web-runtime/hooks';
import { Copy, ExternalLink, Github, Thermometer } from '@heyclaude/web-runtime/icons';
import type { ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { BADGE_COLORS, getDisplayTitle, toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

/**
 * Validate slug is safe for use in URLs
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Note: Protocol check removed as unreachable (path already starts with /)
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores
  // This is permissive but safe for Next.js routing
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Get safe content URL with validation
 * Returns null if category or slug is invalid
 */
function getSafeContentItemUrl(category: string, slug: string): string | null {
  if (!(isValidCategory(category) && isValidSlug(slug))) return null;
  const sanitizedSlug = sanitizeSlug(slug);
  // sanitizeSlug only removes characters that isValidSlug already forbids,
  // so if slug passed isValidSlug, sanitizedSlug will also pass
  // Construct the URL
  const url = getContentItemUrl({
    category: category as Database['public']['Enums']['content_category'],
    slug: sanitizedSlug,
  });
  // Validate the final URL path to ensure it's safe
  if (!isValidInternalPath(url)) return null;
  return url;
}

function getSafeDocumentationUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol.toLowerCase() !== 'https:') {
      return null;
    }

    parsed.username = '';
    parsed.password = '';
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    if (parsed.port === '443') {
      parsed.port = '';
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Props for DetailSidebar
 */
export interface DetailSidebarProps {
  item:
    | ContentItem
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['content'];
  relatedItems:
    | ContentItem[]
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['related'];
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
        item:
          | ContentItem
          | Database['public']['Functions']['get_content_detail_complete']['Returns']['content'],
        relatedItems:
          | ContentItem[]
          | Database['public']['Functions']['get_content_detail_complete']['Returns']['related'],
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
  const pulse = usePulse();
  const { copy: copyToClipboard } = useCopyToClipboard({
    context: {
      component: 'detail-sidebar',
      action: 'quick_action',
    },
  });

  // Cast item to ContentItem for property access (content is Json type from RPC)
  const contentItem = item as ContentItem;

  // Use custom renderer if provided
  if (customRenderer) {
    return <div className="space-y-6">{customRenderer(item, relatedItems, router)}</div>;
  }

  // Default sidebar using SidebarCard with inline configuration
  const githubUrl = config.metadata?.githubPathPrefix
    ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/${config.metadata.githubPathPrefix}/${contentItem.slug}.json`
    : contentItem.category
      ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/content/${contentItem.category}/${contentItem.slug}.json`
      : null;

  const showGitHubLink = config.metadata?.showGitHubLink ?? true;
  const hasDocumentationUrl = 'documentation_url' in contentItem && contentItem.documentation_url;
  const metadata = getMetadata(contentItem);
  const hasConfiguration =
    metadata['configuration'] && typeof metadata['configuration'] === 'object';
  const packageName = metadata['package'] as string | undefined;
  const hasPackage = !!packageName;
  const hasAuth = 'requiresAuth' in metadata;
  const hasPermissions = 'permissions' in metadata;
  const permissions = hasPermissions ? ensureStringArray(metadata['permissions']) : [];
  const hasSource = 'source' in contentItem && contentItem.source;
  const mcpServers =
    metadata['mcpServers'] && typeof metadata['mcpServers'] === 'object'
      ? metadata['mcpServers']
      : null;
  const configurationObject =
    metadata['configuration'] && typeof metadata['configuration'] === 'object'
      ? metadata['configuration']
      : null;
  const pulseCategory = isValidCategory(contentItem.category)
    ? (contentItem.category as Database['public']['Enums']['content_category'])
    : null;
  const contentSlug = typeof contentItem.slug === 'string' ? contentItem.slug : null;

  type QuickAction = {
    key: string;
    label: string;
    description?: string;
    onClick: () => void | Promise<void>;
  };

  const trackCopyPulse = (metadata?: Record<string, unknown>) => {
    if (!(pulseCategory && contentSlug)) return;
    pulse
      .copy({
        category: pulseCategory,
        slug: contentSlug,
        ...(metadata ? { metadata } : {}),
      })
      .catch((error) => {
        logUnhandledPromise('NavigationSidebar: quick action pulse failed', error, {
          category: contentItem.category ?? 'null',
          slug: contentSlug ?? 'null',
        });
      });
  };

  const quickActions: QuickAction[] = [];

  if (hasPackage && packageName) {
    const pnpmCommand = `pnpm add ${packageName}`;
    quickActions.push({
      key: 'pnpm-install',
      label: `Copy “${pnpmCommand}”`,
      description: 'Paste into your terminal to install this package',
      onClick: async () => {
        try {
          await copyToClipboard(pnpmCommand);
          toasts.raw.success('Install command copied', {
            description: pnpmCommand,
          });
          trackCopyPulse({ action: 'copy_install', manager: 'pnpm' });
        } catch (error) {
          logger.error('NavigationSidebar: failed to copy pnpm command', error as Error);
          toasts.raw.error('Copy failed', {
            description: 'Unable to copy pnpm command.',
          });
        }
      },
    });
  }

  if (mcpServers) {
    quickActions.push({
      key: 'copy-mcp-config',
      label: 'Copy Claude Desktop config',
      description: 'Adds this MCP server to Claude Desktop settings',
      onClick: async () => {
        try {
          await copyToClipboard(JSON.stringify({ mcpServers }, null, 2));
          toasts.raw.success('Claude config copied', {
            description: 'Paste into Claude Desktop → Settings → MCP Servers.',
          });
          trackCopyPulse({ action: 'copy_mcp_config' });
        } catch (error) {
          logger.error('NavigationSidebar: failed to copy MCP config', error as Error);
          toasts.raw.error('Copy failed', {
            description: 'Unable to copy Claude Desktop configuration.',
          });
        }
      },
    });
  }

  if (configurationObject && !mcpServers) {
    quickActions.push({
      key: 'copy-config-json',
      label: 'Copy configuration JSON',
      description: 'Use this configuration in your own project',
      onClick: async () => {
        try {
          await copyToClipboard(JSON.stringify(configurationObject, null, 2));
          toasts.raw.success('Configuration copied', {
            description: 'JSON configuration saved to your clipboard.',
          });
          trackCopyPulse({ action: 'copy_configuration' });
        } catch (error) {
          logger.error('NavigationSidebar: failed to copy configuration JSON', error as Error);
          toasts.raw.error('Copy failed', {
            description: 'Unable to copy configuration JSON.',
          });
        }
      },
    });
  }

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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  pulse
                    .click({
                      category: isValidCategory(contentItem.category) ? contentItem.category : null,
                      slug: contentItem.slug || null,
                      metadata: {
                        action: 'external_link',
                        link_type: 'github',
                        target_url: githubUrl,
                      },
                    })
                    .catch((error) => {
                      logUnhandledPromise(
                        'NavigationSidebar: GitHub link click pulse failed',
                        error,
                        {
                          category: contentItem.category ?? 'null',
                          slug: contentItem.slug ?? 'null',
                        }
                      );
                    });
                }}
                asChild={true}
              >
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className={UI_CLASSES.ICON_SM_LEADING} />
                  View on GitHub
                </a>
              </Button>
            )}
            {hasDocumentationUrl &&
              'documentation_url' in contentItem &&
              contentItem.documentation_url &&
              (() => {
                // Validate and sanitize documentation URL before rendering
                const safeDocUrl = getSafeDocumentationUrl(contentItem.documentation_url);
                if (!safeDocUrl) {
                  logger.warn('NavigationSidebar: Invalid documentation URL rejected', {
                    category: contentItem.category ?? 'null',
                    slug: contentItem.slug ?? 'null',
                    url: contentItem.documentation_url ?? 'null',
                  });
                  // Don't render link if URL is invalid or unsafe
                  return null;
                }
                return (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      pulse
                        .click({
                          category: isValidCategory(contentItem.category)
                            ? contentItem.category
                            : null,
                          slug: contentItem.slug || null,
                          metadata: {
                            action: 'external_link',
                            link_type: 'documentation',
                            target_url: safeDocUrl,
                          },
                        })
                        .catch((error) => {
                          logUnhandledPromise(
                            'NavigationSidebar: documentation link click pulse failed',
                            error,
                            {
                              category: contentItem.category ?? 'null',
                              slug: contentItem.slug ?? 'null',
                            }
                          );
                        });
                    }}
                    asChild={true}
                  >
                    <a href={safeDocUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className={UI_CLASSES.ICON_SM_LEADING} />
                      Documentation
                    </a>
                  </Button>
                );
              })()}
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
            {contentItem.category && (
              <div>
                <h4 className={'mb-1 font-medium'}>Category</h4>
                <UnifiedBadge
                  variant="base"
                  style="default"
                  className={`font-medium text-xs ${
                    BADGE_COLORS.category[contentItem.category as CategoryType] ||
                    BADGE_COLORS.category.default
                  }`}
                >
                  {contentItem.category === 'mcp'
                    ? 'MCP Server'
                    : contentItem.category.charAt(0).toUpperCase() + contentItem.category.slice(1)}
                </UnifiedBadge>
              </div>
            )}

            {(() => {
              if (
                !hasConfiguration ||
                typeof metadata['configuration'] !== 'object' ||
                metadata['configuration'] === null
              ) {
                return null;
              }
              const config = metadata['configuration'] as { temperature?: number };
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
                  {(metadata['requiresAuth'] as boolean) ? 'Required' : 'Not required'}
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

            {hasSource && 'source' in contentItem && contentItem.source && (
              <div>
                <h4 className={'mb-1 font-medium'}>Source</h4>
                <UnifiedBadge variant="base" style="outline">
                  {contentItem.source}
                </UnifiedBadge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!!quickActions.length && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.key}
                variant="secondary"
                className="w-full justify-start gap-3 text-left"
                onClick={action.onClick}
              >
                <Copy className={UI_CLASSES.ICON_SM_LEADING} />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.label}</div>
                  {action.description && (
                    <p className="text-muted-foreground text-xs">{action.description}</p>
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Related Items Card */}
      {relatedItems && Array.isArray(relatedItems) && relatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{`Related ${config.typeName}s`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedItems.slice(0, 5).map((relatedItem) => {
              const relatedCategory =
                'category' in relatedItem &&
                typeof relatedItem.category === 'string' &&
                isValidCategory(relatedItem.category)
                  ? relatedItem.category
                  : 'agents';
              const relatedSlug =
                'slug' in relatedItem && typeof relatedItem.slug === 'string'
                  ? relatedItem.slug
                  : '';
              // Validate and sanitize URL before using
              const safeRelatedUrl = getSafeContentItemUrl(relatedCategory, relatedSlug);
              if (!safeRelatedUrl) {
                logger.warn('NavigationSidebar: Invalid related item URL rejected', {
                  category: relatedCategory,
                  slug: relatedSlug,
                  relatedItemTitle: getDisplayTitle({
                    title:
                      'title' in relatedItem && typeof relatedItem.title === 'string'
                        ? relatedItem.title
                        : null,
                    slug: relatedSlug,
                    category: relatedCategory,
                  }),
                });
                return null;
              }
              // Explicit validation at point of use to satisfy static analysis
              // This ensures the URL is a safe internal path before using in Link
              // Type guard: after this check, safeRelatedUrl is guaranteed to be a valid internal path
              if (!isValidInternalPath(safeRelatedUrl)) {
                logger.warn('NavigationSidebar: Invalid internal path rejected', {
                  category: relatedCategory,
                  slug: relatedSlug,
                  url: safeRelatedUrl,
                });
                return null;
              }
              // At this point, safeRelatedUrl is validated and safe for use in Next.js Link
              // Use validated URL directly to satisfy static analysis
              const validatedUrl: string = safeRelatedUrl;
              return (
                <Link
                  key={relatedSlug}
                  href={validatedUrl}
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} block w-full cursor-pointer rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50`}
                >
                  <div className={'min-w-0 flex-1'}>
                    <h4 className="truncate font-medium text-sm">
                      {getDisplayTitle({
                        title:
                          'title' in relatedItem && typeof relatedItem.title === 'string'
                            ? relatedItem.title
                            : null,
                        slug: relatedSlug,
                        category: relatedCategory,
                      })}
                    </h4>
                    <p className="truncate text-muted-foreground text-xs">
                      {'description' in relatedItem && typeof relatedItem.description === 'string'
                        ? relatedItem.description
                        : ''}
                    </p>
                  </div>
                  <ExternalLink className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
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
