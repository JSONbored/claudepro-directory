'use client';

/**
 * Collection Form Component
 * Form for creating and editing user collections
 *
 * Uses react-hook-form with zod validation
 * Follows patterns from existing forms in the codebase
 */

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { FormField } from '@/src/components/forms/utilities/form-field';
import { Button } from '@/src/components/primitives/button';
import { Checkbox } from '@/src/components/primitives/checkbox';
import { Label } from '@/src/components/primitives/label';
import { createCollection, updateCollection } from '@/src/lib/actions/content.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Tables } from '@/src/types/database.types';

type Bookmark = Tables<'bookmarks'>;
type CollectionData = Tables<'user_collections'>;

interface CollectionFormProps {
  bookmarks: Bookmark[];
  mode: 'create' | 'edit';
  collection?: CollectionData;
}

export function CollectionForm({ bookmarks, mode, collection }: CollectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);

  // Generate unique ID for checkbox (FormField auto-generates IDs for other fields)
  const isPublicId = useId();

  // Form state
  const [name, setName] = useState(collection?.name || '');
  const [slug, setSlug] = useState(collection?.slug || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [isPublic, setIsPublic] = useState(collection?.is_public ?? false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Only auto-generate slug in create mode if slug is empty or was auto-generated
    if (mode === 'create' || !slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toasts.error.validation('Collection name is required');
      return;
    }

    if (name.length < 2) {
      toasts.error.validation('Collection name must be at least 2 characters');
      return;
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createCollection({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          });

          if (result?.data?.success) {
            if (!result.data.collection) {
              throw new Error('Collection data not returned');
            }
            toasts.success.itemCreated('Collection');
            const collectionSlug = result.data.collection.slug;
            router.push(`/account/library/${collectionSlug}`);
            router.refresh();
          }
        } else if (collection) {
          const result = await updateCollection({
            id: collection.id,
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          });

          if (result?.data?.success) {
            if (!result.data.collection) {
              throw new Error('Collection data not returned');
            }
            toasts.success.itemUpdated('Collection');
            router.push(`/account/library/${result.data.collection.slug}`);
            router.refresh();
          }
        }
      } catch (error) {
        toasts.error.fromError(error, 'Failed to save collection');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={UI_CLASSES.FORM_SECTION_SPACING}>
      {/* Collection Name */}
      <FormField
        variant="input"
        label="Collection Name"
        type="text"
        placeholder="My Awesome Collection"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        maxLength={100}
        showCharCount
        required
        disabled={isPending}
      />

      {/* Collection Slug */}
      <FormField
        variant="input"
        label="Slug"
        type="text"
        placeholder="my-awesome-collection"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase())}
        maxLength={100}
        disabled={isPending}
        description="Used in URL. Leave empty to auto-generate from name."
      />

      {/* Description */}
      <FormField
        variant="textarea"
        label="Description"
        placeholder="Describe what this collection is about..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        showCharCount
        rows={3}
        disabled={isPending}
      />

      {/* Public Toggle */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} rounded-lg border p-4`}>
        <Checkbox
          id={isPublicId}
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
          disabled={isPending}
        />
        <div className="flex-1">
          <Label htmlFor={isPublicId} className="cursor-pointer font-medium text-base">
            Public Collection
          </Label>
          <p className={'text-muted-foreground text-sm'}>
            Make this collection visible on your public profile
          </p>
        </div>
      </div>

      {/* Bookmarks Selection (only in create mode initially) */}
      {mode === 'create' && bookmarks.length > 0 && (
        <div className={UI_CLASSES.FORM_GROUP_SPACING}>
          <div>
            <Label className="text-base">Add Bookmarks (Optional)</Label>
            <p className={'mt-1 text-muted-foreground text-sm'}>
              Select bookmarks to add to this collection. You can add more later.
            </p>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} rounded-md p-2 hover:bg-accent`}
              >
                <Checkbox
                  id={bookmark.id}
                  checked={selectedBookmarks.includes(bookmark.id)}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setSelectedBookmarks([...selectedBookmarks, bookmark.id]);
                    } else {
                      setSelectedBookmarks(
                        selectedBookmarks.filter((id: string) => id !== bookmark.id)
                      );
                    }
                  }}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={bookmark.id}
                    className={`cursor-pointer font-normal text-sm ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}`}
                  >
                    <UnifiedBadge variant="base" style="outline" className="text-xs capitalize">
                      {bookmark.content_type}
                    </UnifiedBadge>
                    {bookmark.content_slug}
                  </Label>
                </div>
              </div>
            ))}
          </div>
          {selectedBookmarks.length > 0 && (
            <p className={'text-muted-foreground text-sm'}>
              {selectedBookmarks.length} bookmark{selectedBookmarks.length === 1 ? '' : 's'}{' '}
              selected
            </p>
          )}
        </div>
      )}

      {/* Empty bookmarks message */}
      {mode === 'create' && bookmarks.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className={'text-muted-foreground text-sm'}>
            You don't have any bookmarks yet. Create the collection first and add bookmarks later.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={'flex items-center gap-4 pt-4'}>
        <Button type="submit" disabled={isPending} className="flex-1 sm:flex-initial">
          {isPending
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Collection'
              : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
