import { createPost } from '@/src/lib/actions/post-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'New Post - ClaudePro Directory',
  description: 'Share something with the community',
};

export default function NewPostPage() {
  const handleSubmit = async (formData: FormData) => {
    'use server';
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string | null;
    const url = formData.get('url') as string | null;

    const result = await createPost({
      title,
      content: content || null,
      url: url || null,
    });

    if (result?.data?.success) {
      redirect('/board');
    }
  };

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background ${UI_CLASSES.PX_4} py-12`}>
      <div className={`container ${UI_CLASSES.MX_AUTO} max-w-2xl`}>
        <div className={UI_CLASSES.SPACE_Y_6}>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create a Post</h1>
            <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
              Share a link, ask a question, or start a discussion
            </p>
          </div>

          <form action={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Include either a URL, text content, or both
                </CardDescription>
              </CardHeader>
              <CardContent className={UI_CLASSES.SPACE_Y_4}>
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="What's this about?"
                    maxLength={300}
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL (optional)</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com/article"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                    Share a link to an article, project, or resource
                  </p>
                </div>

                <div>
                  <Label htmlFor="content">Content (optional)</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={8}
                    placeholder="Share your thoughts, ask a question, or provide context..."
                    maxLength={5000}
                    className="resize-none"
                  />
                </div>

                <div className={UI_CLASSES.FLEX_GAP_4}>
                  <Button type="submit">Create Post</Button>
                  <Button type="button" variant="outline" asChild>
                    <a href="/board">Cancel</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
