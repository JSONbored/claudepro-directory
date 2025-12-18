-- Migration: Remove unused get_collection_items_grouped RPC
-- Version: 20251216233953
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_collection_items_grouped RPC function
-- This function is unused in the codebase.
-- Function signature: get_collection_items_grouped(text)

DROP FUNCTION IF EXISTS public.get_collection_items_grouped(text);
