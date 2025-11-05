/**
 * Analytics Client - Thin wrapper for Supabase Edge Function
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analytics`;

async function callEdgeFunction(action: string, data: Record<string, unknown> = {}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Use session token if available, otherwise use anon key from env
  const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token) {
    logger.error('No auth token or anon key available for analytics');
    throw new Error('Authentication token not available');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Analytics edge function error', errorText, { status: response.status, action });
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || 'Edge function call failed');
    } catch {
      throw new Error(`Edge function call failed: ${response.status}`);
    }
  }

  return response.json();
}

export async function trackInteraction(params: {
  content_type: string;
  content_slug: string;
  interaction_type: string;
  session_id?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  return callEdgeFunction('trackInteraction', params);
}

export async function getForYouFeed(params: {
  limit?: number;
  offset?: number;
  category?: string;
  exclude_bookmarked?: boolean;
}) {
  return callEdgeFunction('getForYouFeed', params);
}

export async function getSimilarConfigs(params: {
  content_type: string;
  content_slug: string;
  limit?: number;
}) {
  return callEdgeFunction('getSimilarConfigs', params);
}

export async function getUsageRecommendations(params: {
  trigger: 'after_bookmark' | 'after_copy' | 'extended_time' | 'category_browse';
  content_type?: string;
  content_slug?: string;
  category?: string;
  time_spent?: number;
}) {
  return callEdgeFunction('getUsageRecommendations', params);
}

export async function getUserAffinities(params: { limit?: number; min_score?: number }) {
  return callEdgeFunction('getUserAffinities', params);
}

export async function calculateUserAffinities() {
  return callEdgeFunction('calculateUserAffinities');
}

export async function getContentAffinity(content_type: string, content_slug: string) {
  const result = await callEdgeFunction('getContentAffinity', { content_type, content_slug });
  return result.affinity;
}

export async function getUserFavoriteCategories() {
  const result = await callEdgeFunction('getUserFavoriteCategories');
  return result.categories;
}

export async function getUserRecentInteractions(limit = 20) {
  const result = await callEdgeFunction('getUserRecentInteractions', { limit });
  return result.interactions;
}

export async function getUserInteractionSummary() {
  return callEdgeFunction('getUserInteractionSummary');
}

export async function generateConfigRecommendations(answers: {
  useCase: string;
  experienceLevel: string;
  toolPreferences: string[];
  integrations?: string[];
  focusAreas?: string[];
}) {
  return callEdgeFunction('generateConfigRecommendations', answers);
}
