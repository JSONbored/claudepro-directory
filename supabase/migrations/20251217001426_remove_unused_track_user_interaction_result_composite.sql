-- Migration: Remove unused track_user_interaction_result composite type
-- Version: 20251217001426
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove track_user_interaction_result composite type - track_user_interaction function was deleted, composite type is no longer used
-- This composite type was only used by the deleted track_user_interaction function

DROP TYPE IF EXISTS public.track_user_interaction_result CASCADE;
