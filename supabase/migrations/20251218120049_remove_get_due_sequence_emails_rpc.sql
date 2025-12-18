-- Migration: Remove unused get_due_sequence_emails RPC
-- Version: 20251218120049
-- Applied via: Supabase MCP
-- Date: 2025-12-18
--
-- Description: Remove get_due_sequence_emails RPC function - Converted to Prisma
-- MiscService.getDueSequenceEmails now uses Prisma directly (line 900), RPC no longer called.
-- Inngest function calls service.getDueSequenceEmails() which uses Prisma.
--
-- Function signature: get_due_sequence_emails()
-- Related: MiscService.getDueSequenceEmails uses Prisma queries instead

DROP FUNCTION IF EXISTS public.get_due_sequence_emails();
