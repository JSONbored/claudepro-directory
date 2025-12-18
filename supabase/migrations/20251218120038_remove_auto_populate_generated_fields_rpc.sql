-- Migration: Remove unused auto_populate_generated_fields RPC
-- Version: 20251218120038
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove auto_populate_generated_fields RPC function - No trigger found using it
-- This is a trigger function (RETURNS trigger) but no CREATE TRIGGER statement found that uses it.
-- Function may have been replaced or trigger removed.
--
-- Function signature: auto_populate_generated_fields()
-- Related: No triggers found using this function

DROP FUNCTION IF EXISTS public.auto_populate_generated_fields();
