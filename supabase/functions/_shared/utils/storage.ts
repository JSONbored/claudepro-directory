/**
 * Shared Storage Utilities - Secure image upload with validation
 * Max 200KB, 512x512px, WebP/PNG/JPG only
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 200 * 1024, // 200KB
  MAX_DIMENSION: 512, // 512x512px
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

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

/**
 * Validate image buffer - size and MIME type only (no dimension check in Deno)
 * Dimension validation enforced by Storage bucket limits
 */
export function validateImageBuffer(buffer: ArrayBuffer, mimeType: string): ImageValidationResult {
  // Validate MIME type
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(mimeType as never)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.',
    };
  }

  // Validate file size
  if (buffer.byteLength > IMAGE_CONFIG.MAX_FILE_SIZE) {
    const sizeKB = (IMAGE_CONFIG.MAX_FILE_SIZE / 1024).toFixed(0);
    return {
      valid: false,
      error: `File too large. Maximum size is ${sizeKB}KB.`,
    };
  }

  return { valid: true };
}

/**
 * Upload image to Supabase Storage with security checks
 *
 * @param bucket - Storage bucket name (e.g., 'company-logos')
 * @param buffer - Image file buffer
 * @param mimeType - Image MIME type
 * @param userId - User ID for path isolation (security via RLS)
 * @param fileName - Optional custom filename (sanitized automatically)
 * @returns Upload result with public URL or error
 */
export async function uploadImage(
  bucket: string,
  buffer: ArrayBuffer,
  mimeType: string,
  userId: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Validate image
    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create Supabase client with service role (bypass RLS for server-side operations)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate secure filename: {userId}/{timestamp}-{sanitized-name}.ext
    const timestamp = Date.now();
    const ext = mimeType.split('/')[1]; // jpeg, png, webp
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : `upload.${ext}`;
    const path = `${userId}/${timestamp}-${safeName}`;

    // Upload to Storage with 1-year cache
    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year
      upsert: false, // Prevent overwrites
    });

    if (error) {
      console.error('[Storage] Upload failed:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete image from Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path in storage (e.g., 'user-id/timestamp-file.jpg')
 * @returns Success boolean
 */
export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('[Storage] Delete failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    return false;
  }
}

/**
 * Extract storage path from public URL
 *
 * @param publicUrl - Full public URL from Supabase Storage
 * @param bucket - Bucket name to extract from
 * @returns File path or null if invalid URL
 */
export function extractPathFromUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
