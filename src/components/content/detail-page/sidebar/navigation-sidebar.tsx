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
import { usePulse } from '@/src/hooks/use-pulse';
import { isValidCategory } from '@/src/lib/data/config/category';
import { getSocialLinks } from '@/src/lib/data/marketing/contact';
import { ExternalLink, Github, Thermometer } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { ContentItem } from '@/src/lib/types/component.types';
import { BADGE_COLORS, type CategoryType, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { getContentItemUrl, sanitizeSlug } from '@/src/lib/utils/content.utils';
import { ensureStringArray, getMetadata } from '@/src/lib/utils/data.utils';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

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

/**
 * Validate and sanitize documentation URL for safe use in href attributes
 * Only allows HTTPS URLs from trusted domains with common TLDs
 * Returns canonicalized URL or null if invalid
 */
function getSafeDocumentationUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol
    if (parsed.protocol.toLowerCase() !== 'https:') return null;

    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // List of trusted TLDs for documentation sites
    // These are common TLDs used by legitimate documentation platforms
    const trustedTlds = [
      '.com',
      '.org',
      '.net',
      '.io',
      '.ai',
      '.dev',
      '.co',
      '.xyz',
      '.info',
      '.edu',
      '.gov',
      '.us',
      '.uk',
      '.ca',
      '.au',
      '.de',
      '.fr',
      '.jp',
      '.cn',
      '.tech',
      '.site',
      '.online',
    ];

    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
    // Only allow hostnames ending with one of the trusted TLDs
    const hasTrustedTld = trustedTlds.some((tld) => hostname.endsWith(tld));
    if (!hasTrustedTld) return null;

    // Sanitize: strip credentials but keep query/fragment for navigation
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = hostname;
    // Remove default ports
    if (parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href (guaranteed to be normalized and safe)
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
