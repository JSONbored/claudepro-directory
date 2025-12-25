-- Migration: Remove unused invoke_edge_function_endpoint RPC
-- Version: 20251217000147
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove invoke_edge_function_endpoint RPC function - Only defined, not called (public-api deleted)
-- Function signature: invoke_edge_function_endpoint(endpoint text)
DROP FUNCTION IF EXISTS public.invoke_edge_function_endpoint (text);
