-- Migration: Remove unused get_job_title_by_id RPC
-- Version: 20251218120027
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_job_title_by_id RPC function - Converted to Prisma
-- JobsService.getJobTitleById now uses Prisma directly (line 563), RPC no longer called.
--
-- Function signature: get_job_title_by_id(p_job_id uuid)
-- Related: JobsService.getJobTitleById uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_job_title_by_id(uuid);
