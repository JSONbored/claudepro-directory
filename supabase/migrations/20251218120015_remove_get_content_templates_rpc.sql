-- Migration: Remove unused get_content_templates RPC
-- Version: 20251218120015
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_content_templates RPC function - Converted to Prisma
-- ContentService.getContentTemplates now uses Prisma directly (line 589), RPC no longer called.
--
-- Function signature: get_content_templates(p_category content_category)
-- Related: ContentService.getContentTemplates uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_content_templates(public.content_category);
