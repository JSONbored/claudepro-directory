/**
 * DetailMetadata - Server Component for metadata display
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of author, date, and tags
 *
 * Performance: Eliminated from client bundle, server-rendered for instant display
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { z } from 'zod';
import { Badge } from '@/src/components/ui/badge';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { Calendar, Eye, Tag, User } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatViewCount } from '@/src/lib/utils/content.utils';
import { formatDate } from '@/src/lib/utils/data.utils';

/**
 * Schema for DetailMetadata props
 */
const detailMetadataPropsSchema = z.object({
  item: z.custom<UnifiedContentItem>(),
  viewCount: z.number().optional(),
});

export type DetailMetadataProps = z.infer<typeof detailMetadataPropsSchema>;

/**
 * DetailMetadata Component (Server Component)
 *
 * Renders author, date, view count, and tags metadata for a content item
 * No React.memo needed - server components don't re-render
 */
export function DetailMetadata({ item, viewCount }: DetailMetadataProps) {
  const hasMetadata = item.author || item.dateAdded || viewCount !== undefined;
  const hasTags = item.tags && item.tags.length > 0;

  if (!(hasMetadata || hasTags)) return null;

  return (
    <div className="container mx-auto px-4">
      {/* Author, Date & View Count Metadata */}
      {hasMetadata && (
        <div className={UI_CLASSES.FLEX_WRAP_MUTED}>
          {item.author && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <User className="h-4 w-4" />
              <a
                href={SOCIAL_LINKS.authorProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-foreground transition-colors"
              >
                {item.author}
              </a>
            </div>
          )}
          {item.dateAdded && (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.dateAdded)}</span>
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
      {hasTags && item.tags && (
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          <Tag className="h-4 w-4 text-muted-foreground" />
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className={UI_CLASSES.TEXT_XS}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
