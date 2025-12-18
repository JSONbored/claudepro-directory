-- Migration: Remove unused reindex_content_embeddings RPC
-- Version: 20251217000100
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove reindex_content_embeddings RPC function - embedding generation system was removed
-- Function signature: reindex_content_embeddings() RETURNS text

DROP FUNCTION IF EXISTS public.reindex_content_embeddings();
