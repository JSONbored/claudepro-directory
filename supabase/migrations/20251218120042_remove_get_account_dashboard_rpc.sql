-- Migration: Remove unused get_account_dashboard RPC
-- Version: 20251218120042
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_account_dashboard RPC function - Converted to Prisma
-- AccountService.getAccountDashboard now uses Prisma directly (line 96), RPC no longer called.
-- This RPC was only called by get_user_complete_data RPC, which has also been converted to Prisma.
--
-- Function signature: get_account_dashboard(p_user_id uuid)
-- Related: AccountService.getAccountDashboard uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_account_dashboard(uuid);
