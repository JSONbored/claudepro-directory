/**
 * DetailMetadata - Server Component for metadata display
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of author, date, and tags
 *
 * Performance: Eliminated from client bundle, server-rendered for instant display
 */

import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { Calendar, Eye, Tag, User } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatViewCount } from '@/src/lib/utils/content.utils';
import { formatDate } from '@/src/lib/utils/data.utils';

export interface DetailMetadataProps {
  item: ContentItem;
  viewCount?: number | undefined;
}

/**
 * DetailMetadata Component (Server Component)
 *
 * Renders author, date, view count, and tags metadata for a content item
 * No React.memo needed - server components don't re-render
 */
export function DetailMetadata({ item, viewCount }: DetailMetadataProps) {
  const hasMetadata =
    ('author' in item && item.author) ||
    ('date_added' in item && item.date_added) ||
    viewCount !== undefined;
  const hasTags = 'tags' in item && Array.isArray(item.tags) && item.tags.length > 0;

  if (!(hasMetadata || hasTags)) return null;

  return (
    <div className="container mx-auto px-4">
      {/* Author, Date & View Count Metadata */}
      {hasMetadata && (
        <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
          {'author' in item && item.author && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <User className="h-4 w-4" />
              <a
                href={
                  ('author_profile_url' in item && item.author_profile_url) ||
                  SOCIAL_LINKS.authorProfile
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
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.date_added)}</span>
            </div>
          )}
          {viewCount !== undefined && viewCount > 0 && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Eye className="h-4 w-4" />
              <span>{formatViewCount(viewCount)} views</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {hasTags && 'tags' in item && Array.isArray(item.tags) && (
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          <Tag className="h-4 w-4 text-muted-foreground" />
          {(item.tags as string[]).map((tag: string) => (
            <UnifiedBadge key={tag} variant="base" style="outline" className="text-xs">
              {tag}
            </UnifiedBadge>
          ))}
        </div>
      )}
    </div>
  );
}
