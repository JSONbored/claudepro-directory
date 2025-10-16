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
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { createCollection, updateCollection } from '@/src/lib/actions/content.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

interface Bookmark {
  id: string;
  content_type: string;
  content_slug: string;
  notes?: string;
  created_at: string;
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_public: boolean;
}

interface CollectionFormProps {
  bookmarks: Bookmark[];
  mode: 'create' | 'edit';
  collection?: CollectionData;
}

export function CollectionForm({ bookmarks, mode, collection }: CollectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);

  // Generate unique IDs for form fields
  const nameId = useId();
  const slugId = useId();
  const descriptionId = useId();
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
            slug: slug.trim() || undefined,
            description: description.trim() || undefined,
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
            description: description.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Collection Name */}
      <div className="space-y-2">
        <Label htmlFor={nameId}>
          Collection Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id={nameId}
          type="text"
          placeholder="My Awesome Collection"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          maxLength={100}
          required
          disabled={isPending}
        />
        <p className={'text-xs text-muted-foreground'}>{name.length}/100 characters</p>
      </div>

      {/* Collection Slug */}
      <div className="space-y-2">
        <Label htmlFor={slugId}>Slug</Label>
        <Input
          id={slugId}
          type="text"
          placeholder="my-awesome-collection"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          maxLength={100}
          pattern="[a-z0-9-]+"
          disabled={isPending}
        />
        <p className={'text-xs text-muted-foreground'}>
          Used in URL. Leave empty to auto-generate from name.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          placeholder="Describe what this collection is about..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={isPending}
        />
        <p className={'text-xs text-muted-foreground'}>{description.length}/500 characters</p>
      </div>

      {/* Public Toggle */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} rounded-lg border p-4`}>
        <Checkbox
          id={isPublicId}
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
          disabled={isPending}
        />
        <div className="flex-1">
          <Label htmlFor={isPublicId} className="text-base font-medium cursor-pointer">
            Public Collection
          </Label>
          <p className={'text-sm text-muted-foreground'}>
            Make this collection visible on your public profile
          </p>
        </div>
      </div>

      {/* Bookmarks Selection (only in create mode initially) */}
      {mode === 'create' && bookmarks.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base">Add Bookmarks (Optional)</Label>
            <p className={'text-sm text-muted-foreground mt-1'}>
              Select bookmarks to add to this collection. You can add more later.
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-4">
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
                    className={`text-sm font-normal cursor-pointer ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}`}
                  >
                    <Badge variant="outline" className="text-xs capitalize">
                      {bookmark.content_type}
                    </Badge>
                    {bookmark.content_slug}
                  </Label>
                </div>
              </div>
            ))}
          </div>
          {selectedBookmarks.length > 0 && (
            <p className={'text-sm text-muted-foreground'}>
              {selectedBookmarks.length} bookmark{selectedBookmarks.length === 1 ? '' : 's'}{' '}
              selected
            </p>
          )}
        </div>
      )}

      {/* Empty bookmarks message */}
      {mode === 'create' && bookmarks.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className={'text-sm text-muted-foreground'}>
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
