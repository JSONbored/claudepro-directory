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
import { toast } from 'sonner';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@/src/lib/actions/collection-actions';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    (bookmark) =>
      !items.some(
        (item) =>
          item.content_type === bookmark.content_type && item.content_slug === bookmark.content_slug
      )
  );

  const handleAdd = async () => {
    if (!selectedBookmarkId) {
      toast.error('Please select a bookmark to add');
      return;
    }

    const bookmark = availableBookmarks.find((b) => b.id === selectedBookmarkId);
    if (!bookmark) return;

    startTransition(async () => {
      try {
        const result = await addItemToCollection({
          collection_id: collectionId,
          content_type: bookmark.content_type,
          content_slug: bookmark.content_slug,
          order: items.length, // Add to end
        });

        if (result?.data?.success) {
          toast.success('Item added to collection');
          setSelectedBookmarkId('');
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add item');
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
          toast.success('Item removed from collection');
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to remove item');
      }
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    
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
        toast.success('Items reordered');
        router.refresh();
      } catch (error) {
        setItems(items); // Revert on error
        toast.error('Failed to reorder items');
      }
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
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
        toast.success('Items reordered');
        router.refresh();
      } catch (error) {
        setItems(items); // Revert on error
        toast.error('Failed to reorder items');
      }
    });
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_4}>
      {/* Add Item Section */}
      <div className="flex items-end gap-2 pb-4 border-b">
        <div className="flex-1">
          <label className={`${UI_CLASSES.TEXT_SM} font-medium mb-2 block`}>
            Add Bookmark to Collection
          </label>
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
                    <div className="flex items-center gap-2">
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
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        <div className={UI_CLASSES.SPACE_Y_2}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-1">
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(`/${item.content_type}/${item.content_slug}`, '_blank')}
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
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
