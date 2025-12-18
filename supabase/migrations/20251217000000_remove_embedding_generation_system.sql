-- Remove embedding generation system completely
-- This removes all embedding-related database objects: table, RPCs, triggers, functions, indexes

-- 1. Drop trigger that enqueues embedding generation
DROP TRIGGER IF EXISTS on_content_embedding_generation ON public.content;

-- 2. Drop trigger function
DROP FUNCTION IF EXISTS public.trigger_enqueue_embedding_generation();

-- 3. Drop helper function
DROP FUNCTION IF EXISTS public.should_generate_embedding(text, text, text[], text);

-- 4. Drop unused RPC function (query_content_embeddings is never called)
DROP FUNCTION IF EXISTS public.query_content_embeddings(extensions.vector, double precision, integer, public.content_category[], text[], text[], integer);

-- 5. Drop reindex function
DROP FUNCTION IF EXISTS public.reindex_content_embeddings();

-- 6. Drop update trigger on content_embeddings table
DROP TRIGGER IF EXISTS content_embeddings_updated_at ON public.content_embeddings;

-- 7. Drop update function (only used by content_embeddings)
DROP FUNCTION IF EXISTS public.update_content_embeddings_updated_at();

-- 8. Drop the content_embeddings table (cascade will drop indexes and constraints)
DROP TABLE IF EXISTS public.content_embeddings CASCADE;

-- 9. Drop sequence if it exists
DROP SEQUENCE IF EXISTS public.content_embeddings_id_seq CASCADE;

-- Note: get_similar_content() RPC is kept - it uses content_similarities table, not embeddings
