-- Migration: Remove is_bookmarked_batch RPC function
-- Version: 20251216054129
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove is_bookmarked_batch RPC function - converted to Prisma direct query
--
-- This function processed JSONB array and did EXISTS checks for each item.
-- The service now uses Prisma with OR conditions in AccountService.isBookmarkedBatch():
--   prisma.bookmarks.findMany({ where: { user_id, OR: [...] } })
--
-- Related Changes:
-- - packages/data-layer/src/services/account.ts: Converted isBookmarkedBatch() to use Prisma

DROP FUNCTION IF EXISTS public.is_bookmarked_batch(uuid, jsonb);
