-- Migration: Remove unused get_jobs_by_category RPC
-- Version: 20251218120025
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_jobs_by_category RPC function - Converted to Prisma
-- JobsService.getJobsByCategory now uses Prisma directly (line 388), RPC no longer called.
--
-- Function signature: get_jobs_by_category(p_category job_category)
-- Related: JobsService.getJobsByCategory uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_jobs_by_category(public.job_category);
