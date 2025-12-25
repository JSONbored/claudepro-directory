'use server';

import { insertContactSubmissionReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/insert_contact_submission';
import { z } from 'zod';
import { contact_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

const submitContactFormSchema = z.object({
  name: z.string(),
  email: z.string(),
  category: contact_categorySchema,
  message: z.string(),
  metadata: z.any().optional(),
});

export const submitContactForm = authedAction
  .inputSchema(submitContactFormSchema)
  .outputSchema(insertContactSubmissionReturnsSchema)
  .metadata({ actionName: 'submitContactForm', category: 'form' })
  .action(
    async ({ parsedInput, ctx }): Promise<z.infer<typeof insertContactSubmissionReturnsSchema>> => {
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      const args = {
        p_name: parsedInput.name,
        p_email: parsedInput.email,
        p_category: parsedInput.category,
        p_message: parsedInput.message,
        p_metadata: parsedInput.metadata,
      };

      const rawResult = await runRpc<z.infer<typeof insertContactSubmissionReturnsSchema>>(
        'insert_contact_submission',
        args,
        {
          action: 'submitContactForm.rpc',
          userId: ctx.userId,
        }
      );

      // insertContactSubmissionReturnsSchema is an array
      // callRpc may unwrap single-element arrays, so ensure we always return an array
      const result: z.infer<typeof insertContactSubmissionReturnsSchema> = Array.isArray(rawResult)
        ? rawResult
        : [rawResult];

      // Execute post-action hook
      try {
        const firstElement = result[0];
        const id = firstElement?.submission_id;
        if (id) {
          const { onContactSubmission } = await import('./hooks/contact-hooks.ts');
          await onContactSubmission({ submission_id: id }, ctx, {
            name: parsedInput.name,
            email: parsedInput.email,
            category: parsedInput.category,
            message: parsedInput.message,
          });
          // Hook doesn't modify the result array, just processes side effects
        }
      } catch (hookError) {
        // Log hook errors but don't fail the action
        const { logger } = await import('../logger.ts');
        const { normalizeError } = await import('../errors.ts');
        const normalized = normalizeError(hookError, 'Hook onContactSubmission failed');
        logger.error(
          {
            err: normalized,
            hookName: 'onContactSubmission',
            actionName: 'submitContactForm',
            userId: ctx.userId,
          },
          'Post-action hook onContactSubmission failed'
        );
      }

      // Cache invalidation
      revalidatePath('/admin/contact-submissions');
      const firstElement = result[0];
      const id = firstElement?.submission_id;
      if (id) {
        revalidateTag(`contact-submission-${id}`, 'default');
      }
      revalidateTag('contact', 'default');
      revalidateTag('submissions', 'default');

      return result;
    }
  );
