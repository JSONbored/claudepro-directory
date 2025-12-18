-- Migration: Remove unused get_collection_detail_with_items RPC
-- Version: 20251218120052
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_collection_detail_with_items RPC function - Converted to Prisma
-- AccountService.getCollectionDetailWithItems now uses Prisma directly (line 372), RPC no longer called.
-- The RPC was doing joins and aggregations, which we replicate with Prisma queries using relationLoadStrategy: 'join'.
--
-- Function signature: get_collection_detail_with_items(p_slug text, p_user_id uuid)
-- Related: AccountService.getCollectionDetailWithItems uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_collection_detail_with_items(text, uuid);
