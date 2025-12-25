-- Migration: Remove unused handle_webhook_vercel_deployment RPC
-- Version: 20251217000129
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove handle_webhook_vercel_deployment RPC function - No codebase usage found
-- Function signature: handle_webhook_vercel_deployment(p_webhook_id uuid, p_event_data jsonb)
DROP FUNCTION IF EXISTS public.handle_webhook_vercel_deployment (uuid, jsonb);
