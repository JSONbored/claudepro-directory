'use server';

import { submitContentForReviewReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/submit_content_for_review';
import { z } from 'zod';
import {
  submission_typeSchema,
  content_categorySchema,
} from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

const submitContentForReviewSchema = z.object({
  submission_type: submission_typeSchema,
  name: z.string(),
  description: z.string(),
  category: content_categorySchema,
  author: z.string(),
  content_data: z.any(),
  author_profile_url: z.string().optional(),
  github_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const submitContentForReview = authedAction
  .inputSchema(submitContentForReviewSchema)
  .outputSchema(submitContentForReviewReturnsSchema)
  .metadata({ actionName: 'submitContentForReview', category: 'content' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof submitContentForReviewReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_submission_type': parsedInput.submission_type,
      'p_name': parsedInput.name,
      'p_description': parsedInput.description,
      'p_category': parsedInput.category,
      'p_author': parsedInput.author,
      'p_content_data': parsedInput.content_data,
      'p_author_profile_url': parsedInput.author_profile_url,
      'p_github_url': parsedInput.github_url,
      'p_tags': parsedInput.tags,
    };
    
    const result = await runRpc<z.infer<typeof submitContentForReviewReturnsSchema>>(
      'submit_content_for_review',
      args,
      {
        action: 'submitContentForReview.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account/submissions');
    revalidateTag('submissions', 'default');
    
    return result;
  });
