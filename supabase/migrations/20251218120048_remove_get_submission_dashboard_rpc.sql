-- Migration: Remove unused get_submission_dashboard RPC
-- Version: 20251218120048
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_submission_dashboard RPC function - Converted to Prisma
-- AccountService.getSubmissionDashboard now uses Prisma directly (line 875), RPC no longer called.
-- The RPC was doing aggregations and fetching recent merged submissions and top contributors.
--
-- Function signature: get_submission_dashboard(p_recent_limit integer, p_contributors_limit integer)
-- Related: AccountService.getSubmissionDashboard uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_submission_dashboard(integer, integer);
