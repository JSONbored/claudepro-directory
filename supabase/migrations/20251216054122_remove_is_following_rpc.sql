-- Migration: Remove is_following RPC function
-- Version: 20251216054122
-- Applied via: Supabase MCP
-- Date: 2025-12-16
--
-- Description: Remove is_following RPC function - converted to Prisma direct query
--
-- This function was a simple EXISTS check: SELECT 1 FROM followers WHERE ...
-- The service now uses Prisma directly in AccountService.isFollowing():
--   prisma.followers.findFirst({ where: {...}, select: { id: true } }) !== null
--
-- Related Changes:
-- - packages/data-layer/src/services/account.ts: Converted isFollowing() to use Prisma

DROP FUNCTION IF EXISTS public.is_following(uuid, uuid);
