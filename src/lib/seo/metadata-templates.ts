/**
 * Metadata Templates - Database-First Architecture
 * ALL logic in PostgreSQL via generate_metadata_for_route() RPC function
 */

import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import type { RoutePattern } from '@/src/lib/seo/route-classifier';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

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
  const supabase = createAnonClient();

  // Step 1: Check for database-stored SEO fields
  const dbSeoFields = await fetchDatabaseSEOFields(supabase, pattern, context, route);

  // Step 2: Generate metadata from RPC (for fallback and baseline)
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

  const { data } = await supabase.rpc(
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

  const fallbackData: MetadataConfig = {
    title: 'Claude Pro Directory - Browse AI Resources',
    description: 'Browse Claude AI configurations and resources.',
    keywords: ['claude', 'ai', new Date().getFullYear().toString()],
    openGraphType: 'website',
    twitterCard: 'summary_large_image',
    robots: { index: true, follow: true },
    shouldAddLlmsTxt: false,
  };

  const rpcData = (data as unknown as MetadataConfig) || fallbackData;

  // Step 3: Merge database SEO fields with RPC-generated metadata (database takes priority)
  if (dbSeoFields) {
    return {
      ...rpcData,
      // Use seo_title if present, fall back to title, then RPC-generated
      ...(dbSeoFields.seo_title && { title: dbSeoFields.seo_title }),
      ...(!dbSeoFields.seo_title && dbSeoFields.title && { title: dbSeoFields.title }),
      ...(dbSeoFields.description && { description: dbSeoFields.description }),
      ...(dbSeoFields.og_type && { openGraphType: dbSeoFields.og_type as 'website' | 'article' }),
      ...(dbSeoFields.twitter_card && {
        twitterCard: dbSeoFields.twitter_card as 'summary_large_image',
      }),
      ...(dbSeoFields.robots_index !== null &&
        dbSeoFields.robots_follow !== null && {
          robots: {
            index: dbSeoFields.robots_index,
            follow: dbSeoFields.robots_follow,
          },
        }),
    };
  }

  return rpcData;
}

type SEOFields = Pick<
  Tables<'content'> | Tables<'changelog_entries'> | Tables<'static_routes'>,
  | 'title'
  | 'description'
  | 'og_type'
  | 'twitter_card'
  | 'robots_index'
  | 'robots_follow'
  | 'json_ld'
> & {
  seo_title?: string | null;
};

async function fetchDatabaseSEOFields(
  supabase: ReturnType<typeof createAnonClient>,
  pattern: RoutePattern,
  context: MetadataContext,
  route?: string
): Promise<SEOFields | null> {
  const category = context.params?.category as string;
  const slug = context.params?.slug as string;

  // Match route pattern to table query
  if (pattern === 'CONTENT_DETAIL' && category && slug) {
    const { data } = await supabase
      .from('content')
      .select(
        'title, seo_title, description, og_type, twitter_card, robots_index, robots_follow, json_ld'
      )
      .eq('category', category)
      .eq('slug', slug)
      .maybeSingle();
    return data;
  }

  // Changelog routes: check if route starts with /changelog/
  if (route?.startsWith('/changelog/') && slug) {
    const { data } = await supabase
      .from('changelog_entries')
      .select('title, description, og_type, twitter_card, robots_index, robots_follow, json_ld')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  }

  // Static routes: check static_routes table
  if (route) {
    const { data } = await supabase
      .from('static_routes')
      .select('title, description, og_type, twitter_card, robots_index, robots_follow, json_ld')
      .eq('path', route)
      .maybeSingle();
    return data;
  }

  return null;
}
