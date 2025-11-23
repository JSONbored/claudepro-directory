/**
 * Content transformation routes
 * Handles syntax highlighting and other content processing
 */

import {
  badRequestResponse,
  buildCacheHeaders,
  jsonResponse,
  publicCorsHeaders,
} from '@heyclaude/edge-runtime/utils/http.ts';
import { parseJsonBody } from '@heyclaude/edge-runtime/utils/parse-json-body.ts';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import {
  buildSecurityHeaders,
  generateHighlightCacheKey,
  highlightCode,
  logError,
  MAX_BODY_SIZE,
} from '@heyclaude/shared-runtime';

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
      headers: {
        ...buildSecurityHeaders(),
        ...CORS,
      },
    });
  }

  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  try {
    const parseResult = await parseJsonBody<HighlightRequest>(req, {
      maxSize: MAX_BODY_SIZE.default * 10, // Allow larger payloads for code (1MB)
      cors: CORS,
    });

    if (!parseResult.success) {
      return parseResult.response;
    }

    const { code, language = 'javascript', showLineNumbers = true } = parseResult.data;

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
          ...buildSecurityHeaders(),
          ...CORS,
          ...buildCacheHeaders('transform'),
        }
      );
    }

    // Generate cache key
    const cacheKey = generateHighlightCacheKey(code, language, showLineNumbers);

    // Highlight code using shared utility
    const html = highlightCode(code, language, { showLineNumbers });

    return jsonResponse(
      {
        html,
        cached: false,
        cacheKey,
      } satisfies HighlightResponse,
      200,
      {
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('transform'),
      }
    );
  } catch (error) {
    logError('Request parsing failed', logContext, error);
    return badRequestResponse(
      'Invalid request body. Expected JSON with code, language, and showLineNumbers.',
      CORS
    );
  }
}
