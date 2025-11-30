'use client';

/**
 * Collection Form Component
 *
 * Form for creating and editing user collections.
 * Uses the standardized `useFormSubmit` hook for submission handling.
 *
 * @example
 * ```tsx
 * <CollectionForm
 *   bookmarks={userBookmarks}
 *   mode="create"
 * />
 * ```
 */

import type { Database } from '@heyclaude/database-types';
import { cluster } from '@heyclaude/web-runtime/design-system';
import { createCollection, updateCollection } from '@heyclaude/web-runtime/actions';
import { useFormSubmit } from '@heyclaude/web-runtime/hooks';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useId, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { FormField } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Checkbox } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';

type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
type CollectionData = Database['public']['Tables']['user_collections']['Row'];

interface CollectionFormProps {
  /** User's existing bookmarks to optionally add to collection */
  bookmarks: Bookmark[];
  /** Form mode - 'create' for new collections, 'edit' for existing */
  mode: 'create' | 'edit';
  /** Existing collection data (required for edit mode) */
  collection?: CollectionData;
}

/**
 * Renders a form for creating or editing a user collection, handling validation, submission, and navigation.
 *
 * The form supports name, slug, description, and visibility fields; in create mode it also optionally lets the user select existing bookmarks to include in the new collection.
 *
 * @param bookmarks - List of bookmarks available to add when creating a collection (ignored in edit mode).
 * @param mode - Either `'create'` or `'edit'`; controls available UI and submission behavior.
 * @param collection - Existing collection data used to prefill fields when `mode` is `'edit'`.
 *
 * @returns The collection form React element.
 *
 * @see useFormSubmit
 * @see createCollection
 * @see updateCollection
 */
export function CollectionForm({ bookmarks, mode, collection }: CollectionFormProps) {
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);

  // Use standardized form submission hook
  const { isPending, handleSubmit, router } = useFormSubmit<CollectionData>({
    scope: 'CollectionForm',
    mode,
    refreshOnSuccess: true,
    messages: {
      createSuccess: 'Collection created successfully',
      editSuccess: 'Collection updated successfully',
      errorTitle: 'Failed to save collection',
    },
    onSuccess: (result) => {
      // Navigate to the collection page
      router.push(`/account/library/${result.slug}`);
    },
    logContext: {
      collectionId: collection?.id,
    },
  });

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (!name.trim()) {
      toasts.error.validation('Collection name is required');
      return;
    }

    if (name.length < 2) {
      toasts.error.validation('Collection name must be at least 2 characters');
      return;
    }

    await handleSubmit(async () => {
      if (mode === 'create') {
        const result = await createCollection({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        });

        if (!result?.data?.success || !result.data.collection) {
          throw new Error('Collection creation failed');
        }

        return result.data.collection;
      } else if (collection) {
        const result = await updateCollection({
          id: collection.id,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        });

        if (!result?.data?.success || !result.data.collection) {
          throw new Error('Collection update failed');
        }

        return result.data.collection;
      }

      throw new Error('Invalid form state');
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Collection Name */}
      <FormField
        variant="input"
        label="Collection Name"
        type="text"
        placeholder="My Awesome Collection"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        maxLength={100}
        showCharCount={true}
        required={true}
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
        showCharCount={true}
        rows={3}
        disabled={isPending}
      />

      {/* Public Toggle */}
      <div className={`${cluster.default} rounded-lg border p-4`}>
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
        <div className="space-y-4">
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
                className="flex items-start gap-3 rounded-md p-2 hover:bg-accent"
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
                    className={`cursor-pointer font-normal text-sm ${cluster.compact}`}
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