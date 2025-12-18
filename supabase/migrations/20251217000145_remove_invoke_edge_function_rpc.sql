-- Migration: Remove unused invoke_edge_function RPC
-- Version: 20251217000145
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove invoke_edge_function RPC function - Only defined, not called (public-api deleted)
-- Function signature: invoke_edge_function(function_name text, action_header text, payload jsonb DEFAULT '{}'::jsonb)

DROP FUNCTION IF EXISTS public.invoke_edge_function(text, text, jsonb);
