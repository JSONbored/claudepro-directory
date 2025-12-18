/**
 * Bookmarks Actions - Consolidated
 * 
 * All bookmark operations (add, remove) in one file.
 * Uses next-safe-action directly with factory helpers for business logic.
 */

'use server';

import { addBookmarkReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/add_bookmark';
import { removeBookmarkReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/remove_bookmark';
import { z } from 'zod';
import { content_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

// Add bookmark schema
const addBookmarkSchema = z.object({
  content_type: content_categorySchema,
  content_slug: z.string(),
  notes: z.string().optional()
});

// Remove bookmark schema
const removeBookmarkSchema = z.object({
  content_type: content_categorySchema,
  content_slug: z.string()
});

// Export input types (can't export from 'use server' files, but types are OK)
export type AddBookmarkInput = z.infer<typeof addBookmarkSchema>;
export type RemoveBookmarkInput = z.infer<typeof removeBookmarkSchema>;

export const addBookmark = authedAction
  .inputSchema(addBookmarkSchema)
  .outputSchema(addBookmarkReturnsSchema)
  .metadata({ actionName: 'addBookmark', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof addBookmarkReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_user_id': ctx.userId,
      'p_content_type': parsedInput.content_type,
      'p_content_slug': parsedInput.content_slug,
      'p_notes': parsedInput.notes,
    };
    
    const result = await runRpc<z.infer<typeof addBookmarkReturnsSchema>>(
      'add_bookmark',
      args,
      {
        action: 'addBookmark.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidateTag('user-bookmarks', 'default');
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');
    revalidateTag(`content-${parsedInput.content_slug}`, 'default');
    
    return result;
  });

export const removeBookmark = authedAction
  .inputSchema(removeBookmarkSchema)
  .outputSchema(removeBookmarkReturnsSchema)
  .metadata({ actionName: 'removeBookmark', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof removeBookmarkReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_user_id': ctx.userId,
      'p_content_type': parsedInput.content_type,
      'p_content_slug': parsedInput.content_slug,
    };
    
    const result = await runRpc<z.infer<typeof removeBookmarkReturnsSchema>>(
      'remove_bookmark',
      args,
      {
        action: 'removeBookmark.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidateTag('user-bookmarks', 'default');
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');
    revalidateTag(`content-${parsedInput.content_slug}`, 'default');
    
    return result;
  });
