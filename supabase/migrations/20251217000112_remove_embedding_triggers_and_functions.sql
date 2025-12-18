-- Migration: Remove embedding generation triggers and functions
-- Version: 20251217000112
-- Applied via: Supabase MCP
-- Date: 2025-12-17
--
-- Description: Remove all triggers and functions related to embedding generation system
-- This includes dropping triggers first, then the functions they depend on

-- Drop triggers first
DROP TRIGGER IF EXISTS on_content_embedding_generation ON public.content;
DROP TRIGGER IF EXISTS content_embeddings_updated_at ON public.content_embeddings;

-- Drop functions
DROP FUNCTION IF EXISTS public.should_generate_embedding(text, text, text[], text);
DROP FUNCTION IF EXISTS public.trigger_enqueue_embedding_generation();
DROP FUNCTION IF EXISTS public.update_content_embeddings_updated_at();
