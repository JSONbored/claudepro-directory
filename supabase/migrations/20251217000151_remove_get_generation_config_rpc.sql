-- Migration: Remove unused get_generation_config RPC
-- Version: 20251217000151
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_generation_config RPC function - Only defined, not called internally or externally
-- Function signature: get_generation_config(p_category content_category)

DROP FUNCTION IF EXISTS public.get_generation_config(public.content_category);
