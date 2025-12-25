'use server';

/**
 * User Image Upload Actions
 * Handles avatar and hero image uploads for user profiles
 */

import { createSupabaseAdminClient } from '../supabase/admin.ts';
import { authedAction } from './safe-action.ts';
import { validateImageBuffer, extractPathFromUrl, IMAGE_CONFIG } from '../storage/image-utils.ts';
import { z } from 'zod';
import { prisma } from '@heyclaude/data-layer/prisma/client';

const uploadImageSchema = z.object({
  fileName: z.string().min(1).max(256),
  mimeType: z.enum(IMAGE_CONFIG.ALLOWED_TYPES),
  fileBase64: z.string().min(1),
  imageType: z.enum(['avatar', 'hero']),
  oldImageUrl: z.string().optional(),
});

/**
 * Upload user avatar or hero image
 */
export const uploadUserImage = authedAction
  .inputSchema(uploadImageSchema)
  .metadata({ actionName: 'uploadUserImage', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { fileBase64, fileName, mimeType, imageType, oldImageUrl } = parsedInput;

    const buffer = Buffer.from(fileBase64, 'base64');
    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image format');
    }

    try {
      // Lazy-load storage functions to prevent Turbopack from bundling iceberg-js client-side
      const { uploadImageToStorage, deleteImageFromStorage } =
        await import('../storage/image-storage.ts');

      const supabaseAdmin = await createSupabaseAdminClient();
      const bucket = imageType === 'avatar' ? 'user-avatars' : 'user-heroes';

      const uploadResult = await uploadImageToStorage({
        bucket,
        data: buffer,
        mimeType,
        userId: ctx.userId,
        fileName,
        supabase: supabaseAdmin,
      });

      if (!(uploadResult.success && uploadResult.publicUrl)) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      // Delete old image if provided
      if (oldImageUrl) {
        const existingPath = extractPathFromUrl(oldImageUrl, bucket);
        if (existingPath) {
          await deleteImageFromStorage(bucket, existingPath, supabaseAdmin);
        }
      }

      // Update database with new image URL
      const updateData =
        imageType === 'avatar'
          ? { image: uploadResult.publicUrl }
          : { hero: uploadResult.publicUrl };

      await prisma.public_users.update({
        where: { id: ctx.userId },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      // Invalidate caches
      const { revalidatePath, revalidateTag } = await import('next/cache');
      revalidatePath('/account');
      revalidatePath('/account/settings');
      revalidateTag('users', 'default');
      revalidateTag(`user-${ctx.userId}`, 'default');

      // Get user slug for profile page invalidation
      const user = await prisma.public_users.findUnique({
        where: { id: ctx.userId },
        select: { slug: true },
      });
      if (user?.slug) {
        revalidatePath(`/u/${user.slug}`);
      }

      return {
        success: true,
        publicUrl: uploadResult.publicUrl,
        path: uploadResult.path,
      };
    } catch (error) {
      const { logActionFailure } = await import('../errors.ts');
      throw logActionFailure('user.uploadUserImage', error, {
        userId: ctx.userId,
        imageType,
        fileName,
        mimeType,
      });
    }
  });

/**
 * Delete user avatar or hero image
 */
export const deleteUserImage = authedAction
  .inputSchema(
    z.object({
      imageType: z.enum(['avatar', 'hero']),
      imageUrl: z.string(),
    })
  )
  .metadata({ actionName: 'deleteUserImage', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { imageType, imageUrl } = parsedInput;

    try {
      const { deleteImageFromStorage } = await import('../storage/image-storage.ts');
      const supabaseAdmin = await createSupabaseAdminClient();
      const bucket = imageType === 'avatar' ? 'user-avatars' : 'user-heroes';

      const existingPath = extractPathFromUrl(imageUrl, bucket);
      if (existingPath) {
        await deleteImageFromStorage(bucket, existingPath, supabaseAdmin);
      }

      // Update database to remove image URL
      const updateData = imageType === 'avatar' ? { image: null } : { hero: null };

      await prisma.public_users.update({
        where: { id: ctx.userId },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      // Invalidate caches
      const { revalidatePath, revalidateTag } = await import('next/cache');
      revalidatePath('/account');
      revalidatePath('/account/settings');
      revalidateTag('users', 'default');
      revalidateTag(`user-${ctx.userId}`, 'default');

      // Get user slug for profile page invalidation
      const user = await prisma.public_users.findUnique({
        where: { id: ctx.userId },
        select: { slug: true },
      });
      if (user?.slug) {
        revalidatePath(`/u/${user.slug}`);
      }

      return { success: true };
    } catch (error) {
      const { logActionFailure } = await import('../errors.ts');
      throw logActionFailure('user.deleteUserImage', error, {
        userId: ctx.userId,
        imageType,
      });
    }
  });
