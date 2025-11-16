/**
 * Content transformation routes
 * Handles syntax highlighting and other content processing
 */

import { highlight } from 'npm:sugar-high@0.9.5';
import { badRequestResponse, jsonResponse, publicCorsHeaders } from '../../_shared/utils/http.ts';
import type { BaseLogContext } from '../../_shared/utils/logging.ts';

// CORS headers for POST requests
const CORS = publicCorsHeaders;

interface HighlightRequest {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

interface HighlightResponse {
  html: string;
  cached: boolean;
  cacheKey?: string;
}

/**
 * Generate cache key for highlighted code
 * Deterministic hash based on code content, language, and line number setting
 */
function generateCacheKey(code: string, language: string, showLineNumbers: boolean): string {
  const input = `${code}:${language}:${showLineNumbers}`;
  // Simple hash function (good enough for cache keys)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32-bit integer
  }
  return `highlight:${Math.abs(hash).toString(36)}`;
}

/**
 * Handle syntax highlighting request
 * POST /transform-api/content/highlight
 */
export async function handleContentHighlight(
  req: Request,
  logContext: BaseLogContext
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS,
    });
  }

  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  try {
    const body = await req.json();
    const { code, language = 'javascript', showLineNumbers = true }: HighlightRequest = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return badRequestResponse('Invalid code parameter. Must be a non-empty string.', CORS);
    }

    if (code.trim() === '') {
      return jsonResponse(
        {
          html: '<pre class="sugar-high-empty"><code>No code provided</code></pre>',
          cached: false,
        } satisfies HighlightResponse,
        200,
        {
          ...CORS,
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      );
    }

    // Generate cache key
    const cacheKey = generateCacheKey(code, language, showLineNumbers);

    try {
      // Highlight code using sugar-high
      const highlighted = highlight(code);
      const lines = highlighted.split('\n');
      const hasMultipleLines = lines.length > 1;
      const totalLines = lines.length;
      const visibleLines = Math.min(totalLines, 20);

      let html: string;

      if (showLineNumbers && hasMultipleLines) {
        const numberedLines = lines
          .map((line, index) => {
            const lineNum = index + 1;
            return `<span class="sh__line" data-line="${lineNum}">${line || ' '}</span>`;
          })
          .join('\n');

        html = `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${numberedLines}</code></pre>${totalLines > visibleLines ? `<button class="code-expand-btn">Expand ${totalLines - visibleLines} more lines</button>` : ''}</div>`;
      } else {
        html = `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${highlighted}</code></pre></div>`;
      }

      return jsonResponse(
        {
          html,
          cached: false,
          cacheKey,
        } satisfies HighlightResponse,
        200,
        {
          ...CORS,
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      );
    } catch (error) {
      // Fallback: escape code (same as current implementation)
      console.warn('[transform-api] Highlighting failed, using fallback', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        language,
        codePreview: code.slice(0, 80),
      });

      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const html = `<pre class="code-block-pre code-block-fallback"><code>${escapedCode}</code></pre>`;

      return jsonResponse(
        {
          html,
          cached: false,
          error: 'highlighting_failed',
        },
        200,
        CORS
      );
    }
  } catch (error) {
    console.error('[transform-api] Request parsing failed', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return badRequestResponse(
      'Invalid request body. Expected JSON with code, language, and showLineNumbers.',
      CORS
    );
  }
}
