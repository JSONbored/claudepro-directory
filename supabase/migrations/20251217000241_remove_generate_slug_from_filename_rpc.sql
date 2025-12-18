-- Migration: Remove unused generate_slug_from_filename RPC
-- Version: 20251217000241
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove generate_slug_from_filename RPC function - Only defined, not called
-- Function signature: generate_slug_from_filename(p_filename text)

DROP FUNCTION IF EXISTS public.generate_slug_from_filename(text);
