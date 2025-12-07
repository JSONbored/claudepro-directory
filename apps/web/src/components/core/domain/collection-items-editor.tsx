'use client';

/**
 * Collection Item Manager Component
 * Manages items within a collection (add, remove, reorder)
 *
 * Uses simple up/down buttons for reordering (no drag-drop initially)
 * Following existing UI patterns from the codebase
 */

import { type Database } from '@heyclaude/database-types';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@heyclaude/web-runtime/actions';
import { isValidCategory, sanitizeSlug } from '@heyclaude/web-runtime/core';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash } from '@heyclaude/web-runtime/icons';
import {
  toasts,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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
function getSafeContentUrl(type: string, slug: string): null | string {
  if (!(isValidCategory(type) && isValidSlug(slug))) return null;
  const sanitizedSlug = sanitizeSlug(slug);
  if (!isValidSlug(sanitizedSlug)) return null;
  return `/${type}/${sanitizedSlug}`;
}

type CollectionItem = Database['public']['Tables']['collection_items']['Row'];
type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

interface CollectionItemManagerProps {
  availableBookmarks: Bookmark[];
  collectionId: string;
  items: CollectionItem[];
}

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
        const normalized = normalizeError(error, 'Failed to add item to collection');
        logClientWarn(
          '[Collection] Add item failed',
          normalized,
          'CollectionItemManager.handleAdd',
          {
            component: 'CollectionItemManager',
            action: 'add-item',
            category: 'collection',
            collectionId,
            bookmarkId: bookmark.id,
          }
        );
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
        const normalized = normalizeError(error, 'Failed to remove item from collection');
        logClientWarn(
          '[Collection] Remove item failed',
          normalized,
          'CollectionItemManager.handleRemove',
          {
            component: 'CollectionItemManager',
            action: 'remove-item',
            category: 'collection',
            collectionId,
            itemId,
          }
        );
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
        const normalized = normalizeError(error, 'Failed to reorder items up');
        logClientWarn(
          '[Collection] Reorder up failed',
          normalized,
          'CollectionItemManager.handleMoveUp',
          {
            component: 'CollectionItemManager',
            action: 'reorder-up',
            category: 'collection',
            collectionId,
          }
        );
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
        const normalized = normalizeError(error, 'Failed to reorder items down');
        logClientWarn(
          '[Collection] Reorder down failed',
          normalized,
          'CollectionItemManager.handleMoveDown',
          {
            component: 'CollectionItemManager',
            action: 'reorder-down',
            category: 'collection',
            collectionId,
          }
        );
        toasts.error.actionFailed('reorder items');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Item Section */}
      <div className="flex items-end gap-2 pb-4">
        <div className="flex-1">
          <div className="mb-2 block text-sm font-medium">Add Bookmark to Collection</div>
          <Select value={selectedBookmarkId} onValueChange={setSelectedBookmarkId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bookmark to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className="text-muted-foreground p-2 text-sm">
                  All bookmarks have been added
                </div>
              ) : (
                availableToAdd.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <UnifiedBadge variant="base" style="outline" className="text-xs capitalize">
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
          className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
        >
          <Plus className={UI_CLASSES.ICON_SM} />
          Add
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Items List */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: CollectionItem, index: number) => (
            <div
              key={item.id}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} bg-card hover:bg-accent/50 rounded-lg border p-3 transition-colors`}
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_LG} p-0`}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isPending}
                  aria-label="Move up"
                >
                  <ArrowUp className={UI_CLASSES.ICON_XS} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_LG} p-0`}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1 || isPending}
                  aria-label="Move down"
                >
                  <ArrowDown className={UI_CLASSES.ICON_XS} />
                </Button>
              </div>

              {/* Order Number */}
              <div className="text-muted-foreground w-8 text-center text-sm font-medium">
                #{index + 1}
              </div>

              {/* Content Info */}
              <div className="flex-1">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <UnifiedBadge variant="base" style="outline" className="text-xs capitalize">
                    {item.content_type}
                  </UnifiedBadge>
                  <span className="text-sm font-medium">{item.content_slug}</span>
                </div>
                {item.notes ? (
                  <p className="text-muted-foreground mt-1 text-xs">{item.notes}</p>
                ) : null}
              </div>

              {/* Actions */}
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                {(() => {
                  const safeContentUrl = getSafeContentUrl(item.content_type, item.content_slug);
                  if (!safeContentUrl) return null;
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${UI_CLASSES.ICON_XL} p-0`}
                      onClick={() => window.open(safeContentUrl, '_blank')}
                      aria-label="View item"
                    >
                      <ExternalLink className={UI_CLASSES.ICON_SM} />
                    </Button>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_XL} text-destructive hover:text-destructive p-0`}
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  aria-label="Remove item"
                >
                  <Trash className={UI_CLASSES.ICON_SM} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
