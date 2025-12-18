-- Migration: Remove unused trigger_generate_embedding trigger function
-- Version: 20251217000059
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove trigger_generate_embedding trigger function - embedding generation system was removed
-- Function signature: trigger_generate_embedding() RETURNS trigger

DROP FUNCTION IF EXISTS public.trigger_generate_embedding();
