-- Migration: Remove unused get_jobs_list RPC
-- Version: 20251218120022
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_jobs_list RPC function - Converted to Prisma
-- JobsService.getJobs now uses Prisma directly (line 108), RPC no longer called.
--
-- Function signature: get_jobs_list()
-- Related: JobsService.getJobs uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_jobs_list();
