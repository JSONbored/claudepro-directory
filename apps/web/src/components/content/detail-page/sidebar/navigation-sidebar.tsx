'use client';

/**
 * DetailSidebar - Sidebar orchestrator for detail pages
 */

import { ContentCategory } from '@heyclaude/data-layer/prisma';
import type { GetContentDetailCompleteReturns } from '@heyclaude/database-types/postgres-types';
import { ensureStringArray, getMetadata } from '@heyclaude/web-runtime/utils/content-helpers';
import { getContentItemUrl, sanitizeSlug } from '@heyclaude/web-runtime/content';
import { getSocialLinks } from '@heyclaude/web-runtime/config/marketing-client';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import { Copy, ExternalLink, Github, Thermometer } from '@heyclaude/web-runtime/icons';
import { logClientWarn } from '@heyclaude/web-runtime/logging/client';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';
import {
  getDisplayTitle,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';

import { useDetailQuickActions } from '../use-detail-quick-actions';

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
 * Build a safe internal content-item URL from a category and slug, or return null if it cannot be validated.
 *
 * @param category - Content category (e.g., "agents", "integrations")
 * @param slug - Content item slug (user-facing identifier)
 * @returns The validated internal path for the content item, or `null` if the inputs or resulting path are invalid
 *
 * @see getContentItemUrl
 * @see isValidCategory
 * @see isValidSlug
 * @see isValidInternalPath
 */
function getSafeContentItemUrl(category: string, slug: string): null | string {
  if (!(isValidCategory(category) && isValidSlug(slug))) return null;
  const sanitizedSlug = sanitizeSlug(slug);
  // sanitizeSlug only removes characters that isValidSlug already forbids,
  // so if slug passed isValidSlug, sanitizedSlug will also pass
  // Construct the URL
  const url = getContentItemUrl({
    category: category,
    slug: sanitizedSlug,
  });
  // Validate the final URL path to ensure it's safe
  if (!isValidInternalPath(url)) return null;
  return url;
}

/**
 * Normalize and validate a documentation URL, returning a safe absolute HTTPS URL or `null`.
 *
 * Attempts to parse `url`, requires the `https:` protocol, removes any embedded credentials,
 * lowercases the hostname and removes a trailing dot, and clears port `443`. Returns the
 * normalized URL string if valid, or `null` for empty, invalid, or non-HTTPS inputs.
 *
 * @param url - The input documentation URL to validate and normalize; may be `null` or `undefined`.
 * @returns The normalized absolute HTTPS URL as a string, or `null` if the input is invalid or unsafe.
 *
 * @see getSafeContentItemUrl
 * @see isValidInternalPath
 */
function getSafeDocumentationUrl(url: null | string | undefined): null | string {
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
  config: {
    metadata?:
      | undefined
      | {
          categoryLabel?: string;
          githubPathPrefix?: string;
          showGitHubLink?: boolean;
        };
    typeName: string;
  };
  customRenderer?:
    | ((
        item:
          | ContentItem
          | GetContentDetailCompleteReturns['content'],
        relatedItems:
          | ContentItem[]
          | GetContentDetailCompleteReturns['related'],
        router: ReturnType<typeof useRouter>
      ) => React.ReactNode)
    | undefined;
  item:
    | ContentItem
    | GetContentDetailCompleteReturns['content'];
  relatedItems:
    | ContentItem[]
    | GetContentDetailCompleteReturns['related'];
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

  // Early return if item is null (can happen with GetContentDetailCompleteReturns['content'])
  if (!item) {
    return null;
  }

  // Type guard: Check if item is Record<string, unknown> (from GetContentDetailCompleteReturns)
  // and extract category/slug safely, or use ContentItem properties directly
  const itemCategory = 'category' in item && typeof item.category === 'string' ? item.category : null;
  const itemSlug = 'slug' in item && typeof item.slug === 'string' ? item.slug : null;

  // Default sidebar using SidebarCard with inline configuration
  const githubUrl = config.metadata?.githubPathPrefix
    ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/${config.metadata.githubPathPrefix}/${itemSlug}.json`
    : itemCategory
      ? `${SOCIAL_LINK_SNAPSHOT.github}/blob/main/content/${itemCategory}/${itemSlug}.json`
      : null;

  const showGitHubLink = config.metadata?.showGitHubLink ?? true;
  const hasDocumentationUrl = 'documentation_url' in item && typeof item.documentation_url === 'string' && item.documentation_url;
  // Type narrowing: getMetadata accepts ContentItem or EnrichedContentItem
  // item is ContentItem | GetContentDetailCompleteReturns['content'], both compatible
  const metadata = getMetadata(item as ContentItem);
  const hasConfiguration =
    metadata['configuration'] && typeof metadata['configuration'] === 'object';
  // Type guard for package name
  const packageName = typeof metadata['package'] === 'string' ? metadata['package'] : undefined;
  const hasPackage = !!packageName;
  const hasAuth = 'requiresAuth' in metadata;
  const hasPermissions = 'permissions' in metadata;
  const permissions = hasPermissions ? ensureStringArray(metadata['permissions']) : [];
  const hasSource = 'source' in item && typeof item.source === 'string' && item.source;
  // Type guard for Record<string, unknown> (object but not array or null)
  function isValidRecord(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }

  const mcpServers = isValidRecord(metadata['mcpServers'])
    ? metadata['mcpServers']
    : null;
  const configurationObject = isValidRecord(metadata['configuration'])
    ? metadata['configuration']
    : null;
  // Type guard: Check if item is ContentItem (has id property) vs Record<string, unknown>
  // ContentItem is contentModel which has proper types including 'id'
  const isContentItem = (value: ContentItem | GetContentDetailCompleteReturns['content']): value is ContentItem => {
    return value !== null && typeof value === 'object' && 'id' in value && typeof value.id === 'string';
  };

  // Only call useDetailQuickActions if item is ContentItem (not Record<string, unknown>)
  const quickActions = isContentItem(item)
    ? useDetailQuickActions({
        item: item,
        metadata,
        packageName: packageName ?? null,
        configurationObject,
        mcpServers,
      })
    : [];

  if (customRenderer) {
    return <div className="space-y-6">{customRenderer(item, relatedItems, router)}</div>;
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
            {showGitHubLink && githubUrl ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  pulse
                    .click({
                      category: itemCategory && isValidCategory(itemCategory) ? itemCategory : null,
                      slug: itemSlug || null,
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
                          category: itemCategory ?? 'null',
                          slug: itemSlug ?? 'null',
                        }
                      );
                    });
                }}
                asChild
              >
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
            ) : null}
            {hasDocumentationUrl &&
            'documentation_url' in item &&
            typeof item.documentation_url === 'string' &&
            item.documentation_url
              ? (() => {
                  // Validate and sanitize documentation URL before rendering
                  const safeDocUrl = getSafeDocumentationUrl(item.documentation_url);
                  if (!safeDocUrl) {
                    logClientWarn(
                      '[Content] Invalid documentation URL rejected',
                      undefined,
                      'NavigationSidebar.render',
                      {
                        component: 'NavigationSidebar',
                        action: 'render-documentation-link',
                        category: 'content',
                        itemCategory: itemCategory ?? 'null',
                        slug: itemSlug ?? 'null',
                        url: item.documentation_url ?? 'null',
                      }
                    );
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
                            category: itemCategory && isValidCategory(itemCategory)
                              ? itemCategory
                              : null,
                            slug: itemSlug || null,
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
                                category: itemCategory ?? 'null',
                                slug: itemSlug ?? 'null',
                              }
                            );
                          });
                      }}
                      asChild
                    >
                      <a href={safeDocUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Documentation
                      </a>
                    </Button>
                  );
                })()
              : null}
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
            {itemCategory ? (
              <div>
                <h4 className="mb-1 font-medium">Category</h4>
                <UnifiedBadge
                  variant="base"
                  style="default"
                  className={`text-xs-medium ${
                    itemCategory === 'agents' ? 'bg-transparent text-category-agents border-category-agents-border font-semibold' :
                    itemCategory === 'mcp' ? 'bg-transparent text-category-mcp border-category-mcp-border font-semibold' :
                    itemCategory === 'commands' ? 'bg-transparent text-category-commands border-category-commands-border font-semibold' :
                    itemCategory === 'rules' ? 'bg-transparent text-category-rules border-category-rules-border font-semibold' :
                    itemCategory === 'hooks' ? 'bg-transparent text-category-hooks border-category-hooks-border font-semibold' :
                    itemCategory === 'statuslines' ? 'bg-transparent text-category-statuslines border-category-statuslines-border font-semibold' :
                    itemCategory === 'collections' ? 'bg-transparent text-category-collections border-category-collections-border font-semibold' :
                    itemCategory === 'skills' ? 'bg-transparent text-category-skills border-category-skills-border font-semibold' :
                    itemCategory === 'guides' ? 'bg-transparent text-category-guides border-category-guides-border font-semibold' :
                    itemCategory === 'jobs' ? 'bg-muted/20 text-muted border-muted/30' :
                    itemCategory === 'changelog' ? 'bg-muted/20 text-muted border-muted/30' :
                    'bg-muted/20 text-muted border-muted/30'
                  }`}
                >
                  {config.typeName}
                </UnifiedBadge>
              </div>
            ) : null}

            {(() => {
              if (
                !hasConfiguration ||
                typeof metadata['configuration'] !== 'object' ||
                metadata['configuration'] === null
              ) {
                return null;
              }
              // Type guard: We already checked it's an object and not null
              const config = metadata['configuration'] as Record<string, unknown>;
              const temperature = config['temperature'];
              if (typeof temperature !== 'number') {
                return null;
              }
              return (
                <div>
                  <h4 className="mb-1 font-medium">Temperature</h4>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-3 w-3 text-orange-500" />
                    <UnifiedBadge
                      variant="base"
                      style="outline"
                      className="border-orange-500/30 bg-orange-500/10 text-xs-medium text-orange-600"
                    >
                      {String(temperature)}
                    </UnifiedBadge>
                  </div>
                </div>
              );
            })()}

            {hasPackage && packageName ? (
              <div>
                <h4 className="mb-1 font-medium">Package</h4>
                <UnifiedBadge variant="base" style="outline" className="font-mono text-xs">
                  {packageName}
                </UnifiedBadge>
              </div>
            ) : null}

            {hasAuth ? (
              <div>
                <h4 className="mb-1 font-medium">Authentication</h4>
                <p className="text-muted-foreground text-sm">
                  {typeof metadata['requiresAuth'] === 'boolean' && metadata['requiresAuth']
                    ? 'Required'
                    : 'Not required'}
                </p>
              </div>
            ) : null}

            {hasPermissions && permissions.length > 0 ? (
              <div>
                <h4 className="mb-1 font-medium">Permissions</h4>
                <div className="flex flex-wrap gap-0.5">
                  {permissions.map((perm) => (
                    <UnifiedBadge key={perm} variant="base" style="outline" className="text-xs">
                      {perm}
                    </UnifiedBadge>
                  ))}
                </div>
              </div>
            ) : null}

            {hasSource && 'source' in item && typeof item.source === 'string' && item.source ? (
              <div>
                <h4 className="mb-1 font-medium">Source</h4>
                <UnifiedBadge variant="base" style="outline">
                  {item.source}
                </UnifiedBadge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.key}
                variant="secondary"
                className="w-full justify-start gap-2 text-left"
                onClick={action.onClick}
              >
                <Copy className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm-medium">{action.label}</div>
                  {action.description ? (
                    <p className="text-muted-foreground text-xs">{action.description}</p>
                  ) : null}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Related Items Card */}
      {relatedItems && Array.isArray(relatedItems) && relatedItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{`Related ${config.typeName}s`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedItems.slice(0, 5).map((relatedItem) => {
              const relatedCategory =
                'category' in relatedItem &&
                typeof relatedItem['category'] === 'string' &&
                isValidCategory(relatedItem['category'])
                  ? relatedItem['category']
                  : ContentCategory.agents; // 'agents'
              const relatedSlug =
                'slug' in relatedItem && typeof relatedItem['slug'] === 'string'
                  ? relatedItem['slug']
                  : '';
              // Validate and sanitize URL before using
              const safeRelatedUrl = getSafeContentItemUrl(relatedCategory, relatedSlug);
              if (!safeRelatedUrl) {
                logClientWarn(
                  '[Content] Invalid related content URL rejected',
                  undefined,
                  'NavigationSidebar.render',
                  {
                    component: 'NavigationSidebar',
                    action: 'render-related-content-link',
                    category: 'content',
                    relatedCategory,
                    relatedSlug,
                  }
                );
                return null;
              }
              // At this point, safeRelatedUrl is validated and safe for use in Next.js Link
              // getSafeContentItemUrl ensures the URL is a safe internal path
              return (
                <Link
                  key={relatedSlug}
                  href={safeRelatedUrl}
                  className="flex items-center justify-between border-border hover:bg-muted/50 block w-full cursor-pointer card-base p-3 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm-medium">
                      {getDisplayTitle({
                        title:
                          'title' in relatedItem && typeof relatedItem.title === 'string'
                            ? relatedItem.title
                            : null,
                        slug: relatedSlug,
                        category: relatedCategory,
                      })}
                    </h4>
                    <p className="text-muted-foreground truncate text-xs">
                      {'description' in relatedItem && typeof relatedItem.description === 'string'
                        ? relatedItem.description
                        : ''}
                    </p>
                  </div>
                  <ExternalLink className="text-muted-foreground ml-1 h-4 w-4 shrink-0" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Jobs Promotion */}
      <JobsPromo />
    </div>
  );
});