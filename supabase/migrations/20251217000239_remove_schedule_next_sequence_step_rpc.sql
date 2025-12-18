-- Migration: Remove unused schedule_next_sequence_step RPC
-- Version: 20251217000239
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove schedule_next_sequence_step RPC function - Not found in EmailService or Inngest functions, only in generated types
-- Function signature: schedule_next_sequence_step(p_email text, p_current_step integer)

DROP FUNCTION IF EXISTS public.schedule_next_sequence_step(text, integer);
