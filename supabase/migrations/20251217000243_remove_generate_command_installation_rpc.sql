-- Migration: Remove unused generate_command_installation RPC
-- Version: 20251217000243
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove generate_command_installation RPC function - Only defined, not called
-- Function signature: generate_command_installation(p_slug text, p_title text)
DROP FUNCTION IF EXISTS public.generate_command_installation (text, text);
