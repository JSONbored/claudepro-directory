/**
 * Unified SEO Client - Fetches metadata + schemas from data-api/seo
 */

import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

const SEO_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/data-api/seo`;

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  openGraphType: 'website' | 'article';
  twitterCard: string;
  robots: { index: boolean; follow: boolean };
  authors?: Array<{ name: string }> | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  shouldAddLlmsTxt: boolean;
  isOverride: boolean;
}

/**
 * SEOSchema - Pre-serialized JSON-LD string from edge function (XSS-protected)
 * Edge function handles all serialization and XSS protection
 */
export type SEOSchema = string;

export interface SEOResponse {
  metadata: SEOMetadata;
  schemas?: SEOSchema[];
}

const DEFAULT_SEO_METADATA: SEOMetadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  keywords: [],
  openGraphType: 'website',
  twitterCard: 'summary',
  robots: { index: true, follow: true },
  authors: null,
  publishedTime: null,
  modifiedTime: null,
  shouldAddLlmsTxt: false,
  isOverride: false,
};

const DEFAULT_SEO_RESPONSE: SEOResponse = {
  metadata: DEFAULT_SEO_METADATA,
  schemas: [],
};

export async function fetchSEO(
  route: string,
  include: 'metadata' | 'metadata,schemas' = 'metadata'
): Promise<SEOResponse> {
  const url = `${SEO_API_URL}?route=${encodeURIComponent(route)}&include=${include}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 86400 }, // 24hr Next.js cache
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read response body');
      const normalized = normalizeError(
        new Error(`SEO API error: ${response.status} ${response.statusText}`),
        'SEO API request failed'
      );
      logger.error('Failed to fetch SEO from edge function', normalized, {
        route,
        include,
        status: response.status,
        responseBody: errorText.slice(0, 200), // First 200 chars for context
      });
      return DEFAULT_SEO_RESPONSE;
    }

    const data = await response.json();

    // Transform RPC response to client-side SEOResponse format
    // RPC returns either: { title, description, ... } OR { metadata: {...}, schemas: [...] }
    if ('metadata' in data && data.metadata) {
      // Case: metadata+schemas response
      return {
        metadata: {
          ...data.metadata,
          // Add default values for fields not in RPC return
          authors: null,
          publishedTime: null,
          modifiedTime: null,
          shouldAddLlmsTxt: false,
          isOverride: false,
        } as SEOMetadata,
        schemas: Array.isArray(data.schemas)
          ? data.schemas.map((s: unknown) => (typeof s === 'string' ? s : JSON.stringify(s)))
          : [],
      };
    }
    if ('title' in data) {
      // Case: metadata-only response (discriminated union case 1)
      return {
        metadata: {
          ...data,
          // Add default values for fields not in RPC return
          authors: null,
          publishedTime: null,
          modifiedTime: null,
          shouldAddLlmsTxt: false,
          isOverride: false,
        } as SEOMetadata,
        schemas: [],
      };
    }

    // Fallback to default if structure is unexpected
    return DEFAULT_SEO_RESPONSE;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch SEO from edge function');
    logger.error('Failed to fetch SEO from edge function', normalized, {
      route,
      include,
    });
    return DEFAULT_SEO_RESPONSE;
  }
}

export async function fetchMetadata(route: string): Promise<SEOMetadata> {
  const { metadata } = await fetchSEO(route, 'metadata');
  return metadata;
}

export async function fetchSchemas(route: string): Promise<SEOSchema[]> {
  const { schemas } = await fetchSEO(route, 'metadata,schemas');
  return schemas || [];
}
