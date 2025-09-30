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

import { Calendar, Tag, User } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import type { UnifiedContentItem } from '@/lib/schemas';

/**
 * Schema for DetailMetadata props
 */
const detailMetadataPropsSchema = z.object({
  item: z.custom<UnifiedContentItem>(),
});

export type DetailMetadataProps = z.infer<typeof detailMetadataPropsSchema>;

/**
 * DetailMetadata Component (Server Component)
 *
 * Renders author, date, and tags metadata for a content item
 * No React.memo needed - server components don't re-render
 */
export function DetailMetadata({ item }: DetailMetadataProps) {
  const hasMetadata = item.author || item.dateAdded;
  const hasTags = item.tags && item.tags.length > 0;

  if (!(hasMetadata || hasTags)) return null;

  return (
    <div className="container mx-auto px-4">
      {/* Author & Date Metadata */}
      {hasMetadata && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          {item.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{item.author}</span>
            </div>
          )}
          {item.dateAdded && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.dateAdded)}</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {hasTags && item.tags && (
        <div className="flex flex-wrap gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
