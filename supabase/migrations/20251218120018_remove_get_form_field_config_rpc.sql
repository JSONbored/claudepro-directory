-- Migration: Remove unused get_form_field_config RPC
-- Version: 20251218120018
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_form_field_config RPC function - Converted to Prisma
-- MiscService.getFormFieldConfig now uses Prisma directly (line 293), RPC no longer called.
--
-- Function signature: get_form_field_config(p_form_type text)
-- Related: MiscService.getFormFieldConfig uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_form_field_config(text);
