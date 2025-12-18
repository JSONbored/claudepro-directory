-- Migration: Remove unused format_date_iso RPC
-- Version: 20251217000250
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove format_date_iso RPC function - Not found in codebase, codebase uses TypeScript formatDate
-- Function signature: format_date_iso(input_date timestamp with time zone)

DROP FUNCTION IF EXISTS public.format_date_iso(timestamp with time zone);
