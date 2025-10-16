'use client';

import { useId } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { ROUTES } from '@/src/lib/constants/routes';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface NewPostFormProps {
  onSubmit: (formData: FormData) => void;
}

export function NewPostForm({ onSubmit }: NewPostFormProps) {
  const titleId = useId();
  const urlId = useId();
  const contentId = useId();

  return (
    <form action={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>Include either a URL, text content, or both</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={titleId}>Title *</Label>
            <Input
              id={titleId}
              name="title"
              required
              placeholder="What's this about?"
              maxLength={300}
            />
          </div>

          <div>
            <Label htmlFor={urlId}>URL (optional)</Label>
            <Input id={urlId} name="url" type="url" placeholder="https://example.com/article" />
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
              Share a link to an article, project, or resource
            </p>
          </div>

          <div>
            <Label htmlFor={contentId}>Content (optional)</Label>
            <Textarea
              id={contentId}
              name="content"
              rows={8}
              placeholder="Share your thoughts, ask a question, or provide context..."
              maxLength={5000}
              className="resize-none"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Post</Button>
            <Button type="button" variant="outline" asChild>
              <a href={ROUTES.BOARD}>Cancel</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
