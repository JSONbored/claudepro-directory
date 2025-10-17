import { redirect } from 'next/navigation';
import { InlineEmailCTA } from '@/src/components/features/growth/inline-email-cta';
import { NewPostForm } from '@/src/components/forms/new-post-form';
import { createPost } from '@/src/lib/actions/content.actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/board/new');

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
    <div className={'min-h-screen bg-background px-4 py-12'}>
      <div className={'container mx-auto max-w-2xl'}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create a Post</h1>
            <p className="text-muted-foreground">
              Share a link, ask a question, or start a discussion
            </p>
          </div>

          <NewPostForm onSubmit={handleSubmit} />
        </div>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={'mx-auto px-4 py-12'}>
          <InlineEmailCTA
            variant="hero"
            context="board-new-page"
            headline="Join 1,000+ Claude Power Users"
            description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
          />
        </section>
      </div>
    </div>
  );
}
