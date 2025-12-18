'use client';

/**
 * Collection Item Manager Component
 * Manages items within a collection (add, remove, reorder)
 *
 * Uses drag-to-reorder with Motion.dev Reorder component for intuitive UX
 * Following existing UI patterns from the codebase
 */

import type { Bookmarks, CollectionItems } from '@heyclaude/database-types/postgres-types';
import {
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from '@heyclaude/web-runtime/actions/collection-items';
import { isValidCategory, sanitizeSlug } from '@heyclaude/web-runtime/core';
import { useAuthenticatedUser, useSafeAction } from '@heyclaude/web-runtime/hooks';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { ExternalLink, Plus, Trash } from '@heyclaude/web-runtime/icons';
import {
  toasts,
  UnifiedBadge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Reorder,
  cn,
} from '@heyclaude/web-runtime/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

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

// Use composite types directly from generator - these match what RPCs return
type CollectionItem = CollectionItems;
type Bookmark = Bookmarks;

interface CollectionItemManagerProps {
  availableBookmarks: Bookmark[];
  collectionId: string;
  items: CollectionItem[];
}

/**
 * UI for managing items within a collection (add, remove, and reorder).
 *
 * Renders controls to add bookmarks to the collection, remove existing items, and reorder items
 * using drag-to-reorder. Performs optimistic updates for reordering, synchronizes changes with
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
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState(initialItems);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string>('');
  
  // Use useSafeAction hooks - this properly infers types from next-safe-action
  const { executeAsync: executeAddItem, isPending: isAdding } = useSafeAction(addItemToCollection, {
    onSuccess: ({ data }: { data?: { success: boolean | null } }) => {
      if (data?.success) {
        toasts.success.actionCompleted('Item added to collection');
        setSelectedBookmarkId('');
        router.refresh();
      }
    },
    onError: ({ error }: { error: { serverError?: string; validationErrors?: unknown } }) => {
      const errorMessage = error.serverError || 'Failed to add item to collection';
      if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        openAuthModal({
          valueProposition: 'Sign in to add items to collections',
          redirectTo: pathname ?? undefined,
        });
      } else {
        toasts.raw.error('Failed to add item to collection', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleAdd();
            },
          },
        });
      }
    },
  });
  
  const { executeAsync: executeRemoveItem, isPending: isRemoving } = useSafeAction(removeItemFromCollection, {
    onSuccess: ({ data }: { data?: { success: boolean | null } }) => {
      if (data?.success) {
        toasts.success.actionCompleted('Item removed from collection');
        router.refresh();
      }
    },
    onError: () => {
      // Error handling is done in the hook's onError callback
      toasts.raw.error('Failed to remove item', {
        action: {
          label: 'Retry',
          onClick: () => {
            // Will be handled by the caller
          },
        },
      });
    },
  });
  
  const { executeAsync: executeReorderItems, isPending: isReordering } = useSafeAction(reorderCollectionItems, {
    onSuccess: () => {
      toasts.success.actionCompleted('Items reordered');
      router.refresh();
    },
    onError: () => {
      // Revert on error
      setItems(items);
      toasts.raw.error('Failed to reorder items', {
        action: {
          label: 'Retry',
          onClick: () => {
            // Will be handled by the caller
          },
        },
      });
    },
  });
  
  const isPending = isAdding || isRemoving || isReordering;

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
    // Execute the action using useSafeAction's executeAsync
    executeAddItem({
      collection_id: collectionId,
      content_type: isValidCategory(bookmark.content_type) ? bookmark.content_type : 'agents',
      content_slug: bookmark.content_slug,
      order: items.length, // Add to end
    });
  }, [user, status, openAuthModal, pathname, selectedBookmarkId, availableBookmarks, collectionId, items.length, router, executeAddItem]);

  const handleRemove = useCallback(async (itemId: string) => {
    // Execute the action using useSafeAction's executeAsync
    executeRemoveItem({
      remove_item_id: itemId,
    });
  }, [executeRemoveItem]);

  const handleReorder = useCallback(
    (newOrder: unknown[]) => {
      // Type assertion - Reorder.Group passes the same type as values
      const typedOrder = newOrder as CollectionItem[];

      // Update order values based on new order
      const reorderedItems = typedOrder.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));

      // Optimistic update
      setItems(typedOrder);

      // Execute the action using useSafeAction's executeAsync
      executeReorderItems({
        collection_id: collectionId,
        items: reorderedItems,
      });
    },
    [collectionId, items, router, executeReorderItems, setItems]
  );

  return (
    <div className="space-y-4">
      {/* Add Item Section */}
      <div className={cn('flex items-end', 'gap-2', 'pb-4')}>
        <div className={`flex-1`}>
          <div className={`mb-2 block text-sm-medium`}>Add Bookmark to Collection</div>
          <Select value={selectedBookmarkId} onValueChange={setSelectedBookmarkId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bookmark to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className={cn('text-muted-foreground text-sm', 'p-2')}>
                  All bookmarks have been added
                </div>
              ) : (
                availableToAdd.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    <div className="flex items-center gap-2">
                      <UnifiedBadge variant="base" style="outline" className="text-[10px] capitalize">
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
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Items List */}
      {items.length === 0 ? (
        <div className="card-base border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No items in this collection yet. Add bookmarks above to get started.
          </p>
        </div>
      ) : (
        // TODO: Enhance reordering functionality with features that leverage custom order:
        // - Display collections in custom order on profile/public pages
        // - Featured/pinned items at the top (with visual indicator)
        // - Custom sorting options (by date added, type, alphabetical, custom order)
        // - Export collections preserving custom order
        // - Share collections with custom order preserved
        // - Collection templates with predefined item order
        // - Analytics on most-reordered items (popularity/priority insights)
        // Currently, reordering only affects the database order field but doesn't impact
        // how collections are displayed elsewhere in the application.
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={shouldReduceMotion || isPending ? () => {} : handleReorder}
          as="div"
          className="space-y-2"
        >
          {items.map((item: CollectionItem, index: number) => (
            <Reorder.Item
              key={item.id}
              value={item}
              as="div"
              className="flex items-center gap-3 bg-card hover:bg-accent/50 card-base p-3 transition-colors ${
                shouldReduceMotion || isPending ? '' : 'cursor-grab active:cursor-grabbing'
              }"
              dragListener={!shouldReduceMotion && !isPending}
            >
              {/* Drag Handle - Only visible when drag is enabled */}
              {!shouldReduceMotion && !isPending && (
                <div
                  className={cn('text-muted-foreground', 'flex flex-col', 'gap-3.5 cursor-grab active:cursor-grabbing touch-none')}
                  aria-label="Drag handle"
                >
                  <div className="h-0.5 w-3 rounded-full bg-current" />
                  <div className="h-0.5 w-3 rounded-full bg-current" />
                  <div className="h-0.5 w-3 rounded-full bg-current" />
                </div>
              )}

              {/* Order Number */}
              <div className={cn('text-muted-foreground text-sm', 'w-8 text-center', 'font-medium')}>
                #{index + 1}
              </div>

              {/* Content Info */}
              <div className={`flex-1`}>
                <div className="flex items-center gap-2">
                  <UnifiedBadge variant="base" style="outline" className="text-[10px] capitalize">
                    {item.content_type}
                  </UnifiedBadge>
                  <span className="text-sm-medium">{item.content_slug}</span>
                </div>
                {item.notes ? (
                  <p className={cn('text-muted-foreground', 'mt-1', 'text-xs')}>{item.notes}</p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {(() => {
                  const safeContentUrl = getSafeContentUrl(item.content_type, item.content_slug);
                  if (!safeContentUrl) return null;
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(safeContentUrl, '_blank')}
                      aria-label="View item"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-destructive hover:text-destructive p-0"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  aria-label="Remove item"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}