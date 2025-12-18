-- Migration: Remove unused get_company_profile RPC
-- Version: 20251218120000
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_company_profile RPC function - Converted to Prisma
-- CompaniesService.getCompanyProfile now uses Prisma directly (line 49), RPC no longer called.
--
-- Function signature: get_company_profile(p_slug text)
-- Related: CompaniesService.getCompanyProfile uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_company_profile(text);
