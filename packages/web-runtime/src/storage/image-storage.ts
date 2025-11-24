'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseAdminClient } from '../supabase/admin.ts';
import { type AllowedImageMimeType, type ImageUploadResult } from './image-utils.ts';


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
  const safeName = (fileName || `${globalThis.crypto.randomUUID()}.${mimeType.split('/')[1]}`)
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
