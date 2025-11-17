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

// Helper to get a safe, sanitized href for the author profile.
// Only allows strictly mapped profile URLs for allowed domains or fallback to default.
// Never uses arbitrary user-supplied URLs to prevent client-side URL redirect attacks.
function getSafeAuthorProfileHref(
  item: ContentItem | GetGetContentDetailCompleteReturn['content']
): string {
  // Only allow strictly mapped profile URLs for allowed domains or fallback to default.
  // Never use arbitrary user-supplied URLs.
  let handle: string | undefined;
  const url: string | undefined =
    'author_profile_url' in item && typeof item.author_profile_url === 'string'
      ? item.author_profile_url.trim()
      : undefined;

  if (!url) return SOCIAL_LINK_SNAPSHOT.authorProfile;

  // Handle relative URLs (/profile/...) only to local domain.
  if (url.startsWith('/')) {
    // Encode minimally.
    return encodeURI(url);
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();

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
    } else if (hostname === 'linkedin.com') {
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
