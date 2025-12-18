-- Migration: Remove unused query_content_embeddings RPC
-- Version: 20251217000055
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove query_content_embeddings RPC function - embedding generation system was removed
-- Function signature: query_content_embeddings(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_limit integer DEFAULT 20, p_categories content_category[] DEFAULT NULL::content_category[], p_tags text[] DEFAULT NULL::text[], p_authors text[] DEFAULT NULL::text[], p_offset integer DEFAULT 0)

DROP FUNCTION IF EXISTS public.query_content_embeddings(extensions.vector, double precision, integer, public.content_category[], text[], text[], integer);
