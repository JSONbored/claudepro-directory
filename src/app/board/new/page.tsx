import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NewPostForm } from '@/src/components/board/new-post-form';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { createPost } from '@/src/lib/actions/content.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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

          <NewPostForm onSubmit={handleSubmit} />
        </div>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={`${UI_CLASSES.MX_AUTO} px-4 py-12`}>
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
