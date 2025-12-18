-- Migration: Remove unused track_user_interaction RPC
-- Version: 20251217000144
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove track_user_interaction RPC function - Pulse Inngest function uses batch_insert_user_interactions instead
-- Function signature: track_user_interaction(p_content_type content_category, p_content_slug text, p_interaction_type interaction_type, p_session_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)

DROP FUNCTION IF EXISTS public.track_user_interaction(public.content_category, text, public.interaction_type, text, jsonb);
