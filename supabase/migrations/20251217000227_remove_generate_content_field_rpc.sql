-- Migration: Remove unused generate_content_field RPC
-- Version: 20251217000227
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove generate_content_field RPC function - Not found in codebase, only in generated types
-- Function signature: generate_content_field(p_category content_category, p_slug text, p_field_type content_field_type)
DROP FUNCTION IF EXISTS public.generate_content_field (
  public.content_category,
  text,
  public.content_field_type
);
