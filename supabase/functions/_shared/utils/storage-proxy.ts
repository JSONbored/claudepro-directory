/**
 * Storage Proxy Utility - Custom Cache Control for Supabase Storage
 *
 * Fetches files from Supabase Storage and re-serves them with custom
 * Cache-Control headers for optimal CDN caching and reduced egress costs.
 */

import { SITE_URL, supabaseAnon } from './supabase.ts';

export interface StorageProxyOptions {
  /**
   * Bucket name in Supabase Storage
   */
  bucket: string;

  /**
   * File path within bucket
   */
  path: string;

  /**
   * Custom Cache-Control header (default: 1 year for static assets)
   */
  cacheControl?: string;

  /**
   * Content-Type override (auto-detected if not provided)
   */
  contentType?: string;
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'; // 1 year

/**
 * Fetch file from Supabase Storage and proxy with custom headers
 *
 * @param options - Storage proxy configuration
 * @returns Response with file content and custom headers
 */
export async function proxyStorageFile(options: StorageProxyOptions): Promise<Response> {
  const { bucket, path, cacheControl = DEFAULT_CACHE_CONTROL, contentType } = options;

  try {
    // Download file from Supabase Storage
    const { data, error } = await supabaseAnon.storage.from(bucket).download(path);

    if (error) {
      console.error('Storage download error:', error);
      return new Response(
        JSON.stringify({
          error: 'File not found',
          message: error.message,
          bucket,
          path,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'File not found',
          bucket,
          path,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Detect content type from file extension if not provided
    const detectedContentType = contentType || detectContentType(path);

    // Extract filename from path
    const filename = path.split('/').pop() || 'download';

    console.log('Storage proxy:', {
      bucket,
      path,
      size: data.size,
      type: detectedContentType,
      cacheControl,
    });

    // Return file with custom cache headers
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': detectedContentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': cacheControl,
        'CDN-Cache-Control': cacheControl,
        'X-Content-Source': 'Supabase Storage (Proxied)',
        'X-Storage-Bucket': bucket,
        'X-Storage-Path': path,
        'X-Robots-Tag': 'noindex', // Don't index download files
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Storage proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Proxy failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Detect content type from file extension
 */
function detectContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

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
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Build public storage URL (for reference, not used in proxy)
 */
export function getPublicStorageUrl(bucket: string, path: string): string {
  return `${SITE_URL.replace('https://claudepro.directory', 'https://hgtjdifxfapoltfflowc.supabase.co')}/storage/v1/object/public/${bucket}/${path}`;
}
