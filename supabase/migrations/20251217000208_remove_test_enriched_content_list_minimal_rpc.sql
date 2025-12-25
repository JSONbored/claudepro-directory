-- Migration: Remove unused test_enriched_content_list_minimal RPC
-- Version: 20251217000208
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove test_enriched_content_list_minimal RPC function - Test function, not used in production
-- Function signature: test_enriched_content_list_minimal(p_category content_category)
DROP FUNCTION IF EXISTS public.test_enriched_content_list_minimal (public.content_category);
