/**
 * Analytics Edge Function - All analytics/personalization logic colocated with PostgreSQL
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';

const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type InteractionType = Database['public']['Enums']['interaction_type'];

function getContentItemUrl(category: string, slug: string): string {
  return `${SITE_URL}/${category}/${slug}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
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
        return await handleTrackInteraction(supabase, user, body);
      
      case 'getForYouFeed':
        return await handleGetForYouFeed(supabase, user, body);
      
      case 'getSimilarConfigs':
        return await handleGetSimilarConfigs(supabase, body);
      
      case 'getUsageRecommendations':
        return await handleGetUsageRecommendations(supabase, user, body);
      
      case 'getUserAffinities':
        return await handleGetUserAffinities(supabase, user, body);
      
      case 'calculateUserAffinities':
        return await handleCalculateUserAffinities(supabase, user);
      
      case 'getContentAffinity':
        return await handleGetContentAffinity(supabase, user, body);
      
      case 'getUserFavoriteCategories':
        return await handleGetUserFavoriteCategories(supabase, user);
      
      case 'getUserRecentInteractions':
        return await handleGetUserRecentInteractions(supabase, user, body);
      
      case 'getUserInteractionSummary':
        return await handleGetUserInteractionSummary(supabase, user);
      
      case 'generateConfigRecommendations':
        return await handleGenerateConfigRecommendations(supabase, body);
      
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleTrackInteraction(
  supabase: any,
  user: any,
  body: any
) {
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, message: 'User not authenticated' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { content_type, content_slug, interaction_type, session_id, metadata } = body;

  const { error } = await supabase.from('user_interactions').insert({
    content_type,
    content_slug,
    interaction_type: interaction_type as InteractionType,
    user_id: user.id,
    session_id: session_id || null,
    metadata: metadata || null,
  });

  if (error) {
    console.error('Failed to track interaction:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleGetForYouFeed(supabase: any, user: any, body: any) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { category, limit = 12 } = body;

  const { data: feedData, error } = await supabase.rpc('get_personalized_feed', {
    p_user_id: user.id,
    ...(category && { p_category: category }),
    p_limit: limit,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const feed = feedData as any;
  const response = {
    recommendations: feed.recommendations.map((rec: any) => ({
      ...rec,
      url: getContentItemUrl(rec.category, rec.slug),
    })),
    total_count: feed.total_count,
    sources_used: feed.sources_used,
    user_has_history: feed.user_has_history,
    generated_at: feed.generated_at,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetSimilarConfigs(supabase: any, body: any) {
  const { content_type, content_slug, limit = 6 } = body;

  const { data, error } = await supabase.rpc('get_similar_content', {
    p_content_type: content_type,
    p_content_slug: content_slug,
    p_limit: limit,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = data as any;
  result.similar_items = result.similar_items.map((item: any) => ({
    ...item,
    url: getContentItemUrl(item.category, item.slug),
  }));

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUsageRecommendations(supabase: any, user: any, body: any) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { trigger, content_type, content_slug, category } = body;

  const { data, error } = await supabase.rpc('get_usage_recommendations', {
    p_user_id: user.id,
    p_trigger: trigger,
    ...(content_type && { p_content_type: content_type }),
    ...(content_slug && { p_content_slug: content_slug }),
    ...(category && { p_category: category }),
    p_limit: 3,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rpcResponse = data as any;
  const response = {
    recommendations: rpcResponse.recommendations.map((rec: any) => ({
      ...rec,
      url: getContentItemUrl(rec.category, rec.slug),
    })),
    trigger,
    context: { content_type, content_slug, category },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUserAffinities(supabase: any, user: any, body: any) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { limit = 50, min_score = 10 } = body;

  const { data, error } = await supabase.rpc('get_user_affinities', {
    p_user_id: user.id,
    p_limit: limit,
    p_min_score: min_score,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCalculateUserAffinities(supabase: any, user: any) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase.rpc('update_user_affinity_scores', {
    p_user_id: user.id,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = data?.[0];
  return new Response(
    JSON.stringify({
      success: true,
      message: `Affinities calculated (${result?.inserted_count || 0} new, ${result?.updated_count || 0} updated)`,
      affinities_calculated: result?.total_affinity_count || 0,
      inserted_count: result?.inserted_count || 0,
      updated_count: result?.updated_count || 0,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleGetContentAffinity(supabase: any, user: any, body: any) {
  if (!user) {
    return new Response(JSON.stringify({ affinity: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { content_type, content_slug } = body;

  const { data, error } = await supabase.rpc('get_content_affinity', {
    p_user_id: user.id,
    p_content_type: content_type,
    p_content_slug: content_slug,
  });

  return new Response(JSON.stringify({ affinity: error ? null : data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUserFavoriteCategories(supabase: any, user: any) {
  if (!user) {
    return new Response(JSON.stringify({ categories: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase.rpc('get_user_favorite_categories', {
    p_user_id: user.id,
    p_limit: 3,
  });

  return new Response(JSON.stringify({ categories: error ? [] : data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUserRecentInteractions(supabase: any, user: any, body: any) {
  if (!user) {
    return new Response(JSON.stringify({ interactions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { limit = 20 } = body;

  const { data, error } = await supabase.rpc('get_user_recent_interactions', {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) {
    return new Response(JSON.stringify({ interactions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ interactions: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGetUserInteractionSummary(supabase: any, user: any) {
  const defaultSummary = {
    total_interactions: 0,
    views: 0,
    copies: 0,
    bookmarks: 0,
    unique_content_items: 0,
  };

  if (!user) {
    return new Response(JSON.stringify(defaultSummary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase.rpc('get_user_interaction_summary', {
    p_user_id: user.id,
  });

  return new Response(JSON.stringify(error ? defaultSummary : data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGenerateConfigRecommendations(supabase: any, body: any) {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const enrichedResult = dbResult as any;
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

  return new Response(
    JSON.stringify({ success: true, recommendations: response }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
