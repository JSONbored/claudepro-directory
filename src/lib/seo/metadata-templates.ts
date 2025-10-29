/**
 * Metadata Templates - Database-First Architecture
 * ALL logic in PostgreSQL via generate_metadata_for_route() RPC function
 */

import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import type { RoutePattern } from '@/src/lib/seo/route-classifier';
import { createClient } from '@/src/lib/supabase/server';

export interface MetadataConfig {
  title: string;
  description: string;
  keywords: string[];
  openGraphType: 'website' | 'article';
  twitterCard: 'summary_large_image';
  robots: {
    index: boolean;
    follow: boolean;
  };
  authors?: Array<{ name: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  shouldAddLlmsTxt: boolean;
  isOverride?: boolean;
}

export async function generateMetadataFromDB(
  pattern: RoutePattern,
  context: MetadataContext,
  route?: string
): Promise<MetadataConfig> {
  const supabase = await createClient();

  const contextPayload = {
    plural_title: context.categoryConfig?.pluralTitle,
    kw1: context.categoryConfig?.keywords?.split(',')[0]?.trim(),
    kw2: context.categoryConfig?.keywords?.split(',')[1]?.trim(),
    display_title: (context.item as any)?.title || (context.item as any)?.name,
    category_name: context.categoryConfig?.title,
    name: (context.profile as any)?.name || context.params?.slug,
    follower_count: (context.profile as any)?.followerCount,
    post_count: (context.profile as any)?.postCount,
    meta_description: context.categoryConfig?.metaDescription,
    description: (context.item as any)?.description,
    keywords: (context.item as any)?.tags || (context.item as any)?.keywords,
    item: context.item,
  };

  const { data, error } = await supabase.rpc(
    'generate_metadata_for_route',
    route
      ? {
          p_route_pattern: pattern,
          p_context: contextPayload as any,
          p_route: route,
        }
      : {
          p_route_pattern: pattern,
          p_context: contextPayload as any,
        }
  );

  if (error || !data) {
    return {
      title: 'Claude Pro Directory - Browse AI Resources',
      description: 'Browse Claude AI configurations and resources.',
      keywords: ['claude', 'ai', new Date().getFullYear().toString()],
      openGraphType: 'website',
      twitterCard: 'summary_large_image',
      robots: { index: true, follow: true },
      shouldAddLlmsTxt: false,
    };
  }

  return data as unknown as MetadataConfig;
}
