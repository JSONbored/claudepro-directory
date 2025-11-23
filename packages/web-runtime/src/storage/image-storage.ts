'use server';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseAdminClient } from '../supabase/admin.ts';

export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 200 * 1024, // 200KB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

export type AllowedImageMimeType = (typeof IMAGE_CONFIG.ALLOWED_TYPES)[number];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

export function validateImageBuffer(
  buffer: ArrayBuffer | Uint8Array | Buffer,
  mimeType: string
): ImageValidationResult {
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(mimeType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.',
    };
  }

  const sizeInBytes =
    buffer instanceof Buffer
      ? buffer.byteLength
      : buffer instanceof Uint8Array
        ? buffer.byteLength
        : buffer.byteLength;

  if (sizeInBytes > IMAGE_CONFIG.MAX_FILE_SIZE) {
    const sizeKB = (IMAGE_CONFIG.MAX_FILE_SIZE / 1024).toFixed(0);
    return {
      valid: false,
      error: `File too large. Maximum size is ${sizeKB}KB.`,
    };
  }

  return { valid: true };
}

export function extractPathFromUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
    const match = url.pathname.match(pattern);
    return match && typeof match[1] === 'string' ? match[1] : null;
  } catch {
    return null;
  }
}

interface UploadParams {
  bucket: string;
  data: Buffer;
  mimeType: AllowedImageMimeType;
  userId: string;
  fileName?: string;
  supabase?: SupabaseClient<Database>;
}

export async function uploadImageToStorage({
  bucket,
  data,
  mimeType,
  userId,
  fileName,
  supabase: providedClient,
}: UploadParams): Promise<ImageUploadResult> {
  const supabase = providedClient ?? (await createSupabaseAdminClient());

  const timestamp = Date.now();
  const safeName = (fileName || `${randomUUID()}.${mimeType.split('/')[1]}`)
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const path = `${userId}/${timestamp}-${safeName}`;

  const { error, data: uploaded } = await supabase.storage.from(bucket).upload(path, data, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error || !uploaded?.path) {
    return { success: false, error: error?.message || 'Failed to upload image' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(uploaded.path);

  return {
    success: true,
    publicUrl,
    path: uploaded.path,
  };
}

export async function deleteImageFromStorage(
  bucket: string,
  path: string,
  supabase?: SupabaseClient<Database>
): Promise<boolean> {
  const client = supabase ?? (await createSupabaseAdminClient());
  const { error } = await client.storage.from(bucket).remove([path]);
  return !error;
}
