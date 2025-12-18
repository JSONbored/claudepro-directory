-- Migration: Remove unused get_companies_list RPC
-- Version: 20251218120001
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_companies_list RPC function - Converted to Prisma
-- CompaniesService.getCompaniesList now uses Prisma directly, RPC no longer called.
--
-- Function signature: get_companies_list(p_limit integer, p_offset integer)
-- Related: CompaniesService.getCompaniesList uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_companies_list(integer, integer);
