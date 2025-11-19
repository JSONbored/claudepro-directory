/**
 * Edge Function Client - Generic client for all Supabase Edge Functions
 * Consolidated pattern for analytics, reputation, and future Edge calls (SHA-4198)
 */

import {
  generateConfigRecommendationsAction,
  getSimilarConfigsAction,
  type TrackInteractionParams,
  trackInteractionAction,
  trackNewsletterEventAction,
  trackUsageAction,
} from '@/src/lib/actions/pulse.actions';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Database, Json } from '@/src/types/database.types';

// All ENUM types accessed directly via Database['public']['Enums']['enum_name']

const EDGE_BASE_URL = `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/functions/v1`;
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://claudepro.directory';

interface EdgeCallOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  requireAuth?: boolean;
}

/**
 * Generic Edge Function caller - Use this for all Edge Function calls
 * Handles authentication, error handling, and response parsing
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  options: EdgeCallOptions = {}
): Promise<T> {
  const { method = 'POST', body, requireAuth = false } = options;

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Use session token if available, otherwise anon key (if auth not required)
  const token =
    session?.access_token || (requireAuth ? null : process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

  if (!token && requireAuth) {
    logger.error(
      'No auth token available for Edge function',
      new Error('Authentication required'),
      { functionName }
    );
    throw new Error('Authentication required');
  }

  const response = await fetch(`${EDGE_BASE_URL}/${functionName}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Edge function error', errorText, {
      functionName,
      status: response.status,
      method,
    });

    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || `Edge function ${functionName} failed`);
    } catch {
      throw new Error(`Edge function ${functionName} failed: ${response.status}`);
    }
  }

  return response.json();
}

export async function trackInteraction(params: TrackInteractionParams): Promise<void> {
  const result = await trackInteractionAction({
    interaction_type: params.interaction_type,
    content_type: params.content_type ?? null,
    content_slug: params.content_slug ?? null,
    session_id: params.session_id ?? null,
    metadata: params.metadata ?? null,
  });
  if (result?.serverError) {
    logger.warn('trackInteraction failed', { error: result.serverError });
  }
}

export async function getSimilarConfigs(params: {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
  limit?: number;
}) {
  const result = await getSimilarConfigsAction(params);
  const data = result?.data;

  if (!data) {
    return {
      similar_items: [],
      source_item: { slug: params.content_slug, category: params.content_type },
      algorithm_version: 'unknown',
    };
  }

  return {
    ...data,
    similar_items: (data.similar_items || []).map((item) => ({
      ...item,
      url: `${SITE_URL}/${item.category}/${item.slug}`,
    })),
  };
}

// Config recommendations response (analytics Edge function wrapper)
interface RecommendationsSummary {
  topCategory?: string | null;
  avgMatchScore?: number | null;
  diversityScore?: number | null;
}

interface RecommendationItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags?: string[] | null;
  author?: string | null;
  match_score?: number | null;
  match_percentage?: number | null;
  primary_reason?: string | null;
  rank?: number | null;
  reasons?: Json;
}

interface RecommendationsPayload {
  results: RecommendationItem[];
  totalMatches: number;
  algorithm: string;
  summary: RecommendationsSummary | null;
}

export interface ConfigRecommendationsResponse {
  success: boolean;
  recommendations: RecommendationsPayload & {
    id: string;
    generatedAt: string;
    answers: {
      useCase: Database['public']['Enums']['use_case_type'];
      experienceLevel: Database['public']['Enums']['experience_level'];
      toolPreferences: string[];
      integrations: Database['public']['Enums']['integration_type'][];
      focusAreas: Database['public']['Enums']['focus_area_type'][];
    };
  };
}

export async function generateConfigRecommendations(answers: {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  integrations?: Database['public']['Enums']['integration_type'][];
  focusAreas?: Database['public']['Enums']['focus_area_type'][];
}): Promise<ConfigRecommendationsResponse> {
  const result = await generateConfigRecommendationsAction(answers);
  const payload = result?.data;

  if (!payload) {
    // Return error response if action failed
    return {
      success: false,
      recommendations: {
        results: [],
        totalMatches: 0,
        algorithm: 'unknown',
        summary: {},
        answers: {
          useCase: answers.useCase,
          experienceLevel: answers.experienceLevel,
          toolPreferences: answers.toolPreferences,
          integrations: answers.integrations ?? [],
          focusAreas: answers.focusAreas ?? [],
        },
        id: `error_${Date.now()}`,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: payload.success,
    recommendations: {
      ...payload.recommendations,
      results:
        payload.recommendations.results?.map((item) => ({
          ...item,
          description: item.description ?? '',
          url: `${SITE_URL}/${item.category}/${item.slug}`,
        })) ?? [],
    },
  };
}

// Newsletter analytics
export type NewsletterEventType =
  | 'modal_shown'
  | 'modal_dismissed'
  | 'signup_success'
  | 'signup_error'
  | 'scroll_trigger_shown'
  | 'exit_intent_shown'
  | 'footer_cta_shown';

export async function trackNewsletterEvent(
  eventType: NewsletterEventType,
  metadata?: {
    source?: string;
    error?: string;
    ctaVariant?: string;
    copyTrigger?: string;
    [key: string]: unknown;
  }
) {
  const result = await trackNewsletterEventAction({ eventType, metadata });
  if (result?.serverError) {
    logger.warn('trackNewsletterEvent failed', { error: result.serverError, eventType });
  }
}

/**
 * Track content usage (copy, download) - Queue-Based
 * Enqueues to pulse queue for batched processing
 */
export async function trackUsage(params: {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
  action_type: 'copy' | 'download_zip' | 'download_markdown' | 'llmstxt' | 'download_mcpb';
}): Promise<void> {
  const result = await trackUsageAction(params);
  if (result?.serverError) {
    logger.warn('trackUsage failed', { error: result.serverError });
  }
}

// ============================================
// TRANSFORM API - Data Transformations
// ============================================

const EDGE_TRANSFORM_URL = `${EDGE_BASE_URL}/transform-api`;

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
  category: string;
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

/**
 * Highlight code syntax - Edge function with aggressive caching
 *
 * This function calls the edge function to highlight code, which:
 * - Processes highlighting at the edge (faster, cached)
 * - Returns pre-rendered HTML ready for display
 * - Uses immutable caching (same code = same output, cached forever)
 *
 * @param code - Code string to highlight
 * @param options - Highlighting options (language, showLineNumbers)
 * @returns Highlighted HTML string
 *
 * @example
 * ```typescript
 * const html = await highlightCodeEdge('const x = 1;', { language: 'javascript' });
 * ```
 */
export async function highlightCodeEdge(
  code: string,
  options: HighlightCodeOptions = {}
): Promise<string> {
  const { language = 'javascript', showLineNumbers = true } = options;

  // Handle empty code (same as original implementation)
  if (!code || code.trim() === '') {
    return '<pre class="sugar-high-empty"><code>No code provided</code></pre>';
  }

  try {
    const response = await fetch(`${EDGE_TRANSFORM_URL}/content/highlight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, showLineNumbers }),
      next: {
        revalidate: 31536000, // 1 year (immutable cache - same code = same output)
        tags: ['transform:highlight'],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Highlight failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as HighlightCodeResponse;

    // If edge function returned an error but still provided HTML (fallback), log it
    if (data.error) {
      logger.warn('Edge highlighting used fallback', {
        error: data.error,
        language,
        codePreview: code.slice(0, 80),
      });
    }

    return data.html;
  } catch (error) {
    // Fallback: escape code (same as current implementation)
    const normalized = error instanceof Error ? error : new Error(String(error));
    logger.warn('Edge highlighting failed, using fallback', {
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

/**
 * Process content - Batched language detection, filename generation, and highlighting
 *
 * This function calls the edge function to process content, which:
 * - Supports 3 operation modes: 'full' (batched), 'filename' (filename only), 'highlight' (highlight only)
 * - Processes at the edge (faster, cached)
 * - Uses immutable caching (same input = same output, cached forever)
 *
 * @param options - Processing options (operation mode, code, item, etc.)
 * @returns Processed content with html, language, and/or filename based on operation mode
 *
 * @example
 * ```typescript
 * // Full batched processing
 * const result = await processContentEdge({
 *   operation: 'full',
 *   code: 'const x = 1;',
 *   languageHint: 'typescript',
 *   item: { category: 'agents', slug: 'my-agent' }
 * });
 * // Returns: { html, language, filename }
 *
 * // Filename only
 * const filename = await processContentEdge({
 *   operation: 'filename',
 *   language: 'json',
 *   item: { category: 'mcp', slug: 'my-mcp' },
 *   format: 'multi',
 *   sectionKey: 'claudeDesktop'
 * });
 * // Returns: { filename }
 * ```
 */
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

  // Validate required fields based on operation
  if (operation === 'full' || operation === 'highlight') {
    if (!code || code.trim() === '') {
      return {
        html: '<pre class="sugar-high-empty"><code>No code provided</code></pre>',
      };
    }
  }

  if (operation === 'full' || operation === 'filename') {
    if (!item?.category) {
      throw new Error('Item with category is required for full and filename operations');
    }
  }

  try {
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
      next: {
        revalidate: 31536000, // 1 year (immutable cache - same input = same output)
        tags: ['transform:process'],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Content processing failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as ProcessContentResponse;

    // If edge function returned an error, log it
    if (data.error) {
      logger.warn('Edge content processing returned error', {
        error: data.error,
        operation,
        ...(language && { language }),
        ...(code && { codePreview: code.slice(0, 80) }),
      });
    }

    return data;
  } catch (error) {
    // Fallback handling based on operation
    const normalized = error instanceof Error ? error : new Error(String(error));
    logger.warn('Edge content processing failed', {
      error: normalized.message,
      operation,
      ...(language && { language }),
      ...(code && { codePreview: code.slice(0, 80) }),
    });

    // For highlight operations, provide fallback HTML
    if (operation === 'full' || operation === 'highlight') {
      const escapedCode = (code || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      return {
        html: `<pre class="code-block-pre code-block-fallback"><code>${escapedCode}</code></pre>`,
        language: language || 'text',
        ...(item && {
          filename: `${item.slug || 'untitled'}.${language || 'txt'}`,
        }),
      };
    }

    // For filename-only operations, throw error (no fallback)
    throw normalized;
  }
}
