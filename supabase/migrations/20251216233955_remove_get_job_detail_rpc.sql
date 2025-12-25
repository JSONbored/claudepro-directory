-- Migration: Remove unused get_job_detail RPC
-- Version: 20251216233955
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove get_job_detail RPC function
-- Migrated to Prisma: JobsService.getJobBySlug()
-- Function signature: get_job_detail(text)
DROP FUNCTION IF EXISTS public.get_job_detail (text);
