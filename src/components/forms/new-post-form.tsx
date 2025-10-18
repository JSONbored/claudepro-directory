'use client';

import { useTransition } from 'react';
import { FormField } from '@/src/components/forms/utilities/form-field';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { toasts } from '@/src/lib/utils/toast.utils';

interface NewPostFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
}

export function NewPostForm({ onSubmit }: NewPostFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData(e.currentTarget);
        await onSubmit(formData);
      } catch (error) {
        toasts.error.fromError(error, 'Failed to create post');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>Include either a URL, text content, or both</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            variant="input"
            label="Title"
            name="title"
            placeholder="What's this about?"
            maxLength={300}
            required
          />

          <FormField
            variant="input"
            label="URL (optional)"
            name="url"
            type="url"
            placeholder="https://example.com/article"
            description="Share a link to an article, project, or resource"
          />

          <FormField
            variant="textarea"
            label="Content (optional)"
            name="content"
            rows={8}
            placeholder="Share your thoughts, ask a question, or provide context..."
            maxLength={5000}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Post'}
            </Button>
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <a href={ROUTES.BOARD}>Cancel</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
