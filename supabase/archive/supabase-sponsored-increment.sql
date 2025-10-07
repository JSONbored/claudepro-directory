-- Sponsored Content - Increment Function
-- Run this in Supabase SQL Editor if not already present
-- This function is needed for atomic counter updates

-- Check if function exists first
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name = 'increment';

-- Create increment function for atomic counter updates
CREATE OR REPLACE FUNCTION public.increment(
  table_name TEXT,
  row_id UUID,
  column_name TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dynamic SQL for atomic increment
  EXECUTE format(
    'UPDATE public.%I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2',
    table_name,
    column_name,
    column_name
  ) USING increment_by, row_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment(TEXT, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment(TEXT, UUID, TEXT, INTEGER) TO anon;
