'use client';

/**
 * Collection Item Manager Component
 * Manages items within a collection (add, remove, reorder)
 *
 * Uses simple up/down buttons for reordering (no drag-drop initially)
 * Following existing UI patterns from the codebase
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Separator } from '@/src/components/ui/separator';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@/src/lib/actions/content.actions';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash } from '@/src/lib/icons';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

interface CollectionItem {
  id: string;
  collection_id: string;
  content_type: string;
  content_slug: string;
  notes?: string;
  order: number;
}

interface Bookmark {
  id: string;
  content_type: string;
  content_slug: string;
}

interface CollectionItemManagerProps {
  collectionId: string;
  items: CollectionItem[];
  availableBookmarks: Bookmark[];
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
        const result = await addItemToCollection({
          collection_id: collectionId,
          content_type: bookmark.content_type as ContentCategory,
          content_slug: bookmark.content_slug,
          order: items.length, // Add to end
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted('Item added to collection');
          setSelectedBookmarkId('');
          router.refresh();
        }
      } catch (error) {
        toasts.error.fromError(error, 'Failed to add item');
      }
    });
  };

  const handleRemove = async (itemId: string) => {
    startTransition(async () => {
      try {
        const result = await removeItemFromCollection({
          id: itemId,
          collection_id: collectionId,
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted('Item removed from collection');
          router.refresh();
        }
      } catch (error) {
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
      } catch (_error) {
        setItems(items); // Revert on error
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
      } catch (_error) {
        setItems(items); // Revert on error
        toasts.error.actionFailed('reorder items');
      }
    });
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_4}>
      {/* Add Item Section */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_END_GAP_2} pb-4`}>
        <div className={UI_CLASSES.FLEX_1}>
          <div className={`${UI_CLASSES.TEXT_SM} font-medium mb-2 block`}>
            Add Bookmark to Collection
          </div>
          <Select value={selectedBookmarkId} onValueChange={setSelectedBookmarkId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bookmark to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  All bookmarks have been added
                </div>
              ) : (
                availableToAdd.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <Badge variant="outline" className="text-xs capitalize">
                        {bookmark.content_type}
                      </Badge>
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
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        <div className={UI_CLASSES.SPACE_Y_2}>
          {items.map((item: CollectionItem, index: number) => (
            <div
              key={item.id}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors`}
            >
              {/* Order Controls */}
              <div className={UI_CLASSES.FLEX_COL_GAP_1}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isPending}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1 || isPending}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Order Number */}
              <div className="text-sm font-medium text-muted-foreground w-8 text-center">
                #{index + 1}
              </div>

              {/* Content Info */}
              <div className={UI_CLASSES.FLEX_1}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.content_type}
                  </Badge>
                  <span className="text-sm font-medium">{item.content_slug}</span>
                </div>
                {item.notes && (
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    window.open(`/${item.content_type}/${item.content_slug}`, '_blank')
                  }
                  aria-label="View item"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  aria-label="Remove item"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
