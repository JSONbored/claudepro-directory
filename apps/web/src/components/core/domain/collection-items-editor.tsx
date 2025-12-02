'use client';

/**
 * Collection Item Manager Component
 * Manages items within a collection (add, remove, reorder)
 *
 * Uses simple up/down buttons for reordering (no drag-drop initially)
 * Following existing UI patterns from the codebase
 */

import type { Database } from '@heyclaude/database-types';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@heyclaude/web-runtime/actions';
import { isValidCategory, logClientWarning, sanitizeSlug } from '@heyclaude/web-runtime/core';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash } from '@heyclaude/web-runtime/icons';
import {
  bgColor,
  cluster,
  gap,
  iconSize,
  border,
  items as alignItems,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  size,
  spaceY,
  stack,
  textColor,
  transition,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { Separator } from '@heyclaude/web-runtime/ui';

/**
 * Validate slug is safe for use in URLs
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Get safe content URL from type and slug
 * Returns null if either is invalid
 */
function getSafeContentUrl(type: string, slug: string): string | null {
  if (!(isValidCategory(type) && isValidSlug(slug))) return null;
  const sanitizedSlug = sanitizeSlug(slug);
  if (!isValidSlug(sanitizedSlug)) return null;
  return `/${type}/${sanitizedSlug}`;
}

type CollectionItem = Database['public']['Tables']['collection_items']['Row'];
type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

interface CollectionItemManagerProps {
  collectionId: string;
  items: CollectionItem[];
  availableBookmarks: Bookmark[];
}

/**
 * Renders a UI for managing items in a collection, allowing adding bookmarks, removing items, and reordering items.
 *
 * This component provides selection of available bookmarks to add, optimistic reorder updates with server reconciliation,
 * removal of items, and safe "view item" links when available. User feedback is surfaced via toasts and the Next.js router is refreshed after server changes.
 *
 * @param props.collectionId - The ID of the collection being managed.
 * @param props.items - Initial list of collection items.
 * @param props.availableBookmarks - List of bookmarks that can be added to the collection.
 * @returns A React element containing the collection item management UI.
 *
 * @see getSafeContentUrl
 * @see addItemToCollection
 * @see removeItemFromCollection
 * @see reorderCollectionItems
 */
export function CollectionItemManager({
  collectionId,
  items: initialItems,
  availableBookmarks,
}: CollectionItemManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string>('');

  // Filter out bookmarks that are already in the collection
  const availableToAdd = availableBookmarks.filter(
    (bookmark: Bookmark) =>
      !items.some(
        (item: CollectionItem) =>
          item.content_type === bookmark.content_type && item.content_slug === bookmark.content_slug
      )
  );

  const handleAdd = async () => {
    if (!selectedBookmarkId) {
      toasts.error.validation('Please select a bookmark to add');
      return;
    }

    const bookmark = availableBookmarks.find((b) => b.id === selectedBookmarkId);
    if (!bookmark) return;

    startTransition(async () => {
      try {
        // Server-side schema validation handles content_type validation via categoryIdSchema
        const result = await addItemToCollection({
          collection_id: collectionId,
          content_type: isValidCategory(bookmark.content_type) ? bookmark.content_type : 'agents',
          content_slug: bookmark.content_slug,
          order: items.length, // Add to end
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted('Item added to collection');
          setSelectedBookmarkId('');
          router.refresh();
        }
      } catch (error) {
        logClientWarning('CollectionItemManager: add failed', error, {
          collectionId,
          bookmarkId: bookmark.id,
        });
        toasts.error.fromError(error, 'Failed to add item');
      }
    });
  };

  const handleRemove = async (itemId: string) => {
    startTransition(async () => {
      try {
        const result = await removeItemFromCollection({
          remove_item_id: itemId,
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted('Item removed from collection');
          router.refresh();
        }
      } catch (error) {
        logClientWarning('CollectionItemManager: remove failed', error, {
          collectionId,
          itemId,
        });
        toasts.error.fromError(error, 'Failed to remove item');
      }
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newItems = [...items];
    const temp = newItems[index];
    const prev = newItems[index - 1];
    if (temp && prev) {
      newItems[index] = prev;
      newItems[index - 1] = temp;
    }

    // Update order values
    const reorderedItems = newItems.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    setItems(newItems); // Optimistic update

    startTransition(async () => {
      try {
        await reorderCollectionItems({
          collection_id: collectionId,
          items: reorderedItems,
        });
        toasts.success.actionCompleted('Items reordered');
        router.refresh();
      } catch (error) {
        setItems(items); // Revert on error
        logClientWarning('CollectionItemManager: reorder up failed', error, {
          collectionId,
        });
        toasts.error.actionFailed('reorder items');
      }
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    const temp = newItems[index];
    const next = newItems[index + 1];
    if (temp && next) {
      newItems[index] = next;
      newItems[index + 1] = temp;
    }

    // Update order values
    const reorderedItems = newItems.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    setItems(newItems); // Optimistic update

    startTransition(async () => {
      try {
        await reorderCollectionItems({
          collection_id: collectionId,
          items: reorderedItems,
        });
        toasts.success.actionCompleted('Items reordered');
        router.refresh();
      } catch (error) {
        setItems(items); // Revert on error
        logClientWarning('CollectionItemManager: reorder down failed', error, {
          collectionId,
        });
        toasts.error.actionFailed('reorder items');
      }
    });
  };

  return (
    <div className={spaceY.comfortable}>
      {/* Add Item Section */}
      <div className={`flex ${alignItems.end} ${gap.compact} pb-4`}>
        <div className="flex-1">
          <div className={`${marginBottom.tight} block ${weight.medium} ${size.sm}`}>Add Bookmark to Collection</div>
          <Select value={selectedBookmarkId} onValueChange={setSelectedBookmarkId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bookmark to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className={`${padding.tight} ${muted.sm}`}>
                  All bookmarks have been added
                </div>
              ) : (
                availableToAdd.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    <div className={cluster.compact}>
                      <UnifiedBadge variant="base" style="outline" className={`${size.xs} capitalize`}>
                        {bookmark.content_type}
                      </UnifiedBadge>
                      {bookmark.content_slug}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!selectedBookmarkId || isPending}
          className={cluster.compact}
        >
          <Plus className={iconSize.sm} />
          Add
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Items List */}
      {items.length === 0 ? (
        <div className={`${radius.lg} ${border.dashed} ${padding.ySection} text-center`}>
          <p className={muted.default}>
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        <div className={spaceY.compact}>
          {items.map((item: CollectionItem, index: number) => (
            <div
              key={item.id}
              className={`${cluster.default} ${radius.lg} border ${bgColor.card} ${padding.compact} ${transition.colors} hover:bg-accent/50`}
            >
              {/* Order Controls */}
              <div className={stack.tight}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${iconSize.lg} ${padding.none}`}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isPending}
                  aria-label="Move up"
                >
                  <ArrowUp className={iconSize.xs} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${iconSize.lg} ${padding.none}`}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1 || isPending}
                  aria-label="Move down"
                >
                  <ArrowDown className={iconSize.xs} />
                </Button>
              </div>

              {/* Order Number */}
              <div className={`w-8 text-center ${weight.medium} ${muted.sm}`}>
                #{index + 1}
              </div>

              {/* Content Info */}
              <div className="flex-1">
                <div className={cluster.compact}>
                  <UnifiedBadge variant="base" style="outline" className={`${size.xs} capitalize`}>
                    {item.content_type}
                  </UnifiedBadge>
                  <span className={`${weight.medium} ${size.sm}`}>{item.content_slug}</span>
                </div>
                {item.notes && <p className={`${marginTop.tight} ${muted.default} ${size.xs}`}>{item.notes}</p>}
              </div>

              {/* Actions */}
              <div className={cluster.tight}>
                {(() => {
                  const safeContentUrl = getSafeContentUrl(item.content_type, item.content_slug);
                  if (!safeContentUrl) return null;
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${iconSize.xl} ${padding.none}`}
                      onClick={() => window.open(safeContentUrl, '_blank')}
                      aria-label="View item"
                    >
                      <ExternalLink className={iconSize.sm} />
                    </Button>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${iconSize.xl} ${padding.none} ${textColor.destructive} hover:text-destructive`}
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  aria-label="Remove item"
                >
                  <Trash className={iconSize.sm} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}