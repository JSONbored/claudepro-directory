/**
 * DetailMetadata - Server Component for metadata display
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of author, date, and tags
 *
 * Performance: Eliminated from client bundle, server-rendered for instant display
 */

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { getSocialLinks } from '@/src/lib/data/marketing/contact';
import { Calendar, Copy, Eye, Tag, User } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatCopyCount, formatViewCount } from '@/src/lib/utils/content.utils';
import { ensureStringArray, formatDate } from '@/src/lib/utils/data.utils';
import type {
  ContentItem,
  GetGetContentDetailCompleteReturn,
} from '@/src/types/database-overrides';

export interface DetailMetadataProps {
  item: ContentItem | GetGetContentDetailCompleteReturn['content'];
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

/**
 * Validate that author profile URL is safe for use in href.
 * Only allows:
 *   - Relative paths (starting with '/')
 *   - Absolute URLs using 'https://' protocol to exactly allowlisted domains (NO subdomains, normalized, case-insensitive).
 * Subdomains and punycode/unicode tricks are rejected.
 * To add exceptions, extend ALLOWED_AUTHOR_PROFILE_DOMAINS as needed.
 */
const ALLOWED_AUTHOR_PROFILE_DOMAINS = [
  'github.com',
  'twitter.com',
  'linkedin.com',
  'x.com',
  // Add your actual domain(s) here if needed.
] as const;

function isSafeAuthorProfileUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    // Block dangerous protocols and whitespace
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript|blob|ftp|file):/i.test(trimmed)) return false;
    // Allow relative paths only
    if (trimmed.startsWith('/')) return true;
    if (/^\/\//.test(trimmed)) return false; // block protocol-relative
    // Parse URL and check allowed domains strictly
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    // Block login credentials in author URL
    if (parsed.username || parsed.password) return false;
    // Hostname is always ASCII per URL spec, but normalize: remove trailing dot, lowercase
    // EXPLICIT: No subdomains - only exact host matches
    const normalizedHostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    if (
      !ALLOWED_AUTHOR_PROFILE_DOMAINS.some((domain) => normalizedHostname === domain.toLowerCase())
    ) {
      return false;
    }
    // If a port is present, only allow default (443) or none
    if (parsed.port && parsed.port !== '443') return false;
    return true;
  } catch {
    return false;
  }
}

// Helper to get a safe, sanitized href for the author profile.
// Returns a fully validated and sanitized URL safe for use in href attributes.
function getSafeAuthorProfileHref(
  item: ContentItem | GetGetContentDetailCompleteReturn['content']
): string {
  if (
    'author_profile_url' in item &&
    typeof item.author_profile_url === 'string' &&
    isSafeAuthorProfileUrl(item.author_profile_url)
  ) {
    const url = item.author_profile_url.trim();

    // Handle relative paths - encode for safety
    if (url.startsWith('/')) {
      // Only encode non-absolute paths (relative) minimally
      return encodeURI(url);
    }

    try {
      // Absolute URL to allowed domain - fully sanitize before output
      const parsed = new URL(url);

      // Remove all potentially dangerous components
      parsed.username = '';
      parsed.password = '';
      parsed.search = '';
      parsed.hash = '';

      // Ensure port is removed if it's the default (443) or explicitly block non-default ports
      if (parsed.port === '443') {
        parsed.port = '';
      }

      // Normalize hostname (already validated, but ensure consistency)
      parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();

      // Return the fully sanitized URL
      return parsed.toString();
    } catch {
      // Fallback to safe default on any parsing error
      return SOCIAL_LINK_SNAPSHOT.authorProfile;
    }
  }
  return SOCIAL_LINK_SNAPSHOT.authorProfile;
}

export function DetailMetadata({ item, viewCount, copyCount }: DetailMetadataProps) {
  const hasMetadata =
    ('author' in item && item.author) ||
    ('date_added' in item && item.date_added) ||
    viewCount !== undefined ||
    copyCount !== undefined;
  const hasTags = 'tags' in item && Array.isArray(item.tags) && item.tags.length > 0;
  const tags = hasTags ? ensureStringArray(item.tags) : [];

  if (!(hasMetadata || hasTags)) return null;

  return (
    <div className="container mx-auto px-4">
      {/* Author, Date & View Count Metadata */}
      {hasMetadata && (
        <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
          {'author' in item && item.author && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <User className={UI_CLASSES.ICON_SM} />
              <a
                href={getSafeAuthorProfileHref(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground hover:underline"
              >
                {item.author}
              </a>
            </div>
          )}
          {'date_added' in item && item.date_added && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className={UI_CLASSES.ICON_SM} />
              <span>{formatDate(item.date_added)}</span>
            </div>
          )}
          {viewCount !== undefined && viewCount > 0 && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Eye className={UI_CLASSES.ICON_SM} />
              <span>{formatViewCount(viewCount)}</span>
            </div>
          )}
          {copyCount !== undefined && copyCount > 0 && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_SM} />
              <span>{formatCopyCount(copyCount)}</span>
            </div>
          )}
        </div>
      )}
      {/* Tags */}
      {hasTags && tags.length > 0 && (
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          <Tag className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
          {tags.map((tag) => (
            <UnifiedBadge key={tag} variant="base" style="outline" className="text-xs">
              {tag}
            </UnifiedBadge>
          ))}
        </div>
      )}
    </div>
  );
}
