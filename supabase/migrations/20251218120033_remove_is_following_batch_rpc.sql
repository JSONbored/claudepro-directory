-- Migration: Remove unused is_following_batch RPC
-- Version: 20251218120033
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove is_following_batch RPC function - Converted to Prisma
-- AccountService.isFollowingBatch now uses Prisma directly (line 1171), RPC no longer called.
--
-- Function signature: is_following_batch(p_follower_id uuid, p_followed_user_ids uuid[])
-- Related: AccountService.isFollowingBatch uses Prisma queries instead

DROP FUNCTION IF EXISTS public.is_following_batch(uuid, uuid[]);
