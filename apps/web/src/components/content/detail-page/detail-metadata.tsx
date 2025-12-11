/**
 * DetailMetadata - Server Component for metadata display
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of author, date, and tags
 *
 * Performance: Eliminated from client bundle, server-rendered for instant display
 */

import { type Database } from '@heyclaude/database-types';
import {
  ensureStringArray,
  formatCopyCount,
  formatDate,
  formatViewCount,
  getSocialLinks,
} from '@heyclaude/web-runtime/core';
import { Calendar, Copy, Eye, Tag, User } from '@heyclaude/web-runtime/icons';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { UI_CLASSES, UnifiedBadge } from '@heyclaude/web-runtime/ui';

export interface DetailMetadataProps {
  copyCount?: number | undefined;
  item:
    | ContentItem
    | (ContentItem &
        Database['public']['Functions']['get_content_detail_complete']['Returns']['content']);
  viewCount?: number | undefined;
}

/**
 * DetailMetadata Component (Server Component)
 *
 * Renders author, date, view count, copy count, and tags metadata for a content item
 * No React.memo needed - server components don't re-render
 */
const SOCIAL_LINK_SNAPSHOT = getSocialLinks();

// Helper to get a safe, sanitized href for the author profile.
// Only allows strictly mapped profile URLs for allowed domains or fallback to default.
/**
 * Produce a sanitized, canonical author profile href derived from a content item's `author_user_id` or `author_profile_url`.
 *
 * Priority:
 * 1. If `author_user_id` and `author_user_slug` are present, link to internal user profile `/u/{slug}`
 * 2. Otherwise, use `author_profile_url` with validation (GitHub, Twitter/X, LinkedIn, or safe relative paths)
 * 3. Fallback to default author profile URL from `SOCIAL_LINK_SNAPSHOT`
 *
 * Valid outputs are:
 * - Internal user profile URL `/u/{slug}` when `author_user_id` is set
 * - a canonical https URL for GitHub, Twitter/X, or LinkedIn when the input maps to those domains,
 * - an encoded safe local path when the input is a validated relative URL,
 * - otherwise the safe fallback author profile URL from `SOCIAL_LINK_SNAPSHOT`.
 *
 * This function rejects protocol-relative URLs and any input that could enable open-redirects or unsafe navigation.
 *
 * @param item - Content item object (may include RPC-composed fields); checks for `author_user_id`, `author_user_slug`, and `author_profile_url`.
 * @returns The sanitized author profile URL string; if the input is invalid or not allowed, returns the default author profile URL.
 *
 * @see SOCIAL_LINK_SNAPSHOT
 */
function getSafeAuthorProfileHref(
  item:
    | ContentItem
    | (ContentItem &
        Database['public']['Functions']['get_content_detail_complete']['Returns']['content'])
): string {
  // Cast item to handle both ContentItem and RPC return types
  const contentItem = item as ContentItem & {
    author_user_id?: string | null;
    author_user_slug?: string | null;
  };

  // Priority 1: If author_user_id is set, link to internal user profile
  // Check for author_user_slug (from get_content_detail_complete RPC) or author_user_id (from direct content table access)
  const authorUserSlug =
    ('author_user_slug' in contentItem && typeof contentItem.author_user_slug === 'string'
      ? contentItem.author_user_slug
      : null) ||
    ('author_user_id' in contentItem && contentItem.author_user_id
      ? null // We'd need to query for slug, but RPC should provide it
      : null);

  if (authorUserSlug) {
    // Validate slug format (alphanumeric, hyphens, underscores only)
    if (/^[a-zA-Z0-9-_]+$/.test(authorUserSlug) && authorUserSlug.length > 0) {
      // Construct safe internal profile URL
      return `/u/${encodeURIComponent(authorUserSlug)}`;
    }
  }

  // Priority 2: Use author_profile_url with validation
  // Only allow strictly mapped profile URLs for allowed domains or fallback to default.
  // Never use arbitrary user-supplied URLs.
  let handle: string | undefined;
  const url: string | undefined =
    'author_profile_url' in contentItem && typeof contentItem.author_profile_url === 'string'
      ? contentItem.author_profile_url.trim()
      : undefined;

  if (!url) return SOCIAL_LINK_SNAPSHOT.authorProfile;

  // Block protocol-relative URLs (//evil.com) before checking relative paths
  // Protocol-relative URLs are interpreted by browsers as https://evil.com, creating open redirect vulnerability
  if (url.startsWith('//')) {
    return SOCIAL_LINK_SNAPSHOT.authorProfile;
  }

  // Handle relative URLs (/profile/...) only to local domain.
  // Strict validation to prevent open redirect attacks:
  // - Must start with a single / (not // for protocol-relative URLs - already blocked above)
  // - Reject paths with traversal or suspicious patterns before other checks
  if (url.startsWith('/')) {
    // Reject paths with traversal or suspicious patterns
    if (url.includes('..') || url.includes('//')) {
      return SOCIAL_LINK_SNAPSHOT.authorProfile;
    }
    // Additional validation: no backslashes, fragments, or query strings
    if (!(url.includes('\\') || url.includes('#') || url.includes('?'))) {
      // Encode minimally - URL is already validated as safe relative path
      return encodeURI(url);
    }
  }

  try {
    const parsed = new URL(url);
    // Normalize hostname: remove trailing dots, lowercase, and strip www prefix
    const hostname = parsed.hostname
      .replace(/\.$/, '')
      .replace(/^www\./, '')
      .toLowerCase();

    // Strict mapping for allowed domains only - extract handle and reconstruct URL
    switch (hostname) {
      case 'github.com': {
        // Extract username from path: /username (GitHub usernames: alphanumeric, hyphens, cannot start/end with hyphen)
        const match = parsed.pathname.match(/^\/([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)$/);
        if (match?.[1]) {
          handle = match[1];
          return `https://github.com/${encodeURIComponent(handle)}`;
        }

        break;
      }
      case 'twitter.com':
      case 'x.com': {
        // Extract username from path: /username (no @)
        const match = parsed.pathname.match(/^\/([A-Za-z0-9_]+)$/);
        if (match?.[1]) {
          handle = match[1];
          return `https://twitter.com/${encodeURIComponent(handle)}`;
        }

        break;
      }
      case 'linkedin.com':
      case 'www.linkedin.com': {
        // Extract from /in/username or /company/username
        const match = parsed.pathname.match(
          /^\/(in|company)\/([A-Za-z0-9]([A-Za-z0-9-._]*[A-Za-z0-9])?)$/
        );
        if (match?.[1] && match[2]) {
          // Only allow standard public profile structures
          return `https://linkedin.com/${match[1]}/${encodeURIComponent(match[2])}`;
        }

        break;
      }
      // No default
    }
  } catch {
    // Ignore, fall through to fallback
  }

  // Otherwise, fallback (do not use arbitrary external/user-supplied URLs)
  return SOCIAL_LINK_SNAPSHOT.authorProfile;
}

/**
 * Render author, date, view/copy counts, and tags for a content item as a metadata block.
 *
 * Renders an author link (sanitized), the formatted date_added, formatted view and copy counts, and a set of tag badges; returns null when there is no metadata or tags to display.
 *
 * @param props.item - Content item object containing fields like `author`, `author_profile_url`, `date_added`, and `tags`. Author profile links are validated and normalized before being rendered.
 * @param props.viewCount - Optional number of views; shown when greater than zero.
 * @param props.copyCount - Optional number of times the content was copied; shown when greater than zero.
 * @returns A JSX element with the metadata and tag badges, or `null` when nothing should be rendered.
 *
 * @see getSafeAuthorProfileHref
 * @see formatDate
 * @see formatViewCount
 * @see formatCopyCount
 * @see UnifiedBadge
 */
export function DetailMetadata({ item, viewCount, copyCount }: DetailMetadataProps) {
  const hasViewCount = typeof viewCount === 'number' && viewCount > 0;
  const hasCopyCount = typeof copyCount === 'number' && copyCount > 0;
  const hasMetadata =
    ('author' in item && item.author) ||
    ('date_added' in item && item.date_added) ||
    hasViewCount ||
    hasCopyCount;
  const hasTags = 'tags' in item && Array.isArray(item.tags) && item.tags.length > 0;
  const tags = hasTags ? ensureStringArray(item.tags) : [];

  if (!(hasMetadata || hasTags)) return null;

  return (
    <div className="container mx-auto px-4">
      {/* Author, Date & View Count Metadata */}
      {hasMetadata ? (
        <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
          {'author' in item && item.author
            ? (() => {
                // Get safe author profile URL - this function validates and sanitizes the URL
                // It only allows relative paths or strictly mapped social media profile URLs
                // (GitHub, Twitter/X, LinkedIn) with extracted handles, or falls back to default
                const safeAuthorUrl = getSafeAuthorProfileHref(item);
                // Explicit validation: getSafeAuthorProfileHref guarantees the URL is safe
                // It validates protocol-relative URLs, path traversal, and only allows
                // known social media domains with strict handle extraction, or safe relative paths
                // At this point, safeAuthorUrl is validated and safe for use in external links
                const validatedUrl: string = safeAuthorUrl;
                // Check if this is an internal user profile link
                const isInternalProfile = validatedUrl.startsWith('/u/');
                return (
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <User className={UI_CLASSES.ICON_SM} />
                    {isInternalProfile ? (
                      <a
                        href={validatedUrl}
                        className="hover:text-foreground transition-colors hover:underline"
                      >
                        {item.author}
                      </a>
                    ) : (
                      <a
                        href={validatedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors hover:underline"
                      >
                        {item.author}
                      </a>
                    )}
                  </div>
                );
              })()
            : null}
          {'date_added' in item && item.date_added ? (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className={UI_CLASSES.ICON_SM} />
              <span>{formatDate(item.date_added)}</span>
            </div>
          ) : null}
          {typeof viewCount === 'number' && viewCount > 0 && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Eye className={UI_CLASSES.ICON_SM} />
              <span>{formatViewCount(viewCount)}</span>
            </div>
          )}
          {typeof copyCount === 'number' && copyCount > 0 && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_SM} />
              <span>{formatCopyCount(copyCount)}</span>
            </div>
          )}
        </div>
      ) : null}
      {/* Tags */}
      {hasTags && tags.length > 0 ? (
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          <Tag className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
          {tags.map((tag) => (
            <UnifiedBadge key={tag} variant="base" style="outline" className="text-xs">
              {tag}
            </UnifiedBadge>
          ))}
        </div>
      ) : null}
    </div>
  );
}