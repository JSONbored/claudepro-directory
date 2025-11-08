/**
 * Analytics Edge Function - Authenticated endpoint with origin-restricted CORS
 * All analytics/personalization logic colocated with PostgreSQL
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';
import {
  getAuthenticatedCorsHeaders,
  jsonResponse,
  unauthorizedResponse,
} from '../_shared/utils/response.ts';

const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type InteractionType = 'view' | 'copy' | 'bookmark' | 'click' | 'time_spent' | 'search' | 'filter' | 'screenshot' | 'share' | 'embed_generated' | 'download';

function getContentItemUrl(category: string, slug: string): string {
  return `${SITE_URL}/${category}/${slug}`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getAuthenticatedCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return unauthorizedResponse('Missing authorization header', corsHeaders);
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'trackInteraction':
        return await handleTrackInteraction(supabase, user, body, corsHeaders);

      case 'getSimilarConfigs':
        return await handleGetSimilarConfigs(supabase, body, corsHeaders);

      case 'generateConfigRecommendations':
        return await handleGenerateConfigRecommendations(supabase, body, corsHeaders);
      
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400, corsHeaders);
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
});

async function handleTrackInteraction(
  supabase: any,
  user: any,
  body: any,
  corsHeaders: Record<string, string>
) {
  const { content_type, content_slug, interaction_type, session_id, metadata } = body;

  const { error } = await supabase.from('user_interactions').insert({
    content_type,
    content_slug,
    interaction_type: interaction_type as InteractionType,
    user_id: user?.id || null,  // Allow anonymous tracking
    session_id: session_id || null,
    metadata: metadata || null,
  });

  if (error) {
    console.error('Failed to track interaction:', error);
    return jsonResponse({ success: false, message: error.message }, 200, corsHeaders);
  }

  return jsonResponse({ success: true }, 200, corsHeaders);
}

async function handleGetSimilarConfigs(supabase: any, body: any, corsHeaders: Record<string, string>) {
  const { content_type, content_slug, limit = 6 } = body;

  const { data, error } = await supabase.rpc('get_similar_content', {
    p_content_type: content_type,
    p_content_slug: content_slug,
    p_limit: limit,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500, corsHeaders);
  }

  const result = data as Database['public']['Functions']['get_similar_content']['Returns'];
  (result as { similar_items: any[] }).similar_items = (result as { similar_items: any[] }).similar_items.map((item: any) => ({
    ...item,
    url: getContentItemUrl(item.category, item.slug),
  }));

  return jsonResponse(result, 200, corsHeaders);
}

async function handleGenerateConfigRecommendations(supabase: any, body: any, corsHeaders: Record<string, string>) {
  const { useCase, experienceLevel, toolPreferences, integrations = [], focusAreas = [] } = body;
  const startTime = performance.now();

  const { data: dbResult, error } = await supabase.rpc('get_recommendations', {
    p_use_case: useCase,
    p_experience_level: experienceLevel,
    p_tool_preferences: toolPreferences,
    p_integrations: integrations,
    p_focus_areas: focusAreas,
    p_limit: 20,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500, corsHeaders);
  }

  const enrichedResult = dbResult as Database['public']['Functions']['get_recommendations']['Returns'];
  const resultId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const duration = performance.now() - startTime;

  console.log('Recommendations generated:', {
    resultId,
    resultCount: enrichedResult.results.length,
    duration: `${duration.toFixed(2)}ms`,
  });

  const response = {
    ...enrichedResult,
    answers: { useCase, experienceLevel, toolPreferences, integrations, focusAreas },
    id: resultId,
    generatedAt: new Date().toISOString(),
  };

  return jsonResponse({ success: true, recommendations: response }, 200, corsHeaders);
}
