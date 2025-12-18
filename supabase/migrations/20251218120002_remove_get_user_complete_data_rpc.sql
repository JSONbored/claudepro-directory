-- Migration: Remove unused get_user_complete_data RPC
-- Version: 20251218120002
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_user_complete_data RPC function - Converted to Prisma
-- AccountService.getUserCompleteData now uses Prisma directly by calling individual service methods.
-- The RPC was calling other RPCs (get_user_settings, get_user_identities, etc.) which have all been
-- converted to Prisma. This method now calls the Prisma-based service methods directly.
--
-- Function signature: get_user_complete_data(p_user_id uuid, p_activity_limit integer, p_activity_offset integer, p_activity_type text)
-- Related: AccountService.getUserCompleteData now calls individual Prisma-based service methods

DROP FUNCTION IF EXISTS public.get_user_complete_data(uuid, integer, integer, text);
