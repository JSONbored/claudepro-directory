import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

import type { Database as DatabaseGenerated } from '../../database.types.ts';
import { createUtilityContext } from '../logging.ts';
import {
  type BuildStorageObjectPathOptions,
  buildStorageObjectPath,
  getPublicStorageUrl,
  getStorageServiceClient,
} from './client.ts';

export interface FileValidationPolicy {
  maxFileSize: number;
  allowedMimeTypes: readonly string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface StorageUploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

export interface UploadObjectOptions {
  bucket: string;
  buffer: ArrayBuffer;
  mimeType: string;
  objectPath?: string;
  pathOptions?: BuildStorageObjectPathOptions;
  cacheControl?: string;
  upsert?: boolean;
  client?: SupabaseClient<DatabaseGenerated>;
  validationPolicy?: FileValidationPolicy;
}

export const IMAGE_UPLOAD_POLICY: FileValidationPolicy = {
  maxFileSize: 200 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export type AllowedImageMimeType = (typeof IMAGE_UPLOAD_POLICY.allowedMimeTypes)[number];

export function validateBufferAgainstPolicy(
  buffer: ArrayBuffer,
  mimeType: string,
  policy: FileValidationPolicy
): FileValidationResult {
  if (!policy.allowedMimeTypes.includes(mimeType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${policy.allowedMimeTypes.join(', ')}`,
    };
  }

  if (buffer.byteLength > policy.maxFileSize) {
    const sizeKB = (policy.maxFileSize / 1024).toFixed(0);
    return {
      valid: false,
      error: `File too large. Maximum size is ${sizeKB}KB.`,
    };
  }

  return { valid: true };
}

export function validateImageBuffer(buffer: ArrayBuffer, mimeType: string): FileValidationResult {
  return validateBufferAgainstPolicy(buffer, mimeType, IMAGE_UPLOAD_POLICY);
}

export async function uploadObject({
  bucket,
  buffer,
  mimeType,
  objectPath,
  pathOptions,
  cacheControl = '31536000',
  upsert = false,
  client = getStorageServiceClient(),
  validationPolicy,
}: UploadObjectOptions): Promise<StorageUploadResult> {
  const mimeExtension = mimeType.split('/')[1];
  if (!mimeExtension) {
    throw new Error(`Invalid MIME type: ${mimeType}`);
  }
  const targetPath =
    objectPath ??
    buildStorageObjectPath({
      extension: mimeExtension,
      ...(pathOptions
        ? {
            ...(pathOptions.prefix !== undefined ? { prefix: pathOptions.prefix } : {}),
            ...(pathOptions.userId !== undefined ? { userId: pathOptions.userId } : {}),
            ...(pathOptions.fileName !== undefined ? { fileName: pathOptions.fileName } : {}),
            ...(pathOptions.includeTimestamp !== undefined
              ? { includeTimestamp: pathOptions.includeTimestamp }
              : {}),
            ...(pathOptions.sanitize !== undefined ? { sanitize: pathOptions.sanitize } : {}),
          }
        : {}),
    });

  try {
    if (validationPolicy) {
      const validation = validateBufferAgainstPolicy(buffer, mimeType, validationPolicy);
      if (!validation.valid) {
        return {
          success: false,
          error: validation['error'] ?? 'Validation failed',
        };
      }
    }

    const { data, error } = await client.storage.from(bucket).upload(targetPath, buffer, {
      contentType: mimeType,
      cacheControl,
      upsert,
    });

    if (error) {
      const logContext = createUtilityContext('storage-upload', 'upload', {
        bucket,
        targetPath,
      });
      console.error('[Storage] Upload failed', {
        ...logContext,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    const publicUrl = getPublicStorageUrl(bucket, data.path);

    return {
      success: true,
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    const logContext = createUtilityContext('storage-upload', 'upload', {
      bucket,
      targetPath,
    });
    console.error('[Storage] Upload error', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown storage upload error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown storage upload error',
    };
  }
}

export async function uploadImage(
  bucket: string,
  buffer: ArrayBuffer,
  mimeType: string,
  userId: string,
  fileName?: string
): Promise<StorageUploadResult> {
  return uploadObject({
    bucket,
    buffer,
    mimeType,
    cacheControl: '31536000',
    upsert: false,
    validationPolicy: IMAGE_UPLOAD_POLICY,
    pathOptions: {
      prefix: userId,
      fileName: fileName ?? 'upload',
      extension: mimeType.split('/')[1] ?? 'bin',
    },
  });
}
