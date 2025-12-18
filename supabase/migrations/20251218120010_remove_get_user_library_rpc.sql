-- Migration: Remove unused get_user_library RPC
-- Version: 20251218120010
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_library RPC function - Converted to Prisma
-- AccountService.getUserLibrary now uses Prisma directly (line 159), RPC no longer called.
--
-- Function signature: get_user_library(p_user_id uuid)
-- Related: AccountService.getUserLibrary uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_user_library(uuid);
