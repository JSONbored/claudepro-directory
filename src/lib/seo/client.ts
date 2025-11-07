/**
 * Unified SEO Client - Fetches metadata + schemas from seo-api edge function
 */

import { logger } from '@/src/lib/logger';

const SEO_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/seo-api`;

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

export interface SEOSchema {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export interface SEOResponse {
  metadata: SEOMetadata;
  schemas?: SEOSchema[];
}

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
      throw new Error(`SEO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle backward compatibility - if no metadata wrapper, entire response is metadata
    if (!data.metadata && data.title) {
      return { metadata: data as SEOMetadata, schemas: data.schemas };
    }

    return data;
  } catch (error) {
    logger.error(`Failed to fetch SEO from edge function for route: ${route}`, error as Error);
    throw error;
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
