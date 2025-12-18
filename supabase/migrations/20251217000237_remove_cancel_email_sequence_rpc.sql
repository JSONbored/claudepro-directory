-- Migration: Remove unused cancel_email_sequence RPC
-- Version: 20251217000237
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove cancel_email_sequence RPC function - Not found in EmailService or Inngest functions, only in generated types
-- Function signature: cancel_email_sequence(p_email text)

DROP FUNCTION IF EXISTS public.cancel_email_sequence(text);
