-- Migration: Remove unused validate_content_metadata RPC
-- Version: 20251217000233
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove validate_content_metadata RPC function - Only defined, not called
-- Function signature: validate_content_metadata(metadata jsonb)

DROP FUNCTION IF EXISTS public.validate_content_metadata(jsonb);
