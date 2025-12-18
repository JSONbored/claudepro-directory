-- Migration: Reorder changelog_category enum to match UI display order
-- Version: 20251216130000
-- Applied via: Supabase MCP (or manual application)
-- Date: 2025-12-16
--
-- Description: Reorder changelog_category enum to prioritize positive changes
-- Display order: Added, Changed, Fixed, Security, Deprecated, Removed
--
-- PostgreSQL doesn't support reordering enums directly, so we need to:
-- 1. Create a new enum with the desired order
-- 2. Drop the old enum (no columns use it directly - only in function signatures and JSON keys)
-- 3. Rename the new enum to the original name
--
-- Note: The enum is not used as a column type in any table. It's only used in:
-- - Function parameters (text type, not enum type)
-- - JSON keys in the changes field (which are strings, not enum values)
-- So we can safely recreate it without affecting data.

-- Step 1: Create new enum with correct order
CREATE TYPE public.changelog_category_new AS ENUM (
    'Added',
    'Changed',
    'Fixed',
    'Security',
    'Deprecated',
    'Removed'
);

-- Step 2: Drop the old enum
-- Safe because no columns use it directly (only function signatures reference it)
DROP TYPE public.changelog_category;

-- Step 3: Rename the new enum to the original name
ALTER TYPE public.changelog_category_new RENAME TO changelog_category;
