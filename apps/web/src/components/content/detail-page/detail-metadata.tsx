/**
 * DetailMetadata - Server Component for metadata display
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of author, date, and tags
 *
 * Performance: Eliminated from client bundle, server-rendered for instant display
 */

import type { Database } from '@heyclaude/database-types';
import {
  ensureStringArray,
  formatCopyCount,
  formatDate,
  formatViewCount,
  getSocialLinks,
} from '@heyclaude/web-runtime/core';
import { Calendar, Copy, Eye, Tag, User } from '@heyclaude/web-runtime/icons';
import { cluster, iconSize, marginBottom, muted  , gap , padding } from '@heyclaude/web-runtime/design-system';
import type { ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';

export interface DetailMetadataProps {
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem);
  viewCount?: number | undefined;
  copyCount?: number | undefined;
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
 * Produce a sanitized, safe href for an author's profile URL or fallback to the canonical default.
 *
 * Performs strict validation and domain-specific mapping so the returned href is safe for direct use
 * in anchor href attributes (prevents open-redirects and arbitrary external URLs).
 *
 * @param item - Content item (or RPC-derived content object) that may contain `author_profile_url`
 * @returns A safe href string: either an allowed absolute URL, an encoded relative path, or the
 * canonical default author profile when the input is missing or considered unsafe
 *
 * @see getSocialLinks
 * @see SOCIAL_LINK_SNAPSHOT
 * @see DetailMetadata
 */
function getSafeAuthorProfileHref(
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem)
): string {
  // Cast item to ContentItem for property access (content is Json type from RPC)
  const contentItem = item as ContentItem;
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
    if (hostname === 'github.com') {
      // Extract username from path: /username (GitHub usernames: alphanumeric, hyphens, cannot start/end with hyphen)
      const match = parsed.pathname.match(/^\/([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)$/);
      if (match?.[1]) {
        handle = match[1];
        return `https://github.com/${encodeURIComponent(handle)}`;
      }
    } else if (hostname === 'twitter.com' || hostname === 'x.com') {
      // Extract username from path: /username (no @)
      const match = parsed.pathname.match(/^\/([A-Za-z0-9_]+)$/);
      if (match?.[1]) {
        handle = match[1];
        return `https://twitter.com/${encodeURIComponent(handle)}`;
      }
    } else if (hostname === 'linkedin.com' || hostname === 'www.linkedin.com') {
      // Extract from /in/username or /company/username
      const match = parsed.pathname.match(
        /^\/(in|company)\/([A-Za-z0-9]([A-Za-z0-9-._]*[A-Za-z0-9])?)$/
      );
      if (match?.[1] && match[2]) {
        // Only allow standard public profile structures
        return `https://linkedin.com/${match[1]}/${encodeURIComponent(match[2])}`;
      }
    }
  } catch {
    // Ignore, fall through to fallback
  }

  // Otherwise, fallback (do not use arbitrary external/user-supplied URLs)
  return SOCIAL_LINK_SNAPSHOT.authorProfile;
}

/**
 * Render metadata and tags for a content item including author, date, view count, and copy count.
 *
 * Server component that produces read-only, server-rendered markup; returns null when the item has no metadata or tags to display.
 *
 * @param item - The content item (or RPC-derived item) whose metadata and tags will be rendered.
 * @param viewCount - Optional total view count; displayed only when a number greater than 0 is provided.
 * @param copyCount - Optional total copy count; displayed only when a number greater than 0 is provided.
 *
 * @returns A React element containing the metadata and tag badges, or `null` if there is nothing to display.
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
    <div className={`container mx-auto ${padding.xDefault}`}>
      {/* Author, Date & View Count Metadata */}
      {hasMetadata && (
        <div className={`${marginBottom.default} flex flex-wrap ${gap.comfortable} ${muted.sm}`}>
          {'author' in item &&
            item.author &&
            (() => {
              // Get safe author profile URL - this function validates and sanitizes the URL
              // It only allows relative paths or strictly mapped social media profile URLs
              // (GitHub, Twitter/X, LinkedIn) with extracted handles, or falls back to default
              const safeAuthorUrl = getSafeAuthorProfileHref(item);
              // Explicit validation: getSafeAuthorProfileHref guarantees the URL is safe
              // It validates protocol-relative URLs, path traversal, and only allows
              // known social media domains with strict handle extraction, or safe relative paths
              // At this point, safeAuthorUrl is validated and safe for use in external links
              const validatedUrl: string = safeAuthorUrl;
              return (
                <div className={cluster.compact}>
                  <User className={iconSize.sm} />
                  <a
                    href={validatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {item.author}
                  </a>
                </div>
              );
            })()}
          {'date_added' in item && item.date_added && (
            <div className={cluster.compact}>
              <Calendar className={iconSize.sm} />
              <span>{formatDate(item.date_added)}</span>
            </div>
          )}
          {typeof viewCount === 'number' && viewCount > 0 && (
            <div className={cluster.compact}>
              <Eye className={iconSize.sm} />
              <span>{formatViewCount(viewCount)}</span>
            </div>
          )}
          {typeof copyCount === 'number' && copyCount > 0 && (
            <div className={cluster.compact}>
              <Copy className={iconSize.sm} />
              <span>{formatCopyCount(copyCount)}</span>
            </div>
          )}
        </div>
      )}
      {/* Tags */}
      {hasTags && tags.length > 0 && (
        <div className={`flex flex-wrap ${gap.compact}`}>
          <Tag className={`${iconSize.sm} ${muted.default}`} />
          {tags.map((tag) => (
            <UnifiedBadge
              key={tag}
              variant="tag"
              tag={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}