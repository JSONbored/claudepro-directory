'use server';

import { unlinkOauthProviderReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/unlink_oauth_provider';
import { z } from 'zod';
import { oauth_providerSchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

const unlinkOAuthProviderSchema = z.object({
  provider: oauth_providerSchema,
});

export const unlinkOAuthProvider = authedAction
  .inputSchema(unlinkOAuthProviderSchema)
  .outputSchema(unlinkOauthProviderReturnsSchema)
  .metadata({ actionName: 'unlinkOAuthProvider', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof unlinkOauthProviderReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_provider': parsedInput.provider,
      'p_user_id': ctx.userId,
    };
    
    const result = await runRpc<z.infer<typeof unlinkOauthProviderReturnsSchema>>(
      'unlink_oauth_provider',
      args,
      {
        action: 'unlinkOAuthProvider.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account/settings');
    revalidateTag('users', 'default');
    
    return result;
  });
