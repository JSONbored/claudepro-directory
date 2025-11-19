import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { supabaseAnon, supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database } from '../../database-overrides.ts';
import { createUtilityContext } from '../logging.ts';

export type StorageServiceClient = SupabaseClient<Database>;

export interface BuildStorageObjectPathOptions {
  /**
   * Optional folder prefix (e.g., bucket namespace, entity type)
   */
  prefix?: string;

  /**
   * User identifier to isolate uploads
   */
  userId?: string;

  /**
   * Explicit filename without extension
   */
  fileName?: string;

  /**
   * File extension (e.g., "png" / ".png")
   */
  extension?: string;

  /**
   * Append a millisecond timestamp to prevent collisions (default: true)
   */
  includeTimestamp?: boolean;

  /**
   * Sanitize filename to safe characters (default: true)
   */
  sanitize?: boolean;
}

export interface DeleteStorageResult {
  success: boolean;
  error?: string;
}

export interface SignedStorageUrlResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

const DEFAULT_TIMESTAMP = true;
const DEFAULT_SANITIZE = true;
const DEFAULT_SIGNED_URL_TTL = 60 * 60; // 1 hour

export function getStorageServiceClient(): StorageServiceClient {
  return supabaseServiceRole;
}

export function getStorageAnonClient(): StorageServiceClient {
  return supabaseAnon;
}

export function sanitizeStorageFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function buildStorageObjectPath(options: BuildStorageObjectPathOptions = {}): string {
  const {
    prefix,
    userId,
    fileName = 'upload',
    extension,
    includeTimestamp = DEFAULT_TIMESTAMP,
    sanitize = DEFAULT_SANITIZE,
  } = options;

  if (!extension) {
    throw new Error('extension is required for buildStorageObjectPath');
  }

  const segments: string[] = [];

  if (prefix) {
    segments.push(prefix.replace(/^\/+|\/+$/g, ''));
  }

  if (userId) {
    segments.push(userId);
  }

  const normalizedName = sanitize ? sanitizeStorageFileName(fileName) : fileName;
  const normalizedExt = extension ? extension.replace(/^\./, '').toLowerCase() : undefined;

  const baseName = includeTimestamp ? `${Date.now()}-${normalizedName}` : normalizedName;
  const fullName = normalizedExt ? `${baseName}.${normalizedExt}` : baseName;

  segments.push(fullName);

  return segments.join('/');
}

export function getPublicStorageUrl(bucket: string, path: string): string {
  const { data } = getStorageServiceClient().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteStorageObject(
  bucket: string,
  path: string
): Promise<DeleteStorageResult> {
  return deleteStorageObjects(bucket, [path]);
}

export async function deleteStorageObjects(
  bucket: string,
  paths: string[]
): Promise<DeleteStorageResult> {
  try {
    if (!paths.length) {
      return { success: true };
    }

    const { error } = await getStorageServiceClient().storage.from(bucket).remove(paths);

    if (error) {
      const logContext = createUtilityContext('storage-client', 'delete', {
        bucket,
        pathCount: paths.length,
      });
      console.error('[Storage] Delete failed', {
        ...logContext,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const logContext = createUtilityContext('storage-client', 'delete', {
      bucket,
      pathCount: paths.length,
    });
    console.error('[Storage] Delete error', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown storage delete error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown storage delete error',
    };
  }
}

export async function createSignedStorageUrl(
  bucket: string,
  path: string,
  options?: { expiresIn?: number; downloadFileName?: string }
): Promise<SignedStorageUrlResult> {
  const expiresIn = options?.expiresIn ?? DEFAULT_SIGNED_URL_TTL;

  try {
    const { data, error } = await getStorageServiceClient()
      .storage.from(bucket)
      .createSignedUrl(path, expiresIn, {
        ...(options?.downloadFileName !== undefined ? { download: options.downloadFileName } : {}),
      });

    if (error) {
      const logContext = createUtilityContext('storage-client', 'create-signed-url', {
        bucket,
        path,
      });
      console.error('[Storage] Signed URL error', {
        ...logContext,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    return { success: true, signedUrl: data?.signedUrl };
  } catch (error) {
    const logContext = createUtilityContext('storage-client', 'create-signed-url', {
      bucket,
      path,
    });
    console.error('[Storage] Signed URL exception', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown signed URL error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signed URL error',
    };
  }
}
