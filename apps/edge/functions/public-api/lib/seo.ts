/**
 * Shared SEO metadata extraction logic
 * Extracted from routes/seo.ts to enable direct function calls without HTTP loopback
 */

import { SeoService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import { sanitizeRoute } from '@heyclaude/shared-runtime';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SeoMetadataResult {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Get SEO metadata for a route by calling the database RPC directly
 * This avoids HTTP loopback calls and reduces latency
 *
 * @param route - The route path (e.g., '/agents/some-slug')
 * @param supabase - Supabase client instance
 * @param include - What to include in the response (default: 'metadata')
 * @returns SEO metadata or null if generation fails
 */
export async function getSeoMetadata(
  route: string,
  supabase: SupabaseClient<Database>,
  include = 'metadata'
): Promise<SeoMetadataResult | null> {
  // Sanitize route parameter
  const sanitizedRoute = sanitizeRoute(route);

  const service = new SeoService(supabase);

  try {
    const data = await service.generateMetadata({
      p_route: sanitizedRoute,
      p_include: include,
    });

    if (!data) {
      return null;
    }

    // Validate data structure matches expected composite type
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return null;
    }

    // Type guard: validate the structure matches our composite type
    const dataObj = data as Record<string, unknown>;
    const hasMetadata =
      'metadata' in dataObj &&
      typeof dataObj['metadata'] === 'object' &&
      dataObj['metadata'] !== null;

    if (!hasMetadata) {
      return null;
    }

    // Access properties safely - TypeScript will infer types from structure
    const metadataObj = dataObj['metadata'] as Record<string, unknown>;

    // Extract metadata fields safely
    // Use bracket notation for Record<string, unknown> to satisfy TypeScript index signature requirements
    const title = typeof metadataObj['title'] === 'string' ? metadataObj['title'] : '';
    const description =
      typeof metadataObj['description'] === 'string' ? metadataObj['description'] : '';
    const keywords = Array.isArray(metadataObj['keywords'])
      ? (metadataObj['keywords'] as unknown[]).filter(
          (item): item is string => typeof item === 'string'
        )
      : [];

    if (!title) {
      return null;
    }

    return {
      title,
      description,
      keywords,
    };
  } catch (error) {
    // Return null on error - caller should handle fallback
    // Log error for debugging while maintaining API contract
    console.error('Failed to generate SEO metadata:', error);
    return null;
  }
}
