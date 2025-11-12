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
import { UnifiedBadge } from '@/src/components/core/domain/badges/unified-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/ui/select';
import { Separator } from '@/src/components/primitives/ui/separator';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@/src/lib/actions/content.actions';
import type { CategoryId } from '@/src/lib/config/category-config';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Tables } from '@/src/types/database.types';

type CollectionItem = Tables<'collection_items'>;
type Bookmark = Tables<'bookmarks'>;

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
        // Server-side schema validation handles content_type validation via categoryIdSchema
        const result = await addItemToCollection({
          collection_id: collectionId,
          content_type: bookmark.content_type as CategoryId,
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
    <div className="space-y-4">
      {/* Add Item Section */}
      <div className={'flex items-end gap-2 pb-4'}>
        <div className="flex-1">
          <div className={'mb-2 block font-medium text-sm'}>Add Bookmark to Collection</div>
          <Select value={selectedBookmarkId} onValueChange={setSelectedBookmarkId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bookmark to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className="p-2 text-muted-foreground text-sm">
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
          <p className={'text-muted-foreground'}>
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: CollectionItem, index: number) => (
            <div
              key={item.id}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50`}
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
              <div className="w-8 text-center font-medium text-muted-foreground text-sm">
                #{index + 1}
              </div>

              {/* Content Info */}
              <div className="flex-1">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <UnifiedBadge variant="base" style="outline" className="text-xs capitalize">
                    {item.content_type}
                  </UnifiedBadge>
                  <span className="font-medium text-sm">{item.content_slug}</span>
                </div>
                {item.notes && <p className={'mt-1 text-muted-foreground text-xs'}>{item.notes}</p>}
              </div>

              {/* Actions */}
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_XL} p-0`}
                  onClick={() =>
                    window.open(`/${item.content_type}/${item.content_slug}`, '_blank')
                  }
                  aria-label="View item"
                >
                  <ExternalLink className={UI_CLASSES.ICON_SM} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_XL} p-0 text-destructive hover:text-destructive`}
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
