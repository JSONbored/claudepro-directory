-- Migration: Remove unused import_redis_seed_data RPC
-- Version: 20251217000213
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove import_redis_seed_data RPC function - Not found in codebase, only in generated types
-- Function signature: import_redis_seed_data(redis_data jsonb)

DROP FUNCTION IF EXISTS public.import_redis_seed_data(jsonb);
