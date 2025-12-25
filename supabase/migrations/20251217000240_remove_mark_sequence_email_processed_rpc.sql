-- Migration: Remove unused mark_sequence_email_processed RPC (both overloads)
-- Version: 20251217000240
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove mark_sequence_email_processed RPC functions - Not found in EmailService or Inngest functions, only in generated types
-- Function signatures:
--   mark_sequence_email_processed(p_schedule_id uuid, p_email text, p_step integer, p_success boolean DEFAULT true)
--   mark_sequence_email_processed(p_enrollment_id uuid, p_step_number integer, p_sent_at timestamp with time zone DEFAULT now())
DROP FUNCTION IF EXISTS public.mark_sequence_email_processed (uuid, text, integer, boolean);

DROP FUNCTION IF EXISTS public.mark_sequence_email_processed (
  uuid,
  integer,
  timestamp
  with
    time zone
);
