-- Migration: Remove is_following_batch RPC function
-- Version: 20251216054132
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove is_following_batch RPC function - converted to Prisma direct query
--
-- This function processed UUID array and did EXISTS checks for each user.
-- The service now uses Prisma with IN condition in AccountService.isFollowingBatch():
--   prisma.followers.findMany({ where: { follower_id, following_id: { in: [...] } } })
--
-- Related Changes:
-- - packages/data-layer/src/services/account.ts: Converted isFollowingBatch() to use Prisma

DROP FUNCTION IF EXISTS public.is_following_batch(uuid, uuid[]);
