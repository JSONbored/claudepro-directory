-- Migration: Remove unused handle_webhook_complaint RPC
-- Version: 20251217000123
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove handle_webhook_complaint RPC function - Resend webhook handler uses Inngest, not RPCs
-- Function signature: handle_webhook_complaint(p_webhook_id uuid, p_event_data jsonb)
DROP FUNCTION IF EXISTS public.handle_webhook_complaint (uuid, jsonb);
