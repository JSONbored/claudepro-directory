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
 * Validate that author profile URL is safe for use in href
 * Only allows relative paths or absolute URLs with https:// protocol to allowlisted domains
 */
const ALLOWED_AUTHOR_PROFILE_DOMAINS = [
  'github.com',
  'twitter.com',
  'linkedin.com',
  'x.com',
  // Add your actual domain(s) here if needed
] as const;

function isSafeAuthorProfileUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    // Block dangerous protocols
    if (/^(javascript|data|vbscript):/i.test(url.trim())) return false;
    // Allow relative paths
    if (url.startsWith('/')) return true;
    // Allow absolute HTTPS URLs ONLY to allowed domains
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (
      !ALLOWED_AUTHOR_PROFILE_DOMAINS.includes(
        parsed.hostname as (typeof ALLOWED_AUTHOR_PROFILE_DOMAINS)[number]
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
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
                href={
                  'author_profile_url' in item &&
                  isSafeAuthorProfileUrl(item.author_profile_url) &&
                  item.author_profile_url
                    ? item.author_profile_url
                    : SOCIAL_LINK_SNAPSHOT.authorProfile
                }
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
