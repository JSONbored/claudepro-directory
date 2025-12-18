-- Migration: Remove unused is_bookmarked_batch RPC
-- Version: 20251218120032
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove is_bookmarked_batch RPC function - Converted to Prisma
-- AccountService.isBookmarkedBatch now uses Prisma directly (line 1091), RPC no longer called.
--
-- Function signature: is_bookmarked_batch(p_user_id uuid, p_items jsonb)
-- Related: AccountService.isBookmarkedBatch uses Prisma queries instead

DROP FUNCTION IF EXISTS public.is_bookmarked_batch(uuid, jsonb);
