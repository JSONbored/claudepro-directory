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
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { createCollection, updateCollection } from '@/src/lib/actions/content.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
      toast.error('Collection name is required');
      return;
    }

    if (name.length < 2) {
      toast.error('Collection name must be at least 2 characters');
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
            toast.success('Collection created successfully!');
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
            toast.success('Collection updated successfully!');
            router.push(`/account/library/${result.data.collection.slug}`);
            router.refresh();
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save collection');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={UI_CLASSES.SPACE_Y_6}>
      {/* Collection Name */}
      <div className={UI_CLASSES.SPACE_Y_2}>
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
        <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          {name.length}/100 characters
        </p>
      </div>

      {/* Collection Slug */}
      <div className={UI_CLASSES.SPACE_Y_2}>
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
        <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          Used in URL. Leave empty to auto-generate from name.
        </p>
      </div>

      {/* Description */}
      <div className={UI_CLASSES.SPACE_Y_2}>
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
        <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          {description.length}/500 characters
        </p>
      </div>

      {/* Public Toggle */}
      <div className="flex items-center gap-3 rounded-lg border p-4">
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
          <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            Make this collection visible on your public profile
          </p>
        </div>
      </div>

      {/* Bookmarks Selection (only in create mode initially) */}
      {mode === 'create' && bookmarks.length > 0 && (
        <div className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label className="text-base">Add Bookmarks (Optional)</Label>
            <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
              Select bookmarks to add to this collection. You can add more later.
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-start space-x-3 rounded-md p-2 hover:bg-accent"
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
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
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
            <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              {selectedBookmarks.length} bookmark{selectedBookmarks.length === 1 ? '' : 's'}{' '}
              selected
            </p>
          )}
        </div>
      )}

      {/* Empty bookmarks message */}
      {mode === 'create' && bookmarks.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
            You don't have any bookmarks yet. Create the collection first and add bookmarks later.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
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
