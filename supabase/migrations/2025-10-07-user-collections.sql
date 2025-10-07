-- =====================================================
-- User Collections System - Database Tables
-- Run this in Supabase SQL Editor
-- =====================================================
-- This migration adds support for user-created collections,
-- allowing users to organize their bookmarks into custom
-- collections that can be shared publicly.
-- =====================================================

-- User Collections table
-- Stores user-created collections of bookmarked content
CREATE TABLE IF NOT EXISTS public.user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Collection details
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  slug TEXT NOT NULL CHECK (char_length(slug) >= 2 AND char_length(slug) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  
  -- Visibility and sharing
  is_public BOOLEAN DEFAULT false NOT NULL,
  
  -- Analytics (denormalized for performance)
  view_count INTEGER DEFAULT 0 NOT NULL,
  bookmark_count INTEGER DEFAULT 0 NOT NULL,
  item_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique slugs per user
  UNIQUE(user_id, slug)
);

-- Collection Items table (junction table between user_collections and bookmarks)
-- Stores the relationship between collections and bookmarked content
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES public.user_collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference to bookmarked content (denormalized for query performance)
  content_type TEXT NOT NULL, -- 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides', 'collections'
  content_slug TEXT NOT NULL,
  
  -- Ordering within collection
  "order" INTEGER DEFAULT 0 NOT NULL,
  
  -- Optional notes specific to this item in this collection
  notes TEXT CHECK (char_length(notes) <= 500),
  
  -- Audit
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure no duplicate items in same collection
  UNIQUE(collection_id, content_type, content_slug)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User Collections indexes
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON public.user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_slug ON public.user_collections(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_user_collections_public ON public.user_collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_collections_created_at ON public.user_collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_collections_view_count ON public.user_collections(view_count DESC) WHERE is_public = true;

-- Collection Items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_user_id ON public.collection_items(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_order ON public.collection_items(collection_id, "order");
CREATE INDEX IF NOT EXISTS idx_collection_items_content ON public.collection_items(content_type, content_slug);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON public.user_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate slug from name (if not provided)
CREATE OR REPLACE FUNCTION public.generate_collection_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
    
    -- Ensure slug is not empty
    IF NEW.slug = '' THEN
      NEW.slug := 'collection-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    -- Handle duplicate slugs by appending number
    IF EXISTS (
      SELECT 1 FROM public.user_collections 
      WHERE user_id = NEW.user_id 
      AND slug = NEW.slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
      NEW.slug := NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_user_collections_slug BEFORE INSERT OR UPDATE ON public.user_collections
  FOR EACH ROW EXECUTE FUNCTION generate_collection_slug();

-- Function to update item_count in user_collections when items are added/removed
CREATE OR REPLACE FUNCTION public.update_collection_item_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_collection_id UUID;
BEGIN
  -- Determine which collection was affected
  affected_collection_id := COALESCE(NEW.collection_id, OLD.collection_id);
  
  -- Update the item count
  UPDATE public.user_collections
  SET item_count = (
    SELECT COUNT(*) 
    FROM public.collection_items 
    WHERE collection_id = affected_collection_id
  ),
  updated_at = NOW()
  WHERE id = affected_collection_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_collection_item_count_on_insert 
  AFTER INSERT ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

CREATE TRIGGER update_collection_item_count_on_delete 
  AFTER DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- User Collections: Public collections viewable by all, users can manage their own
CREATE POLICY "Public collections are viewable by everyone"
  ON public.user_collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON public.user_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.user_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.user_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Items: Inherit visibility from parent collection, users can manage their own
CREATE POLICY "Users can view items in their collections"
  ON public.collection_items FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_collections 
      WHERE id = collection_items.collection_id 
      AND is_public = true
    )
  );

CREATE POLICY "Users can add items to their collections"
  ON public.collection_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update items in their collections"
  ON public.collection_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete items from their collections"
  ON public.collection_items FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION public.generate_collection_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_collection_item_count() TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Create server actions for collection CRUD operations
-- 2. Build collection management UI
-- 3. Add public collection pages to user profiles
-- 4. Implement collection sharing features
-- =====================================================
