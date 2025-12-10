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
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
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
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

/**
 * Validate slug is safe for use in URLs
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

/**
 * Build a safe URL path for a content item from its category and slug.
 *
 * @param type - Content category name; must be a recognized category
 * @param slug - Content slug to be sanitized and validated
 * @returns The URL path in the form `/type/sanitized-slug` if both inputs are valid, `null` otherwise.
 *
 * @see isValidCategory
 * @see sanitizeSlug
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

/**
 * UI for managing items within a collection (add, remove, and reorder).
 *
 * Renders controls to add bookmarks to the collection, remove existing items, and reorder items
 * using up/down buttons. Performs optimistic updates for reordering, synchronizes changes with
 * server actions, shows user-facing toasts for validation/success/errors, and refreshes route data
 * after successful operations.
 *
 * @param collectionId - The ID of the collection to manage.
 * @param items - Initial list of collection items to display and manage.
 * @param availableBookmarks - All bookmarks that may be added to the collection; bookmarks already
 *   present in the collection are filtered out from the add picker.
 * @returns The JSX element for the collection item manager.
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
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'CollectionItemManager' });
  const { openAuthModal } = useAuthModal();
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

  const handleAdd = useCallback(async () => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to add items to collections',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    if (!selectedBookmarkId) {
      toasts.error.validation('Please select a bookmark to add');
      return;
    }

    const bookmark = availableBookmarks.find((b) => b.id === selectedBookmarkId);
    if (!bookmark) return;

    // User is authenticated - proceed with add action
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
        // Check if error is auth-related and show modal if so
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          openAuthModal({
            valueProposition: 'Sign in to add items to collections',
            redirectTo: pathname ?? undefined,
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to add item to collection', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleAdd();
              },
            },
          });
        }
      }
    });
  }, [user, status, openAuthModal, pathname, selectedBookmarkId, availableBookmarks, collectionId, items.length, router]);

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
        // Show error toast with "Retry" button
        toasts.raw.error('Failed to remove item', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleRemove(itemId);
            },
          },
        });
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
        // Show error toast with "Retry" button
        toasts.raw.error('Failed to reorder items', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleMoveUp(index);
            },
          },
        });
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
        // Show error toast with "Retry" button
        toasts.raw.error('Failed to reorder items', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleMoveDown(index);
            },
          },
        });
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