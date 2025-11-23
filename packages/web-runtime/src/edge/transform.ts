'use server';

import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { getEnvVar } from '@heyclaude/shared-runtime';

const EDGE_TRANSFORM_URL = `${getEnvVar('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/transform-api`;

export interface HighlightCodeOptions {
  language?: string;
  showLineNumbers?: boolean;
}

export interface HighlightCodeResponse {
  html: string;
  cached: boolean;
  cacheKey?: string;
  error?: string;
}

export interface ProcessContentItem {
  category: Database['public']['Enums']['content_category'] | null;
  slug?: string | null;
  name?: string | null;
  hook_type?: string | null;
}

export interface ProcessContentOptions {
  operation: 'full' | 'filename' | 'highlight';
  code?: string;
  language?: string;
  languageHint?: string;
  showLineNumbers?: boolean;
  item?: ProcessContentItem;
  format?: 'json' | 'multi' | 'hook';
  section?: string;
  sectionKey?: string;
  contentType?: 'hookConfig' | 'scriptContent';
}

export interface ProcessContentResponse {
  html?: string;
  language?: string;
  filename?: string;
  error?: string;
}

export async function highlightCodeEdge(
  code: string,
  options: HighlightCodeOptions = {}
): Promise<string> {
  const { language = 'javascript', showLineNumbers = true } = options;

  if (!code || code.trim() === '') {
    return '<pre class="sugar-high-empty"><code>No code provided</code></pre>';
  }

  try {
    const response = await fetch(`${EDGE_TRANSFORM_URL}/content/highlight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, showLineNumbers }),
      cache: 'force-cache',
      next: {
        revalidate: 31536000,
        tags: ['transform:highlight'],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Highlight failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as HighlightCodeResponse;

    if (data.error) {
      logger.warn('Edge highlighting used fallback', undefined, {
        error: data.error,
        language,
        codePreview: code.slice(0, 80),
      });
    }

    return data.html;
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    logger.warn('Edge highlighting failed, using fallback', undefined, {
      error: normalized.message,
      language,
      codePreview: code.slice(0, 80),
    });

    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<pre class="code-block-pre code-block-fallback"><code>${escapedCode}</code></pre>`;
  }
}

export async function processContentEdge(
  options: ProcessContentOptions
): Promise<ProcessContentResponse> {
  const {
    operation,
    code,
    language,
    languageHint,
    showLineNumbers = true,
    item,
    format,
    section,
    sectionKey,
    contentType,
  } = options;

  const response = await fetch(`${EDGE_TRANSFORM_URL}/content/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation,
      code,
      language,
      languageHint,
      showLineNumbers,
      item,
      format,
      section,
      sectionKey,
      contentType,
    }),
    cache: 'force-cache',
    next: {
      revalidate: 31536000,
      tags: ['transform:content'],
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Process content failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ProcessContentResponse;
  if (data.error) {
    const normalized = normalizeError(new Error(data.error), 'Process content edge error');
    logger.warn('processContentEdge fallback', undefined, { error: normalized.message });
  }
  return data;
}
