'use server';

import { toggleJobStatusReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/toggle_job_status';
import { z } from 'zod';
import { job_statusSchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

const toggleJobStatusSchema = z.object({
  job_id: z.string().uuid(),
  new_status: job_statusSchema,
});

export const toggleJobStatus = authedAction
  .inputSchema(toggleJobStatusSchema)
  .outputSchema(toggleJobStatusReturnsSchema)
  .metadata({ actionName: 'toggleJobStatus', category: 'content' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof toggleJobStatusReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_job_id': parsedInput.job_id,
      'p_user_id': ctx.userId,
      'p_new_status': parsedInput.new_status,
    };
    
    let result = await runRpc<z.infer<typeof toggleJobStatusReturnsSchema>>(
      'toggle_job_status',
      args,
      {
        action: 'toggleJobStatus.rpc',
        userId: ctx.userId,
      }
    );
    
    // Execute post-action hook
    try {
      const { onJobStatusToggled } = await import('./hooks/job-hooks.ts');
      await onJobStatusToggled(
        result as { job_id: string; new_status: string },
        ctx,
        parsedInput as { job_id: string; new_status: string }
      );
      // Hook doesn't modify the result, just processes side effects
    } catch (hookError) {
      // Log hook errors but don't fail the action
      const { logger } = await import('../logger.ts');
      const { normalizeError } = await import('../errors.ts');
      const normalized = normalizeError(hookError, 'Hook onJobStatusToggled failed');
      logger.error({
        err: normalized,
        hookName: 'onJobStatusToggled',
        actionName: 'toggleJobStatus',
        userId: ctx.userId,
      }, 'Post-action hook onJobStatusToggled failed');
    }
    
    // Cache invalidation
    revalidatePath('/jobs');
    revalidatePath('/account/jobs');
    revalidateTag(`job-${parsedInput.job_id}`, 'default');
    revalidateTag('jobs', 'default');
    revalidateTag('companies', 'default');
    
    return result;
  });
