-- Migration: Remove unused get_contact_commands RPC
-- Version: 20251218120034
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-18
--
-- Description: Remove get_contact_commands RPC function - Converted to Prisma
-- MiscService.getContactCommands now uses Prisma directly (line 235), RPC no longer called.
-- Action getContactCommands calls service.getContactCommands() which uses Prisma.
--
-- Function signature: get_contact_commands()
-- Related: MiscService.getContactCommands uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_contact_commands();
