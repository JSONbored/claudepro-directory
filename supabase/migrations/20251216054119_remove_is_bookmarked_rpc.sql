-- Migration: Remove is_bookmarked RPC function
-- Version: 20251216054119
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove is_bookmarked RPC function - converted to Prisma direct query
--
-- This function was a simple EXISTS check: SELECT 1 FROM bookmarks WHERE ...
-- The service now uses Prisma directly in AccountService.isBookmarked():
--   prisma.bookmarks.findFirst({ where: {...}, select: { id: true } }) !== null
--
-- Related Changes:
-- - packages/data-layer/src/services/account.ts: Converted isBookmarked() to use Prisma

DROP FUNCTION IF EXISTS public.is_bookmarked(uuid, public.content_category, text);
