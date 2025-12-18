'use server';

import { toggleReviewHelpfulReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/toggle_review_helpful';
import { z } from 'zod';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

const markReviewHelpfulSchema = z.object({
  review_id: z.string().uuid(),
  helpful: z.boolean(),
});

export const markReviewHelpful = authedAction
  .inputSchema(markReviewHelpfulSchema)
  .outputSchema(toggleReviewHelpfulReturnsSchema)
  .metadata({ actionName: 'markReviewHelpful', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof toggleReviewHelpfulReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_review_id': parsedInput.review_id,
      'p_user_id': ctx.userId,
      'p_helpful': parsedInput.helpful,
    };
    
    const result = await runRpc<z.infer<typeof toggleReviewHelpfulReturnsSchema>>(
      'toggle_review_helpful',
      args,
      {
        action: 'markReviewHelpful.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    if (result?.content_type && result?.content_slug) {
      revalidatePath(`/${result.content_type}/${result.content_slug}`);
      revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'default');
    }
    revalidateTag('content', 'default');
    
    return result;
  });
