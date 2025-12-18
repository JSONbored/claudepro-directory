-- Migration: Remove unused populate_content_seo_data RPC
-- Version: 20251217000211
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove populate_content_seo_data RPC function - Not found in codebase, only in generated types
-- Function signature: populate_content_seo_data()

DROP FUNCTION IF EXISTS public.populate_content_seo_data();
