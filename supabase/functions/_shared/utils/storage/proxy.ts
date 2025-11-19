import { createUtilityContext } from '../logging.ts';
import { getStorageAnonClient } from './client.ts';

export interface StorageProxyOptions {
  bucket: string;
  path: string;
  cacheControl?: string;
  contentType?: string;
  disposition?: 'inline' | 'attachment';
  fileName?: string;
  corsOrigin?: string;
}

export interface StorageProxyErrorBody {
  error: string;
  message?: string;
  bucket: string;
  path: string;
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function proxyStorageFile(options: StorageProxyOptions): Promise<Response> {
  const {
    bucket,
    path,
    cacheControl = DEFAULT_CACHE_CONTROL,
    contentType,
    disposition = 'attachment',
    fileName,
    corsOrigin = '*',
  } = options;

  try {
    const { data, error } = await getStorageAnonClient().storage.from(bucket).download(path);

    if (error || !data) {
      return buildErrorResponse(
        {
          error: 'file_not_found',
          message: error?.message,
          bucket,
          path,
        },
        404
      );
    }

    const detectedContentType = contentType ?? detectContentType(path);
    const resolvedFileName = fileName ?? path.split('/').pop() ?? 'download';

    const logContext = createUtilityContext('storage-proxy', 'download', {
      bucket,
      path,
    });
    console.log('[Storage] Proxy download', {
      ...logContext,
      size: data.size,
      contentType: detectedContentType,
      cacheControl,
    });

    return new Response(data, {
      status: 200,
      headers: buildProxyHeaders({
        bucket,
        path,
        cacheControl,
        contentType: detectedContentType,
        disposition,
        fileName: resolvedFileName,
        corsOrigin,
      }),
    });
  } catch (error) {
    const logContext = createUtilityContext('storage-proxy', 'download', {
      bucket,
      path,
    });
    console.error('[Storage] Proxy error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return buildErrorResponse(
      {
        error: 'proxy_failed',
        message: error instanceof Error ? error.message : 'Unknown proxy error',
        bucket,
        path,
      },
      500
    );
  }
}

function buildErrorResponse(body: StorageProxyErrorBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

interface ProxyHeaderOptions {
  cacheControl: string;
  contentType: string;
  disposition: 'inline' | 'attachment';
  fileName: string;
  bucket: string;
  path: string;
  corsOrigin: string;
}

export function buildProxyHeaders(options: ProxyHeaderOptions): HeadersInit {
  const { cacheControl, contentType, disposition, fileName, bucket, path, corsOrigin } = options;

  return {
    'Content-Type': contentType,
    'Content-Disposition': `${disposition}; filename="${fileName}"`,
    'Cache-Control': cacheControl,
    'CDN-Cache-Control': cacheControl,
    'X-Content-Source': 'supabase-storage:proxy',
    'X-Storage-Bucket': bucket,
    'X-Storage-Path': path,
    'X-Robots-Tag': 'noindex',
    'Access-Control-Allow-Origin': corsOrigin,
  };
}

export function detectContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';

  const mimeTypes: Record<string, string> = {
    zip: 'application/zip',
    pdf: 'application/pdf',
    json: 'application/json',
    md: 'text/markdown',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
  };

  return mimeTypes[extension] ?? 'application/octet-stream';
}
