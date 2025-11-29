import 'server-only';

import { NextResponse } from 'next/server';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import { logger } from '../logger.ts';
import type { LogContext } from '../logger.ts';
import { createUtilityContext, normalizeError } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';

export interface StorageProxyOptions {
  bucket: string;
  path: string;
  cacheControl?: string;
  contentType?: string;
  disposition?: 'inline' | 'attachment';
  fileName?: string;
  corsOrigin?: string;
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const MIME_MAP: Record<string, string> = {
  zip: 'application/zip',
  mcpb: 'application/zip',
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

function detectContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[extension] ?? 'application/octet-stream';
}

function createStorageProxyLogContext(bucket: string, path: string): LogContext {
  return createUtilityContext('storage-proxy', 'download', {
    bucket,
    path,
  }) as LogContext;
}

function sanitizeContentDispositionFilename(name: string): { ascii: string; encoded: string } {
  const stripped = name.replace(/[\r\n]/g, ' ').trim();
  const cleaned = stripped.replace(/["\\]/g, '_') || 'download';
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(cleaned);
  return { ascii, encoded };
}

export async function proxyStorageFile(options: StorageProxyOptions): Promise<NextResponse> {
  const {
    bucket,
    path,
    cacheControl = DEFAULT_CACHE_CONTROL,
    contentType,
    disposition = 'attachment',
    fileName,
    corsOrigin = '*',
  } = options;

  const supabase = createSupabaseAnonClient();
  const logContext = createStorageProxyLogContext(bucket, path);

  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error || !data) {
      logger.error('Storage file not found', error || new Error('No data returned'), logContext);

      return NextResponse.json(
        {
          error: 'file_not_found',
          message: error?.message || 'File not found',
          bucket,
          path,
        },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            ...buildSecurityHeaders(),
          },
        }
      );
    }

    const detectedContentType = contentType ?? detectContentType(path);
    const resolvedFileName = fileName ?? path.split('/').pop() ?? 'download';
    const safeFileName = sanitizeContentDispositionFilename(resolvedFileName);

    logger.info('Proxy download', {
      ...logContext,
      size: data.size,
      contentType: detectedContentType,
      cacheControl,
    });

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': detectedContentType,
        'Content-Disposition': `${disposition}; filename="${safeFileName.ascii}"; filename*=UTF-8''${safeFileName.encoded}`,
        'Cache-Control': cacheControl,
        'CDN-Cache-Control': cacheControl,
        'X-Content-Source': 'supabase-storage:proxy',
        'X-Storage-Bucket': bucket,
        'X-Storage-Path': path,
        'X-Robots-Tag': 'noindex',
        'Access-Control-Allow-Origin': corsOrigin,
        ...buildSecurityHeaders(),
      },
    });
  } catch (error) {
    logger.error('Proxy error', normalizeError(error, 'Storage proxy error'), logContext);

    return NextResponse.json(
      {
        error: 'proxy_failed',
        message: normalizeError(error, 'Storage proxy failed').message,
        bucket,
        path,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
          ...buildSecurityHeaders(),
        },
      }
    );
  }
}
