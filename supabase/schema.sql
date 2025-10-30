


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."announcement_priority" AS ENUM (
    'high',
    'medium',
    'low'
);


ALTER TYPE "public"."announcement_priority" OWNER TO "postgres";


CREATE TYPE "public"."announcement_variant" AS ENUM (
    'default',
    'outline',
    'secondary',
    'destructive'
);


ALTER TYPE "public"."announcement_variant" OWNER TO "postgres";


CREATE TYPE "public"."badge_rarity" AS ENUM (
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
);


ALTER TYPE "public"."badge_rarity" OWNER TO "postgres";


CREATE TYPE "public"."changelog_category" AS ENUM (
    'Added',
    'Changed',
    'Deprecated',
    'Removed',
    'Fixed',
    'Security'
);


ALTER TYPE "public"."changelog_category" OWNER TO "postgres";


CREATE TYPE "public"."content_category" AS ENUM (
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'skills',
    'collections',
    'guides',
    'jobs',
    'changelog'
);


ALTER TYPE "public"."content_category" OWNER TO "postgres";


COMMENT ON TYPE "public"."content_category" IS 'All valid content categories - single source of truth';



CREATE TYPE "public"."experience_level" AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE "public"."experience_level" OWNER TO "postgres";


COMMENT ON TYPE "public"."experience_level" IS 'User experience level for recommendations';



CREATE TYPE "public"."field_scope" AS ENUM (
    'common',
    'type_specific',
    'tags'
);


ALTER TYPE "public"."field_scope" OWNER TO "postgres";


CREATE TYPE "public"."field_type" AS ENUM (
    'text',
    'textarea',
    'number',
    'select'
);


ALTER TYPE "public"."field_type" OWNER TO "postgres";


CREATE TYPE "public"."focus_area_type" AS ENUM (
    'security',
    'performance',
    'documentation',
    'testing',
    'code-quality',
    'automation'
);


ALTER TYPE "public"."focus_area_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."focus_area_type" IS 'Primary focus areas for configuration';



CREATE TYPE "public"."form_field_type" AS ENUM (
    'text',
    'textarea',
    'number',
    'select'
);


ALTER TYPE "public"."form_field_type" OWNER TO "postgres";


CREATE TYPE "public"."form_grid_column" AS ENUM (
    'full',
    'half',
    'third',
    'two-thirds'
);


ALTER TYPE "public"."form_grid_column" OWNER TO "postgres";


CREATE TYPE "public"."form_icon_position" AS ENUM (
    'left',
    'right'
);


ALTER TYPE "public"."form_icon_position" OWNER TO "postgres";


CREATE TYPE "public"."grid_column" AS ENUM (
    'full',
    'half',
    'third',
    'two-thirds'
);


ALTER TYPE "public"."grid_column" OWNER TO "postgres";


CREATE TYPE "public"."icon_position" AS ENUM (
    'left',
    'right'
);


ALTER TYPE "public"."icon_position" OWNER TO "postgres";


CREATE TYPE "public"."integration_type" AS ENUM (
    'github',
    'database',
    'cloud-aws',
    'cloud-gcp',
    'cloud-azure',
    'communication',
    'none'
);


ALTER TYPE "public"."integration_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."integration_type" IS 'Required integration capabilities';



CREATE TYPE "public"."interaction_type" AS ENUM (
    'view',
    'copy',
    'bookmark',
    'click',
    'time_spent',
    'search',
    'filter'
);


ALTER TYPE "public"."interaction_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_priority" AS ENUM (
    'high',
    'medium',
    'low'
);


ALTER TYPE "public"."notification_priority" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'announcement',
    'feedback'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."sort_direction" AS ENUM (
    'asc',
    'desc'
);


ALTER TYPE "public"."sort_direction" OWNER TO "postgres";


COMMENT ON TYPE "public"."sort_direction" IS 'Sort order direction';



CREATE TYPE "public"."sort_option" AS ENUM (
    'relevance',
    'date',
    'popularity',
    'name',
    'updated',
    'created',
    'views',
    'trending'
);


ALTER TYPE "public"."sort_option" OWNER TO "postgres";


COMMENT ON TYPE "public"."sort_option" IS 'Sort options for search and filtering';



CREATE TYPE "public"."submission_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'spam',
    'merged'
);


ALTER TYPE "public"."submission_status" OWNER TO "postgres";


CREATE TYPE "public"."submission_type" AS ENUM (
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'skills'
);


ALTER TYPE "public"."submission_type" OWNER TO "postgres";


CREATE TYPE "public"."trending_metric" AS ENUM (
    'views',
    'likes',
    'shares',
    'downloads',
    'all'
);


ALTER TYPE "public"."trending_metric" OWNER TO "postgres";


COMMENT ON TYPE "public"."trending_metric" IS 'Trending metric types - replaces inline trendingParamsSchema.metric in TypeScript';



CREATE TYPE "public"."trending_period" AS ENUM (
    'today',
    'week',
    'month',
    'year',
    'all'
);


ALTER TYPE "public"."trending_period" OWNER TO "postgres";


COMMENT ON TYPE "public"."trending_period" IS 'Trending time period options - replaces inline trendingParamsSchema.period in TypeScript';



CREATE TYPE "public"."use_case_type" AS ENUM (
    'code-review',
    'api-development',
    'frontend-development',
    'data-science',
    'content-creation',
    'devops-infrastructure',
    'general-development',
    'testing-qa',
    'security-audit'
);


ALTER TYPE "public"."use_case_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."use_case_type" IS 'Primary use cases for content recommendations';



CREATE OR REPLACE FUNCTION "public"."add_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_bookmark JSONB;
BEGIN
  INSERT INTO bookmarks (user_id, content_type, content_slug, notes)
  VALUES (p_user_id, p_content_type, p_content_slug, NULLIF(p_notes, ''))
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'content_type', content_type,
    'content_slug', content_slug,
    'notes', notes,
    'created_at', created_at
  ) INTO v_bookmark;

  INSERT INTO user_interactions (user_id, content_type, content_slug, interaction_type, session_id, metadata)
  VALUES (p_user_id, p_content_type, p_content_slug, 'bookmark', NULL, NULL)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'bookmark', v_bookmark
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Bookmark already exists';
END;
$$;


ALTER FUNCTION "public"."add_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text", "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text", "p_notes" "text") IS 'Add bookmark with automatic interaction tracking. Replaces 64 LOC TypeScript with atomic database operation.';



CREATE OR REPLACE FUNCTION "public"."auto_award_badges"("p_user_id" "uuid") RETURNS TABLE("badge_slug" "text", "badge_name" "text", "awarded" boolean, "reason" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_stats JSONB;
  v_badge RECORD;
  v_already_has_badge BOOLEAN;
  v_meets_criteria BOOLEAN;
  v_insert_result RECORD;
BEGIN
  -- STEP 1: Get user stats from materialized view (instant lookup!)
  SELECT jsonb_build_object(
    'reputation', COALESCE(reputation, 0),
    'posts', COALESCE(posts, 0),
    'comments', COALESCE(comments, 0),
    'submissions', COALESCE(submissions, 0),
    'votes_received', COALESCE(votes_received, 0),
    'reviews', COALESCE(reviews, 0),
    'bookmarks_received', COALESCE(bookmarks_received, 0),
    'followers', COALESCE(followers, 0)
  )
  INTO v_stats
  FROM public.user_badge_stats
  WHERE user_id = p_user_id;

  -- Fallback: User not in materialized view yet (new user)
  IF v_stats IS NULL THEN
    v_stats := jsonb_build_object(
      'reputation', 0,
      'posts', 0,
      'comments', 0,
      'submissions', 0,
      'votes_received', 0,
      'reviews', 0,
      'bookmarks_received', 0,
      'followers', 0
    );
  END IF;

  -- STEP 2: Loop through all active badges
  FOR v_badge IN
    SELECT id, slug, name, criteria
    FROM public.badges
    WHERE active = TRUE
    ORDER BY "order" ASC
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) INTO v_already_has_badge;

    -- Skip if already awarded
    IF v_already_has_badge THEN
      RETURN QUERY SELECT
        v_badge.slug::TEXT,
        v_badge.name::TEXT,
        FALSE,
        'Already awarded'::TEXT;
      CONTINUE;
    END IF;

    -- STEP 3: Evaluate criteria
    v_meets_criteria := evaluate_badge_criteria(v_badge.criteria, v_stats);

    -- STEP 4: Award badge if criteria met
    IF v_meets_criteria THEN
      BEGIN
        INSERT INTO public.user_badges (user_id, badge_id, featured, metadata, earned_at)
        VALUES (p_user_id, v_badge.id, FALSE, NULL, NOW())
        RETURNING * INTO v_insert_result;

        RETURN QUERY SELECT
          v_badge.slug::TEXT,
          v_badge.name::TEXT,
          TRUE,
          'Badge awarded'::TEXT;

      EXCEPTION WHEN unique_violation THEN
        -- Race condition: Badge was awarded by another process
        RETURN QUERY SELECT
          v_badge.slug::TEXT,
          v_badge.name::TEXT,
          FALSE,
          'Already awarded (race condition)'::TEXT;
      END;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."auto_award_badges"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_award_badges"("p_user_id" "uuid") IS 'Automatically checks and awards all eligible badges for a user. Uses user_badge_stats materialized view for instant stats lookup. Returns list of awarded badges. SECURITY DEFINER for RLS bypass.';



CREATE OR REPLACE FUNCTION "public"."auto_populate_generated_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_category text;
  v_result jsonb;
begin
  -- Determine category from table name
  v_category := TG_TABLE_NAME;
  
  -- Auto-populate installation if null
  if TG_TABLE_NAME in ('agents', 'commands', 'hooks', 'mcp', 'statuslines') then
    if NEW.installation is null then
      NEW.installation := public.generate_content_field(v_category, NEW.slug, 'installation');
    end if;
  end if;
  
  -- Auto-populate use_cases if null or empty
  if NEW.use_cases is null or array_length(NEW.use_cases, 1) = 0 then
    v_result := public.generate_content_field(v_category, NEW.slug, 'use_cases');
    if v_result is not null then
      NEW.use_cases := array(
        select value::text
        from jsonb_array_elements_text(v_result)
      );
    end if;
  end if;
  
  -- Auto-populate troubleshooting if null or empty (commands, hooks, mcp only)
  if TG_TABLE_NAME in ('commands', 'hooks', 'mcp') then
    if NEW.troubleshooting is null or array_length(NEW.troubleshooting, 1) = 0 then
      v_result := public.generate_content_field(v_category, NEW.slug, 'troubleshooting');
      if v_result is not null then
        NEW.troubleshooting := array(
          select value
          from jsonb_array_elements(v_result)
        );
      end if;
    end if;
  end if;
  
  -- Auto-populate requirements if null or empty (agents only, and if config exists)
  if TG_TABLE_NAME = 'agents' then
    if NEW.requirements is null or array_length(NEW.requirements, 1) = 0 then
      v_result := public.generate_content_field(v_category, NEW.slug, 'requirements');
      if v_result is not null then
        NEW.requirements := array(
          select value::text
          from jsonb_array_elements_text(v_result)
        );
      end if;
    end if;
  end if;
  
  return NEW;
end;
$$;


ALTER FUNCTION "public"."auto_populate_generated_fields"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_populate_generated_fields"() IS 'Trigger function to auto-populate null content fields using database-driven generators on INSERT/UPDATE.';



CREATE OR REPLACE FUNCTION "public"."batch_add_bookmarks"("p_user_id" "uuid", "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_bookmarks JSONB;
  v_item JSONB;
  v_saved_count INTEGER := 0;
  v_total_requested INTEGER;
BEGIN
  v_total_requested := jsonb_array_length(p_items);

  -- Batch insert with UPSERT (skip duplicates)
  INSERT INTO bookmarks (user_id, content_type, content_slug, notes)
  SELECT
    p_user_id,
    item->>'content_type',
    item->>'content_slug',
    NULL
  FROM jsonb_array_elements(p_items) AS item
  ON CONFLICT (user_id, content_type, content_slug) DO NOTHING;

  GET DIAGNOSTICS v_saved_count = ROW_COUNT;

  -- Track interactions for each bookmark (fire-and-forget)
  INSERT INTO user_interactions (user_id, content_type, content_slug, interaction_type, metadata)
  SELECT
    p_user_id,
    item->>'content_type',
    item->>'content_slug',
    'bookmark',
    jsonb_build_object('source', 'bulk_save')
  FROM jsonb_array_elements(p_items) AS item
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'saved_count', v_saved_count,
    'total_requested', v_total_requested
  );
END;
$$;


ALTER FUNCTION "public"."batch_add_bookmarks"("p_user_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_add_bookmarks"("p_user_id" "uuid", "p_items" "jsonb") IS 'Bulk bookmark creation with UPSERT and interaction tracking. Replaces 98 LOC TypeScript with atomic database operation.';



CREATE OR REPLACE FUNCTION "public"."batch_recalculate_all_reputation"() RETURNS TABLE("user_id" "uuid", "old_score" integer, "new_score" integer, "updated" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT
      u.id AS user_id,
      u.reputation_score AS old_score,
      calculate_user_reputation_score(u.id) AS new_score
    FROM public.users u
  )
  UPDATE public.users u
  SET
    reputation_score = us.new_score,
    updated_at = NOW()
  FROM user_scores us
  WHERE u.id = us.user_id
    AND u.reputation_score != us.new_score -- Only update if changed
  RETURNING u.id, us.old_score, us.new_score, TRUE AS updated;
END;
$$;


ALTER FUNCTION "public"."batch_recalculate_all_reputation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_recalculate_all_reputation"() IS 'Batch recalculate reputation for ALL users. Returns users whose scores changed. ADMIN USE ONLY.';



CREATE OR REPLACE FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "new_reputation_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- SECURITY: Validate batch size to prevent abuse
  IF array_length(user_ids, 1) > 1000 THEN
    RAISE EXCEPTION 'Maximum 1000 users per batch. Requested: %', array_length(user_ids, 1);
  END IF;

  -- Process all users using LATERAL join (parallel execution)
  -- This leverages PostgreSQL's query planner for optimal execution
  RETURN QUERY
  SELECT
    u_ids.id AS user_id,
    public.calculate_user_reputation(u_ids.id) AS new_reputation_score
  FROM
    unnest(user_ids) AS u_ids(id);
END;
$$;


ALTER FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) IS 'Recalculates reputation for multiple users in batch. Uses existing calculate_user_reputation() function. Max 1000 users per batch.';



CREATE OR REPLACE FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer DEFAULT 100) RETURNS TABLE("user_id" "uuid", "inserted_count" integer, "updated_count" integer, "total_affinity_count" integer, "processing_time_ms" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_start_time TIMESTAMPTZ;
  v_processing_time INTEGER;
BEGIN
  -- Security: Enforce batch size limit
  IF array_length(p_user_ids, 1) > p_max_users THEN
    RAISE EXCEPTION 'Maximum % users per batch. Requested: %', p_max_users, array_length(p_user_ids, 1);
  END IF;

  -- Process each user
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    v_start_time := clock_timestamp();

    -- Calculate and update affinities
    RETURN QUERY
    SELECT
      v_user_id,
      result.inserted_count,
      result.updated_count,
      result.total_affinity_count,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
    FROM public.update_user_affinity_scores(v_user_id) AS result;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer) IS 'Batch processes affinity score updates for multiple users. Used by pg_cron job (SUPABASE-015). Max 100 users per batch. Returns processing statistics per user.';



CREATE OR REPLACE FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" integer, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" bigint, "p_copy_count" bigint, "p_bookmark_count" bigint, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', p_id::TEXT,                           -- Cast UUID to TEXT for JSON output
    'slug', p_slug,
    'title', p_title,
    'description', p_description,
    'author', p_author,
    'author_profile_url', p_author_profile_url,
    'category', p_category,
    'tags', to_jsonb(p_tags),
    'source_table', p_source_table,
    'created_at', p_created_at,
    'updated_at', p_updated_at,
    'date_added', p_date_added,
    'discovery_metadata', p_discovery_metadata,
    'examples', p_examples,
    'features', to_jsonb(p_features),
    'troubleshooting', to_jsonb(p_troubleshooting),
    'use_cases', to_jsonb(p_use_cases),
    -- Common optional fields
    'source', p_source,
    'documentation_url', p_documentation_url,
    'popularity_score', p_popularity_score,
    'content', p_content,
    'seo_title', p_seo_title,
    'display_title', p_display_title,
    -- Analytics
    'viewCount', COALESCE(p_view_count, 0),
    'copyCount', COALESCE(p_copy_count, 0),
    'bookmarkCount', COALESCE(p_bookmark_count, 0),
    -- Computed
    'isNew', (p_date_added >= (CURRENT_DATE - INTERVAL '7 days')::date),
    'popularity', CASE
      WHEN p_popularity_score IS NOT NULL THEN ROUND((p_popularity_score * 100)::numeric, 0)::int
      ELSE NULL
    END,
    -- Sponsorship
    'isSponsored', (p_sponsored_id IS NOT NULL AND p_sponsored_active = true),
    'sponsoredId', CASE                          -- Cast UUID to TEXT for JSON output
      WHEN p_sponsored_id IS NOT NULL THEN p_sponsored_id::TEXT
      ELSE NULL
    END,
    'sponsorTier', p_sponsor_tier
  );
END;
$$;


ALTER FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" integer, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" bigint, "p_copy_count" bigint, "p_bookmark_count" bigint, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" numeric, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" integer, "p_copy_count" integer, "p_bookmark_count" integer, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', p_id::TEXT,                           -- Cast UUID to TEXT for JSON output
    'slug', p_slug,
    'title', p_title,
    'description', p_description,
    'author', p_author,
    'author_profile_url', p_author_profile_url,
    'category', p_category,
    'tags', to_jsonb(p_tags),
    'source_table', p_source_table,
    'created_at', p_created_at,
    'updated_at', p_updated_at,
    'date_added', p_date_added,
    'discovery_metadata', p_discovery_metadata,
    'examples', p_examples,
    'features', to_jsonb(p_features),
    'troubleshooting', to_jsonb(p_troubleshooting),
    'use_cases', to_jsonb(p_use_cases),
    -- Common optional fields
    'source', p_source,
    'documentation_url', p_documentation_url,
    'popularity_score', p_popularity_score,
    'content', p_content,
    'seo_title', p_seo_title,
    'display_title', p_display_title,
    -- Analytics
    'viewCount', COALESCE(p_view_count, 0),
    'copyCount', COALESCE(p_copy_count, 0),
    'bookmarkCount', COALESCE(p_bookmark_count, 0),
    -- Computed
    'isNew', (p_date_added >= (CURRENT_DATE - INTERVAL '7 days')::date),
    'popularity', CASE
      WHEN p_popularity_score IS NOT NULL THEN ROUND((p_popularity_score * 100)::numeric, 0)::int
      ELSE NULL
    END,
    -- Sponsorship
    'isSponsored', (p_sponsored_id IS NOT NULL AND p_sponsored_active = true),
    'sponsoredId', CASE                          -- Cast UUID to TEXT for JSON output
      WHEN p_sponsored_id IS NOT NULL THEN p_sponsored_id::TEXT
      ELSE NULL
    END,
    'sponsorTier', p_sponsor_tier
  );
END;
$$;


ALTER FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" numeric, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" integer, "p_copy_count" integer, "p_bookmark_count" integer, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") RETURNS TABLE("user_id" "uuid", "content_type" "text", "content_slug" "text", "affinity_score" integer, "breakdown" "jsonb", "component_scores" "jsonb", "interaction_summary" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config RECORD;
  v_views INTEGER;
  v_bookmarks INTEGER;
  v_copies INTEGER;
  v_time_spent_seconds NUMERIC;
  v_last_interaction TIMESTAMPTZ;
  v_days_since_last NUMERIC;

  -- Component scores (0-1 range)
  v_view_score NUMERIC;
  v_time_score NUMERIC;
  v_bookmark_score NUMERIC;
  v_copy_score NUMERIC;
  v_recency_score NUMERIC;

  -- Weighted scores (0-1 range)
  v_weighted_total NUMERIC;
  v_final_score INTEGER;
BEGIN
  -- Load configuration
  SELECT * INTO v_config FROM public.affinity_config WHERE id = 1;

  -- Aggregate interactions for this content
  SELECT
    COUNT(*) FILTER (WHERE interaction_type = 'view') AS views,
    COUNT(*) FILTER (WHERE interaction_type = 'bookmark') AS bookmarks,
    COUNT(*) FILTER (WHERE interaction_type = 'copy') AS copies,
    COALESCE(SUM((metadata->>'time_spent_seconds')::INTEGER) FILTER (WHERE interaction_type = 'time_spent'), 0) AS time_spent,
    MAX(created_at) AS last_interaction
  INTO v_views, v_bookmarks, v_copies, v_time_spent_seconds, v_last_interaction
  FROM public.user_interactions
  WHERE
    user_interactions.user_id = p_user_id
    AND user_interactions.content_type = p_content_type
    AND user_interactions.content_slug = p_content_slug
    AND interaction_type IN ('view', 'bookmark', 'copy', 'time_spent');

  -- Return NULL if no interactions found
  IF v_views IS NULL OR v_views = 0 THEN
    RETURN;
  END IF;

  -- Calculate component scores (0-1 range, capped at threshold)
  v_view_score := LEAST(v_views::NUMERIC / v_config.max_views, 1.0);
  v_time_score := LEAST(v_time_spent_seconds / v_config.max_time_spent_seconds, 1.0);
  v_bookmark_score := LEAST(v_bookmarks::NUMERIC / v_config.max_bookmarks, 1.0);
  v_copy_score := LEAST(v_copies::NUMERIC / v_config.max_copies, 1.0);

  -- Calculate recency boost using exponential decay
  -- Formula: exp(-ln(2) * (days_since_last / half_life_days))
  v_days_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_interaction)) / 86400.0;
  v_recency_score := EXP(-LN(2) * (v_days_since_last / v_config.recency_half_life_days));

  -- Calculate weighted total (0-1 range)
  v_weighted_total :=
    (v_view_score * v_config.weight_views) +
    (v_time_score * v_config.weight_time_spent) +
    (v_bookmark_score * v_config.weight_bookmarks) +
    (v_copy_score * v_config.weight_copies) +
    (v_recency_score * v_config.weight_recency);

  -- Convert to 0-100 range
  v_final_score := ROUND(v_weighted_total * 100)::INTEGER;

  -- Return result only if above minimum threshold
  IF v_final_score >= v_config.min_score_threshold THEN
    RETURN QUERY SELECT
      p_user_id,
      p_content_type,
      p_content_slug,
      v_final_score,
      -- Breakdown: weighted contribution of each component (0-100 scale)
      jsonb_build_object(
        'views', ROUND(v_view_score * v_config.weight_views * 100),
        'bookmarks', ROUND(v_bookmark_score * v_config.weight_bookmarks * 100),
        'copies', ROUND(v_copy_score * v_config.weight_copies * 100),
        'time_spent', ROUND(v_time_score * v_config.weight_time_spent * 100),
        'recency_boost', ROUND(v_recency_score * v_config.weight_recency * 100)
      ),
      -- Component scores: raw 0-1 scores before weighting
      jsonb_build_object(
        'view_score', v_view_score,
        'time_score', v_time_score,
        'bookmark_score', v_bookmark_score,
        'copy_score', v_copy_score,
        'recency_score', v_recency_score
      ),
      -- Interaction summary: raw counts
      jsonb_build_object(
        'views', v_views,
        'bookmarks', v_bookmarks,
        'copies', v_copies,
        'time_spent_seconds', v_time_spent_seconds,
        'days_since_last_interaction', ROUND(v_days_since_last, 2),
        'last_interaction', v_last_interaction
      );
  END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") IS 'Calculates affinity score for a specific user-content pair. Replaces calculateAffinityScore() from affinity-scorer.ts. Returns NULL if no interactions or score below threshold.';



CREATE OR REPLACE FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") RETURNS TABLE("content_type" "text", "content_slug" "text", "affinity_score" integer, "breakdown" "jsonb", "interaction_summary" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    aff.content_type,
    aff.content_slug,
    aff.affinity_score,
    aff.breakdown,
    aff.interaction_summary
  FROM (
    -- Get distinct content items user has interacted with
    SELECT DISTINCT
      ui.content_type,
      ui.content_slug
    FROM public.user_interactions ui
    WHERE
      ui.user_id = p_user_id
      AND ui.interaction_type IN ('view', 'bookmark', 'copy', 'time_spent')
  ) AS distinct_content
  -- Calculate affinity for each content item
  CROSS JOIN LATERAL (
    SELECT *
    FROM public.calculate_affinity_score_for_content(
      p_user_id,
      distinct_content.content_type,
      distinct_content.content_slug
    )
  ) AS aff
  WHERE aff.affinity_score IS NOT NULL
  ORDER BY aff.affinity_score DESC;
END;
$$;


ALTER FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") IS 'Calculates affinities for ALL content a user has interacted with. Replaces calculateUserAffinities() from affinity-scorer.ts. Returns sorted by affinity_score DESC.';



CREATE OR REPLACE FUNCTION "public"."calculate_and_store_weekly_featured"() RETURNS TABLE("category" "text", "featured_count" integer, "duration_ms" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end DATE := (v_week_start + INTERVAL '7 days')::DATE;
  v_category TEXT;
  v_count INTEGER := 0;
  v_start_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  -- Delete previous featured entries for this week (idempotent)
  DELETE FROM featured_configs
  WHERE week_start = v_week_start;

  RAISE NOTICE 'Calculating weekly featured for week: % to %', v_week_start, v_week_end;

  -- Process each category
  FOR v_category IN SELECT * FROM get_all_content_categories()
  LOOP
    v_start_time := clock_timestamp();
    v_count := 0;

    -- Get featured scores and insert atomically
    WITH featured_scores AS (
      SELECT
        fs.content_slug,
        fs.final_score,
        fs.trending_score,
        fs.rating_score,
        fs.engagement_score,
        fs.freshness_score,
        fs.total_views,
        fs.growth_rate_pct,
        fs.bookmark_count,
        fs.copy_count,
        fs.comment_count,
        fs.days_old,
        ROW_NUMBER() OVER (ORDER BY fs.final_score DESC) as row_num
      FROM get_featured_content(v_category, 10) fs
    )
    INSERT INTO featured_configs (
      content_type,
      content_slug,
      rank,
      final_score,
      trending_score,
      rating_score,
      engagement_score,
      freshness_score,
      week_start,
      week_end,
      calculation_metadata
    )
    SELECT
      v_category,
      fs.content_slug,
      fs.row_num::INTEGER,
      fs.final_score,
      fs.trending_score,
      fs.rating_score,
      fs.engagement_score,
      fs.freshness_score,
      v_week_start,
      v_week_end,
      jsonb_build_object(
        'views', fs.total_views,
        'growthRate', fs.growth_rate_pct,
        'engagement', jsonb_build_object(
          'bookmarks', fs.bookmark_count,
          'copies', fs.copy_count,
          'comments', fs.comment_count
        ),
        'daysOld', fs.days_old
      )
    FROM featured_scores fs
    WHERE fs.row_num <= 10;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_duration_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

    RAISE NOTICE 'Category %: % featured items (% ms)', v_category, v_count, v_duration_ms;

    category := v_category;
    featured_count := v_count;
    duration_ms := v_duration_ms;
    RETURN NEXT;
  END LOOP;

  RAISE NOTICE 'Weekly featured calculation complete';
END;
$$;


ALTER FUNCTION "public"."calculate_and_store_weekly_featured"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_and_store_weekly_featured"() IS 'Calculates and stores weekly featured content for all categories. Called by pg_cron Monday 00:00 UTC. Replaces Next.js weekly-tasks cron.';



CREATE OR REPLACE FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_intersection INT;
  v_union INT;
  v_jaccard NUMERIC;
BEGIN
  -- Jaccard similarity: intersection / union
  v_intersection := (
    SELECT COUNT(*)
    FROM unnest(p_tags_a) AS tag
    WHERE tag = ANY(p_tags_b)
  );

  v_union := (
    SELECT COUNT(DISTINCT tag)
    FROM unnest(p_tags_a || p_tags_b) AS tag
  );

  IF v_union = 0 THEN
    RETURN 0;
  END IF;

  v_jaccard := v_intersection::NUMERIC / v_union::NUMERIC;
  RETURN ROUND(v_jaccard, 4);
END;
$$;


ALTER FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) IS 'Calculate Jaccard similarity between two tag arrays. Returns 0-1 score (0=no overlap, 1=identical).';



CREATE OR REPLACE FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  -- Calculate new score
  v_new_score := calculate_user_reputation_score(target_user_id);

  -- Update user's reputation_score (tier_name and tier_progress auto-update)
  UPDATE public.users
  SET
    reputation_score = v_new_score,
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN v_new_score;
END;
$$;


ALTER FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") IS 'Recalculate and update reputation score for a specific user. Returns new score.';



CREATE OR REPLACE FUNCTION "public"."calculate_user_reputation_score"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_posts_count INTEGER;
  v_votes_received INTEGER;
  v_comments_count INTEGER;
  v_submissions_count INTEGER;
  v_total_score INTEGER;
  v_post_points INTEGER;
  v_vote_points INTEGER;
  v_comment_points INTEGER;
  v_submission_points INTEGER;
BEGIN
  -- Get point values from reputation_actions table
  SELECT points INTO v_post_points
  FROM public.reputation_actions
  WHERE action_type = 'post' AND active = true
  LIMIT 1;

  SELECT points INTO v_vote_points
  FROM public.reputation_actions
  WHERE action_type = 'vote_received' AND active = true
  LIMIT 1;

  SELECT points INTO v_comment_points
  FROM public.reputation_actions
  WHERE action_type = 'comment' AND active = true
  LIMIT 1;

  SELECT points INTO v_submission_points
  FROM public.reputation_actions
  WHERE action_type = 'submission_merged' AND active = true
  LIMIT 1;

  -- Default to 0 if not found
  v_post_points := COALESCE(v_post_points, 10);
  v_vote_points := COALESCE(v_vote_points, 5);
  v_comment_points := COALESCE(v_comment_points, 2);
  v_submission_points := COALESCE(v_submission_points, 20);

  -- Count user activities
  SELECT COUNT(*) INTO v_posts_count
  FROM public.posts
  WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(vote_count), 0) INTO v_votes_received
  FROM public.posts
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_comments_count
  FROM public.comments
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_submissions_count
  FROM public.submissions
  WHERE user_id = p_user_id AND status = 'merged';

  -- Calculate total score
  v_total_score :=
    (v_posts_count * v_post_points) +
    (v_votes_received * v_vote_points) +
    (v_comments_count * v_comment_points) +
    (v_submissions_count * v_submission_points);

  RETURN v_total_score;
END;
$$;


ALTER FUNCTION "public"."calculate_user_reputation_score"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_user_reputation_score"("p_user_id" "uuid") IS 'Calculate total reputation score for a user based on posts, votes, comments, and submissions.';



CREATE OR REPLACE FUNCTION "public"."cancel_email_sequence"("p_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sequence_id TEXT := 'onboarding';
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Update sequence status to cancelled
  UPDATE email_sequences
  SET status = 'cancelled',
      updated_at = v_now
  WHERE sequence_id = v_sequence_id
    AND email = p_email
    AND status = 'active';

  -- Mark all pending scheduled emails as processed (cancel them)
  UPDATE email_sequence_schedule
  SET processed = true,
      processed_at = v_now
  WHERE sequence_id = v_sequence_id
    AND email = p_email
    AND processed = false;
END;
$$;


ALTER FUNCTION "public"."cancel_email_sequence"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cancel_email_sequence"("p_email" "text") IS 'Cancel email sequence for user (e.g., on unsubscribe).';



CREATE OR REPLACE FUNCTION "public"."check_all_badges"("target_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  badge_record RECORD;
  newly_awarded INTEGER := 0;
  was_awarded BOOLEAN;
BEGIN
  FOR badge_record IN SELECT slug FROM public.badges WHERE active = true ORDER BY "order" LOOP
    SELECT public.check_and_award_badge(target_user_id, badge_record.slug) INTO was_awarded;
    IF was_awarded THEN newly_awarded := newly_awarded + 1; END IF;
  END LOOP;
  RETURN newly_awarded;
END;
$$;


ALTER FUNCTION "public"."check_all_badges"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_badge"("target_user_id" "uuid", "badge_slug" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  badge_record RECORD;
  user_qualifies BOOLEAN := false;
  post_count INTEGER;
  max_post_votes INTEGER;
  merged_count INTEGER;
  user_reputation INTEGER;
BEGIN
  SELECT * INTO badge_record FROM public.badges WHERE slug = badge_slug AND active = true;
  IF NOT FOUND THEN RETURN false; END IF;
  
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = target_user_id AND badge_id = badge_record.id) THEN
    RETURN false;
  END IF;
  
  CASE badge_record.criteria->>'type'
    WHEN 'post_count' THEN
      SELECT COUNT(*) INTO post_count FROM public.posts WHERE user_id = target_user_id;
      user_qualifies := post_count >= (badge_record.criteria->>'threshold')::INTEGER;
    WHEN 'post_votes' THEN
      SELECT MAX(vote_count) INTO max_post_votes FROM public.posts WHERE user_id = target_user_id;
      user_qualifies := COALESCE(max_post_votes, 0) >= (badge_record.criteria->>'threshold')::INTEGER;
    WHEN 'submission_merged' THEN
      SELECT COUNT(*) INTO merged_count FROM public.submissions WHERE user_id = target_user_id AND status = 'merged';
      user_qualifies := merged_count >= (badge_record.criteria->>'threshold')::INTEGER;
    WHEN 'reputation' THEN
      SELECT reputation_score INTO user_reputation FROM public.users WHERE id = target_user_id;
      user_qualifies := COALESCE(user_reputation, 0) >= (badge_record.criteria->>'threshold')::INTEGER;
    WHEN 'manual' THEN
      user_qualifies := false;
    ELSE
      user_qualifies := false;
  END CASE;
  
  IF user_qualifies THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (target_user_id, badge_record.id, NOW())
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_and_award_badge"("target_user_id" "uuid", "badge_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_badges_manual"("p_user_id" "uuid") RETURNS TABLE("success" boolean, "badges_awarded" integer, "badge_slugs" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_results RECORD;
  v_awarded_badges TEXT[] := ARRAY[]::TEXT[];
  v_awarded_count INTEGER := 0;
BEGIN
  -- Run full badge check
  FOR v_results IN SELECT * FROM auto_award_badges(p_user_id)
  LOOP
    IF v_results.awarded THEN
      v_awarded_count := v_awarded_count + 1;
      v_awarded_badges := array_append(v_awarded_badges, v_results.badge_slug);
    END IF;
  END LOOP;

  RETURN QUERY SELECT TRUE, v_awarded_count, v_awarded_badges;
END;
$$;


ALTER FUNCTION "public"."check_and_award_badges_manual"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_award_badges_manual"("p_user_id" "uuid") IS 'Manual badge check initiated by user. Returns list of newly awarded badges.';



CREATE OR REPLACE FUNCTION "public"."check_badges_after_reputation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.check_all_badges(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_badges_after_reputation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_interactions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_interactions
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_interactions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_form_field_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  max_version INTEGER;
BEGIN
  -- Get current max version for this field
  SELECT COALESCE(MAX(version_number), 0) INTO max_version
  FROM form_field_versions
  WHERE field_id = NEW.id;

  -- Insert new version snapshot
  INSERT INTO form_field_versions (
    field_id,
    version_number,
    field_data,
    changed_by
  ) VALUES (
    NEW.id,
    max_version + 1,
    row_to_json(NEW)::JSONB,
    NEW.created_by
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_form_field_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enroll_in_email_sequence"("p_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sequence_id TEXT := 'onboarding';
  v_now TIMESTAMPTZ := NOW();
  v_step2_due_at TIMESTAMPTZ;
BEGIN
  -- Calculate step 2 due date (2 days from now)
  v_step2_due_at := v_now + INTERVAL '2 days';

  -- Insert sequence record
  INSERT INTO email_sequences (
    sequence_id,
    email,
    current_step,
    total_steps,
    started_at,
    last_sent_at,
    status
  ) VALUES (
    v_sequence_id,
    p_email,
    1, -- Step 1 (welcome) already sent on signup
    5,
    v_now,
    v_now,
    'active'
  )
  ON CONFLICT (sequence_id, email) DO NOTHING; -- Idempotent

  -- Schedule step 2
  INSERT INTO email_sequence_schedule (
    sequence_id,
    email,
    step,
    due_at,
    processed
  ) VALUES (
    v_sequence_id,
    p_email,
    2,
    v_step2_due_at,
    false
  )
  ON CONFLICT (sequence_id, email, step) DO NOTHING; -- Idempotent
END;
$$;


ALTER FUNCTION "public"."enroll_in_email_sequence"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enroll_in_email_sequence"("p_email" "text") IS 'Enroll user in onboarding email sequence. Idempotent.';



CREATE OR REPLACE FUNCTION "public"."evaluate_badge_criteria"("p_criteria" "jsonb", "p_stats" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_criteria_type TEXT;
  v_condition JSONB;
  v_all_met BOOLEAN;
  v_any_met BOOLEAN;
BEGIN
  v_criteria_type := p_criteria->>'type';

  -- Reputation criteria: reputation >= minScore
  IF v_criteria_type = 'reputation' THEN
    RETURN (p_stats->>'reputation')::INTEGER >= (p_criteria->>'minScore')::INTEGER;
  END IF;

  -- Count criteria: metric >= minCount
  IF v_criteria_type = 'count' THEN
    RETURN (p_stats->>p_criteria->>'metric')::INTEGER >= (p_criteria->>'minCount')::INTEGER;
  END IF;

  -- Special badges: Never auto-award (manually awarded only)
  IF v_criteria_type = 'special' THEN
    RETURN FALSE;
  END IF;

  -- Streak criteria: Not implemented yet
  IF v_criteria_type = 'streak' THEN
    RETURN FALSE;
  END IF;

  -- Composite criteria: Multiple conditions with AND/OR logic
  IF v_criteria_type = 'composite' THEN
    v_all_met := TRUE;
    v_any_met := FALSE;

    -- Evaluate each condition recursively
    FOR v_condition IN SELECT * FROM jsonb_array_elements(p_criteria->'conditions')
    LOOP
      IF evaluate_badge_criteria(v_condition, p_stats) THEN
        v_any_met := TRUE;
      ELSE
        v_all_met := FALSE;
      END IF;
    END LOOP;

    -- Return based on requireAll flag
    IF (p_criteria->>'requireAll')::BOOLEAN THEN
      RETURN v_all_met;
    ELSE
      RETURN v_any_met;
    END IF;
  END IF;

  -- Unknown criteria type
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."evaluate_badge_criteria"("p_criteria" "jsonb", "p_stats" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."evaluate_badge_criteria"("p_criteria" "jsonb", "p_stats" "jsonb") IS 'Evaluates badge criteria against user stats. Supports reputation, count, composite, special, and streak types. IMMUTABLE for performance optimization.';



CREATE OR REPLACE FUNCTION "public"."extract_tags_for_search"("tags" "jsonb") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(string_agg(value::text, ' '), '')
  FROM jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb))
$$;


ALTER FUNCTION "public"."extract_tags_for_search"("tags" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."job_slug"("p_title" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
  select substring(
    regexp_replace(
      regexp_replace(lower(coalesce(p_title, '')), '\s+', '-', 'g'),
      '[^a-z0-9-]',
      '',
      'g'
    )
    from 1 for 100
  );
$$;


ALTER FUNCTION "public"."job_slug"("p_title" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."job_slug"("p_title" "text") IS 'Canonical job slug generator. Mirrors legacy TypeScript logic: lower → collapse whitespace to hyphen → strip non [a-z0-9-] → truncate to 100 chars.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "company" "text" NOT NULL,
    "location" "text",
    "description" "text" NOT NULL,
    "salary" "text",
    "remote" boolean DEFAULT false,
    "type" "text" NOT NULL,
    "workplace" "text",
    "experience" "text",
    "category" "text" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "requirements" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "link" "text" NOT NULL,
    "contact_email" "text",
    "company_logo" "text",
    "plan" "text" DEFAULT 'standard'::"text" NOT NULL,
    "active" boolean DEFAULT false,
    "status" "text" DEFAULT 'draft'::"text",
    "posted_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "featured" boolean DEFAULT false,
    "order" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "payment_method" "text",
    "payment_date" timestamp with time zone,
    "payment_amount" numeric(10,2),
    "payment_reference" "text",
    "admin_notes" "text",
    "search_vector" "tsvector" GENERATED ALWAYS AS ((((("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("company", ''::"text")), 'A'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("description", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("category", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE(("tags")::"text", ''::"text")), 'D'::"char"))) STORED,
    "slug" "text" GENERATED ALWAYS AS ("public"."job_slug"("title")) STORED NOT NULL,
    CONSTRAINT "jobs_benefits_check" CHECK (("jsonb_typeof"("benefits") = 'array'::"text")),
    CONSTRAINT "jobs_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['polar'::"text", 'mercury_invoice'::"text", 'manual'::"text"]))),
    CONSTRAINT "jobs_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['unpaid'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "jobs_requirements_check" CHECK (("jsonb_typeof"("requirements") = 'array'::"text")),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_review'::"text", 'active'::"text", 'expired'::"text", 'rejected'::"text"]))),
    CONSTRAINT "jobs_tags_check" CHECK (("jsonb_typeof"("tags") = 'array'::"text"))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."payment_status" IS 'Payment status: unpaid (default), paid (approved), refunded';



COMMENT ON COLUMN "public"."jobs"."payment_method" IS 'Payment method: polar (Polar.sh), mercury_invoice (Mercury invoicing), manual (admin override)';



COMMENT ON COLUMN "public"."jobs"."payment_date" IS 'Timestamp when payment was confirmed';



COMMENT ON COLUMN "public"."jobs"."payment_amount" IS 'Payment amount in USD (e.g., 299.00 for $299)';



COMMENT ON COLUMN "public"."jobs"."payment_reference" IS 'Payment reference ID (Polar order ID, Mercury invoice number, etc.)';



COMMENT ON COLUMN "public"."jobs"."admin_notes" IS 'Internal admin notes for review/approval process';



COMMENT ON COLUMN "public"."jobs"."search_vector" IS 'Full-text search vector (auto-maintained): title(A) + company(A) + description(B) + category(C) + tags(D)';



COMMENT ON CONSTRAINT "jobs_benefits_check" ON "public"."jobs" IS 'Enforce benefits field is a JSONB array (eliminates application-level Array.isArray checks)';



COMMENT ON CONSTRAINT "jobs_requirements_check" ON "public"."jobs" IS 'Enforce requirements field is a JSONB array (eliminates application-level Array.isArray checks)';



COMMENT ON CONSTRAINT "jobs_tags_check" ON "public"."jobs" IS 'Enforce tags field is a JSONB array (eliminates application-level Array.isArray checks)';



CREATE OR REPLACE FUNCTION "public"."filter_jobs"("p_search_query" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_employment_type" "text" DEFAULT NULL::"text", "p_remote_only" boolean DEFAULT NULL::boolean, "p_experience_level" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."jobs"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT j.*
  FROM public.jobs j
  WHERE
    -- Only active jobs
    j.status = 'active'
    AND j.active = true

    -- Full-text search (if provided)
    AND (
      p_search_query IS NULL
      OR j.search_vector @@ plainto_tsquery('english', p_search_query)
    )

    -- Category filter (if provided and not 'all')
    AND (
      p_category IS NULL
      OR p_category = 'all'
      OR j.category = p_category
    )

    -- Employment type filter (if provided and not 'any')
    AND (
      p_employment_type IS NULL
      OR p_employment_type = 'any'
      OR j.type = p_employment_type
    )

    -- Remote filter (if provided)
    AND (
      p_remote_only IS NULL
      OR p_remote_only = false
      OR j.remote = true
    )

    -- Experience level filter (if provided and not 'any')
    AND (
      p_experience_level IS NULL
      OR p_experience_level = 'any'
      OR j.experience = p_experience_level
    )

  ORDER BY
    -- Relevance ranking for search queries
    CASE
      WHEN p_search_query IS NOT NULL THEN
        ts_rank(j.search_vector, plainto_tsquery('english', p_search_query))
      ELSE 0
    END DESC,
    -- Featured jobs first
    j.featured DESC NULLS LAST,
    -- Manual ordering
    j.order DESC NULLS LAST,
    -- Recently posted
    j.posted_at DESC NULLS LAST,
    -- Fallback to creation date
    j.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."filter_jobs"("p_search_query" "text", "p_category" "text", "p_employment_type" "text", "p_remote_only" boolean, "p_experience_level" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."filter_jobs"("p_search_query" "text", "p_category" "text", "p_employment_type" "text", "p_remote_only" boolean, "p_experience_level" "text", "p_limit" integer, "p_offset" integer) IS 'Filter and search jobs with full-text search, category, employment type, remote, and experience filters. Returns active jobs sorted by relevance, featured status, and date. All filtering logic in PostgreSQL for optimal performance.';



CREATE OR REPLACE FUNCTION "public"."generate_collection_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."generate_collection_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_content_field"("p_category" "text", "p_slug" "text", "p_field_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $_$
declare
  v_config record;
  v_item record;
  v_result jsonb;
  v_strategy text;
  v_tag_results jsonb;
  v_tag text;
begin
  -- Fetch generator config
  select * into v_config
  from public.content_generator_configs
  where category = p_category and field_type = p_field_type;
  
  if not found then
    -- No generator config, return null
    return null;
  end if;
  
  -- Fetch content item (only slug, title, tags - avoid type issues)
  execute format(
    'select slug, title, tags, configuration from public.%I where slug = $1',
    p_category
  ) using p_slug into v_item;
  
  if not found then
    -- Item not found, return defaults
    return v_config.defaults;
  end if;
  
  -- Execute strategy in order
  foreach v_strategy in array v_config.strategy
  loop
    case v_strategy
      -- Strategy 1: item - Skip (checking done by trigger/backfill SQL)
      when 'item' then
        -- This strategy is for checking if field already exists
        -- We skip it here since the trigger/backfill handles that
        continue;
      
      -- Strategy 2: Tag-based generation
      when 'tags' then
        if v_config.tag_mapping is not null and v_item.tags is not null then
          v_tag_results := '[]'::jsonb;
          foreach v_tag in array v_item.tags
          loop
            if v_config.tag_mapping ? v_tag then
              v_tag_results := v_tag_results || (v_config.tag_mapping->v_tag);
            end if;
          end loop;
          
          if jsonb_array_length(v_tag_results) > 0 then
            return v_tag_results;
          end if;
        end if;
      
      -- Strategy 3: Title-based personalization
      when 'title' then
        if v_config.template is not null then
          -- Apply template personalization
          if jsonb_typeof(v_config.template) = 'array' then
            -- Array of items (for use_cases or troubleshooting)
            select jsonb_agg(
              case 
                -- For troubleshooting items {issue, solution}
                when item ? 'issue' and item ? 'solution' then
                  jsonb_build_object(
                    'issue', public.replace_title_placeholder(item->>'issue', v_item.title, v_item.slug),
                    'solution', public.replace_title_placeholder(item->>'solution', v_item.title, v_item.slug)
                  )
                -- For simple string arrays (use_cases)
                else
                  to_jsonb(public.replace_title_placeholder(item#>>'{}', v_item.title, v_item.slug))
              end
            ) into v_result
            from jsonb_array_elements(v_config.template) as item;
            
            return v_result;
          elsif jsonb_typeof(v_config.template) = 'object' then
            -- Single object (for installation)
            return v_config.template;
          end if;
        end if;
      
      -- Strategy 4: Defaults (final fallback)
      when 'defaults' then
        return v_config.defaults;
      
      else
        -- Unknown strategy, skip
        continue;
    end case;
  end loop;
  
  -- Fallback to defaults if nothing worked
  return v_config.defaults;
end;
$_$;


ALTER FUNCTION "public"."generate_content_field"("p_category" "text", "p_slug" "text", "p_field_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_content_field"("p_category" "text", "p_slug" "text", "p_field_type" "text") IS 'Generates content field value using database-driven strategy. Fixed version without dynamic field type checking.';



CREATE OR REPLACE FUNCTION "public"."generate_metadata_for_route"("p_route_pattern" "text", "p_context" "jsonb", "p_route" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_template RECORD;
  v_override RECORD;
  v_content_id TEXT;
  v_category TEXT;
  v_title TEXT;
  v_description TEXT;
  v_keywords TEXT[];
  v_app_name TEXT := 'Claude Pro Directory';
  v_current_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  v_current_month_year TEXT := TO_CHAR(CURRENT_DATE, 'Month YYYY');
  v_formulas TEXT[];
  v_formula TEXT;
  v_optimal_title TEXT;
  v_title_length INT;
  v_og_type TEXT;
  v_should_index BOOLEAN;
  v_should_follow BOOLEAN;
  v_twitter_card TEXT;
  v_authors JSONB;
  v_published_time TEXT;
  v_modified_time TEXT;
  v_should_add_llms_txt BOOLEAN := FALSE;
BEGIN
  -- STEP 1: Check for SEO override (CONTENT_DETAIL only)
  IF p_route_pattern = 'CONTENT_DETAIL' AND p_context ? 'params' THEN
    v_content_id := p_context->'params'->>'slug';
    v_category := p_context->'params'->>'category';

    IF v_content_id IS NOT NULL AND v_category IS NOT NULL THEN
      SELECT * INTO v_override
      FROM content_seo_overrides
      WHERE content_id = v_content_id AND category = v_category;

      IF FOUND THEN
        -- Return override values (merge with template for missing fields)
        RETURN jsonb_build_object(
          'title', COALESCE(v_override.title, v_app_name || ' - ' || v_content_id),
          'description', COALESCE(v_override.description, 'Browse Claude AI configurations.'),
          'keywords', COALESCE(v_override.keywords, ARRAY['claude', 'ai', v_current_year]),
          'openGraphType', COALESCE(v_override.og_type, 'article'),
          'twitterCard', COALESCE(v_override.twitter_card, 'summary_large_image'),
          'robots', jsonb_build_object(
            'index', COALESCE(v_override.robots_index, true),
            'follow', COALESCE(v_override.robots_follow, true)
          ),
          'authors', NULL,
          'publishedTime', NULL,
          'modifiedTime', NULL,
          'shouldAddLlmsTxt', true,
          'isOverride', true
        );
      END IF;
    END IF;
  END IF;

  -- STEP 2: No override found, proceed with template generation
  SELECT * INTO v_template
  FROM metadata_templates
  WHERE route_pattern = p_route_pattern AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'title', v_app_name || ' - Browse AI Resources',
      'description', 'Browse Claude AI configurations and resources.',
      'keywords', ARRAY['claude', 'ai', v_current_year],
      'openGraphType', 'website',
      'twitterCard', 'summary_large_image',
      'robots', jsonb_build_object('index', true, 'follow', true)
    );
  END IF;

  -- Get title formulas and interpolate variables
  v_formulas := v_template.title_formulas;

  FOR i IN 1..array_length(v_formulas, 1) LOOP
    v_formula := v_formulas[i];
    v_formula := REPLACE(v_formula, '{app_name}', v_app_name);
    v_formula := REPLACE(v_formula, '{current_year}', v_current_year);
    v_formula := REPLACE(v_formula, '{current_month_year}', v_current_month_year);

    IF p_context ? 'plural_title' THEN
      v_formula := REPLACE(v_formula, '{plural_title}', p_context->>'plural_title');
    END IF;
    IF p_context ? 'kw1' THEN
      v_formula := REPLACE(v_formula, '{kw1}', p_context->>'kw1');
    END IF;
    IF p_context ? 'kw2' THEN
      v_formula := REPLACE(v_formula, '{kw2}', p_context->>'kw2');
    END IF;
    IF p_context ? 'display_title' THEN
      v_formula := REPLACE(v_formula, '{display_title}', p_context->>'display_title');
    END IF;
    IF p_context ? 'category_name' THEN
      v_formula := REPLACE(v_formula, '{category_name}', p_context->>'category_name');
    END IF;
    IF p_context ? 'name' THEN
      v_formula := REPLACE(v_formula, '{name}', p_context->>'name');
    END IF;

    v_formulas[i] := v_formula;
  END LOOP;

  -- Select optimal title (53-60 chars preferred)
  v_optimal_title := NULL;
  FOREACH v_formula IN ARRAY v_formulas LOOP
    v_title_length := LENGTH(v_formula);
    IF v_title_length >= 53 AND v_title_length <= 60 THEN
      v_optimal_title := v_formula;
      EXIT;
    END IF;
    IF v_optimal_title IS NULL THEN
      v_optimal_title := v_formula;
    END IF;
  END LOOP;

  -- Truncate if too long
  IF LENGTH(v_optimal_title) > 65 THEN
    v_optimal_title := SUBSTRING(v_optimal_title, 1, 57) || '...';
    IF POSITION(' ' IN REVERSE(SUBSTRING(v_optimal_title, 1, 57))) > 0 THEN
      v_optimal_title := SUBSTRING(
        v_optimal_title, 1, 57 - POSITION(' ' IN REVERSE(SUBSTRING(v_optimal_title, 1, 57)))
      ) || '...';
    END IF;
  END IF;

  v_title := v_optimal_title;

  -- Generate description
  v_description := v_template.description_template;
  v_description := REPLACE(v_description, '{app_name}', v_app_name);
  v_description := REPLACE(v_description, '{current_year}', v_current_year);
  v_description := REPLACE(v_description, '{current_month_year}', v_current_month_year);

  IF p_context ? 'category_name' THEN
    v_description := REPLACE(v_description, '{category_name}', p_context->>'category_name');
  END IF;
  IF p_context ? 'meta_description' THEN
    v_description := REPLACE(v_description, '{meta_description}', p_context->>'meta_description');
  END IF;
  IF p_context ? 'description' THEN
    v_description := REPLACE(v_description, '{description}', p_context->>'description');
  END IF;
  IF p_context ? 'name' THEN
    v_description := REPLACE(v_description, '{name}', p_context->>'name');
  END IF;
  IF p_context ? 'follower_count' THEN
    v_description := REPLACE(v_description, '{follower_count}', (p_context->>'follower_count'));
  END IF;
  IF p_context ? 'post_count' THEN
    v_description := REPLACE(v_description, '{post_count}', (p_context->>'post_count'));
  END IF;

  -- Smart padding for description
  IF LENGTH(v_description) < 150 THEN
    v_description := v_description || ' Discover tools and resources for AI development workflows.';
  END IF;

  -- Truncate description if too long
  IF LENGTH(v_description) > 160 THEN
    v_description := SUBSTRING(v_description, 1, 157) || '...';
    IF POSITION(' ' IN REVERSE(SUBSTRING(v_description, 1, 157))) > 0 THEN
      v_description := SUBSTRING(
        v_description, 1, 157 - POSITION(' ' IN REVERSE(SUBSTRING(v_description, 1, 157)))
      ) || '...';
    END IF;
  END IF;

  -- Generate keywords
  v_keywords := v_template.default_keywords;
  IF v_template.use_current_year THEN
    v_keywords := array_append(v_keywords, v_current_year);
  END IF;
  IF p_context ? 'keywords' THEN
    v_keywords := v_keywords || ARRAY(SELECT jsonb_array_elements_text(p_context->'keywords'));
  END IF;
  IF array_length(v_keywords, 1) < 3 THEN
    v_keywords := array_append(v_keywords, 'ai');
    v_keywords := array_append(v_keywords, 'development');
  END IF;

  -- Determine OpenGraph type
  v_og_type := CASE WHEN p_route_pattern = 'CONTENT_DETAIL' THEN 'article' ELSE 'website' END;
  v_twitter_card := 'summary_large_image';

  -- Determine robots directives
  v_should_index := p_route_pattern NOT IN ('ACCOUNT', 'AUTH');
  v_should_follow := p_route_pattern != 'AUTH';
  IF p_route IS NOT NULL AND p_route LIKE '%/new%' THEN
    v_should_index := FALSE;
  END IF;

  -- Article-specific metadata
  v_authors := NULL;
  v_published_time := NULL;
  v_modified_time := NULL;
  v_should_add_llms_txt := FALSE;

  IF p_route_pattern = 'CONTENT_DETAIL' AND p_context ? 'item' THEN
    IF p_context->'item' ? 'author' THEN
      v_authors := jsonb_build_array(jsonb_build_object('name', p_context->'item'->>'author'));
    END IF;
    IF p_context->'item' ? 'date_added' THEN
      v_published_time := p_context->'item'->>'date_added';
    END IF;
    IF p_context->'item' ? 'lastModified' THEN
      v_modified_time := p_context->'item'->>'lastModified';
    END IF;
    v_should_add_llms_txt := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'title', v_title,
    'description', v_description,
    'keywords', v_keywords,
    'openGraphType', v_og_type,
    'twitterCard', v_twitter_card,
    'robots', jsonb_build_object('index', v_should_index, 'follow', v_should_follow),
    'authors', v_authors,
    'publishedTime', v_published_time,
    'modifiedTime', v_modified_time,
    'shouldAddLlmsTxt', v_should_add_llms_txt,
    'isOverride', false
  );
END;
$$;


ALTER FUNCTION "public"."generate_metadata_for_route"("p_route_pattern" "text", "p_context" "jsonb", "p_route" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_metadata_for_route"("p_route_pattern" "text", "p_context" "jsonb", "p_route" "text") IS 'Database-first metadata generation with SEO override support. Checks content_seo_overrides first, then falls back to template-based generation.';



CREATE OR REPLACE FUNCTION "public"."generate_slug"("p_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_slug TEXT;
  v_reserved_slugs TEXT[] := ARRAY[
    'api', 'admin', 'auth', 'login', 'logout', 'signup', 'dashboard',
    'settings', 'profile', 'search', 'changelog', 'about', 'contact',
    'privacy', 'terms', 'help', 'docs', 'guides', 'blog',
    'agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections',
    'new', 'edit', 'delete', 'create', 'update', 'submit', 'test', 'preview', 'draft',
    'assets', 'static', 'public', 'images', 'files', 'uploads',
    'get', 'post', 'put', 'patch', 'delete'
  ];
BEGIN
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Slug cannot be generated from empty string';
  END IF;

  v_slug := LOWER(TRIM(p_name));
  v_slug := REGEXP_REPLACE(v_slug, '[^a-z0-9\s-]', '', 'g');
  v_slug := REGEXP_REPLACE(v_slug, '\s+', '-', 'g');
  v_slug := REGEXP_REPLACE(v_slug, '-+', '-', 'g');
  v_slug := REGEXP_REPLACE(v_slug, '^-|-$', '', 'g');

  IF v_slug = '' THEN
    RAISE EXCEPTION 'Slug cannot be generated from input: "%" (contains no valid characters)', p_name;
  END IF;

  IF LENGTH(v_slug) < 3 THEN
    RAISE EXCEPTION 'Slug must be at least 3 characters (got: "%", length: %)', v_slug, LENGTH(v_slug);
  END IF;

  IF LENGTH(v_slug) > 100 THEN
    RAISE EXCEPTION 'Slug must be at most 100 characters (got length: %)', LENGTH(v_slug);
  END IF;

  IF v_slug = ANY(v_reserved_slugs) THEN
    RAISE EXCEPTION 'Slug "%" is reserved and cannot be used', v_slug;
  END IF;

  RETURN v_slug;
END;
$_$;


ALTER FUNCTION "public"."generate_slug"("p_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_slug"("p_name" "text") IS 'Generate URL-safe slug from name with validation. Replaces 61 LOC TypeScript.';



CREATE OR REPLACE FUNCTION "public"."generate_slug_from_name"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  IF NEW.slug = '' THEN
    NEW.slug := 'item-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_slug_from_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_user_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_user_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_sponsored_content"("p_content_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 5) RETURNS TABLE("id" "uuid", "user_id" "uuid", "content_type" "text", "content_id" "uuid", "tier" "text", "active" boolean, "start_date" timestamp with time zone, "end_date" timestamp with time zone, "impression_limit" integer, "impression_count" integer, "click_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.user_id,
    sc.content_type,
    sc.content_id,
    sc.tier,
    sc.active,
    sc.start_date,
    sc.end_date,
    sc.impression_limit,
    sc.impression_count,
    sc.click_count,
    sc.created_at,
    sc.updated_at
  FROM sponsored_content sc
  WHERE sc.active = true
    AND sc.start_date <= NOW()
    AND sc.end_date >= NOW()
    AND (sc.impression_limit IS NULL OR sc.impression_count < sc.impression_limit)
    AND (p_content_type IS NULL OR sc.content_type = p_content_type)
  ORDER BY sc.tier DESC, sc.created_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_active_sponsored_content"("p_content_type" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_sponsored_content"("p_content_type" "text", "p_limit" integer) IS 'Replaces client-side filtering logic. Returns only active, under-limit sponsored content.';



CREATE OR REPLACE FUNCTION "public"."get_aggregate_rating"("p_content_type" "text", "p_content_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_count INTEGER;
  v_average NUMERIC;
  v_distribution JSONB;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(AVG(rating), 0)
  INTO v_count, v_average
  FROM review_ratings
  WHERE content_type = p_content_type
    AND content_slug = p_content_slug;

  IF v_count = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'average', 0,
      'count', 0,
      'distribution', jsonb_build_object('1', 0, '2', 0, '3', 0, '4', 0, '5', 0)
    );
  END IF;

  SELECT jsonb_build_object(
    '1', COUNT(*) FILTER (WHERE rating = 1),
    '2', COUNT(*) FILTER (WHERE rating = 2),
    '3', COUNT(*) FILTER (WHERE rating = 3),
    '4', COUNT(*) FILTER (WHERE rating = 4),
    '5', COUNT(*) FILTER (WHERE rating = 5)
  ) INTO v_distribution
  FROM review_ratings
  WHERE content_type = p_content_type
    AND content_slug = p_content_slug;

  RETURN jsonb_build_object(
    'success', true,
    'average', ROUND(v_average, 1),
    'count', v_count,
    'distribution', v_distribution
  );
END;
$$;


ALTER FUNCTION "public"."get_aggregate_rating"("p_content_type" "text", "p_content_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_aggregate_rating"("p_content_type" "text", "p_content_slug" "text") IS 'Calculate rating statistics with distribution. Replaces 57 LOC TypeScript aggregation with database-native COUNT/AVG.';



CREATE OR REPLACE FUNCTION "public"."get_all_content_categories"() RETURNS TABLE("category" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT cu.category::TEXT
  FROM content_unified cu
  ORDER BY cu.category;
END;
$$;


ALTER FUNCTION "public"."get_all_content_categories"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_content_categories"() IS 'Returns all published content categories for weekly featured calculation. Uses content_unified view.';



CREATE OR REPLACE FUNCTION "public"."get_all_seo_config"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(key, value)
    FROM seo_config
  );
END;
$$;


ALTER FUNCTION "public"."get_all_seo_config"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_seo_config"() IS 'Fetch all SEO configuration as JSONB object keyed by config key.';



CREATE OR REPLACE FUNCTION "public"."get_all_structured_data_configs"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(
      category,
      jsonb_build_object(
        'schemaTypes', jsonb_build_object(
          'application', generate_application,
          'sourceCode', generate_source_code,
          'howTo', generate_how_to,
          'creativeWork', generate_creative_work,
          'faq', generate_faq,
          'breadcrumb', generate_breadcrumb,
          'speakable', generate_speakable,
          'review', generate_review,
          'aggregateRating', generate_aggregate_rating,
          'videoObject', generate_video_object,
          'course', generate_course,
          'jobPosting', generate_job_posting,
          'collectionPage', generate_collection_page
        ),
        'categoryDisplayName', category_display_name,
        'applicationSubCategory', application_sub_category,
        'defaultKeywords', default_keywords,
        'defaultRequirements', default_requirements,
        'creativeWorkDescription', creative_work_description
      )
    )
    FROM structured_data_config
    WHERE active = true
  );
END;
$$;


ALTER FUNCTION "public"."get_all_structured_data_configs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_structured_data_configs"() IS 'Fetch all structured data configurations as JSONB object keyed by category.';



CREATE OR REPLACE FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") RETURNS TABLE("content_slug" "text", "bookmark_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    content_slug,
    COUNT(*) AS bookmark_count
  FROM public.bookmarks
  WHERE content_type = category_filter
  GROUP BY content_slug
  ORDER BY bookmark_count DESC;
$$;


ALTER FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "reputation" integer, "posts" integer, "comments" integer, "votes_received" integer, "followers" integer, "submissions" integer, "reviews" integer, "bookmarks_received" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- SECURITY: Validate batch size to prevent abuse
  IF array_length(user_ids, 1) > 1000 THEN
    RAISE EXCEPTION 'Maximum 1000 users per batch. Requested: %', array_length(user_ids, 1);
  END IF;

  -- PRIMARY PATH: Query pre-computed materialized view
  RETURN QUERY
  SELECT
    s.user_id,
    s.reputation::INTEGER,
    s.posts::INTEGER,
    s.comments::INTEGER,
    s.votes_received::INTEGER,
    s.followers::INTEGER,
    s.submissions::INTEGER,
    s.reviews::INTEGER,
    s.bookmarks_received::INTEGER
  FROM public.user_badge_stats s
  WHERE s.user_id = ANY(user_ids);

  -- FALLBACK PATH: Compute on-the-fly if materialized view not populated
  -- ✅ SECURITY FIX: Removed auth.users JOIN, use only public.users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      u.id AS user_id,
      COALESCE(u.reputation_score, 0)::INTEGER AS reputation,
      COALESCE(p.post_count, 0)::INTEGER AS posts,
      COALESCE(c.comment_count, 0)::INTEGER AS comments,
      COALESCE(v.votes_received, 0)::INTEGER AS votes_received,
      COALESCE(f.follower_count, 0)::INTEGER AS followers,
      0::INTEGER AS submissions,
      0::INTEGER AS reviews,
      0::INTEGER AS bookmarks_received
    FROM
      public.users u  -- ✅ FIXED: Direct query to public.users, no auth.users
      INNER JOIN unnest(user_ids) AS u_ids(id) ON u.id = u_ids.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS post_count
      FROM public.posts
      GROUP BY user_id
    ) p ON p.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS comment_count
      FROM public.comments
      GROUP BY user_id
    ) c ON c.user_id = u.id
    LEFT JOIN (
      SELECT user_id, SUM(vote_count) AS votes_received
      FROM public.posts
      GROUP BY user_id
    ) v ON v.user_id = u.id
    LEFT JOIN (
      SELECT following_id AS user_id, COUNT(*) AS follower_count
      FROM public.followers
      GROUP BY following_id
    ) f ON f.user_id = u.id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) IS 'Fetches user stats for multiple users in a single query. Uses materialized view if available, falls back to live query. Max 1000 users per batch. SECURITY HARDENED: No auth.users dependency.';



CREATE OR REPLACE FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "reputation" integer, "posts" integer, "comments" integer, "votes_received" integer, "followers" integer, "submissions" integer, "reviews" integer, "bookmarks_received" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- SECURITY: Validate batch size
  IF array_length(user_ids, 1) > 1000 THEN
    RAISE EXCEPTION 'Maximum 1000 users per batch. Requested: %', array_length(user_ids, 1);
  END IF;

  -- Always compute fresh (no materialized view)
  -- ✅ SECURITY FIX: Removed auth.users JOIN, use only public.users
  RETURN QUERY
  SELECT
    u.id AS user_id,
    COALESCE(u.reputation_score, 0)::INTEGER AS reputation,
    COALESCE(p.post_count, 0)::INTEGER AS posts,
    COALESCE(c.comment_count, 0)::INTEGER AS comments,
    COALESCE(v.votes_received, 0)::INTEGER AS votes_received,
    COALESCE(f.follower_count, 0)::INTEGER AS followers,
    0::INTEGER AS submissions,
    0::INTEGER AS reviews,
    0::INTEGER AS bookmarks_received
  FROM
    public.users u  -- ✅ FIXED: Direct query to public.users, no auth.users
    INNER JOIN unnest(user_ids) AS u_ids(id) ON u.id = u_ids.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS post_count
    FROM public.posts
    GROUP BY user_id
  ) p ON p.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS comment_count
    FROM public.comments
    GROUP BY user_id
  ) c ON c.user_id = u.id
  LEFT JOIN (
    SELECT user_id, SUM(vote_count) AS votes_received
    FROM public.posts
    GROUP BY user_id
  ) v ON v.user_id = u.id
  LEFT JOIN (
    SELECT following_id AS user_id, COUNT(*) AS follower_count
    FROM public.followers
    GROUP BY following_id
  ) f ON f.user_id = u.id;
END;
$$;


ALTER FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) IS 'Always computes fresh stats (bypasses materialized view). Use for debugging or when real-time accuracy is critical. Max 1000 users per batch. SECURITY HARDENED: No auth.users dependency.';



CREATE OR REPLACE FUNCTION "public"."get_category_config"("p_category" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_config jsonb;
begin
  select to_jsonb(category_configs.*) into v_config
  from public.category_configs
  where category = p_category::public.content_category;
  
  return v_config;
end;
$$;


ALTER FUNCTION "public"."get_category_config"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_category_config"("p_category" "text") IS 'Fetch category configuration as JSONB for a given category. Returns null if category not found.';



CREATE OR REPLACE FUNCTION "public"."get_changelog_entries"("p_category" "text" DEFAULT NULL::"text", "p_published_only" boolean DEFAULT true, "p_featured_only" boolean DEFAULT false, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  WITH filtered_entries AS (
    SELECT DISTINCT ce.id
    FROM public.changelog_entries ce
    LEFT JOIN public.changelog_changes cc ON cc.changelog_entry_id = ce.id
    WHERE 
      (NOT p_published_only OR ce.published = true)
      AND (NOT p_featured_only OR ce.featured = true)
      AND (p_category IS NULL OR cc.category = p_category)
    ORDER BY ce.release_date DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  enriched_entries AS (
    SELECT
      ce.id,
      ce.slug,
      ce.title,
      ce.tldr,
      ce.description,
      ce.content,
      ce.raw_content,
      ce.release_date,
      ce.release_date as date, -- Alias for backward compatibility
      ce.featured,
      ce.published,
      ce.keywords,
      ce.created_at,
      ce.updated_at,
      -- Aggregate categories into JSONB object
      (
        SELECT jsonb_object_agg(
          category,
          changes_array
        )
        FROM (
          SELECT
            cc.category,
            jsonb_agg(cc.change_text ORDER BY cc.display_order) as changes_array
          FROM public.changelog_changes cc
          WHERE cc.changelog_entry_id = ce.id
          GROUP BY cc.category
        ) category_groups
      ) as categories,
      -- Pre-compute category counts
      (
        SELECT jsonb_object_agg(category, count)
        FROM (
          SELECT cc.category, COUNT(*)::int as count
          FROM public.changelog_changes cc
          WHERE cc.changelog_entry_id = ce.id
          GROUP BY cc.category
        ) counts
      ) as category_counts
    FROM public.changelog_entries ce
    WHERE ce.id IN (SELECT id FROM filtered_entries)
    ORDER BY ce.release_date DESC
  ),
  total_count AS (
    SELECT COUNT(DISTINCT ce.id)::int as count
    FROM public.changelog_entries ce
    LEFT JOIN public.changelog_changes cc ON cc.changelog_entry_id = ce.id
    WHERE 
      (NOT p_published_only OR ce.published = true)
      AND (NOT p_featured_only OR ce.featured = true)
      AND (p_category IS NULL OR cc.category = p_category)
  )
  SELECT jsonb_build_object(
    'entries', COALESCE(jsonb_agg(row_to_json(enriched_entries)::jsonb), '[]'::jsonb),
    'total', (SELECT count FROM total_count),
    'limit', p_limit,
    'offset', p_offset,
    'hasMore', (SELECT count FROM total_count) > (p_offset + p_limit)
  ) INTO result
  FROM enriched_entries;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_changelog_entries"("p_category" "text", "p_published_only" boolean, "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_changelog_entry_by_slug"("p_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', ce.id,
    'slug', ce.slug,
    'title', ce.title,
    'tldr', ce.tldr,
    'description', ce.description,
    'content', ce.content,
    'raw_content', ce.raw_content,
    'release_date', ce.release_date,
    'date', ce.release_date, -- Alias for backward compatibility
    'featured', ce.featured,
    'published', ce.published,
    'keywords', ce.keywords,
    'created_at', ce.created_at,
    'updated_at', ce.updated_at,
    'categories', (
      SELECT jsonb_object_agg(
        category,
        changes_array
      )
      FROM (
        SELECT
          cc.category,
          jsonb_agg(cc.change_text ORDER BY cc.display_order) as changes_array
        FROM public.changelog_changes cc
        WHERE cc.changelog_entry_id = ce.id
        GROUP BY cc.category
      ) category_groups
    )
  ) INTO result
  FROM public.changelog_entries ce
  WHERE ce.slug = p_slug;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_changelog_entry_by_slug"("p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_changelog_metadata"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  WITH category_counts AS (
    SELECT
      cc.category,
      COUNT(DISTINCT cc.changelog_entry_id)::int as count
    FROM public.changelog_changes cc
    JOIN public.changelog_entries ce ON ce.id = cc.changelog_entry_id
    WHERE ce.published = true
    GROUP BY cc.category
  ),
  date_range AS (
    SELECT
      MIN(release_date) as earliest,
      MAX(release_date) as latest
    FROM public.changelog_entries
    WHERE published = true
  ),
  total_entries AS (
    SELECT COUNT(*)::int as count
    FROM public.changelog_entries
    WHERE published = true
  )
  SELECT jsonb_build_object(
    'totalEntries', (SELECT count FROM total_entries),
    'dateRange', (
      SELECT jsonb_build_object(
        'earliest', earliest,
        'latest', latest
      )
      FROM date_range
    ),
    'categoryCounts', (
      SELECT jsonb_object_agg(
        category,
        count
      )
      FROM category_counts
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_changelog_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_changelog_with_category_stats"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 1000, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_entries JSONB;
  v_counts JSONB;
  v_total INTEGER;
BEGIN
  -- Get filtered entries
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'slug', slug,
      'title', title,
      'description', description,
      'tldr', tldr,
      'content', content,
      'raw_content', raw_content,
      'changes', changes,
      'release_date', release_date,
      'featured', featured,
      'published', published,
      'keywords', keywords,
      'created_at', created_at,
      'updated_at', updated_at
    ) ORDER BY release_date DESC
  )
  INTO v_entries
  FROM (
    SELECT *
    FROM changelog_entries
    WHERE published = true
      AND (
        p_category IS NULL OR 
        p_category = 'All' OR 
        CASE p_category
          WHEN 'Added' THEN jsonb_array_length(COALESCE(changes->'Added', '[]'::jsonb)) > 0
          WHEN 'Changed' THEN jsonb_array_length(COALESCE(changes->'Changed', '[]'::jsonb)) > 0
          WHEN 'Fixed' THEN jsonb_array_length(COALESCE(changes->'Fixed', '[]'::jsonb)) > 0
          WHEN 'Removed' THEN jsonb_array_length(COALESCE(changes->'Removed', '[]'::jsonb)) > 0
          WHEN 'Deprecated' THEN jsonb_array_length(COALESCE(changes->'Deprecated', '[]'::jsonb)) > 0
          WHEN 'Security' THEN jsonb_array_length(COALESCE(changes->'Security', '[]'::jsonb)) > 0
          ELSE false
        END
      )
    ORDER BY release_date DESC
    LIMIT p_limit
    OFFSET p_offset
  ) filtered_entries;

  -- Count total entries
  SELECT COUNT(*) 
  INTO v_total 
  FROM changelog_entries 
  WHERE published = true;

  -- Build category counts (all done in single query)
  SELECT jsonb_build_object(
    'All', v_total,
    'Added', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Added', '[]'::jsonb)) > 0),
    'Changed', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Changed', '[]'::jsonb)) > 0),
    'Fixed', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Fixed', '[]'::jsonb)) > 0),
    'Removed', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Removed', '[]'::jsonb)) > 0),
    'Deprecated', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Deprecated', '[]'::jsonb)) > 0),
    'Security', COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(changes->'Security', '[]'::jsonb)) > 0)
  )
  INTO v_counts
  FROM changelog_entries
  WHERE published = true;

  -- Return combined result
  RETURN jsonb_build_object(
    'entries', COALESCE(v_entries, '[]'::jsonb),
    'category_counts', v_counts,
    'total', v_total,
    'filtered_count', jsonb_array_length(COALESCE(v_entries, '[]'::jsonb))
  );
END;
$$;


ALTER FUNCTION "public"."get_changelog_with_category_stats"("p_category" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_changelog_with_category_stats"("p_category" "text", "p_limit" integer, "p_offset" integer) IS 'Database-first changelog filtering with category statistics. Replaces client-side TypeScript filtering (O(n)) with PostgreSQL GIN-indexed JSONB queries (O(log n)). Returns filtered entries + counts in single RPC call.';



CREATE OR REPLACE FUNCTION "public"."get_content_affinity"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT affinity_score
    FROM user_affinities
    WHERE user_id = p_user_id
      AND content_type = p_content_type
      AND content_slug = p_content_slug
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_content_affinity"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_content_affinity"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") IS 'Get single content affinity score for user. Returns NULL if not found.';



CREATE OR REPLACE FUNCTION "public"."get_content_with_analytics"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "date_added" timestamp with time zone, "view_count" bigint, "copy_count" bigint, "bookmark_count" bigint)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.category,
    ci.slug,
    COALESCE(ci.data->>'title', ci.data->>'name', '')::TEXT AS title,
    COALESCE(ci.data->>'description', '')::TEXT AS description,
    COALESCE((ci.data->>'dateAdded')::TIMESTAMPTZ, ci.created_at) AS date_added,
    COALESCE(a.view_count, 0) AS view_count,
    COALESCE(a.copy_count, 0) AS copy_count,
    COALESCE(a.bookmark_count, 0) AS bookmark_count
  FROM public.content_items ci
  LEFT JOIN public.mv_analytics_summary a ON ci.category = a.category AND ci.slug = a.slug
  WHERE (p_category IS NULL OR ci.category = p_category)
    AND ci.category IN ('agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines', 'skills', 'collections')
  ORDER BY date_added DESC NULLS LAST
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) IS 'Helper function to get content items enriched with analytics data from mv_analytics_summary. Used by digest functions.';



CREATE OR REPLACE FUNCTION "public"."get_due_sequence_emails"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sequence_id TEXT := 'onboarding';
  v_now TIMESTAMPTZ := NOW();
  v_result JSONB;
BEGIN
  -- Get all due emails with active sequences
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ess.id,
      'email', ess.email,
      'step', ess.step
    )
  ), '[]'::JSONB) INTO v_result
  FROM email_sequence_schedule ess
  INNER JOIN email_sequences es
    ON es.sequence_id = ess.sequence_id
    AND es.email = ess.email
  WHERE ess.sequence_id = v_sequence_id
    AND ess.processed = false
    AND ess.due_at <= v_now
    AND es.status = 'active' -- Only process active sequences
  ORDER BY ess.due_at ASC
  LIMIT 100; -- Safety limit: max 100 emails per batch

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_due_sequence_emails"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_due_sequence_emails"() IS 'Get all due sequence emails (processed=false, due_at<=now). Returns JSONB array.';



CREATE OR REPLACE FUNCTION "public"."get_enriched_content"("p_category" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text", "p_slugs" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  
  -- Route to specific table based on category for full schema access
  CASE p_category
    
    -- ========================================================================
    -- AGENTS
    -- ========================================================================
    WHEN 'agents' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            a.id, a.slug, a.title, a.description, a.author, a.author_profile_url,
            a.category, a.tags, 'agents', a.created_at, a.updated_at, a.date_added,
            a.discovery_metadata, a.examples, a.features, a.troubleshooting, a.use_cases,
            a.source, a.documentation_url, a.popularity_score, a.content, a.seo_title, a.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'configuration', a.configuration,
            'installation', a.installation
          )
        ) as row_to_json
        FROM public.agents a
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = a.slug AND mv.category = a.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = a.id AND sc.content_type = 'agents'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR a.slug = p_slug)
          AND (p_slugs IS NULL OR a.slug = ANY(p_slugs))
        ORDER BY a.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- MCP
    -- ========================================================================
    WHEN 'mcp' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            m.id, m.slug, m.title, m.description, m.author, m.author_profile_url,
            m.category, m.tags, 'mcp', m.created_at, m.updated_at, m.date_added,
            m.discovery_metadata, m.examples, m.features, m.troubleshooting, m.use_cases,
            m.source, m.documentation_url, m.popularity_score, m.content, m.seo_title, m.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'server_type', m.server_type,
            'mcp_version', m.mcp_version,
            'requires_auth', m.requires_auth,
            'auth_type', m.auth_type,
            'configuration', m.configuration,
            'installation', m.installation,
            'capabilities', m.capabilities,
            'tools_provided', m.tools_provided,
            'resources_provided', m.resources_provided,
            'data_types', m.data_types,
            'transport', m.transport,
            'server_info', m.server_info,
            'security', m.security,
            'permissions', m.permissions,
            'config_location', m.config_location,
            'package', m.package
          )
        ) as row_to_json
        FROM public.mcp m
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = m.slug AND mv.category = m.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = m.id AND sc.content_type = 'mcp'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR m.slug = p_slug)
          AND (p_slugs IS NULL OR m.slug = ANY(p_slugs))
        ORDER BY m.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- COMMANDS
    -- ========================================================================
    WHEN 'commands' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            c.id, c.slug, c.title, c.description, c.author, c.author_profile_url,
            c.category, c.tags, 'commands', c.created_at, c.updated_at, c.date_added,
            c.discovery_metadata, c.examples, c.features, c.troubleshooting, c.use_cases,
            c.source, c.documentation_url, c.popularity_score, c.content, c.seo_title, c.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'configuration', c.configuration,
            'installation', c.installation
          )
        ) as row_to_json
        FROM public.commands c
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = c.slug AND mv.category = c.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = c.id AND sc.content_type = 'commands'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR c.slug = p_slug)
          AND (p_slugs IS NULL OR c.slug = ANY(p_slugs))
        ORDER BY c.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- RULES
    -- ========================================================================
    WHEN 'rules' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            r.id, r.slug, r.title, r.description, r.author, r.author_profile_url,
            r.category, r.tags, 'rules', r.created_at, r.updated_at, r.date_added,
            r.discovery_metadata, r.examples, r.features, r.troubleshooting, r.use_cases,
            r.source, r.documentation_url, r.popularity_score, r.content, r.seo_title, r.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'configuration', r.configuration,
            'expertise_areas', r.expertise_areas,
            'requirements', r.requirements,
            'related_rules', r.related_rules
          )
        ) as row_to_json
        FROM public.rules r
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = r.slug AND mv.category = r.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = r.id AND sc.content_type = 'rules'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR r.slug = p_slug)
          AND (p_slugs IS NULL OR r.slug = ANY(p_slugs))
        ORDER BY r.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- HOOKS
    -- ========================================================================
    WHEN 'hooks' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            h.id, h.slug, h.title, h.description, h.author, h.author_profile_url,
            h.category, h.tags, 'hooks', h.created_at, h.updated_at, h.date_added,
            h.discovery_metadata, h.examples, h.features, h.troubleshooting, h.use_cases,
            h.source, h.documentation_url, h.popularity_score, h.content, h.seo_title, h.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'hook_type', h.hook_type,
            'event_types', h.event_types,
            'configuration', h.configuration,
            'installation', h.installation,
            'requirements', h.requirements
          )
        ) as row_to_json
        FROM public.hooks h
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = h.slug AND mv.category = h.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = h.id AND sc.content_type = 'hooks'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR h.slug = p_slug)
          AND (p_slugs IS NULL OR h.slug = ANY(p_slugs))
        ORDER BY h.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- STATUSLINES
    -- ========================================================================
    WHEN 'statuslines' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            s.id, s.slug, s.title, s.description, s.author, s.author_profile_url,
            s.category, s.tags, 'statuslines', s.created_at, s.updated_at, s.date_added,
            s.discovery_metadata, s.examples, s.features, s.troubleshooting, s.use_cases,
            s.source, s.documentation_url, s.popularity_score, s.content, s.seo_title, s.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'statusline_type', s.statusline_type,
            'preview', s.preview,
            'refresh_rate_ms', s.refresh_rate_ms,
            'configuration', s.configuration,
            'installation', s.installation,
            'requirements', s.requirements
          )
        ) as row_to_json
        FROM public.statuslines s
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = s.slug AND mv.category = s.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = s.id AND sc.content_type = 'statuslines'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR s.slug = p_slug)
          AND (p_slugs IS NULL OR s.slug = ANY(p_slugs))
        ORDER BY s.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- SKILLS
    -- ========================================================================
    WHEN 'skills' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            sk.id, sk.slug, sk.title, sk.description, sk.author, sk.author_profile_url,
            sk.category, sk.tags, 'skills', sk.created_at, sk.updated_at, sk.date_added,
            sk.discovery_metadata, sk.examples, sk.features, sk.troubleshooting, sk.use_cases,
            sk.source, sk.documentation_url, sk.popularity_score, sk.content, sk.seo_title, sk.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'difficulty', sk.difficulty,
            'estimated_time', sk.estimated_time,
            'dependencies', sk.dependencies
          )
        ) as row_to_json
        FROM public.skills sk
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = sk.slug AND mv.category = sk.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = sk.id AND sc.content_type = 'skills'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR sk.slug = p_slug)
          AND (p_slugs IS NULL OR sk.slug = ANY(p_slugs))
        ORDER BY sk.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- GUIDES
    -- ========================================================================
    WHEN 'guides' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            g.id, g.slug, g.title, g.description, g.author, g.author_profile_url,
            g.category, g.tags, 'guides', g.created_at, g.updated_at, g.date_added,
            NULL, NULL, NULL, NULL, NULL, -- guides don't have discovery_metadata, examples, features, troubleshooting, use_cases
            g.source, g.documentation_url, NULL, NULL, g.seo_title, NULL,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'difficulty', g.difficulty,
            'subcategory', g.subcategory,
            'sections', g.sections,
            'keywords', g.keywords,
            'reading_time', g.reading_time,
            'related_guides', g.related_guides,
            'github_url', g.github_url,
            'date_published', g.date_published,
            'date_modified', g.date_modified,
            'date_updated', g.date_updated,
            'last_reviewed', g.last_reviewed,
            'featured', g.featured,
            'ai_optimized', g.ai_optimized,
            'citation_ready', g.citation_ready,
            'community_driven', g.community_driven,
            'community_engagement', g.community_engagement
          )
        ) as row_to_json
        FROM public.guides g
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = g.slug AND mv.category = g.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = g.id AND sc.content_type = 'guides'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR g.slug = p_slug)
          AND (p_slugs IS NULL OR g.slug = ANY(p_slugs))
        ORDER BY g.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- COLLECTIONS
    -- ========================================================================
    WHEN 'collections' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            co.id, co.slug, co.title, co.description, co.author, co.author_profile_url,
            co.category, co.tags, 'collections', co.created_at, co.updated_at, co.date_added,
            co.discovery_metadata, co.examples, co.features, co.troubleshooting, co.use_cases,
            co.source, co.documentation_url, co.popularity_score, co.content, co.seo_title, co.display_title,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          ) || jsonb_build_object(
            'collectionType', co.collection_type,
            'difficulty', co.difficulty,
            'itemCount', COALESCE(jsonb_array_length(co.items), 0),
            'configuration', co.configuration,
            'installation', co.installation,
            'compatibility', co.compatibility,
            'prerequisites', co.prerequisites,
            'related_collections', co.related_collections,
            'installation_order', co.installation_order,
            'estimated_setup_time', co.estimated_setup_time,
            'usage', co.usage,
            'further_reading', co.further_reading,
            'items', co.items
          )
        ) as row_to_json
        FROM public.collections co
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = co.slug AND mv.category = co.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = co.id AND sc.content_type = 'collections'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR co.slug = p_slug)
          AND (p_slugs IS NULL OR co.slug = ANY(p_slugs))
        ORDER BY co.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- JOBS
    -- ========================================================================
    WHEN 'jobs' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          jsonb_build_object(
            'id', j.id,
            'slug', j.slug,
            'title', j.title,
            'description', j.description,
            'author', j.company,
            'author_profile_url', NULL,
            'category', j.category,
            'tags', j.tags,
            'source_table', 'jobs',
            'created_at', j.created_at,
            'updated_at', j.updated_at,
            'date_added', j.created_at,
            -- Jobs-specific fields (from actual schema)
            'company', j.company,
            'company_id', j.company_id,
            'company_logo', j.company_logo,
            'contact_email', j.contact_email,
            'location', j.location,
            'remote', j.remote,
            'salary', j.salary,
            'experience', j.experience,
            'link', j.link,
            'requirements', j.requirements,
            'benefits', j.benefits,
            'status', j.status,
            'expires_at', j.expires_at,
            'posted_at', j.posted_at,
            'featured', j.featured,
            'plan', j.plan,
            'payment_status', j.payment_status,
            'payment_method', j.payment_method,
            'payment_amount', j.payment_amount,
            'payment_date', j.payment_date,
            'payment_reference', j.payment_reference,
            'admin_notes', j.admin_notes,
            'click_count', j.click_count,
            'view_count', COALESCE(j.view_count, 0),
            'workplace', j.workplace,
            'type', j.type,
            'active', j.active,
            'order', j.order,
            -- Analytics (jobs don't use mv_analytics_summary)
            'viewCount', COALESCE(j.view_count, 0),
            'copyCount', 0,
            'bookmarkCount', 0,
            -- Computed
            'isNew', (j.created_at::date >= (CURRENT_DATE - INTERVAL '7 days')::date),
            -- Sponsorship
            'isSponsored', (sc.id IS NOT NULL AND sc.active = true),
            'sponsoredId', sc.id,
            'sponsorTier', sc.tier
          )
        ) as row_to_json
        FROM public.jobs j
        LEFT JOIN public.sponsored_content sc ON sc.content_id = j.id AND sc.content_type = 'jobs'
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_slug IS NULL OR j.slug = p_slug)
          AND (p_slugs IS NULL OR j.slug = ANY(p_slugs))
        ORDER BY j.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- CHANGELOG
    -- ========================================================================
    WHEN 'changelog' THEN
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          jsonb_build_object(
            'id', ch.id,
            'slug', ch.slug,
            'title', ch.title,
            'description', ch.description,
            'author', 'Claude Pro Directory',
            'author_profile_url', NULL,
            'category', 'changelog',
            'tags', '[]'::jsonb,
            'source_table', 'changelog_entries',
            'created_at', ch.created_at,
            'updated_at', ch.updated_at,
            'date_added', ch.release_date,
            -- Changelog-specific fields
            'release_date', ch.release_date,
            'tldr', ch.tldr,
            'content', ch.content,
            'raw_content', ch.raw_content,
            'changes', ch.changes,
            'published', ch.published,
            'featured', ch.featured,
            'keywords', ch.keywords,
            -- Analytics
            'viewCount', COALESCE(mv.view_count, 0),
            'copyCount', COALESCE(mv.copy_count, 0),
            'bookmarkCount', COALESCE(mv.bookmark_count, 0),
            -- Computed
            'isNew', (ch.release_date::date >= (CURRENT_DATE - INTERVAL '7 days')::date),
            -- Sponsorship (changelog typically not sponsored)
            'isSponsored', false,
            'sponsoredId', NULL,
            'sponsorTier', NULL
          )
        ) as row_to_json
        FROM public.changelog_entries ch
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = ch.slug AND mv.category = 'changelog'
        WHERE (p_slug IS NULL OR ch.slug = p_slug)
          AND (p_slugs IS NULL OR ch.slug = ANY(p_slugs))
        ORDER BY ch.release_date DESC
        LIMIT p_limit OFFSET p_offset
      ) subquery;

    -- ========================================================================
    -- NO CATEGORY (all from content_unified)
    -- ========================================================================
    ELSE
      SELECT jsonb_agg(row_to_json) INTO v_result FROM (
        SELECT (
          build_enriched_content_base(
            cu.id, cu.slug, cu.title, cu.description, cu.author, cu.author_profile_url,
            cu.category, cu.tags, cu.source_table, cu.created_at, cu.updated_at, cu.date_added,
            cu.discovery_metadata, cu.examples, cu.features, cu.troubleshooting, cu.use_cases,
            NULL, NULL, NULL, NULL, NULL, NULL,
            mv.view_count, mv.copy_count, mv.bookmark_count,
            sc.id, sc.tier, sc.active
          )
        ) as row_to_json
        FROM public.content_unified cu
        LEFT JOIN public.mv_analytics_summary mv ON mv.slug = cu.slug AND mv.category = cu.category
        LEFT JOIN public.sponsored_content sc ON sc.content_id = cu.id AND sc.content_type = cu.category
          AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
        WHERE (p_category IS NULL OR cu.category = p_category)
          AND (p_slug IS NULL OR cu.slug = p_slug)
          AND (p_slugs IS NULL OR cu.slug = ANY(p_slugs))
        ORDER BY cu.slug
        LIMIT p_limit OFFSET p_offset
      ) subquery;
  END CASE;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) IS 'Returns fully enriched content with analytics, sponsorship, and computed fields for ALL 11 categories: agents, mcp, commands, rules, hooks, statuslines, skills, guides, collections, jobs, changelog. Single unified database-driven system.';



CREATE OR REPLACE FUNCTION "public"."get_featured_content"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 10) RETURNS TABLE("content_type" "text", "content_slug" "text", "rank" bigint, "final_score" numeric, "trending_score" numeric, "rating_score" numeric, "engagement_score" numeric, "freshness_score" numeric, "views_24h" bigint, "growth_rate_pct" numeric, "bookmark_count" bigint, "copy_count" bigint, "comment_count" bigint, "total_views" bigint, "days_old" numeric, "calculated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.content_type,
    mf.content_slug,
    mf.rank,
    mf.final_score,
    mf.trending_score,
    mf.rating_score,
    mf.engagement_score,
    mf.freshness_score,
    mf.views_24h,
    mf.growth_rate_pct,
    mf.bookmark_count,
    mf.copy_count,
    mf.comment_count,
    mf.total_views,
    mf.days_old,
    mf.calculated_at
  FROM mv_featured_scores mf
  WHERE
    (p_category IS NULL OR mf.content_type = p_category)
    AND mf.rank <= p_limit
  ORDER BY mf.content_type, mf.rank;
END;
$$;


ALTER FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) IS 'Returns featured content scores from materialized view. Optional category filter and limit.';



CREATE OR REPLACE FUNCTION "public"."get_form_field_config"("p_form_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Fetch all fields for the form type, grouped by field_group
  SELECT jsonb_build_object(
    'formType', p_form_type,
    'fields', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', field_name,
          'label', field_label,
          'type', field_type::text,
          'required', required,
          'placeholder', placeholder,
          'helpText', help_text,
          'defaultValue', default_value,
          'gridColumn', grid_column::text,
          'iconName', icon_name,
          'iconPosition', COALESCE(icon_position::text, 'left'),
          'config', config,
          'fieldGroup', field_group,
          'displayOrder', display_order
        ) ORDER BY display_order ASC
      )
      FROM public.form_field_configs
      WHERE form_type = p_form_type
        AND enabled = true
    )
  ) INTO v_result;

  -- Return NULL if no config found
  IF v_result->>'fields' IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_form_field_config"("p_form_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") IS 'Fetch form field configuration for a given form type. Returns JSONB with all field definitions ordered by display_order.';



CREATE OR REPLACE FUNCTION "public"."get_form_fields_for_content_type"("p_content_type" "public"."content_category") RETURNS TABLE("id" "uuid", "field_scope" "public"."field_scope", "field_name" "text", "field_type" "public"."field_type", "label" "text", "placeholder" "text", "help_text" "text", "required" boolean, "grid_column" "public"."grid_column", "field_order" integer, "icon" "text", "icon_position" "public"."icon_position", "field_properties" "jsonb", "select_options" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.field_scope,
    f.field_name,
    f.field_type,
    f.label,
    f.placeholder,
    f.help_text,
    f.required,
    f.grid_column,
    f.field_order,
    f.icon,
    f.icon_position,
    f.field_properties,
    CASE
      WHEN f.field_type = 'select' THEN (
        SELECT jsonb_agg(
          jsonb_build_object(
            'value', o.option_value,
            'label', o.option_label
          ) ORDER BY o.option_order
        )
        FROM form_select_options o
        WHERE o.field_id = f.id AND o.active = TRUE
      )
      ELSE NULL
    END as select_options
  FROM form_field_definitions f
  WHERE f.active = TRUE
    AND (
      f.field_scope = 'common' OR
      (f.field_scope = 'type_specific' AND f.content_type = p_content_type) OR
      f.field_scope = 'tags'
    )
  ORDER BY
    CASE f.field_scope
      WHEN 'common' THEN 1
      WHEN 'type_specific' THEN 2
      WHEN 'tags' THEN 3
    END,
    f.field_order;
END;
$$;


ALTER FUNCTION "public"."get_form_fields_for_content_type"("p_content_type" "public"."content_category") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_form_fields_for_content_type"("p_content_type" "public"."content_category") IS 'Retrieves all form fields for a content type (common + type-specific + tags) with select options included.';



CREATE OR REPLACE FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Group fields by field_group (common, type_specific, tags)
  SELECT jsonb_object_agg(
    field_group,
    fields
  )
  FROM (
    SELECT 
      field_group,
      jsonb_agg(
        jsonb_build_object(
          'name', field_name,
          'label', field_label,
          'type', field_type::text,
          'required', required,
          'placeholder', placeholder,
          'helpText', help_text,
          'defaultValue', default_value,
          'gridColumn', grid_column::text,
          'iconName', icon_name,
          'iconPosition', COALESCE(icon_position::text, 'left'),
          'config', config
        ) ORDER BY display_order ASC
      ) AS fields
    FROM public.form_field_configs
    WHERE form_type = p_form_type
      AND enabled = true
    GROUP BY field_group
  ) grouped
  INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") IS 'Fetch form fields grouped by field_group (common, type_specific, tags). Useful for rendering forms in sections.';



CREATE OR REPLACE FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_week_start DATE;
  v_category TEXT;
  v_category_data JSONB;
  v_result JSONB := '{}'::JSONB;
  v_stats JSONB := '{}'::JSONB;
BEGIN
  -- Calculate week start if not provided (Monday-based weeks)
  v_week_start := COALESCE(
    p_week_start,
    (DATE_TRUNC('week', CURRENT_DATE) +
     CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0
          THEN INTERVAL '-6 days'
          ELSE INTERVAL '1 day' * (1 - EXTRACT(DOW FROM CURRENT_DATE)::int)
     END)::DATE
  );

  -- Build enriched category data (analytics + featured flags)
  FOR v_category IN SELECT unnest(p_category_ids)
  LOOP
    -- Get content for this category with analytics and featured data
    EXECUTE format($query$
      SELECT COALESCE(jsonb_agg(item_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'title', c.title,
          'description', c.description,
          'author', c.author,
          'tags', c.tags,
          'created_at', c.created_at,
          'date_added', c.date_added,
          'category', %L,
          'viewCount', COALESCE(a.view_count, 0),
          'copyCount', COALESCE(a.copy_count, 0),
          '_featured', CASE
            WHEN f.rank IS NOT NULL
            THEN jsonb_build_object('rank', f.rank, 'score', f.final_score)
            ELSE NULL
          END
        ) as item_data
        FROM %I c
        LEFT JOIN mv_analytics_summary a
          ON a.category = %L AND a.slug = c.slug
        LEFT JOIN featured_configs f
          ON f.content_type = %L
          AND f.content_slug = c.slug
          AND f.week_start = %L
        ORDER BY c.created_at DESC
        LIMIT 100
      ) items
    $query$, v_category, v_category, v_category, v_category, v_week_start)
    INTO v_category_data;

    -- Add to result
    v_result := v_result || jsonb_build_object(v_category, v_category_data);

    -- Build stats count
    EXECUTE format('SELECT COUNT(*)::integer FROM %I', v_category) INTO v_stats;
    v_stats := jsonb_build_object(v_category, v_stats);
  END LOOP;

  -- Add allConfigs (deduplicated across categories)
  v_result := v_result || jsonb_build_object(
    'allConfigs',
    (
      SELECT COALESCE(jsonb_agg(DISTINCT item), '[]'::jsonb)
      FROM (
        SELECT jsonb_array_elements(value) as item
        FROM jsonb_each(v_result)
        WHERE key = ANY(p_category_ids)
      ) all_items
    )
  );

  -- Add stats (including guides and changelog)
  v_stats := v_stats || jsonb_build_object(
    'guides', (SELECT COUNT(*)::integer FROM guides),
    'changelog', (SELECT COUNT(*)::integer FROM changelog)
  );

  -- Return complete enriched data
  RETURN jsonb_build_object(
    'categoryData', v_result,
    'stats', v_stats,
    'weekStart', v_week_start
  );
END;
$_$;


ALTER FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") IS 'Replaces 135 lines of TypeScript enrichment logic. Single call returns all homepage data with analytics and featured flags.';



CREATE OR REPLACE FUNCTION "public"."get_metadata_template"("p_route_pattern" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_template JSONB;
BEGIN
  SELECT jsonb_build_object(
    'routePattern', route_pattern,
    'titleFormulas', title_formulas,
    'descriptionTemplate', description_template,
    'defaultKeywords', default_keywords,
    'useCurrentYear', use_current_year,
    'useCurrentMonthYear', use_current_month_year
  ) INTO v_template
  FROM metadata_templates
  WHERE route_pattern = p_route_pattern AND active = true;

  RETURN COALESCE(v_template, '{}'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_metadata_template"("p_route_pattern" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_metadata_template"("p_route_pattern" "text") IS 'Fetch metadata template configuration for a route pattern. Returns JSONB.';



CREATE OR REPLACE FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer DEFAULT 5) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "date_added" timestamp with time zone, "url" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    nc.category,
    nc.slug,
    nc.title,
    nc.description,
    nc.date_added,
    'https://claudepro.directory/' || nc.category || '/' || nc.slug AS url
  FROM public.mv_weekly_new_content nc
  WHERE nc.week_start = p_week_start
    AND nc.week_rank <= p_limit
  ORDER BY nc.date_added DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) IS 'Get new content added during a specific week. Used for weekly digest emails.';



CREATE OR REPLACE FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_recommendations JSONB;
  v_user_has_history BOOLEAN;
  v_bookmarked_content TEXT[];
BEGIN
  -- STEP 1: Get bookmarked content (to exclude from recommendations)
  SELECT ARRAY_AGG(content_type || ':' || content_slug)
  INTO v_bookmarked_content
  FROM bookmarks
  WHERE user_id = p_user_id;

  -- STEP 2: Try to get recommendations from recommended_content materialized view
  WITH db_recommendations AS (
    SELECT
      rc.content_type,
      rc.content_slug,
      rc.recommendation_score,
      rc.user_affinity,
      rc.popularity_score,
      CASE
        WHEN rc.user_affinity > 70 THEN 'affinity'
        ELSE 'collaborative'
      END AS source,
      CASE
        WHEN rc.user_affinity > 70 THEN 'Based on your past interactions'
        ELSE 'Popular with users like you'
      END AS reason
    FROM recommended_content rc
    WHERE rc.user_id = p_user_id
      AND (p_category IS NULL OR rc.content_type = p_category)
      AND NOT (rc.content_type || ':' || rc.content_slug = ANY(COALESCE(v_bookmarked_content, ARRAY[]::TEXT[])))
    ORDER BY rc.recommendation_score DESC
    LIMIT p_limit * 2
  ),
  cold_start AS (
    SELECT
      cp.content_type,
      cp.content_slug,
      ROUND(
        CASE WHEN cp.popularity_score > 50 THEN 60 ELSE 0 END +
        (cp.popularity_score * 0.3),
      2) AS recommendation_score,
      NULL::NUMERIC AS user_affinity,
      cp.popularity_score,
      'trending'::TEXT AS source,
      'Popular in the community'::TEXT AS reason
    FROM content_popularity cp
    WHERE cp.popularity_score > 20
      AND (p_category IS NULL OR cp.content_type = p_category)
      AND NOT (cp.content_type || ':' || cp.content_slug = ANY(COALESCE(v_bookmarked_content, ARRAY[]::TEXT[])))
    ORDER BY cp.popularity_score DESC
    LIMIT p_limit
  ),
  selected_recommendations AS (
    SELECT * FROM db_recommendations
    UNION ALL
    SELECT * FROM cold_start
    WHERE NOT EXISTS (SELECT 1 FROM db_recommendations)
  ),
  -- STEP 3: Enrich with content metadata from respective tables
  -- Using UNION ALL to query all content tables dynamically
  enriched AS (
    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score AS score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      -- Fetch metadata from content tables
      COALESCE(a.title, a.display_title, a.slug) AS title,
      a.description,
      a.author,
      a.tags,
      a.popularity_score AS content_popularity,
      COALESCE(mas.view_count, 0) AS view_count
    FROM selected_recommendations sr
    LEFT JOIN agents a ON sr.content_type = 'agents' AND sr.content_slug = a.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'agents'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(m.title, m.display_title, m.slug),
      m.description,
      m.author,
      m.tags,
      m.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN mcp m ON sr.content_type = 'mcp' AND sr.content_slug = m.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'mcp'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(r.title, r.display_title, r.slug),
      r.description,
      r.author,
      r.tags,
      r.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN rules r ON sr.content_type = 'rules' AND sr.content_slug = r.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'rules'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(c.title, c.display_title, c.slug),
      c.description,
      c.author,
      c.tags,
      c.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN commands c ON sr.content_type = 'commands' AND sr.content_slug = c.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'commands'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(h.title, h.display_title, h.slug),
      h.description,
      h.author,
      h.tags,
      h.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN hooks h ON sr.content_type = 'hooks' AND sr.content_slug = h.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'hooks'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(s.title, s.display_title, s.slug),
      s.description,
      s.author,
      s.tags,
      s.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN statuslines s ON sr.content_type = 'statuslines' AND sr.content_slug = s.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'statuslines'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(sk.title, sk.display_title, sk.slug),
      sk.description,
      sk.author,
      sk.tags,
      sk.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN skills sk ON sr.content_type = 'skills' AND sr.content_slug = sk.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'skills'

    UNION ALL

    SELECT
      sr.content_type,
      sr.content_slug,
      sr.recommendation_score,
      sr.source,
      sr.reason,
      sr.user_affinity,
      sr.popularity_score,
      COALESCE(col.title, col.display_title, col.slug),
      col.description,
      col.author,
      col.tags,
      col.popularity_score,
      COALESCE(mas.view_count, 0)
    FROM selected_recommendations sr
    LEFT JOIN collections col ON sr.content_type = 'collections' AND sr.content_slug = col.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'collections'

    ORDER BY score DESC
    LIMIT p_limit
  )
  -- STEP 4: Build final JSONB response
  SELECT jsonb_build_object(
    'recommendations', COALESCE(jsonb_agg(
      jsonb_build_object(
        'slug', content_slug,
        'title', title,
        'description', description,
        'category', content_type,
        'score', score,
        'source', source,
        'reason', reason,
        'view_count', view_count,
        'popularity', content_popularity,
        'author', author,
        'tags', COALESCE(tags, ARRAY[]::TEXT[])
      )
    ), '[]'::JSONB),
    'total_count', (SELECT COUNT(*) FROM enriched),
    'sources_used', (
      SELECT jsonb_agg(DISTINCT source)
      FROM enriched
    ),
    'user_has_history', EXISTS(SELECT 1 FROM recommended_content WHERE user_id = p_user_id LIMIT 1),
    'generated_at', NOW()
  )
  INTO v_recommendations
  FROM enriched;

  RETURN v_recommendations;
END;
$$;


ALTER FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_category" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_category" "text", "p_limit" integer) IS 'Database-first feed generation with complete content metadata. Replaces 310 LOC TypeScript with single RPC call. Queries recommended_content view + enriches from all 8 content tables (agents/mcp/rules/commands/hooks/statuslines/skills/collections).';



CREATE OR REPLACE FUNCTION "public"."get_popular_posts"("limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "user_id" "uuid", "content_type" "text", "content_slug" "text", "title" "text", "body" "text", "vote_count" integer, "comment_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.content_type, p.content_slug, p.title, p.body,
         p.vote_count, p.comment_count, p.created_at, p.updated_at
  FROM public.posts p
  ORDER BY p.vote_count DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_popular_posts"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_quiz_configuration"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', q.question_id,
        'question', q.question_text,
        'description', q.description,
        'required', q.required,
        'displayOrder', q.display_order,
        'options', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'value', o.value,
              'label', o.label,
              'description', o.description,
              'iconName', o.icon_name
            ) ORDER BY o.display_order
          ), '[]'::jsonb)
          FROM public.quiz_options o
          WHERE o.question_id = q.question_id
        )
      ) ORDER BY q.display_order
    )
    FROM public.quiz_questions q
  );
END;
$$;


ALTER FUNCTION "public"."get_quiz_configuration"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_quiz_configuration"() IS 'Returns complete quiz configuration as JSONB. Replaces 250 lines of TypeScript.';



CREATE OR REPLACE FUNCTION "public"."get_recent_merged"("p_limit" integer DEFAULT 5) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'content_name', s.content_name,
          'content_type', s.content_type,
          'merged_at', s.merged_at,
          'user', CASE
            WHEN u.name IS NOT NULL AND u.slug IS NOT NULL THEN
              jsonb_build_object('name', u.name, 'slug', u.slug)
            ELSE
              NULL
          END
        )
      )
      FROM (
        SELECT id, content_name, content_type, merged_at, user_id
        FROM submissions
        WHERE status = 'merged'
          AND merged_at IS NOT NULL
        ORDER BY merged_at DESC
        LIMIT p_limit
      ) s
      LEFT JOIN users u ON s.user_id = u.id
    ),
    '[]'::jsonb
  );
END;
$$;


ALTER FUNCTION "public"."get_recent_merged"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_recent_merged"("p_limit" integer) IS 'Get recent merged submissions with user data. Replaces 94 LOC TypeScript with type transformations.';



CREATE OR REPLACE FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[] DEFAULT ARRAY[]::"text"[], "p_focus_areas" "text"[] DEFAULT ARRAY[]::"text"[], "p_limit" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_results JSONB;
  v_total_matches INT;
  v_algorithm TEXT := 'collaborative_filtering_v2';
BEGIN
  -- Calculate recommendations with enhanced metadata
  WITH scored_content AS (
    SELECT 
      c.slug,
      c.title,
      c.description,
      c.category,
      c.tags,
      c.author,
      -- Match score calculation (simplified - adjust based on your scoring logic)
      CASE 
        WHEN c.category = ANY(p_tool_preferences) THEN 85 + RANDOM() * 15
        ELSE 60 + RANDOM() * 25
      END::INT as match_score,
      -- Primary reason based on match type
      CASE 
        WHEN c.category = ANY(p_tool_preferences) 
          THEN 'Perfect match for your ' || c.category || ' preference'
        WHEN array_length(p_focus_areas, 1) > 0 AND c.tags && p_focus_areas
          THEN 'Matches your focus on ' || (SELECT p_focus_areas[1])
        WHEN c.tags && ARRAY[p_use_case]::TEXT[]
          THEN 'Relevant to ' || p_use_case
        ELSE 'Popular in our directory'
      END as primary_reason
    FROM public.content_unified c
    WHERE 
      c.category = ANY(p_tool_preferences)
      OR c.tags && p_focus_areas
      OR c.tags && ARRAY[p_use_case]::TEXT[]
    ORDER BY match_score DESC
    LIMIT p_limit * 2  -- Get more for filtering
  ),
  ranked_results AS (
    SELECT 
      sc.*,
      (sc.match_score * 100.0 / 100)::INT as match_percentage,
      ROW_NUMBER() OVER (ORDER BY sc.match_score DESC) as rank,
      -- Build reasons array in PostgreSQL
      jsonb_build_array(
        jsonb_build_object(
          'type', 'primary',
          'message', sc.primary_reason
        ),
        jsonb_build_object(
          'type', 'experience_match',
          'message', 'Suitable for ' || p_experience_level || ' users'
        ),
        CASE 
          WHEN array_length(p_integrations, 1) > 0 
          THEN jsonb_build_object(
            'type', 'integration_support',
            'message', 'Supports ' || (SELECT p_integrations[1]) || ' integration'
          )
          ELSE NULL
        END
      ) as reasons
    FROM scored_content sc
    LIMIT p_limit
  ),
  summary_stats AS (
    SELECT
      COUNT(*)::INT as total_count,
      (SELECT category FROM ranked_results ORDER BY match_score DESC LIMIT 1) as top_category,
      ROUND(AVG(match_score))::INT as avg_match_score,
      (COUNT(DISTINCT category) * 100.0 / GREATEST(COUNT(*), 1))::INT as diversity_score
    FROM ranked_results
  )
  SELECT jsonb_build_object(
    'results', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'slug', r.slug,
          'title', r.title,
          'description', r.description,
          'category', r.category,
          'tags', r.tags,
          'author', r.author,
          'match_score', r.match_score,
          'match_percentage', r.match_percentage,
          'primary_reason', r.primary_reason,
          'rank', r.rank,
          'reasons', r.reasons
        ) ORDER BY r.rank
      )
      FROM ranked_results r
    ),
    'totalMatches', (SELECT total_count FROM summary_stats),
    'algorithm', v_algorithm,
    'summary', (
      SELECT jsonb_build_object(
        'topCategory', top_category,
        'avgMatchScore', avg_match_score,
        'diversityScore', diversity_score
      )
      FROM summary_stats
    )
  ) INTO v_results;

  RETURN v_results;
END;
$$;


ALTER FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[], "p_focus_areas" "text"[], "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[], "p_focus_areas" "text"[], "p_limit" integer) IS 'Enhanced recommendations with rank, reasons, summary. Replaces TypeScript enrichment logic.';



CREATE OR REPLACE FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[] DEFAULT '{}'::"text"[], "p_limit" integer DEFAULT 3, "p_exclude_slugs" "text"[] DEFAULT '{}'::"text"[]) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "author" "text", "date_added" timestamp with time zone, "tags" "text"[], "score" numeric, "match_type" "text", "views" bigint, "matched_tags" "text"[])
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_tags TEXT[];
  v_main_categories TEXT[] := ARRAY['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills', 'collections'];
BEGIN
  -- Get tags from current content if not provided
  IF array_length(p_tags, 1) IS NULL OR array_length(p_tags, 1) = 0 THEN
    SELECT COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(data->'tags')),
      '{}'::TEXT[]
    )
    INTO v_current_tags
    FROM public.content_items
    WHERE category = p_category AND slug = p_slug;
  ELSE
    v_current_tags := p_tags;
  END IF;

  RETURN QUERY
  WITH candidate_content AS (
    SELECT
      ci.category,
      ci.slug,
      COALESCE(ci.data->>'title', ci.data->>'name', '') AS title,
      COALESCE(ci.data->>'description', '') AS description,
      COALESCE(ci.data->>'author', 'Community') AS author,
      COALESCE((ci.data->>'dateAdded')::TIMESTAMPTZ, ci.created_at) AS date_added,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(ci.data->'tags')),
        '{}'::TEXT[]
      ) AS tags,
      COALESCE((ci.data->>'featured')::BOOLEAN, FALSE) AS featured,
      COALESCE((ci.data->>'priority')::INTEGER, 0) AS priority
    FROM public.content_items ci
    WHERE ci.slug != p_slug  -- Exclude current item
      AND NOT (ci.slug = ANY(p_exclude_slugs))  -- Exclude specified items
      AND ci.category IN ('agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines', 'skills', 'collections')
  ),
  scored_content AS (
    SELECT
      cc.*,
      -- Calculate similarity scores
      CASE WHEN cc.category = p_category THEN 0.3 ELSE 0.0 END +
      calculate_tag_similarity(cc.tags, v_current_tags) * 0.4 +
      CASE WHEN cc.featured THEN 0.2 ELSE 0.0 END +
      (cc.priority * 0.1)::NUMERIC +
      CASE WHEN cc.category = ANY(v_main_categories) THEN 0.2 ELSE 0.0 END
      AS raw_score,
      -- Determine match type
      CASE
        WHEN calculate_tag_similarity(cc.tags, v_current_tags) > 0 THEN 'tag_match'
        WHEN cc.category = p_category THEN 'same_category'
        ELSE 'trending'
      END AS match_type,
      -- Extract matched tags
      ARRAY(
        SELECT tag
        FROM unnest(cc.tags) AS tag
        WHERE tag = ANY(v_current_tags)
      ) AS matched_tags
    FROM candidate_content cc
  ),
  scored_with_views AS (
    SELECT
      sc.*,
      -- Normalize score to 0-100 range
      LEAST(ROUND(sc.raw_score * 100), 100) AS final_score,
      -- Get view counts from analytics
      COALESCE(a.view_count, 0) AS view_count
    FROM scored_content sc
    LEFT JOIN public.mv_analytics_summary a
      ON sc.category = a.category AND sc.slug = a.slug
    WHERE sc.raw_score >= 0.05  -- Minimum 5% score threshold
  ),
  diverse_selection AS (
    -- Ensure category diversity
    SELECT DISTINCT ON (swv.category, swv.slug)
      swv.*,
      ROW_NUMBER() OVER (
        PARTITION BY swv.category
        ORDER BY swv.final_score DESC, swv.view_count DESC
      ) AS category_rank
    FROM scored_with_views swv
  )
  SELECT
    ds.category,
    ds.slug,
    ds.title,
    ds.description,
    ds.author,
    ds.date_added,
    ds.tags,
    ds.final_score AS score,
    ds.match_type,
    ds.view_count AS views,
    ds.matched_tags
  FROM diverse_selection ds
  ORDER BY ds.final_score DESC, ds.view_count DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) IS 'Get related content based on tag similarity, category matching, and engagement. Returns top N related items with diversity.';



CREATE OR REPLACE FUNCTION "public"."get_reviews_with_stats"("p_content_type" "text", "p_content_slug" "text", "p_sort_by" "text" DEFAULT 'recent'::"text", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 10, "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_reviews JSONB;
  v_aggregate JSONB;
  v_total_count INT;
  v_has_more BOOLEAN;
BEGIN
  -- 1. Get total count (for hasMore calculation)
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.review_ratings
  WHERE content_type = p_content_type
    AND content_slug = p_content_slug;

  -- Calculate hasMore
  v_has_more := (p_offset + p_limit) < v_total_count;

  -- 2. Get paginated reviews with user details
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'rating', r.rating,
      'review_text', r.review_text,
      'helpful_count', r.helpful_count,
      'created_at', r.created_at,
      'updated_at', r.updated_at,
      'user', jsonb_build_object(
        'id', u.id,
        'slug', u.slug,
        'name', u.name,
        'image', u.image,
        'reputation_score', u.reputation_score,
        'tier', u.tier
      ),
      'is_helpful', CASE 
        WHEN p_user_id IS NOT NULL THEN EXISTS(
          SELECT 1 FROM public.review_helpful_votes 
          WHERE review_id = r.id 
            AND user_id = p_user_id 
            AND helpful = true
        )
        ELSE false
      END
    )
    ORDER BY
      CASE 
        WHEN p_sort_by = 'helpful' THEN r.helpful_count
        WHEN p_sort_by = 'rating_high' THEN r.rating
        WHEN p_sort_by = 'rating_low' THEN -r.rating
        ELSE NULL
      END DESC NULLS LAST,
      r.created_at DESC
  ) INTO v_reviews
  FROM (
    SELECT *
    FROM public.review_ratings
    WHERE content_type = p_content_type
      AND content_slug = p_content_slug
    ORDER BY
      CASE 
        WHEN p_sort_by = 'helpful' THEN helpful_count
        WHEN p_sort_by = 'rating_high' THEN rating
        WHEN p_sort_by = 'rating_low' THEN -rating
        ELSE NULL
      END DESC NULLS LAST,
      created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) r
  LEFT JOIN public.users u ON u.id = r.user_id;

  -- 3. Get aggregate rating statistics
  SELECT jsonb_build_object(
    'success', true,
    'average', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'count', COUNT(*)::int,
    'distribution', jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    )
  ) INTO v_aggregate
  FROM public.review_ratings
  WHERE content_type = p_content_type
    AND content_slug = p_content_slug;

  -- 4. Return combined result
  RETURN jsonb_build_object(
    'reviews', COALESCE(v_reviews, '[]'::jsonb),
    'hasMore', v_has_more,
    'totalCount', v_total_count,
    'aggregateRating', v_aggregate
  );
END;
$$;


ALTER FUNCTION "public"."get_reviews_with_stats"("p_content_type" "text", "p_content_slug" "text", "p_sort_by" "text", "p_offset" integer, "p_limit" integer, "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_reviews_with_stats"("p_content_type" "text", "p_content_slug" "text", "p_sort_by" "text", "p_offset" integer, "p_limit" integer, "p_user_id" "uuid") IS 'Returns reviews and aggregate rating statistics in a single optimized query. Replaces 2 separate RPC calls in unified-review.tsx';



CREATE OR REPLACE FUNCTION "public"."get_search_count"("p_query" "text" DEFAULT NULL::"text", "p_categories" "text"[] DEFAULT NULL::"text"[], "p_tags" "text"[] DEFAULT NULL::"text"[], "p_authors" "text"[] DEFAULT NULL::"text"[]) RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM content_unified cu
  WHERE
    (p_query IS NULL OR length(trim(p_query)) = 0 OR cu.fts_vector @@ websearch_to_tsquery('english', p_query))
    AND (p_categories IS NULL OR cu.category = ANY(p_categories))
    AND (p_tags IS NULL OR cu.tags && p_tags)
    AND (p_authors IS NULL OR cu.author = ANY(p_authors));

  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_search_count"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_search_count"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[]) IS 'Database-first search count. Returns total matching results for filters.';



CREATE OR REPLACE FUNCTION "public"."get_search_suggestions"("p_query" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("suggestion" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT cu.title::TEXT
  FROM content_unified cu
  WHERE cu.title ILIKE p_query || '%'
  ORDER BY cu.title
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_search_suggestions"("p_query" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_search_suggestions"("p_query" "text", "p_limit" integer) IS 'Database-first search autocomplete. Returns distinct titles matching query prefix.';



CREATE OR REPLACE FUNCTION "public"."get_seo_config"("p_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM seo_config
  WHERE key = p_key;

  RETURN COALESCE(v_value, '{}'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_seo_config"("p_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_seo_config"("p_key" "text") IS 'Fetch SEO configuration value by key. Returns JSONB.';



CREATE OR REPLACE FUNCTION "public"."get_site_urls"() RETURNS TABLE("path" "text", "lastmod" timestamp with time zone, "changefreq" "text", "priority" numeric)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select path, lastmod, changefreq, priority
  from public.mv_site_urls
  order by priority desc, path asc;
$$;


ALTER FUNCTION "public"."get_site_urls"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_site_urls"() IS 'Returns sitemap-ready URL metadata (path, lastmod, change frequency, priority) sourced from mv_site_urls.';



CREATE OR REPLACE FUNCTION "public"."get_structured_data_config"("p_category" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT jsonb_build_object(
    'category', category,
    'schemaTypes', jsonb_build_object(
      'application', generate_application,
      'sourceCode', generate_source_code,
      'howTo', generate_how_to,
      'creativeWork', generate_creative_work,
      'faq', generate_faq,
      'breadcrumb', generate_breadcrumb,
      'speakable', generate_speakable,
      'review', generate_review,
      'aggregateRating', generate_aggregate_rating,
      'videoObject', generate_video_object,
      'course', generate_course,
      'jobPosting', generate_job_posting,
      'collectionPage', generate_collection_page
    ),
    'categoryDisplayName', category_display_name,
    'applicationSubCategory', application_sub_category,
    'defaultKeywords', default_keywords,
    'defaultRequirements', default_requirements,
    'creativeWorkDescription', creative_work_description
  ) INTO v_config
  FROM structured_data_config
  WHERE category = p_category AND active = true;

  RETURN COALESCE(v_config, '{}'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_structured_data_config"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_structured_data_config"("p_category" "text") IS 'Fetch structured data configuration for a category. Returns JSONB matching STRUCTURED_DATA_RULES shape.';



CREATE OR REPLACE FUNCTION "public"."get_tier_name_from_score"("p_score" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_legend_min INTEGER;
  v_expert_min INTEGER;
  v_contributor_min INTEGER;
  v_member_min INTEGER;
BEGIN
  -- Get tier thresholds (hardcoded for performance in GENERATED columns)
  -- These values should match reputation_tiers table
  v_legend_min := 1000;      -- Legend tier minimum
  v_expert_min := 500;       -- Expert tier minimum
  v_contributor_min := 100;  -- Contributor tier minimum
  v_member_min := 10;        -- Member tier minimum

  -- Determine tier based on score
  IF p_score >= v_legend_min THEN
    RETURN 'Legend';
  ELSIF p_score >= v_expert_min THEN
    RETURN 'Expert';
  ELSIF p_score >= v_contributor_min THEN
    RETURN 'Contributor';
  ELSIF p_score >= v_member_min THEN
    RETURN 'Member';
  ELSE
    RETURN 'Newcomer';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_tier_name_from_score"("p_score" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_tier_name_from_score"("p_score" integer) IS 'Get reputation tier name from score. IMMUTABLE for use in GENERATED columns.';



CREATE OR REPLACE FUNCTION "public"."get_tier_progress_from_score"("p_score" integer) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tier_name TEXT;
  v_tier_min INTEGER;
  v_tier_max INTEGER;
  v_tier_range INTEGER;
  v_score_in_tier INTEGER;
BEGIN
  -- Hardcoded tier boundaries for IMMUTABLE function
  -- Tier: Newcomer (0-9)
  -- Tier: Member (10-99)
  -- Tier: Contributor (100-499)
  -- Tier: Expert (500-999)
  -- Tier: Legend (1000+)

  -- Determine current tier and boundaries
  IF p_score >= 1000 THEN
    RETURN 100; -- Legend tier, always 100%
  ELSIF p_score >= 500 THEN
    v_tier_min := 500;
    v_tier_max := 999;
  ELSIF p_score >= 100 THEN
    v_tier_min := 100;
    v_tier_max := 499;
  ELSIF p_score >= 10 THEN
    v_tier_min := 10;
    v_tier_max := 99;
  ELSE
    v_tier_min := 0;
    v_tier_max := 9;
  END IF;

  -- Calculate progress through current tier
  v_tier_range := v_tier_max - v_tier_min + 1;
  v_score_in_tier := p_score - v_tier_min;

  RETURN LEAST(100, GREATEST(0, ROUND((v_score_in_tier::NUMERIC / v_tier_range) * 100)::INTEGER));
END;
$$;


ALTER FUNCTION "public"."get_tier_progress_from_score"("p_score" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_tier_progress_from_score"("p_score" integer) IS 'Calculate progress percentage through current tier. IMMUTABLE for use in GENERATED columns.';



CREATE OR REPLACE FUNCTION "public"."get_top_contributors"("p_limit" integer DEFAULT 5) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', row_number,
          'name', name,
          'slug', slug,
          'mergedCount', merged_count
        )
      )
      FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as row_number,
          u.name,
          u.slug,
          COUNT(*) as merged_count
        FROM submissions s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.status = 'merged'
          AND u.name IS NOT NULL
          AND u.slug IS NOT NULL
        GROUP BY u.id, u.name, u.slug
        ORDER BY merged_count DESC
        LIMIT p_limit
      ) ranked_contributors
    ),
    '[]'::jsonb
  );
END;
$$;


ALTER FUNCTION "public"."get_top_contributors"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_top_contributors"("p_limit" integer) IS 'Get top contributors by merged submission count. Replaces 70 LOC TypeScript with GROUP BY + ROW_NUMBER().';



CREATE OR REPLACE FUNCTION "public"."get_trending_content"("p_limit" integer DEFAULT 3) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "view_count" bigint, "url" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.category,
    tc.slug,
    tc.title,
    tc.description,
    tc.view_count,
    'https://claudepro.directory/' || tc.category || '/' || tc.slug AS url
  FROM public.mv_trending_content tc
  ORDER BY tc.view_count DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_trending_content"("p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_trending_content"("p_limit" integer) IS 'Get top trending content by view count. Used for weekly digest emails.';



CREATE OR REPLACE FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period" DEFAULT 'week'::"public"."trending_period", "p_metric" "public"."trending_metric" DEFAULT 'views'::"public"."trending_metric", "p_category" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 20) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_offset INTEGER;
  v_trending JSONB;
  v_popular JSONB;
  v_recent JSONB;
  v_total_count INTEGER;
BEGIN
  -- Validate and sanitize inputs
  IF p_page < 1 THEN
    p_page := 1;
  END IF;

  IF p_limit < 1 OR p_limit > 100 THEN
    p_limit := 20;
  END IF;

  v_offset := (p_page - 1) * p_limit;

  -- Get total count across all content types
  SELECT COALESCE(
    (SELECT COUNT(*) FROM agents WHERE active = true) +
    (SELECT COUNT(*) FROM mcp WHERE active = true) +
    (SELECT COUNT(*) FROM rules WHERE active = true) +
    (SELECT COUNT(*) FROM commands WHERE active = true) +
    (SELECT COUNT(*) FROM hooks WHERE active = true) +
    (SELECT COUNT(*) FROM statuslines WHERE active = true) +
    (SELECT COUNT(*) FROM collections WHERE active = true) +
    (SELECT COUNT(*) FROM skills WHERE active = true),
    0
  ) INTO v_total_count;

  -- Get trending content from materialized view
  -- Uses trending_content_24h for real-time trending scores
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', content.category,
      'slug', content.slug,
      'title', content.title,
      'description', content.description,
      'author', content.author,
      'tags', content.tags,
      'trendingScore', t.trending_score,
      'viewCount', COALESCE(a.view_count, 0),
      'copyCount', COALESCE(a.copy_count, 0)
    ) ORDER BY t.trending_score DESC
  ), '[]'::JSONB)
  INTO v_trending
  FROM trending_content_24h t
  -- Union query to get full content metadata from respective tables
  LEFT JOIN LATERAL (
    SELECT category, slug, title, description, author, tags FROM agents WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM mcp WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM rules WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM commands WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM hooks WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM statuslines WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM collections WHERE category = t.content_type AND slug = t.content_slug
    UNION ALL
    SELECT category, slug, title, description, author, tags FROM skills WHERE category = t.content_type AND slug = t.content_slug
  ) content ON true
  LEFT JOIN mv_analytics_summary a ON a.category = t.content_type AND a.slug = t.content_slug
  WHERE (p_category IS NULL OR t.content_type = p_category)
  LIMIT p_limit;

  -- Get popular content from all-time popularity materialized view
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', p.category,
      'slug', p.slug,
      'title', p.title,
      'description', p.description,
      'author', p.author,
      'viewCount', p.view_count,
      'popularityScore', p.trending_score
    ) ORDER BY p.view_count DESC
  ), '[]'::JSONB)
  INTO v_popular
  FROM mv_trending_content p
  WHERE (p_category IS NULL OR p.category = p_category)
  LIMIT p_limit;

  -- Get recent content (last 30 days)
  -- Union across all content tables
  WITH recent_content AS (
    SELECT category, slug, title, description, author, date_added, tags FROM agents WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM mcp WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM rules WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM commands WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM hooks WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM statuslines WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM collections WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
    UNION ALL
    SELECT category, slug, title, description, author, date_added, tags FROM skills WHERE active = true AND date_added >= CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', r.category,
      'slug', r.slug,
      'title', r.title,
      'description', r.description,
      'author', r.author,
      'tags', r.tags,
      'dateAdded', r.date_added,
      'viewCount', COALESCE(a.view_count, 0)
    ) ORDER BY r.date_added DESC
  ), '[]'::JSONB)
  INTO v_recent
  FROM recent_content r
  LEFT JOIN mv_analytics_summary a ON a.category = r.category AND a.slug = r.slug
  WHERE (p_category IS NULL OR r.category = p_category)
  LIMIT p_limit;

  -- Return complete trending page data
  RETURN jsonb_build_object(
    'trending', v_trending,
    'popular', v_popular,
    'recent', v_recent,
    'totalCount', v_total_count,
    'metadata', jsonb_build_object(
      'period', p_period,
      'metric', p_metric,
      'category', p_category,
      'page', p_page,
      'limit', p_limit,
      'algorithm', 'materialized_views'
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) IS 'Database-first trending page data. Returns trending, popular, and recent content with analytics enrichment. Uses materialized views for 100-400x performance improvement.';



CREATE OR REPLACE FUNCTION "public"."get_usage_recommendations"("p_user_id" "uuid", "p_trigger" "text", "p_content_type" "text" DEFAULT NULL::"text", "p_content_slug" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 3) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_recommendations JSONB;
BEGIN
  -- Try personalized recommendations from recommended_content view
  WITH personalized_recs AS (
    SELECT
      rc.content_type,
      rc.content_slug,
      rc.recommendation_score,
      rc.user_affinity,
      rc.popularity_score
    FROM recommended_content rc
    WHERE rc.user_id = p_user_id
      AND (p_category IS NULL OR rc.content_type = p_category)
      -- Exclude current item if provided
      AND NOT (
        p_content_type IS NOT NULL
        AND p_content_slug IS NOT NULL
        AND rc.content_type = p_content_type
        AND rc.content_slug = p_content_slug
      )
    ORDER BY rc.recommendation_score DESC
    LIMIT p_limit
  ),

  -- Fallback: Trending content (popularity > 50)
  trending_recs AS (
    SELECT content_type, content_slug, popularity_score, 0 AS user_affinity, popularity_score AS recommendation_score
    FROM (
      SELECT 'agents' AS content_type, slug AS content_slug, popularity_score FROM agents WHERE popularity_score > 50
      UNION ALL
      SELECT 'mcp', slug, popularity_score FROM mcp WHERE popularity_score > 50
      UNION ALL
      SELECT 'rules', slug, popularity_score FROM rules WHERE popularity_score > 50
      UNION ALL
      SELECT 'commands', slug, popularity_score FROM commands WHERE popularity_score > 50
      UNION ALL
      SELECT 'hooks', slug, popularity_score FROM hooks WHERE popularity_score > 50
      UNION ALL
      SELECT 'statuslines', slug, popularity_score FROM statuslines WHERE popularity_score > 50
      UNION ALL
      SELECT 'skills', slug, popularity_score FROM skills WHERE popularity_score > 50
      UNION ALL
      SELECT 'collections', slug, popularity_score FROM collections WHERE popularity_score > 50
    ) trending
    WHERE (p_category IS NULL OR content_type = p_category)
    ORDER BY popularity_score DESC
    LIMIT p_limit
  ),

  -- Select recommendations (personalized if available, else trending)
  selected_recs AS (
    SELECT * FROM personalized_recs
    UNION ALL
    SELECT * FROM trending_recs
    WHERE NOT EXISTS (SELECT 1 FROM personalized_recs)
    LIMIT p_limit
  ),

  -- Enrich with metadata from all 8 content tables
  enriched AS (
    SELECT
      sr.content_type AS category,
      sr.content_slug AS slug,
      COALESCE(a.title, a.display_title, a.slug) AS title,
      a.description,
      a.author,
      a.tags,
      sr.recommendation_score AS affinity_score,
      CASE
        WHEN sr.user_affinity > 0 THEN 'affinity'
        ELSE 'trending'
      END AS recommendation_source,
      CASE
        WHEN sr.user_affinity > 0 THEN 'Based on your interests'
        ELSE 'Popular in the community'
      END AS recommendation_reason,
      COALESCE(mas.view_count, 0) AS view_count,
      COALESCE(a.popularity_score, sr.popularity_score, 0) AS popularity
    FROM selected_recs sr
    LEFT JOIN agents a ON sr.content_type = 'agents' AND sr.content_slug = a.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'agents'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(m.title, m.display_title, m.slug),
      m.description, m.author, m.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(m.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN mcp m ON sr.content_type = 'mcp' AND sr.content_slug = m.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'mcp'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(r.title, r.display_title, r.slug),
      r.description, r.author, r.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(r.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN rules r ON sr.content_type = 'rules' AND sr.content_slug = r.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'rules'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(c.title, c.display_title, c.slug),
      c.description, c.author, c.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(c.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN commands c ON sr.content_type = 'commands' AND sr.content_slug = c.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'commands'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(h.title, h.display_title, h.slug),
      h.description, h.author, h.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(h.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN hooks h ON sr.content_type = 'hooks' AND sr.content_slug = h.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'hooks'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(s.title, s.display_title, s.slug),
      s.description, s.author, s.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(s.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN statuslines s ON sr.content_type = 'statuslines' AND sr.content_slug = s.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'statuslines'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(sk.title, sk.display_title, sk.slug),
      sk.description, sk.author, sk.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(sk.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN skills sk ON sr.content_type = 'skills' AND sr.content_slug = sk.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'skills'

    UNION ALL

    SELECT
      sr.content_type, sr.content_slug,
      COALESCE(co.title, co.display_title, co.slug),
      co.description, co.author, co.tags,
      sr.recommendation_score,
      CASE WHEN sr.user_affinity > 0 THEN 'affinity' ELSE 'trending' END,
      CASE WHEN sr.user_affinity > 0 THEN 'Based on your interests' ELSE 'Popular in the community' END,
      COALESCE(mas.view_count, 0),
      COALESCE(co.popularity_score, sr.popularity_score, 0)
    FROM selected_recs sr
    LEFT JOIN collections co ON sr.content_type = 'collections' AND sr.content_slug = co.slug
    LEFT JOIN mv_analytics_summary mas ON mas.category = sr.content_type AND mas.slug = sr.content_slug
    WHERE sr.content_type = 'collections'
  )

  -- Build final JSONB response
  SELECT jsonb_build_object(
    'recommendations', COALESCE(jsonb_agg(
      jsonb_build_object(
        'slug', enriched.slug,
        'title', enriched.title,
        'description', enriched.description,
        'category', enriched.category,
        'score', ROUND(enriched.affinity_score),
        'source', enriched.recommendation_source,
        'reason', enriched.recommendation_reason,
        'view_count', enriched.view_count,
        'popularity', enriched.popularity,
        'author', enriched.author,
        'tags', enriched.tags
      )
    ), '[]'::jsonb),
    'trigger', p_trigger,
    'context', jsonb_build_object(
      'content_type', p_content_type,
      'content_slug', p_content_slug,
      'category', p_category
    )
  ) INTO v_recommendations
  FROM enriched;

  RETURN COALESCE(v_recommendations, jsonb_build_object(
    'recommendations', '[]'::jsonb,
    'trigger', p_trigger,
    'context', jsonb_build_object(
      'content_type', p_content_type,
      'content_slug', p_content_slug,
      'category', p_category
    )
  ));
END;
$$;


ALTER FUNCTION "public"."get_usage_recommendations"("p_user_id" "uuid", "p_trigger" "text", "p_content_type" "text", "p_content_slug" "text", "p_category" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_usage_recommendations"("p_user_id" "uuid", "p_trigger" "text", "p_content_type" "text", "p_content_slug" "text", "p_category" "text", "p_limit" integer) IS 'Generates contextual usage-based recommendations with full metadata enrichment from all 8 content tables. Replaces 147 LOC TypeScript + 61 LOC helper function.';



CREATE OR REPLACE FUNCTION "public"."get_user_activity_timeline"("p_user_id" "uuid", "p_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_total INTEGER;
BEGIN
  WITH combined_activities AS (
    SELECT
      'post' AS activity_type,
      id,
      created_at,
      jsonb_build_object(
        'id', id,
        'type', 'post',
        'title', title,
        'body', body,
        'content_type', content_type,
        'content_slug', content_slug,
        'user_id', user_id,
        'created_at', created_at,
        'updated_at', updated_at
      ) AS activity_data
    FROM posts
    WHERE user_id = p_user_id
      AND (p_type IS NULL OR p_type = 'post')

    UNION ALL

    SELECT
      'comment' AS activity_type,
      id,
      created_at,
      jsonb_build_object(
        'id', id,
        'type', 'comment',
        'body', body,
        'post_id', post_id,
        'parent_id', parent_id,
        'user_id', user_id,
        'created_at', created_at,
        'updated_at', updated_at
      ) AS activity_data
    FROM comments
    WHERE user_id = p_user_id
      AND (p_type IS NULL OR p_type = 'comment')

    UNION ALL

    SELECT
      'vote' AS activity_type,
      id,
      created_at,
      jsonb_build_object(
        'id', id,
        'type', 'vote',
        'vote_type', vote_type,
        'post_id', post_id,
        'user_id', user_id,
        'created_at', created_at
      ) AS activity_data
    FROM votes
    WHERE user_id = p_user_id
      AND (p_type IS NULL OR p_type = 'vote')

    UNION ALL

    SELECT
      'submission' AS activity_type,
      id,
      created_at,
      jsonb_build_object(
        'id', id,
        'type', 'submission',
        'title', title,
        'description', description,
        'content_type', content_type,
        'submission_url', submission_url,
        'status', status,
        'user_id', user_id,
        'created_at', created_at,
        'updated_at', updated_at
      ) AS activity_data
    FROM submissions
    WHERE user_id = p_user_id
      AND (p_type IS NULL OR p_type = 'submission')
  ),
  sorted_activities AS (
    SELECT activity_data, created_at
    FROM combined_activities
    ORDER BY created_at DESC
    LIMIT p_limit + 1
    OFFSET p_offset
  ),
  paginated_activities AS (
    SELECT activity_data
    FROM sorted_activities
    LIMIT p_limit
  )

  SELECT COUNT(*) INTO v_total FROM sorted_activities;

  SELECT jsonb_build_object(
    'activities', COALESCE((SELECT jsonb_agg(activity_data) FROM paginated_activities), '[]'::jsonb),
    'hasMore', v_total > p_limit,
    'total', v_total
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_activity_timeline"("p_user_id" "uuid", "p_type" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_activity_timeline"("p_user_id" "uuid", "p_type" "text", "p_limit" integer, "p_offset" integer) IS 'Unified activity timeline combining posts, comments, votes, and submissions.

Returns JSONB with structure:
{
  "activities": [
    {
      "id": "uuid",
      "type": "post" | "comment" | "vote" | "submission",
      "created_at": "timestamp",
      
      -- Post fields (when type = ''post''):
      "title": "string",
      "body": "string",
      "content_type": "string",
      "content_slug": "string",
      "user_id": "uuid",
      "updated_at": "timestamp",
      
      -- Comment fields (when type = ''comment''):
      "body": "string",
      "post_id": "uuid",
      "parent_id": "uuid | null",
      
      -- Vote fields (when type = ''vote''):
      "vote_type": "upvote" | "downvote",
      "post_id": "uuid",
      
      -- Submission fields (when type = ''submission''):
      "title": "string",
      "description": "string | null",
      "content_type": "string",
      "submission_url": "string | null",
      "status": "pending" | "approved" | "rejected",
      "updated_at": "timestamp"
    }
  ],
  "hasMore": boolean,
  "total": integer
}

Performance: Optimized with composite indexes on (user_id, created_at DESC) for all activity tables.';



CREATE OR REPLACE FUNCTION "public"."get_user_badges_with_details"("p_user_id" "uuid", "p_featured_only" boolean DEFAULT false, "p_limit" integer DEFAULT NULL::integer, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Single optimized query with JOIN and aggregation
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ub.id,
      'badge_id', ub.badge_id,
      'earned_at', ub.earned_at,
      'featured', ub.featured,
      'metadata', ub.metadata,
      'badge', jsonb_build_object(
        'id', b.id,
        'slug', b.slug,
        'name', b.name,
        'description', b.description,
        'icon', b.icon,
        'category', b.category,
        'rarity', b.rarity,
        'active', b.active,
        'order', b.order,
        'tier_required', b.tier_required,
        'criteria', b.criteria
      )
    )
    ORDER BY ub.earned_at DESC
  ) INTO v_result
  FROM (
    SELECT *
    FROM public.user_badges
    WHERE user_id = p_user_id
      AND (NOT p_featured_only OR featured = true)
    ORDER BY earned_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) ub
  INNER JOIN public.badges b ON b.id = ub.badge_id;

  -- Return empty array if no badges
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_user_badges_with_details"("p_user_id" "uuid", "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_badges_with_details"("p_user_id" "uuid", "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) IS 'Returns user badges with full badge details in a single query. Replaces client-side badge fetching in badge-grid.tsx';



CREATE OR REPLACE FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer DEFAULT 3) RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN ARRAY(
    SELECT content_type
    FROM user_affinities
    WHERE user_id = p_user_id
      AND affinity_score >= 30  -- Only meaningful affinities
    GROUP BY content_type
    ORDER BY AVG(affinity_score) DESC
    LIMIT p_limit
  );
END;
$$;


ALTER FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) IS 'Database-first favorite categories calculation. Returns top N categories by average affinity score using GROUP BY + AVG.';



CREATE OR REPLACE FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_interactions', COUNT(*),
      'views', COUNT(*) FILTER (WHERE interaction_type = 'view'),
      'copies', COUNT(*) FILTER (WHERE interaction_type = 'copy'),
      'bookmarks', COUNT(*) FILTER (WHERE interaction_type = 'bookmark'),
      'unique_content_items', COUNT(DISTINCT (content_type, content_slug))
    )
    FROM user_interactions
    WHERE user_id = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") IS 'Database-first interaction summary. Replaces 82 LOC TypeScript with single aggregation query using COUNT FILTER.';



CREATE OR REPLACE FUNCTION "public"."get_user_recent_interactions"("p_user_id" "uuid", "p_limit" integer DEFAULT 20) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'content_type', ui.content_type,
          'content_slug', ui.content_slug,
          'interaction_type', ui.interaction_type,
          'session_id', ui.session_id,
          'metadata', COALESCE(ui.metadata, '{}'::jsonb),
          'created_at', ui.created_at
        )
      )
      FROM (
        SELECT content_type, content_slug, interaction_type, session_id, metadata, created_at
        FROM user_interactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT p_limit
      ) ui
    ),
    '[]'::jsonb
  );
END;
$$;


ALTER FUNCTION "public"."get_user_recent_interactions"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_recent_interactions"("p_user_id" "uuid", "p_limit" integer) IS 'Fetches recent user interactions with proper JSONB formatting. Replaces 44 LOC TypeScript with manual validation.';



CREATE OR REPLACE FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_score INTEGER;
  v_tier_name TEXT;
  v_tier_progress INTEGER;
  v_posts_count INTEGER;
  v_votes_received INTEGER;
  v_comments_count INTEGER;
  v_submissions_count INTEGER;
  v_post_points INTEGER;
  v_vote_points INTEGER;
  v_comment_points INTEGER;
  v_submission_points INTEGER;
  v_current_tier RECORD;
  v_next_tier RECORD;
  v_breakdown JSONB;
  v_tier_info JSONB;
  v_next_tier_info JSONB;
  v_activity_counts JSONB;
BEGIN
  -- Fetch user reputation with computed columns
  SELECT reputation_score, tier_name, tier_progress
  INTO v_user_score, v_tier_name, v_tier_progress
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Get point values from reputation_actions table
  SELECT points INTO v_post_points
  FROM public.reputation_actions
  WHERE action_type = 'post' AND active = true
  LIMIT 1;

  SELECT points INTO v_vote_points
  FROM public.reputation_actions
  WHERE action_type = 'vote_received' AND active = true
  LIMIT 1;

  SELECT points INTO v_comment_points
  FROM public.reputation_actions
  WHERE action_type = 'comment' AND active = true
  LIMIT 1;

  SELECT points INTO v_submission_points
  FROM public.reputation_actions
  WHERE action_type = 'submission_merged' AND active = true
  LIMIT 1;

  -- Default to 0 if not found
  v_post_points := COALESCE(v_post_points, 10);
  v_vote_points := COALESCE(v_vote_points, 5);
  v_comment_points := COALESCE(v_comment_points, 2);
  v_submission_points := COALESCE(v_submission_points, 20);

  -- Count user activities
  SELECT COUNT(*) INTO v_posts_count
  FROM public.posts
  WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(vote_count), 0) INTO v_votes_received
  FROM public.posts
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_comments_count
  FROM public.comments
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_submissions_count
  FROM public.submissions
  WHERE user_id = p_user_id AND status = 'merged';

  -- Build breakdown JSON
  v_breakdown := jsonb_build_object(
    'from_posts', v_posts_count * v_post_points,
    'from_votes_received', v_votes_received * v_vote_points,
    'from_comments', v_comments_count * v_comment_points,
    'from_submissions', v_submissions_count * v_submission_points,
    'total', v_user_score
  );

  -- Build activity counts JSON
  v_activity_counts := jsonb_build_object(
    'posts', v_posts_count,
    'votes', v_votes_received,
    'comments', v_comments_count,
    'submissions', v_submissions_count
  );

  -- Get current tier details
  SELECT name, icon, color, min_score, max_score, "order"
  INTO v_current_tier
  FROM public.reputation_tiers
  WHERE name = v_tier_name AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback to Newcomer tier
    v_current_tier := ROW('Newcomer', '🌱', 'gray', 0, 9, 0);
  END IF;

  -- Build tier info JSON
  v_tier_info := jsonb_build_object(
    'name', v_current_tier.name,
    'icon', v_current_tier.icon,
    'color', v_current_tier.color,
    'progress', v_tier_progress
  );

  -- Get next tier info
  SELECT name, min_score
  INTO v_next_tier
  FROM public.reputation_tiers
  WHERE "order" > v_current_tier."order" AND active = true
  ORDER BY "order" ASC
  LIMIT 1;

  IF FOUND THEN
    v_next_tier_info := jsonb_build_object(
      'name', v_next_tier.name,
      'pointsNeeded', v_next_tier.min_score - v_user_score
    );
  ELSE
    v_next_tier_info := NULL;
  END IF;

  -- Return complete breakdown as JSON
  RETURN jsonb_build_object(
    'breakdown', v_breakdown,
    'tier', v_tier_info,
    'nextTier', v_next_tier_info,
    'activityCounts', v_activity_counts
  );
END;
$$;


ALTER FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") IS 'Get complete reputation breakdown for a user. Returns breakdown, tier info, next tier, and activity counts as JSON.';



CREATE OR REPLACE FUNCTION "public"."get_weekly_digest"("p_week_start" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_week_of TEXT;
  v_new_content JSONB;
  v_trending_content JSONB;
BEGIN
  -- Default to start of current week if not provided
  v_week_start := COALESCE(p_week_start, date_trunc('week', CURRENT_DATE)::DATE);
  v_week_end := v_week_start + INTERVAL '7 days';

  -- Format week range string (e.g., "December 2-8, 2025")
  v_week_of := to_char(v_week_start, 'Month') || ' ' ||
               EXTRACT(DAY FROM v_week_start)::TEXT || '-' ||
               EXTRACT(DAY FROM v_week_end)::TEXT || ', ' ||
               EXTRACT(YEAR FROM v_week_start)::TEXT;

  -- Get new content as JSONB array
  SELECT COALESCE(jsonb_agg(row_to_json(nc)), '[]'::JSONB)
  INTO v_new_content
  FROM get_new_content_for_week(v_week_start, 5) nc;

  -- Get trending content as JSONB array
  SELECT COALESCE(jsonb_agg(row_to_json(tc)), '[]'::JSONB)
  INTO v_trending_content
  FROM get_trending_content(3) tc;

  -- Return combined digest
  RETURN jsonb_build_object(
    'weekOf', v_week_of,
    'weekStart', v_week_start,
    'weekEnd', v_week_end,
    'newContent', v_new_content,
    'trendingContent', v_trending_content
  );
END;
$$;


ALTER FUNCTION "public"."get_weekly_digest"("p_week_start" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") IS 'Generate complete weekly digest with new + trending content. Returns JSONB with weekOf, newContent[], trendingContent[].';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  avatar_url TEXT;
  full_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract avatar URL (GitHub uses 'avatar_url', Google uses 'picture')
  avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  -- Extract full name
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name'
  );
  
  -- Get email
  user_email := NEW.email;
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, image, created_at, updated_at)
  VALUES (NEW.id, user_email, full_name, avatar_url, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_webhook_bounce"("p_webhook_id" "uuid", "p_event_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_email TEXT;
  v_bounce_type TEXT;
  v_bounce_count INTEGER;
  v_email_hash TEXT;
BEGIN
  -- Extract email from webhook data
  v_email := COALESCE(
    p_event_data->>'to',
    (p_event_data->'to'->>0)
  );

  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Bounce event % has no email address', p_webhook_id;
    RETURN;
  END IF;

  v_bounce_type := COALESCE(p_event_data->>'bounce_type', 'unknown');
  v_email_hash := encode(digest(lower(v_email), 'sha256'), 'hex');

  -- Count total bounces for this email
  SELECT COUNT(*)
  INTO v_bounce_count
  FROM webhook_events
  WHERE type = 'email.bounced'
    AND (
      data->>'to' = v_email
      OR data->'to'->>0 = v_email
    );

  -- Log bounce
  RAISE NOTICE 'Email bounce: % (type: %, count: %)',
    substring(v_email_hash, 1, 16),
    v_bounce_type,
    v_bounce_count;

  -- Auto-remove if hard bounce or 3+ soft bounces
  IF v_bounce_type = 'hard' OR v_bounce_count >= 3 THEN
    -- Cancel email sequences
    BEGIN
      PERFORM cancel_email_sequence(v_email);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to cancel sequence for %: %', v_email, SQLERRM;
    END;

    -- Mark newsletter subscription as unsubscribed (if exists)
    UPDATE newsletter_subscriptions
    SET
      status = 'unsubscribed',
      unsubscribed_at = NOW(),
      unsubscribe_reason = CASE
        WHEN v_bounce_type = 'hard' THEN 'hard_bounce'
        ELSE 'repeated_soft_bounce'
      END
    WHERE email = v_email
      AND status = 'subscribed';

    RAISE NOTICE 'Removed email % due to %',
      substring(v_email_hash, 1, 16),
      CASE WHEN v_bounce_type = 'hard' THEN 'hard bounce' ELSE 'repeated soft bounces' END;
  END IF;
END;
$$;


ALTER FUNCTION "public"."handle_webhook_bounce"("p_webhook_id" "uuid", "p_event_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_webhook_bounce"("p_webhook_id" "uuid", "p_event_data" "jsonb") IS 'Process email bounce webhooks. Auto-removes after hard bounce or 3+ soft bounces. Replaces 45 LOC TypeScript.';



CREATE OR REPLACE FUNCTION "public"."handle_webhook_complaint"("p_webhook_id" "uuid", "p_event_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_email TEXT;
  v_email_hash TEXT;
  v_feedback_type TEXT;
BEGIN
  -- Extract email from webhook data
  v_email := COALESCE(
    p_event_data->>'to',
    (p_event_data->'to'->>0)
  );

  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Complaint event % has no email address', p_webhook_id;
    RETURN;
  END IF;

  v_email_hash := encode(digest(lower(v_email), 'sha256'), 'hex');
  v_feedback_type := COALESCE(p_event_data->>'feedback_type', 'unknown');

  -- Log complaint (serious issue)
  RAISE WARNING 'SPAM COMPLAINT: % (feedback: %)',
    substring(v_email_hash, 1, 16),
    v_feedback_type;

  -- Cancel email sequences immediately
  BEGIN
    PERFORM cancel_email_sequence(v_email);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to cancel sequence for %: %', v_email, SQLERRM;
  END;

  -- Mark newsletter subscription as unsubscribed
  UPDATE newsletter_subscriptions
  SET
    status = 'unsubscribed',
    unsubscribed_at = NOW(),
    unsubscribe_reason = 'spam_complaint'
  WHERE email = v_email
    AND status = 'subscribed';

  -- Insert into blocklist (prevent future subscriptions)
  INSERT INTO email_blocklist (email, reason, created_at)
  VALUES (v_email, 'spam_complaint', NOW())
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Removed email % due to spam complaint', substring(v_email_hash, 1, 16);
END;
$$;


ALTER FUNCTION "public"."handle_webhook_complaint"("p_webhook_id" "uuid", "p_event_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_webhook_complaint"("p_webhook_id" "uuid", "p_event_data" "jsonb") IS 'Process spam complaint webhooks. Immediately removes email and blocks future subscriptions. Replaces 35 LOC TypeScript.';



CREATE OR REPLACE FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- Dynamic SQL for atomic increment
  EXECUTE format(
    'UPDATE public.%I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2',
    table_name,
    column_name,
    column_name
  ) USING increment_by, row_id;
END;
$_$;


ALTER FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_bookmarked"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookmarks
    WHERE user_id = p_user_id
      AND content_type = p_content_type
      AND content_slug = p_content_slug
  );
END;
$$;


ALTER FUNCTION "public"."is_bookmarked"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_bookmarked"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") IS 'Check if content is bookmarked by user. Replaces 28 LOC TypeScript with simple EXISTS query.';



CREATE OR REPLACE FUNCTION "public"."is_following"("follower_id" "uuid", "following_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.followers 
    WHERE followers.follower_id = is_following.follower_id 
    AND followers.following_id = is_following.following_id
  );
END;
$$;


ALTER FUNCTION "public"."is_following"("follower_id" "uuid", "following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_sequence_email_processed"("p_schedule_id" "uuid", "p_email" "text", "p_step" integer, "p_success" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sequence_id TEXT := 'onboarding';
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Mark schedule record as processed
  UPDATE email_sequence_schedule
  SET processed = true,
      processed_at = v_now
  WHERE id = p_schedule_id;

  -- Only update sequence state if email sent successfully
  IF p_success THEN
    -- Update sequence record (current_step, last_sent_at, completion status)
    UPDATE email_sequences
    SET current_step = p_step,
        last_sent_at = v_now,
        status = CASE WHEN p_step = 5 THEN 'completed' ELSE 'active' END,
        updated_at = v_now
    WHERE sequence_id = v_sequence_id
      AND email = p_email;
  END IF;
END;
$$;


ALTER FUNCTION "public"."mark_sequence_email_processed"("p_schedule_id" "uuid", "p_email" "text", "p_step" integer, "p_success" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_sequence_email_processed"("p_schedule_id" "uuid", "p_email" "text", "p_step" integer, "p_success" boolean) IS 'Mark sequence email as processed and update sequence state.';



CREATE OR REPLACE FUNCTION "public"."process_webhook_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Process based on event type
  CASE NEW.type
    WHEN 'email.bounced' THEN
      PERFORM handle_webhook_bounce(NEW.id, NEW.data);
    WHEN 'email.complained' THEN
      PERFORM handle_webhook_complaint(NEW.id, NEW.data);
    ELSE
      -- Other events (opened, clicked, delayed) just log to table
      NULL;
  END CASE;

  -- Mark as processed
  NEW.processed := true;
  NEW.processed_at := NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."process_webhook_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_content_popularity"() RETURNS TABLE("success" boolean, "message" "text", "rows_refreshed" bigint, "duration_ms" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_row_count BIGINT;
BEGIN
  v_start_time := clock_timestamp();

  -- CONCURRENTLY allows queries during refresh (no table locks)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.content_popularity;

  SELECT COUNT(*) INTO v_row_count FROM public.content_popularity;

  RETURN QUERY SELECT
    true AS success,
    'Content popularity refreshed successfully' AS message,
    v_row_count AS rows_refreshed,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time) AS duration_ms;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    false AS success,
    SQLERRM AS message,
    0::BIGINT AS rows_refreshed,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time) AS duration_ms;
END;
$$;


ALTER FUNCTION "public"."refresh_content_popularity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_mv_site_urls"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  refresh materialized view concurrently public.mv_site_urls;
end;
$$;


ALTER FUNCTION "public"."refresh_mv_site_urls"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_mv_site_urls"() IS 'Refreshes mv_site_urls so cached publishing endpoints stay up to date.';



CREATE OR REPLACE FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  auth_user RECORD;
  avatar_url TEXT;
  full_name TEXT;
BEGIN
  -- Get auth.users data
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Extract data
  avatar_url := COALESCE(
    auth_user.raw_user_meta_data->>'avatar_url',
    auth_user.raw_user_meta_data->>'picture'
  );
  
  full_name := COALESCE(
    auth_user.raw_user_meta_data->>'full_name',
    auth_user.raw_user_meta_data->>'name',
    auth_user.raw_user_meta_data->>'user_name'
  );
  
  -- Update public.users with latest OAuth data
  UPDATE public.users
  SET 
    name = COALESCE(full_name, name),
    image = COALESCE(avatar_url, image),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_user_stat"("p_user_id" "uuid") RETURNS TABLE("success" boolean, "message" "text", "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Delete existing row for this user
  DELETE FROM public.user_stats WHERE user_stats.user_id = p_user_id;

  -- Insert updated stats for this user
  INSERT INTO public.user_stats
  SELECT
    u.id AS user_id,
    u.reputation_score,
    COALESCE(p.total_posts, 0) AS total_posts,
    COALESCE(p.total_upvotes_received, 0) AS total_upvotes_received,
    COALESCE(b.total_bookmarks, 0) AS total_bookmarks,
    COALESCE(c.total_collections, 0) AS total_collections,
    COALESCE(c.public_collections, 0) AS public_collections,
    COALESCE(r.total_reviews, 0) AS total_reviews,
    COALESCE(r.avg_rating_given, 0.0) AS avg_rating_given,
    COALESCE(s.total_submissions, 0) AS total_submissions,
    COALESCE(s.approved_submissions, 0) AS approved_submissions,
    COALESCE(bd.total_badges, 0) AS total_badges,
    COALESCE(bd.featured_badges, 0) AS featured_badges,
    COALESCE(v.total_votes_given, 0) AS total_votes_given,
    COALESCE(cm.total_comments, 0) AS total_comments,
    u.created_at,
    EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 AS account_age_days,
    NOW() AS refreshed_at
  FROM public.users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_posts, COALESCE(SUM(vote_count), 0) AS total_upvotes_received
    FROM public.posts GROUP BY user_id
  ) p ON u.id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_bookmarks
    FROM public.bookmarks GROUP BY user_id
  ) b ON u.id = b.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_collections, COUNT(*) FILTER (WHERE is_public = true) AS public_collections
    FROM public.user_collections GROUP BY user_id
  ) c ON u.id = c.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_reviews, AVG(rating)::NUMERIC(3,1) AS avg_rating_given
    FROM public.review_ratings GROUP BY user_id
  ) r ON u.id = r.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_submissions, COUNT(*) FILTER (WHERE status = 'approved') AS approved_submissions
    FROM public.submissions GROUP BY user_id
  ) s ON u.id = s.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_badges, COUNT(*) FILTER (WHERE featured = true) AS featured_badges
    FROM public.user_badges GROUP BY user_id
  ) bd ON u.id = bd.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_votes_given
    FROM public.votes GROUP BY user_id
  ) v ON u.id = v.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_comments
    FROM public.comments GROUP BY user_id
  ) cm ON u.id = cm.user_id
  WHERE u.id = p_user_id;

  RETURN QUERY SELECT
    true AS success,
    'User stats refreshed successfully' AS message,
    p_user_id AS user_id;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    false AS success,
    SQLERRM AS message,
    p_user_id AS user_id;
END;
$$;


ALTER FUNCTION "public"."refresh_user_stat"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_user_stats"() RETURNS TABLE("success" boolean, "message" "text", "rows_refreshed" bigint, "duration_ms" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_row_count BIGINT;
BEGIN
  v_start_time := clock_timestamp();

  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;

  -- Get row count
  SELECT COUNT(*) INTO v_row_count FROM public.user_stats;

  RETURN QUERY SELECT
    true AS success,
    'User stats refreshed successfully' AS message,
    v_row_count AS rows_refreshed,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time) AS duration_ms;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    false AS success,
    SQLERRM AS message,
    0::BIGINT AS rows_refreshed,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time) AS duration_ms;
END;
$$;


ALTER FUNCTION "public"."refresh_user_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM bookmarks
  WHERE user_id = p_user_id
    AND content_type = p_content_type
    AND content_slug = p_content_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bookmark not found';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."remove_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."remove_bookmark"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") IS 'Remove bookmark. Replaces 38 LOC TypeScript with simple DELETE operation.';



CREATE OR REPLACE FUNCTION "public"."reorder_collection_items"("p_collection_id" "uuid", "p_user_id" "uuid", "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_item JSONB;
  v_updated_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Verify collection exists and user owns it
  IF NOT EXISTS (
    SELECT 1 FROM user_collections
    WHERE id = p_collection_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Collection not found or unauthorized',
      'updated', 0
    );
  END IF;

  -- Batch update all items in single transaction
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      UPDATE collection_items
      SET "order" = (v_item->>'order')::INTEGER,
          updated_at = NOW()
      WHERE id = (v_item->>'id')::UUID
        AND collection_id = p_collection_id;

      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'itemId', v_item->>'id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated', v_updated_count,
    'errors', v_errors
  );
END;
$$;


ALTER FUNCTION "public"."reorder_collection_items"("p_collection_id" "uuid", "p_user_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reorder_collection_items"("p_collection_id" "uuid", "p_user_id" "uuid", "p_items" "jsonb") IS 'Batch reorders collection items in single transaction. Replaces N parallel UPDATE queries (10-50X faster for large collections).';



CREATE OR REPLACE FUNCTION "public"."replace_title_placeholder"("p_text" "text", "p_title" "text", "p_slug" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
begin
  -- Use title if available, otherwise use slug
  return replace(p_text, '{title}', coalesce(p_title, p_slug, ''));
end;
$$;


ALTER FUNCTION "public"."replace_title_placeholder"("p_text" "text", "p_title" "text", "p_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."replace_title_placeholder"("p_text" "text", "p_title" "text", "p_slug" "text") IS 'Replaces {title} placeholder with actual title or slug for personalized content generation.';



CREATE OR REPLACE FUNCTION "public"."schedule_next_sequence_step"("p_email" "text", "p_current_step" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sequence_id TEXT := 'onboarding';
  v_next_step INT;
  v_delay_days INT;
  v_due_at TIMESTAMPTZ;
BEGIN
  -- Calculate next step
  v_next_step := p_current_step + 1;

  -- Only schedule if not at final step
  IF v_next_step > 5 THEN
    RETURN;
  END IF;

  -- Determine delay for next step (from original step, not cumulative)
  -- Step 2: 2 days, Step 3: 5 days, Step 4: 9 days, Step 5: 14 days
  v_delay_days := CASE v_next_step
    WHEN 2 THEN 2
    WHEN 3 THEN 5
    WHEN 4 THEN 9
    WHEN 5 THEN 14
    ELSE 0
  END;

  -- Calculate due date from NOW (not from original enrollment)
  v_due_at := NOW() + (v_delay_days || ' days')::INTERVAL;

  -- Insert schedule record
  INSERT INTO email_sequence_schedule (
    sequence_id,
    email,
    step,
    due_at,
    processed
  ) VALUES (
    v_sequence_id,
    p_email,
    v_next_step,
    v_due_at,
    false
  )
  ON CONFLICT (sequence_id, email, step) DO NOTHING; -- Idempotent
END;
$$;


ALTER FUNCTION "public"."schedule_next_sequence_step"("p_email" "text", "p_current_step" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."schedule_next_sequence_step"("p_email" "text", "p_current_step" integer) IS 'Schedule next step in email sequence. Delays are from NOW, not enrollment date.';



CREATE OR REPLACE FUNCTION "public"."search_by_popularity"("p_query" "text" DEFAULT NULL::"text", "p_categories" "text"[] DEFAULT NULL::"text"[], "p_tags" "text"[] DEFAULT NULL::"text"[], "p_authors" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "slug" "text", "title" "text", "description" "text", "category" "text", "author" "text", "author_profile_url" "text", "date_added" "text", "tags" "text"[], "created_at" "text", "updated_at" "text", "features" "jsonb", "use_cases" "jsonb", "examples" "jsonb", "troubleshooting" "jsonb", "discovery_metadata" "jsonb", "fts_vector" "tsvector", "source_table" "text", "view_count" bigint, "copy_count" bigint, "bookmark_count" bigint, "popularity_score" real)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.slug,
    cs.title,
    cs.description,
    cs.category,
    cs.author,
    cs.author_profile_url,
    cs.date_added,
    cs.tags,
    cs.created_at,
    cs.updated_at,
    cs.features,
    cs.use_cases,
    cs.examples,
    cs.troubleshooting,
    cs.discovery_metadata,
    cs.fts_vector,
    cs.source_table,
    cs.view_count,
    cs.copy_count,
    cs.bookmark_count,
    cs.popularity_score
  FROM mv_content_stats cs
  WHERE
    (p_query IS NULL OR length(trim(p_query)) = 0 OR cs.title ILIKE '%' || p_query || '%' OR cs.description ILIKE '%' || p_query || '%')
    AND (p_categories IS NULL OR cs.category = ANY(p_categories))
    AND (p_tags IS NULL OR cs.tags && p_tags)
    AND (p_authors IS NULL OR cs.author = ANY(p_authors))
  ORDER BY cs.popularity_score DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_by_popularity"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_by_popularity"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_limit" integer, "p_offset" integer) IS 'Database-first popularity search. Uses mv_content_stats materialized view for pre-computed popularity scores.';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid",
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "website" "text",
    "description" "text",
    "size" "text",
    "industry" "text",
    "using_cursor_since" "date",
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("name", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("description", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("industry", ''::"text")), 'C'::"char"))) STORED,
    CONSTRAINT "companies_description_length" CHECK ((("description" IS NULL) OR ("length"("description") <= 1000))),
    CONSTRAINT "companies_industry_length" CHECK ((("industry" IS NULL) OR ("length"("industry") <= 100))),
    CONSTRAINT "companies_logo_url" CHECK ((("logo" IS NULL) OR ("logo" ~ '^https?://[^\s]+$'::"text"))),
    CONSTRAINT "companies_name_length" CHECK ((("length"("name") >= 2) AND ("length"("name") <= 200))),
    CONSTRAINT "companies_size_enum" CHECK ((("size" IS NULL) OR ("size" = ANY (ARRAY['1-10'::"text", '11-50'::"text", '51-200'::"text", '201-500'::"text", '500+'::"text"])))),
    CONSTRAINT "companies_slug_pattern" CHECK (("slug" ~ '^[a-z0-9\-]+$'::"text")),
    CONSTRAINT "companies_website_url" CHECK ((("website" IS NULL) OR ("website" ~ '^https?://[^\s]+$'::"text")))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."companies"."using_cursor_since" IS 'Date when company started using Cursor (PostgreSQL DATE type)';



COMMENT ON COLUMN "public"."companies"."search_vector" IS 'Full-text search vector (auto-maintained): name(A) + description(B) + industry(C)';



COMMENT ON CONSTRAINT "companies_description_length" ON "public"."companies" IS 'Enforces description max 1000 characters';



COMMENT ON CONSTRAINT "companies_industry_length" ON "public"."companies" IS 'Enforces industry max 100 characters';



COMMENT ON CONSTRAINT "companies_logo_url" ON "public"."companies" IS 'Enforces logo must be valid HTTP/HTTPS URL if provided';



COMMENT ON CONSTRAINT "companies_name_length" ON "public"."companies" IS 'Enforces company name between 2-200 characters';



COMMENT ON CONSTRAINT "companies_size_enum" ON "public"."companies" IS 'Enforces valid company size ranges';



COMMENT ON CONSTRAINT "companies_slug_pattern" ON "public"."companies" IS 'Enforces slug format: lowercase letters, numbers, hyphens only';



COMMENT ON CONSTRAINT "companies_website_url" ON "public"."companies" IS 'Enforces website must be valid HTTP/HTTPS URL if provided';



CREATE OR REPLACE FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer DEFAULT 20) RETURNS SETOF "public"."companies"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM public.companies c
  WHERE
    -- Full-text search match
    c.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY
    -- Relevance ranking
    ts_rank(c.search_vector, plainto_tsquery('english', search_query)) DESC,
    -- Tie-breaker: featured companies first
    c.featured DESC NULLS LAST,
    c.created_at DESC
  LIMIT result_limit;
END;
$$;


ALTER FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_content_optimized"("p_query" "text" DEFAULT NULL::"text", "p_categories" "text"[] DEFAULT NULL::"text"[], "p_tags" "text"[] DEFAULT NULL::"text"[], "p_authors" "text"[] DEFAULT NULL::"text"[], "p_sort" "text" DEFAULT 'relevance'::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "slug" "text", "title" "text", "description" "text", "category" "text", "author" "text", "author_profile_url" "text", "date_added" "text", "tags" "text"[], "created_at" "text", "updated_at" "text", "features" "jsonb", "use_cases" "jsonb", "examples" "jsonb", "troubleshooting" "jsonb", "discovery_metadata" "jsonb", "fts_vector" "tsvector", "source_table" "text", "relevance_score" real, "view_count" bigint, "copy_count" bigint, "bookmark_count" bigint, "combined_score" real)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT
      cu.*,
      -- Relevance score from ts_rank (0.0 to 1.0)
      -- Higher weight for exact title matches
      CASE
        WHEN p_query IS NOT NULL AND p_query != '' THEN
          ts_rank(
            cu.fts_vector,
            websearch_to_tsquery('english', p_query),
            1  -- normalization: divide by document length
          )
        ELSE 0.0
      END AS relevance,

      -- Analytics from materialized view
      COALESCE(a.view_count, 0) AS views,
      COALESCE(a.copy_count, 0) AS copies,
      COALESCE(a.bookmark_count, 0) AS bookmarks,

      -- Combined score: relevance (70%) + popularity (30%)
      -- Normalized popularity: log scale to prevent huge view counts from dominating
      CASE
        WHEN p_query IS NOT NULL AND p_query != '' THEN
          (ts_rank(
            cu.fts_vector,
            websearch_to_tsquery('english', p_query),
            1
          ) * 0.7) +
          (LEAST(LOG(1 + COALESCE(a.view_count, 0)) / 10.0, 1.0) * 0.3)
        ELSE
          -- No query: pure popularity ranking
          LOG(1 + COALESCE(a.view_count, 0))
      END AS final_score

    FROM public.content_unified cu
    LEFT JOIN public.mv_analytics_summary a
      ON cu.category = a.category
      AND cu.slug = a.slug

    WHERE
      -- Full-text search filter (uses GIN index)
      (p_query IS NULL OR p_query = '' OR cu.fts_vector @@ websearch_to_tsquery('english', p_query))

      -- Category filter
      AND (p_categories IS NULL OR cu.category = ANY(p_categories))

      -- Tag filter (array overlap)
      AND (p_tags IS NULL OR cu.tags && p_tags)

      -- Author filter
      AND (p_authors IS NULL OR cu.author = ANY(p_authors))
  )
  SELECT
    sr.id,
    sr.slug,
    sr.title,
    sr.description,
    sr.category,
    sr.author,
    sr.author_profile_url,
    sr.date_added,
    sr.tags,
    sr.created_at,
    sr.updated_at,
    sr.features,
    sr.use_cases,
    sr.examples,
    sr.troubleshooting,
    sr.discovery_metadata,
    sr.fts_vector,
    sr.source_table,
    sr.relevance::REAL AS relevance_score,
    sr.views AS view_count,
    sr.copies AS copy_count,
    sr.bookmarks AS bookmark_count,
    sr.final_score::REAL AS combined_score
  FROM search_results sr
  ORDER BY
    CASE
      WHEN p_sort = 'relevance' THEN sr.final_score
      WHEN p_sort = 'popularity' THEN LOG(1 + sr.views)
      ELSE 0
    END DESC,
    CASE WHEN p_sort = 'newest' THEN sr.created_at END DESC,
    CASE WHEN p_sort = 'alphabetical' THEN sr.title END ASC,
    -- Tie-breaker: always use combined_score for consistent ordering
    sr.final_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_content_optimized"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_sort" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_content_optimized"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_sort" "text", "p_limit" integer, "p_offset" integer) IS 'Optimized search with ts_rank relevance scoring and popularity boost.

Performance: ~5-20ms per query using GIN indexes.

Scoring Algorithm:
- Relevance: ts_rank (PostgreSQL full-text search, 0.0-1.0)
- Popularity: LOG(1 + view_count) normalized to 0.0-1.0
- Combined: (relevance × 0.7) + (popularity × 0.3)

Sort Options:
- relevance: Combined score (default)
- popularity: View count (logarithmic scale)
- newest: Created date descending
- alphabetical: Title ascending

Example:
SELECT * FROM search_content_optimized(
  p_query := ''biome linter'',
  p_categories := ARRAY[''agents'', ''rules''],
  p_tags := ARRAY[''linting''],
  p_sort := ''relevance'',
  p_limit := 20
);';



CREATE OR REPLACE FUNCTION "public"."search_jobs"("search_query" "text", "result_limit" integer DEFAULT 20) RETURNS SETOF "public"."jobs"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT j.*
  FROM public.jobs j
  WHERE
    -- Only return active jobs
    j.status = 'active'
    -- Full-text search match
    AND j.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY
    -- Relevance ranking
    ts_rank(j.search_vector, plainto_tsquery('english', search_query)) DESC,
    -- Tie-breaker: featured jobs first
    j.featured DESC NULLS LAST,
    j.created_at DESC
  LIMIT result_limit;
END;
$$;


ALTER FUNCTION "public"."search_jobs"("search_query" "text", "result_limit" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "slug" "text",
    "image" "text",
    "hero" "text",
    "bio" "text",
    "work" "text",
    "website" "text",
    "social_x_link" "text",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "reputation_score" integer DEFAULT 0,
    "tier" "text" DEFAULT 'free'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "public" boolean DEFAULT true,
    "follow_email" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS (((("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("name", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("bio", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("work", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE(("interests")::"text", ''::"text")), 'D'::"char"))) STORED,
    "tier_name" "text" GENERATED ALWAYS AS ("public"."get_tier_name_from_score"("reputation_score")) STORED,
    "tier_progress" integer GENERATED ALWAYS AS ("public"."get_tier_progress_from_score"("reputation_score")) STORED,
    CONSTRAINT "users_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."search_vector" IS 'Full-text search vector (auto-maintained): name(A) + bio(B) + work(C) + interests(D)';



COMMENT ON COLUMN "public"."users"."tier_name" IS 'Auto-computed reputation tier name based on reputation_score. Updates automatically when score changes.';



COMMENT ON COLUMN "public"."users"."tier_progress" IS 'Auto-computed progress through current reputation tier (0-100%). Updates automatically when score changes.';



CREATE OR REPLACE FUNCTION "public"."search_users"("search_query" "text", "result_limit" integer DEFAULT 20) RETURNS SETOF "public"."users"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT u.*
  FROM public.users u
  WHERE
    -- Only return public profiles
    u.public = true
    -- Full-text search match
    AND u.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY
    -- Relevance ranking
    ts_rank(u.search_vector, plainto_tsquery('english', search_query)) DESC,
    -- Tie-breaker: reputation
    u.reputation_score DESC
  LIMIT result_limit;
END;
$$;


ALTER FUNCTION "public"."search_users"("search_query" "text", "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_changelog_changes_from_jsonb"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  category_name TEXT;
  change_item TEXT;
  item_order INT;
BEGIN
  -- Only process if changes field was modified
  IF TG_OP = 'UPDATE' AND (OLD.changes IS NOT DISTINCT FROM NEW.changes) THEN
    RETURN NEW;
  END IF;

  -- Delete existing changes for this entry
  DELETE FROM public.changelog_changes WHERE changelog_entry_id = NEW.id;

  -- Re-insert from JSONB if not null
  IF NEW.changes IS NOT NULL THEN
    FOR category_name IN SELECT * FROM unnest(ARRAY['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'])
    LOOP
      IF NEW.changes ? category_name AND jsonb_typeof(NEW.changes -> category_name) = 'array' THEN
        item_order := 0;
        
        FOR change_item IN 
          SELECT value::text 
          FROM jsonb_array_elements_text(NEW.changes -> category_name)
        LOOP
          INSERT INTO public.changelog_changes (
            changelog_entry_id,
            category,
            change_text,
            display_order
          ) VALUES (
            NEW.id,
            category_name,
            change_item,
            item_order
          );
          
          item_order := item_order + 1;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_changelog_changes_from_jsonb"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_action" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate: Cannot follow yourself
  IF p_follower_id = p_following_id THEN
    RAISE EXCEPTION 'You cannot follow yourself';
  END IF;

  IF p_action = 'follow' THEN
    -- Create follow relationship
    BEGIN
      INSERT INTO followers (follower_id, following_id)
      VALUES (p_follower_id, p_following_id);

      v_result := jsonb_build_object(
        'success', true,
        'action', 'follow'
      );
    EXCEPTION
      WHEN unique_violation THEN
        RAISE EXCEPTION 'You are already following this user';
    END;
  ELSIF p_action = 'unfollow' THEN
    -- Delete follow relationship
    DELETE FROM followers
    WHERE follower_id = p_follower_id
      AND following_id = p_following_id;

    v_result := jsonb_build_object(
      'success', true,
      'action', 'unfollow'
    );
  ELSE
    RAISE EXCEPTION 'Invalid action. Must be "follow" or "unfollow"';
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid", "p_action" "text") IS 'Toggle follow/unfollow with validation. Replaces 53 LOC TypeScript with atomic database operation.';



CREATE OR REPLACE FUNCTION "public"."toggle_post_vote"("p_post_id" "uuid", "p_user_id" "uuid", "p_action" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_action = 'vote' THEN
    INSERT INTO votes (user_id, post_id)
    VALUES (p_user_id, p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'You have already voted on this post';
    END IF;
  ELSIF p_action = 'unvote' THEN
    DELETE FROM votes
    WHERE user_id = p_user_id
      AND post_id = p_post_id;
  ELSE
    RAISE EXCEPTION 'Invalid action. Must be "vote" or "unvote"';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action
  );
END;
$$;


ALTER FUNCTION "public"."toggle_post_vote"("p_post_id" "uuid", "p_user_id" "uuid", "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_post_vote"("p_post_id" "uuid", "p_user_id" "uuid", "p_action" "text") IS 'Toggle vote on post (upvote/unvote). Replaces 50 LOC TypeScript with atomic INSERT/DELETE.';



CREATE OR REPLACE FUNCTION "public"."toggle_review_helpful"("p_review_id" "uuid", "p_user_id" "uuid", "p_helpful" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_review RECORD;
BEGIN
  SELECT user_id, content_type, content_slug
  INTO v_review
  FROM review_ratings
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_review.user_id = p_user_id THEN
    RAISE EXCEPTION 'You cannot vote on your own review';
  END IF;

  IF p_helpful THEN
    INSERT INTO review_helpful_votes (review_id, user_id)
    VALUES (p_review_id, p_user_id)
    ON CONFLICT (review_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM review_helpful_votes
    WHERE review_id = p_review_id
      AND user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'helpful', p_helpful,
    'content_type', v_review.content_type,
    'content_slug', v_review.content_slug
  );
END;
$$;


ALTER FUNCTION "public"."toggle_review_helpful"("p_review_id" "uuid", "p_user_id" "uuid", "p_helpful" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_review_helpful"("p_review_id" "uuid", "p_user_id" "uuid", "p_helpful" boolean) IS 'Toggle helpful vote on review with validation. Replaces 83 LOC TypeScript with atomic database operation.';



CREATE OR REPLACE FUNCTION "public"."trigger_auto_award_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_target_user_id UUID;
  v_results RECORD;
  v_awarded_count INTEGER := 0;
BEGIN
  -- Determine which user_id to check based on trigger context
  IF TG_TABLE_NAME = 'posts' THEN
    v_target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    v_target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'followers' THEN
    v_target_user_id := NEW.followed_id; -- User being followed gets badge
  ELSIF TG_TABLE_NAME = 'submissions' THEN
    v_target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    v_target_user_id := NEW.user_id;
  ELSE
    RETURN NEW; -- Unknown table, skip
  END IF;

  -- Execute badge awarding (async - doesn't block the INSERT)
  FOR v_results IN SELECT * FROM auto_award_badges(v_target_user_id)
  LOOP
    IF v_results.awarded THEN
      v_awarded_count := v_awarded_count + 1;
    END IF;
  END LOOP;

  -- Log if badges were awarded (optional)
  IF v_awarded_count > 0 THEN
    RAISE NOTICE 'Auto-awarded % badges to user %', v_awarded_count, v_target_user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_auto_award_badges"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_auto_award_badges"() IS 'Trigger function that automatically awards badges after user activities. Runs after INSERT on posts, comments, followers, submissions, reviews.';



CREATE OR REPLACE FUNCTION "public"."trigger_update_user_reputation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Determine user_id from the triggering table
  IF TG_TABLE_NAME = 'posts' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'submissions' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Skip if no user_id
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Async update reputation (doesn't block the main operation)
  PERFORM calculate_user_reputation(v_user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_update_user_reputation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_update_user_reputation"() IS 'Trigger function to automatically update user reputation when posts/comments/submissions change.';



CREATE OR REPLACE FUNCTION "public"."update_announcements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_announcements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_collection_item_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  affected_collection_id UUID;
BEGIN
  affected_collection_id := COALESCE(NEW.collection_id, OLD.collection_id);
  
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


ALTER FUNCTION "public"."update_collection_item_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Build tsvector with weighted fields:
  -- A = title (highest priority)
  -- B = description
  -- C = tags
  -- D = keywords (guides only)

  NEW.fts_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');

  -- Add keywords for guides table
  IF TG_TABLE_NAME = 'guides' AND NEW.keywords IS NOT NULL THEN
    NEW.fts_vector := NEW.fts_vector ||
      setweight(to_tsvector('english', array_to_string(NEW.keywords, ' ')), 'D');
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_fts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_items_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_email_sequences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_email_sequences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_newsletter_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newsletter_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.posts
  SET vote_count = (
    SELECT COUNT(*) FROM public.votes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_post_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reputation_on_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.calculate_user_reputation(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reputation_on_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reputation_on_helpful_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Award +5 reputation when review reaches 5 helpful votes
  IF NEW.helpful_count = 5 AND OLD.helpful_count < 5 THEN
    UPDATE public.users
    SET reputation_score = reputation_score + 5
    WHERE id = NEW.user_id;
  END IF;

  -- Award +10 reputation when review reaches 10 helpful votes (another milestone)
  IF NEW.helpful_count = 10 AND OLD.helpful_count < 10 THEN
    UPDATE public.users
    SET reputation_score = reputation_score + 10
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reputation_on_helpful_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reputation_on_post"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.calculate_user_reputation(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reputation_on_post"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reputation_on_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'merged') OR
     (TG_OP = 'UPDATE' AND (OLD.status != NEW.status) AND 
      (OLD.status = 'merged' OR NEW.status = 'merged')) THEN
    PERFORM public.calculate_user_reputation(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reputation_on_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reputation_on_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  IF post_owner_id IS NOT NULL THEN
    PERFORM public.calculate_user_reputation(post_owner_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_reputation_on_vote"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_review_helpful_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.review_ratings
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.review_ratings
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_review_helpful_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seo_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_seo_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_structured_data_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_structured_data_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to automatically update updated_at timestamp';



CREATE OR REPLACE FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") RETURNS TABLE("inserted_count" integer, "updated_count" integer, "total_affinity_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- Calculate all affinities and upsert to user_affinity table
  WITH calculated_affinities AS (
    SELECT * FROM public.calculate_all_user_affinities(p_user_id)
  ),
  upsert_results AS (
    INSERT INTO public.user_affinity (
      user_id,
      content_type,
      content_slug,
      affinity_score,
      last_calculated_at
    )
    SELECT
      p_user_id,
      content_type,
      content_slug,
      affinity_score,
      NOW()
    FROM calculated_affinities
    ON CONFLICT (user_id, content_type, content_slug)
    DO UPDATE SET
      affinity_score = EXCLUDED.affinity_score,
      last_calculated_at = EXCLUDED.last_calculated_at,
      updated_at = NOW()
    RETURNING
      CASE WHEN user_affinity.created_at = user_affinity.updated_at THEN 1 ELSE 0 END as is_insert
  )
  SELECT
    SUM(is_insert)::INTEGER,
    SUM(CASE WHEN is_insert = 0 THEN 1 ELSE 0 END)::INTEGER,
    COUNT(*)::INTEGER
  INTO v_inserted, v_updated, v_total
  FROM upsert_results;

  -- Return summary
  RETURN QUERY SELECT
    COALESCE(v_inserted, 0),
    COALESCE(v_updated, 0),
    COALESCE(v_total, 0);
END;
$$;


ALTER FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") IS 'Calculates all affinities for a user and persists to user_affinity table. Used by pg_cron job (SUPABASE-015) and on-demand calculations. Returns count of inserted/updated records.';



CREATE OR REPLACE FUNCTION "public"."update_user_profile"("p_user_id" "uuid", "p_display_name" "text" DEFAULT NULL::"text", "p_bio" "text" DEFAULT NULL::"text", "p_work" "text" DEFAULT NULL::"text", "p_website" "text" DEFAULT NULL::"text", "p_social_x_link" "text" DEFAULT NULL::"text", "p_interests" "text"[] DEFAULT NULL::"text"[], "p_profile_public" boolean DEFAULT NULL::boolean, "p_follow_email" boolean DEFAULT NULL::boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_updated_user JSONB;
BEGIN
  UPDATE users
  SET
    display_name = COALESCE(p_display_name, display_name),
    bio = CASE WHEN p_bio = '' THEN NULL ELSE COALESCE(p_bio, bio) END,
    work = CASE WHEN p_work = '' THEN NULL ELSE COALESCE(p_work, work) END,
    website = CASE WHEN p_website = '' THEN NULL ELSE COALESCE(p_website, website) END,
    social_x_link = CASE WHEN p_social_x_link = '' THEN NULL ELSE COALESCE(p_social_x_link, social_x_link) END,
    interests = COALESCE(p_interests, interests),
    profile_public = COALESCE(p_profile_public, profile_public),
    follow_email = COALESCE(p_follow_email, follow_email),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'slug', slug,
    'display_name', display_name,
    'bio', bio,
    'work', work,
    'website', website,
    'social_x_link', social_x_link,
    'interests', interests,
    'profile_public', profile_public,
    'follow_email', follow_email,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_updated_user;

  IF v_updated_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile', v_updated_user
  );
END;
$$;


ALTER FUNCTION "public"."update_user_profile"("p_user_id" "uuid", "p_display_name" "text", "p_bio" "text", "p_work" "text", "p_website" "text", "p_social_x_link" "text", "p_interests" "text"[], "p_profile_public" boolean, "p_follow_email" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_profile"("p_user_id" "uuid", "p_display_name" "text", "p_bio" "text", "p_work" "text", "p_website" "text", "p_social_x_link" "text", "p_interests" "text"[], "p_profile_public" boolean, "p_follow_email" boolean) IS 'Update user profile with empty string → NULL conversion. Replaces 51 LOC TypeScript with database logic.';



CREATE OR REPLACE FUNCTION "public"."validate_interests_array"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.interests IS NOT NULL THEN
    -- Check each interest is between 1 and 30 characters
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.interests) AS interest
      WHERE length(interest) > 30 OR length(interest) < 1
    ) THEN
      RAISE EXCEPTION 'Each interest must be between 1 and 30 characters';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_interests_array"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affinity_config" (
    "id" integer DEFAULT 1 NOT NULL,
    "weight_views" numeric(3,2) DEFAULT 0.20,
    "weight_time_spent" numeric(3,2) DEFAULT 0.25,
    "weight_bookmarks" numeric(3,2) DEFAULT 0.30,
    "weight_copies" numeric(3,2) DEFAULT 0.15,
    "weight_recency" numeric(3,2) DEFAULT 0.10,
    "max_views" integer DEFAULT 10,
    "max_time_spent_seconds" integer DEFAULT 300,
    "max_bookmarks" integer DEFAULT 1,
    "max_copies" integer DEFAULT 3,
    "recency_half_life_days" integer DEFAULT 30,
    "min_score_threshold" integer DEFAULT 10,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "single_row_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."affinity_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."affinity_config" IS 'Configuration for affinity scoring algorithm. Single-row table with default weights and thresholds matching affinity-scorer.ts';



CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'agents'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "configuration" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "installation" "jsonb",
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "agents_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "agents_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "agents_category_check" CHECK (("category" = 'agents'::"text")),
    CONSTRAINT "agents_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "agents_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "agents_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "agents_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "agents_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "agents_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "agents_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "agents_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20))),
    CONSTRAINT "chk_agents_author_url" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "chk_agents_description_length" CHECK ((("description" IS NULL) OR (("length"("description") >= 10) AND ("length"("description") <= 500)))),
    CONSTRAINT "chk_agents_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "chk_agents_tags_count" CHECK ((("tags" IS NULL) OR ("array_length"("tags", 1) <= 10)))
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


COMMENT ON TABLE "public"."agents" IS 'AI agent configurations - specialized AI assistants for development tasks';



COMMENT ON COLUMN "public"."agents"."category" IS 'Category discriminator (always agents). No index needed - constant value.';



COMMENT ON COLUMN "public"."agents"."installation" IS 'Installation instructions for different platforms: {claudeCode: object, claudeDesktop: object, sdk: object, requirements: string[]}';



COMMENT ON COLUMN "public"."agents"."fts_vector" IS 'Full-text search vector (title=A, description=B, tags=C). Auto-updated on row change.';



COMMENT ON COLUMN "public"."agents"."popularity_score" IS 'Computed popularity score (will be updated by mv_content_stats)';



COMMENT ON CONSTRAINT "chk_agents_description_length" ON "public"."agents" IS 'Enforces description length 10-500 chars (replaces Zod validation)';



COMMENT ON CONSTRAINT "chk_agents_name_pattern" ON "public"."agents" IS 'Enforces slug pattern validation (replaces Zod regex in form.schema.ts)';



COMMENT ON CONSTRAINT "chk_agents_tags_count" ON "public"."agents" IS 'Enforces max 10 tags per content (replaces Zod validation)';



CREATE TABLE IF NOT EXISTS "public"."analytics_event_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "analytics_event_categories_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 200))),
    CONSTRAINT "analytics_event_categories_display_order_check" CHECK (("display_order" >= 0)),
    CONSTRAINT "analytics_event_categories_name_check" CHECK (("name" = ANY (ARRAY['CONTENT'::"text", 'JOURNEY'::"text", 'PERFORMANCE'::"text", 'INTERACTION'::"text", 'ERROR'::"text", 'FEATURE'::"text", 'NAVIGATION'::"text", 'PERSONALIZATION'::"text"])))
);


ALTER TABLE "public"."analytics_event_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_event_categories" IS 'Analytics event category taxonomy for organization';



COMMENT ON COLUMN "public"."analytics_event_categories"."name" IS 'Category name (CONTENT, JOURNEY, etc)';



COMMENT ON COLUMN "public"."analytics_event_categories"."display_order" IS 'Sort order in admin UI';



CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "sample_rate" numeric(3,2),
    "debug_only" boolean DEFAULT false NOT NULL,
    "payload_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "analytics_events_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "analytics_events_event_name_check" CHECK ((("length"("event_name") >= 2) AND ("length"("event_name") <= 100))),
    CONSTRAINT "analytics_events_sample_rate_check" CHECK ((("sample_rate" IS NULL) OR (("sample_rate" >= 0.0) AND ("sample_rate" <= 1.0))))
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'Analytics event definitions with configuration and payload schemas';



COMMENT ON COLUMN "public"."analytics_events"."event_name" IS 'Event identifier (e.g., content_viewed, search)';



COMMENT ON COLUMN "public"."analytics_events"."description" IS 'Human-readable event description';



COMMENT ON COLUMN "public"."analytics_events"."category" IS 'Event category for organization';



COMMENT ON COLUMN "public"."analytics_events"."enabled" IS 'Whether event is currently being tracked';



COMMENT ON COLUMN "public"."analytics_events"."sample_rate" IS 'Sampling rate (0.0-1.0, NULL = track all)';



COMMENT ON COLUMN "public"."analytics_events"."debug_only" IS 'Only fire in development/debug mode';



COMMENT ON COLUMN "public"."analytics_events"."payload_schema" IS 'JSON schema documenting expected payload fields';



CREATE TABLE IF NOT EXISTS "public"."announcement_dismissals" (
    "user_id" "uuid" NOT NULL,
    "announcement_id" "text" NOT NULL,
    "dismissed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcement_dismissals" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcement_dismissals" IS 'Tracks which users have dismissed which announcements';



COMMENT ON COLUMN "public"."announcement_dismissals"."user_id" IS 'User who dismissed the announcement';



COMMENT ON COLUMN "public"."announcement_dismissals"."announcement_id" IS 'Announcement that was dismissed';



COMMENT ON COLUMN "public"."announcement_dismissals"."dismissed_at" IS 'When the announcement was dismissed';



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "text" NOT NULL,
    "variant" "public"."announcement_variant" DEFAULT 'default'::"public"."announcement_variant" NOT NULL,
    "tag" "text",
    "title" "text" NOT NULL,
    "href" "text",
    "icon" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "priority" "public"."announcement_priority" DEFAULT 'medium'::"public"."announcement_priority" NOT NULL,
    "dismissible" boolean DEFAULT true NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "announcements_check" CHECK ((("end_date" IS NULL) OR ("end_date" > "start_date"))),
    CONSTRAINT "announcements_href_check" CHECK ((("href" IS NULL) OR ("href" ~ '^/'::"text"))),
    CONSTRAINT "announcements_icon_check" CHECK ((("icon" IS NULL) OR ("length"("icon") <= 50))),
    CONSTRAINT "announcements_id_check" CHECK (("id" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "announcements_tag_check" CHECK ((("tag" IS NULL) OR ("length"("tag") <= 20))),
    CONSTRAINT "announcements_title_check" CHECK ((("length"("title") >= 10) AND ("length"("title") <= 150)))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcements" IS 'Site-wide announcement definitions with scheduling and priority';



COMMENT ON COLUMN "public"."announcements"."id" IS 'Unique identifier in kebab-case format (e.g., skills-launch-2025-10)';



COMMENT ON COLUMN "public"."announcements"."variant" IS 'Visual style: default (accent), outline (border), secondary (muted), destructive (red)';



COMMENT ON COLUMN "public"."announcements"."tag" IS 'Optional category badge (e.g., "New", "Beta", "Update")';



COMMENT ON COLUMN "public"."announcements"."title" IS 'Main announcement text (10-150 characters)';



COMMENT ON COLUMN "public"."announcements"."href" IS 'Optional relative link destination (must start with /)';



COMMENT ON COLUMN "public"."announcements"."icon" IS 'Optional Lucide icon name (e.g., "ArrowUpRight", "AlertTriangle")';



COMMENT ON COLUMN "public"."announcements"."start_date" IS 'Announcement becomes visible after this date (null = immediate)';



COMMENT ON COLUMN "public"."announcements"."end_date" IS 'Announcement hidden after this date (null = no expiration)';



COMMENT ON COLUMN "public"."announcements"."priority" IS 'Display priority when multiple active (high > medium > low)';



COMMENT ON COLUMN "public"."announcements"."dismissible" IS 'Whether users can dismiss (false for critical alerts)';



COMMENT ON COLUMN "public"."announcements"."active" IS 'Admin toggle to enable/disable without deleting';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text",
    "category" "text" NOT NULL,
    "criteria" "jsonb" NOT NULL,
    "tier_required" "text" DEFAULT 'free'::"text",
    "order" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rarity" "public"."badge_rarity" DEFAULT 'common'::"public"."badge_rarity" NOT NULL,
    CONSTRAINT "badges_tier_required_check" CHECK (("tier_required" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bookmarks_content_slug_pattern" CHECK ((("content_slug" ~ '^[a-zA-Z0-9\-_/]+$'::"text") AND ("length"("content_slug") <= 200))),
    CONSTRAINT "bookmarks_notes_length" CHECK ((("notes" IS NULL) OR ("length"("notes") <= 500)))
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


COMMENT ON CONSTRAINT "bookmarks_content_slug_pattern" ON "public"."bookmarks" IS 'Enforces content slug format: letters, numbers, hyphens, underscores, slashes (max 200 chars)';



COMMENT ON CONSTRAINT "bookmarks_notes_length" ON "public"."bookmarks" IS 'Enforces notes max 500 characters';



CREATE TABLE IF NOT EXISTS "public"."category_configs" (
    "category" "public"."content_category" NOT NULL,
    "title" "text" NOT NULL,
    "plural_title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon_name" "text" NOT NULL,
    "color_scheme" "text" NOT NULL,
    "show_on_homepage" boolean DEFAULT true NOT NULL,
    "keywords" "text" NOT NULL,
    "meta_description" "text" NOT NULL,
    "sections" "jsonb" DEFAULT '{"examples": false, "features": true, "security": false, "use_cases": true, "installation": true, "configuration": true, "troubleshooting": true}'::"jsonb" NOT NULL,
    "primary_action_type" "text" NOT NULL,
    "primary_action_label" "text" NOT NULL,
    "primary_action_config" "jsonb",
    "search_placeholder" "text" NOT NULL,
    "empty_state_message" "text",
    "url_slug" "text" NOT NULL,
    "content_loader" "text" NOT NULL,
    "display_config" boolean DEFAULT true NOT NULL,
    "config_format" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "category_configs_config_format_check" CHECK (("config_format" = ANY (ARRAY['json'::"text", 'multi'::"text", 'hook'::"text"]))),
    CONSTRAINT "category_configs_primary_action_type_check" CHECK (("primary_action_type" = ANY (ARRAY['notification'::"text", 'copy_command'::"text", 'copy_script'::"text", 'scroll'::"text", 'download'::"text", 'github_link'::"text"])))
);


ALTER TABLE "public"."category_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_configs" IS 'Unified category configuration replacing UNIFIED_CATEGORY_REGISTRY and content-type-configs.tsx. Single source of truth for all category metadata.';



COMMENT ON COLUMN "public"."category_configs"."icon_name" IS 'Lucide icon component name (e.g., ''Sparkles'', ''Terminal''). Maps to React components in TypeScript.';



COMMENT ON COLUMN "public"."category_configs"."sections" IS 'JSONB object defining which sections to display on detail pages: { "features": boolean, "installation": boolean, ... }';



COMMENT ON COLUMN "public"."category_configs"."primary_action_type" IS 'Type of primary action button. Determines which handler function to use in TypeScript.';



COMMENT ON COLUMN "public"."category_configs"."primary_action_config" IS 'Additional configuration for primary action. Structure varies by action_type: scroll needs sectionId, download needs pathTemplate.';



CREATE TABLE IF NOT EXISTS "public"."changelog" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'changelog'::"text" NOT NULL,
    "version" "text",
    "date_added" "date" NOT NULL,
    "date_published" "date",
    "date_updated" "date",
    "tags" "text"[] NOT NULL,
    "sections" "jsonb" NOT NULL,
    "commit_count" integer,
    "contributors" "text"[],
    "git_tag" "text",
    "git_hash" "text",
    "featured" boolean DEFAULT false,
    "source" "text" DEFAULT 'claudepro'::"text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "changelog_category_check" CHECK (("category" = 'changelog'::"text")),
    CONSTRAINT "changelog_commit_count_check" CHECK ((("commit_count" IS NULL) OR ("commit_count" >= 0))),
    CONSTRAINT "changelog_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "changelog_sections_check" CHECK (("jsonb_typeof"("sections") = 'array'::"text")),
    CONSTRAINT "changelog_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "changelog_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "changelog_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "changelog_title_check" CHECK (("length"("title") >= 3)),
    CONSTRAINT "changelog_version_check" CHECK ((("version" IS NULL) OR ("version" ~ '^v?[0-9]+\\.[0-9]+\\.[0-9]+'::"text")))
);


ALTER TABLE "public"."changelog" OWNER TO "postgres";


COMMENT ON TABLE "public"."changelog" IS 'Changelog entries - platform updates and release notes (auto-generated from git-cliff)';



COMMENT ON COLUMN "public"."changelog"."version" IS 'Semantic version (e.g., v1.2.3) extracted from git tags';



COMMENT ON COLUMN "public"."changelog"."sections" IS 'JSONB array of guide-style sections (reuses guide schema for consistency)';



COMMENT ON COLUMN "public"."changelog"."commit_count" IS 'Number of commits in this release';



CREATE TABLE IF NOT EXISTS "public"."changelog_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "changelog_entry_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "change_text" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "changelog_changes_category_check" CHECK (("category" = ANY (ARRAY['Added'::"text", 'Changed'::"text", 'Deprecated'::"text", 'Removed'::"text", 'Fixed'::"text", 'Security'::"text"])))
);


ALTER TABLE "public"."changelog_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."changelog_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "release_date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "tldr" "text",
    "changes" "jsonb" DEFAULT '{"Added": [], "Fixed": [], "Changed": [], "Removed": [], "Security": [], "Deprecated": []}'::"jsonb" NOT NULL,
    "content" "text" NOT NULL,
    "raw_content" "text" NOT NULL,
    "description" "text",
    "keywords" "text"[],
    "published" boolean DEFAULT true NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "changelog_entries_content_check" CHECK (("length"("content") >= 10)),
    CONSTRAINT "changelog_entries_description_check" CHECK ((("description" IS NULL) OR (("length"("description") >= 50) AND ("length"("description") <= 160)))),
    CONSTRAINT "changelog_entries_raw_content_check" CHECK (("length"("raw_content") >= 10)),
    CONSTRAINT "changelog_entries_slug_check" CHECK (("slug" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "changelog_entries_title_check" CHECK ((("length"("title") >= 1) AND ("length"("title") <= 200))),
    CONSTRAINT "changelog_entries_tldr_check" CHECK ((("tldr" IS NULL) OR (("length"("tldr") >= 1) AND ("length"("tldr") <= 500)))),
    CONSTRAINT "changes_structure" CHECK ((("jsonb_typeof"("changes") = 'object'::"text") AND ("changes" ? 'Added'::"text") AND ("changes" ? 'Changed'::"text") AND ("changes" ? 'Deprecated'::"text") AND ("changes" ? 'Removed'::"text") AND ("changes" ? 'Fixed'::"text") AND ("changes" ? 'Security'::"text") AND ("jsonb_typeof"(("changes" -> 'Added'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("changes" -> 'Changed'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("changes" -> 'Deprecated'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("changes" -> 'Removed'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("changes" -> 'Fixed'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("changes" -> 'Security'::"text")) = 'array'::"text")))
);


ALTER TABLE "public"."changelog_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."changelog_entries" IS 'Parsed CHANGELOG.md entries following Keep a Changelog 1.0.0 specification';



COMMENT ON COLUMN "public"."changelog_entries"."changes" IS 'Categorized changes in Keep a Changelog format (Added, Changed, Fixed, etc.)';



COMMENT ON COLUMN "public"."changelog_entries"."raw_content" IS 'Original markdown content for llms.txt export and RSS feeds';



CREATE TABLE IF NOT EXISTS "public"."collection_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "collection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collection_items_content_slug_pattern" CHECK ((("content_slug" ~ '^[a-zA-Z0-9\-_/]+$'::"text") AND ("length"("content_slug") <= 200))),
    CONSTRAINT "collection_items_notes_check" CHECK (("char_length"("notes") <= 500)),
    CONSTRAINT "collection_items_notes_length" CHECK ((("notes" IS NULL) OR ("length"("notes") <= 500))),
    CONSTRAINT "collection_items_order_min" CHECK (("order" >= 0))
);


ALTER TABLE "public"."collection_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."collection_items"."order" IS 'Display order within collection (default: 0, non-negative, NOT NULL)';



COMMENT ON CONSTRAINT "collection_items_content_slug_pattern" ON "public"."collection_items" IS 'Enforces content slug format: letters, numbers, hyphens, underscores, slashes (max 200 chars)';



COMMENT ON CONSTRAINT "collection_items_notes_length" ON "public"."collection_items" IS 'Enforces notes max 500 characters';



COMMENT ON CONSTRAINT "collection_items_order_min" ON "public"."collection_items" IS 'Enforces order must be non-negative';



CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'collections'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "collection_type" "text",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "difficulty" "text",
    "estimated_setup_time" "text",
    "installation_order" "text"[],
    "prerequisites" "text"[],
    "compatibility" "jsonb",
    "installation" "jsonb",
    "configuration" "jsonb",
    "usage" "jsonb",
    "related_collections" "text"[],
    "further_reading" "jsonb"[],
    "items" "jsonb"[],
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_collections_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "collections_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "collections_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "collections_category_check" CHECK (("category" = 'collections'::"text")),
    CONSTRAINT "collections_collection_type_check" CHECK ((("collection_type" IS NULL) OR ("length"("collection_type") >= 3))),
    CONSTRAINT "collections_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "collections_difficulty_check" CHECK ((("difficulty" IS NULL) OR ("difficulty" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))),
    CONSTRAINT "collections_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "collections_estimated_setup_time_check" CHECK ((("estimated_setup_time" IS NULL) OR (("length"("estimated_setup_time") >= 5) AND ("length"("estimated_setup_time") <= 50)))),
    CONSTRAINT "collections_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "collections_further_reading_check" CHECK ((("further_reading" IS NULL) OR ("array_length"("further_reading", 1) <= 10))),
    CONSTRAINT "collections_installation_order_check" CHECK ((("installation_order" IS NULL) OR ("array_length"("installation_order", 1) <= 20))),
    CONSTRAINT "collections_items_check" CHECK ((("items" IS NULL) OR (("array_length"("items", 1) >= 2) AND ("array_length"("items", 1) <= 100)))),
    CONSTRAINT "collections_prerequisites_check" CHECK ((("prerequisites" IS NULL) OR ("array_length"("prerequisites", 1) <= 10))),
    CONSTRAINT "collections_related_collections_check" CHECK ((("related_collections" IS NULL) OR ("array_length"("related_collections", 1) <= 10))),
    CONSTRAINT "collections_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "collections_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "collections_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "collections_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "collections_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


COMMENT ON TABLE "public"."collections" IS 'Collections - curated sets of related content items';



COMMENT ON COLUMN "public"."collections"."difficulty" IS 'Difficulty level for using this collection. Values: beginner, intermediate, advanced.';



COMMENT ON COLUMN "public"."collections"."estimated_setup_time" IS 'Human-readable time estimate for complete collection setup. Examples: "15 minutes", "1 hour", "2-3 hours".';



COMMENT ON COLUMN "public"."collections"."installation_order" IS 'Optional ordered array of item slugs defining recommended installation sequence. If null, items can be installed in any order.';



COMMENT ON COLUMN "public"."collections"."prerequisites" IS 'Prerequisites required before installing collection. Examples: "Node.js 18+", "API key from service X".';



COMMENT ON COLUMN "public"."collections"."compatibility" IS 'Platform compatibility flags: {claudeDesktop: boolean, claudeCode: boolean}. Indicates which Claude platforms support this collection.';



COMMENT ON COLUMN "public"."collections"."installation" IS 'Installation instructions: {overview: string, steps: string[], notes: string[]}. Detailed setup guidance.';



COMMENT ON COLUMN "public"."collections"."configuration" IS 'Configuration settings: {required: object, optional: object}. Settings needed to use the collection.';



COMMENT ON COLUMN "public"."collections"."usage" IS 'Usage guidance: {quickStart: string, examples: array}. How to use the collection effectively.';



COMMENT ON COLUMN "public"."collections"."related_collections" IS 'Array of related collection slugs. Maximum 10 related collections.';



COMMENT ON COLUMN "public"."collections"."further_reading" IS 'Array of JSONB objects with external resources: [{title: string, url: string}]. Maximum 10 links.';



COMMENT ON COLUMN "public"."collections"."items" IS 'Array of JSONB objects representing collection items. Each object contains: {category: string, slug: string, reason?: string}. Minimum 2 items, maximum 100 items.';



CREATE TABLE IF NOT EXISTS "public"."commands" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'commands'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "configuration" "jsonb",
    "installation" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_commands_author_url" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "chk_commands_description_length" CHECK ((("description" IS NULL) OR (("length"("description") >= 10) AND ("length"("description") <= 500)))),
    CONSTRAINT "chk_commands_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "chk_commands_tags_count" CHECK ((("tags" IS NULL) OR ("array_length"("tags", 1) <= 10))),
    CONSTRAINT "commands_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "commands_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "commands_category_check" CHECK (("category" = 'commands'::"text")),
    CONSTRAINT "commands_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "commands_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "commands_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "commands_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "commands_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "commands_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "commands_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "commands_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."commands" OWNER TO "postgres";


COMMENT ON TABLE "public"."commands" IS 'Slash commands - custom command implementations';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."company_job_stats" AS
 SELECT "c"."id" AS "company_id",
    "c"."slug" AS "company_slug",
    "c"."name" AS "company_name",
    "count"("j"."id") AS "total_jobs",
    "count"("j"."id") FILTER (WHERE (("j"."status" = 'active'::"text") AND ("j"."active" = true))) AS "active_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."featured" = true)) AS "featured_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."remote" = true)) AS "remote_jobs",
    ("round"("avg"(
        CASE
            WHEN ("j"."salary" ~ '\$?\d+'::"text") THEN ((("regexp_match"("j"."salary", '\$?(\d+)k?'::"text"))[1])::numeric * (
            CASE
                WHEN ("j"."salary" ~ 'k'::"text") THEN 1000
                ELSE 1
            END)::numeric)
            ELSE NULL::numeric
        END)))::integer AS "avg_salary_min",
    "count"("j"."id") FILTER (WHERE ("j"."type" = 'full-time'::"text")) AS "full_time_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."type" = 'part-time'::"text")) AS "part_time_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."type" = 'contract'::"text")) AS "contract_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."type" = 'internship'::"text")) AS "internship_jobs",
    "count"("j"."id") FILTER (WHERE ("j"."workplace" = 'Remote'::"text")) AS "workplace_remote",
    "count"("j"."id") FILTER (WHERE ("j"."workplace" = 'Hybrid'::"text")) AS "workplace_hybrid",
    "count"("j"."id") FILTER (WHERE ("j"."workplace" = 'On site'::"text")) AS "workplace_onsite",
    (COALESCE("sum"("j"."view_count"), (0)::bigint))::integer AS "total_views",
    (COALESCE("sum"("j"."click_count"), (0)::bigint))::integer AS "total_clicks",
        CASE
            WHEN (COALESCE("sum"("j"."view_count"), (0)::bigint) > 0) THEN "round"((((COALESCE("sum"("j"."click_count"), (0)::bigint))::numeric / ("sum"("j"."view_count"))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "click_through_rate",
    "max"("j"."posted_at") AS "latest_job_posted_at",
    "min"("j"."posted_at") AS "first_job_posted_at",
    "now"() AS "last_refreshed_at"
   FROM ("public"."companies" "c"
     LEFT JOIN "public"."jobs" "j" ON (("c"."id" = "j"."company_id")))
  GROUP BY "c"."id", "c"."slug", "c"."name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."company_job_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."company_job_stats" IS 'Company job statistics materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



CREATE TABLE IF NOT EXISTS "public"."guides" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'guides'::"text" NOT NULL,
    "subcategory" "text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date",
    "date_published" "date",
    "date_modified" "date",
    "date_updated" "date",
    "last_reviewed" "date",
    "tags" "text"[] NOT NULL,
    "keywords" "text"[] NOT NULL,
    "seo_title" "text",
    "reading_time" "text",
    "difficulty" "text",
    "featured" boolean DEFAULT false,
    "ai_optimized" boolean DEFAULT false,
    "citation_ready" boolean DEFAULT false,
    "community_engagement" boolean DEFAULT false,
    "community_driven" boolean DEFAULT false,
    "source" "text" DEFAULT 'claudepro'::"text",
    "documentation_url" "text",
    "github_url" "text",
    "related_guides" "text"[],
    "sections" "jsonb" NOT NULL,
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fts_vector" "tsvector",
    CONSTRAINT "guides_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "guides_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "guides_category_check" CHECK (("category" = 'guides'::"text")),
    CONSTRAINT "guides_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "guides_difficulty_check" CHECK ((("difficulty" IS NULL) OR ("length"("difficulty") >= 3))),
    CONSTRAINT "guides_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "guides_github_url_check" CHECK ((("github_url" IS NULL) OR ("github_url" ~ '^https?://'::"text"))),
    CONSTRAINT "guides_keywords_check" CHECK ((("array_length"("keywords", 1) >= 1) AND ("array_length"("keywords", 1) <= 20))),
    CONSTRAINT "guides_related_guides_check" CHECK ((("related_guides" IS NULL) OR ("array_length"("related_guides", 1) <= 20))),
    CONSTRAINT "guides_sections_check" CHECK (("jsonb_typeof"("sections") = 'array'::"text")),
    CONSTRAINT "guides_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "guides_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "guides_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "guides_subcategory_check" CHECK (("length"("subcategory") >= 3)),
    CONSTRAINT "guides_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "guides_title_check" CHECK (("length"("title") >= 3))
);


ALTER TABLE "public"."guides" OWNER TO "postgres";


COMMENT ON TABLE "public"."guides" IS 'Guides - JSON-based educational content with 18+ section types (tutorials, comparisons, troubleshooting, workflows)';



COMMENT ON COLUMN "public"."guides"."subcategory" IS 'Guide subcategory for routing: tutorials, comparisons, troubleshooting, use-cases, workflows';



COMMENT ON COLUMN "public"."guides"."sections" IS 'JSONB array of typed sections: tldr, text, code, callout, tabs, accordion, faq, steps, checklist, etc. See guide.schema.ts';



COMMENT ON CONSTRAINT "guides_sections_check" ON "public"."guides" IS 'Ensures sections column is JSONB array type (same pattern as changelog_sections_check)';



CREATE TABLE IF NOT EXISTS "public"."hooks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'hooks'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "installation" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "event_types" "text"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "configuration" "jsonb",
    "requirements" "text"[],
    "hook_type" "text",
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_hooks_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "hooks_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "hooks_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "hooks_category_check" CHECK (("category" = 'hooks'::"text")),
    CONSTRAINT "hooks_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "hooks_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "hooks_event_types_check" CHECK ((("event_types" IS NULL) OR ("array_length"("event_types", 1) <= 20))),
    CONSTRAINT "hooks_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "hooks_hook_type_check" CHECK ((("hook_type" IS NULL) OR ("hook_type" = ANY (ARRAY['SessionStart'::"text", 'ToolUse'::"text", 'ToolResult'::"text", 'UserPromptSubmit'::"text", 'Error'::"text"])))),
    CONSTRAINT "hooks_requirements_check" CHECK ((("requirements" IS NULL) OR ("array_length"("requirements", 1) <= 10))),
    CONSTRAINT "hooks_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "hooks_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "hooks_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "hooks_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "hooks_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."hooks" OWNER TO "postgres";


COMMENT ON TABLE "public"."hooks" IS 'Event hooks - automation triggers for development workflows';



COMMENT ON COLUMN "public"."hooks"."configuration" IS 'Hook configuration settings and parameters';



COMMENT ON COLUMN "public"."hooks"."requirements" IS 'Prerequisites or requirements for using this hook';



COMMENT ON COLUMN "public"."hooks"."hook_type" IS 'Type of hook event: SessionStart, ToolUse, ToolResult, UserPromptSubmit, Error';



CREATE TABLE IF NOT EXISTS "public"."mcp" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'mcp'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "configuration" "jsonb" NOT NULL,
    "installation" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "package" "jsonb",
    "auth_type" "text",
    "capabilities" "jsonb",
    "data_types" "text"[],
    "mcp_version" "text",
    "permissions" "jsonb",
    "requires_auth" boolean DEFAULT false,
    "resources_provided" "text"[],
    "security" "jsonb",
    "server_info" "jsonb",
    "server_type" "text",
    "tools_provided" "text"[],
    "transport" "jsonb",
    "config_location" "text",
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_mcp_author_url" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "chk_mcp_description_length" CHECK ((("description" IS NULL) OR (("length"("description") >= 10) AND ("length"("description") <= 500)))),
    CONSTRAINT "chk_mcp_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "chk_mcp_tags_count" CHECK ((("tags" IS NULL) OR ("array_length"("tags", 1) <= 10))),
    CONSTRAINT "mcp_auth_type_check" CHECK ((("auth_type" IS NULL) OR ("auth_type" = ANY (ARRAY['none'::"text", 'api_key'::"text", 'oauth'::"text", 'basic'::"text", 'bearer'::"text", 'custom'::"text"])))),
    CONSTRAINT "mcp_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "mcp_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "mcp_category_check" CHECK (("category" = 'mcp'::"text")),
    CONSTRAINT "mcp_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "mcp_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "mcp_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "mcp_mcp_version_check" CHECK ((("mcp_version" IS NULL) OR ("mcp_version" ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$'::"text"))),
    CONSTRAINT "mcp_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "mcp_server_type_check" CHECK ((("server_type" IS NULL) OR ("server_type" = ANY (ARRAY['stdio'::"text", 'sse'::"text", 'http'::"text", 'websocket'::"text"])))),
    CONSTRAINT "mcp_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "mcp_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "mcp_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "mcp_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."mcp" OWNER TO "postgres";


COMMENT ON TABLE "public"."mcp" IS 'Model Context Protocol servers - external integrations for Claude Code';



COMMENT ON COLUMN "public"."mcp"."package" IS 'NPM package information: {name: string, version: string, registry?: string}';



COMMENT ON COLUMN "public"."mcp"."auth_type" IS 'Authentication type required: none, api_key, oauth, basic, bearer, custom';



COMMENT ON COLUMN "public"."mcp"."capabilities" IS 'MCP server capabilities: {tools: boolean, resources: boolean, prompts: boolean}';



COMMENT ON COLUMN "public"."mcp"."data_types" IS 'Types of data this MCP server works with (e.g., ["files", "databases", "apis"])';



COMMENT ON COLUMN "public"."mcp"."mcp_version" IS 'MCP protocol version supported (e.g., "1.0", "1.1")';



COMMENT ON COLUMN "public"."mcp"."permissions" IS 'Required permissions: {filesystem: string[], network: string[], environment: string[]}';



COMMENT ON COLUMN "public"."mcp"."requires_auth" IS 'Whether this MCP server requires authentication';



COMMENT ON COLUMN "public"."mcp"."resources_provided" IS 'List of resource types provided by this server';



COMMENT ON COLUMN "public"."mcp"."security" IS 'Security considerations and best practices: {warnings: string[], recommendations: string[]}';



COMMENT ON COLUMN "public"."mcp"."server_info" IS 'Server metadata: {vendor: string, homepage: string, version: string}';



COMMENT ON COLUMN "public"."mcp"."server_type" IS 'Server transport type: stdio, sse, http, websocket';



COMMENT ON COLUMN "public"."mcp"."tools_provided" IS 'List of tool names provided by this MCP server';



COMMENT ON COLUMN "public"."mcp"."transport" IS 'Transport configuration details for different connection types';



COMMENT ON COLUMN "public"."mcp"."config_location" IS 'Where configuration should be placed (e.g., "claude_desktop_config.json", "mcp_config.json")';



CREATE TABLE IF NOT EXISTS "public"."rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'rules'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "configuration" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expertise_areas" "text"[],
    "related_rules" "text"[],
    "requirements" "text"[],
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_rules_author_url" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "chk_rules_description_length" CHECK ((("description" IS NULL) OR (("length"("description") >= 10) AND ("length"("description") <= 500)))),
    CONSTRAINT "chk_rules_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "chk_rules_tags_count" CHECK ((("tags" IS NULL) OR ("array_length"("tags", 1) <= 10))),
    CONSTRAINT "rules_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "rules_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "rules_category_check" CHECK (("category" = 'rules'::"text")),
    CONSTRAINT "rules_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "rules_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "rules_expertise_areas_check" CHECK ((("expertise_areas" IS NULL) OR ("array_length"("expertise_areas", 1) <= 20))),
    CONSTRAINT "rules_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "rules_related_rules_check" CHECK ((("related_rules" IS NULL) OR ("array_length"("related_rules", 1) <= 10))),
    CONSTRAINT "rules_requirements_check" CHECK ((("requirements" IS NULL) OR ("array_length"("requirements", 1) <= 10))),
    CONSTRAINT "rules_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "rules_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "rules_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "rules_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "rules_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."rules" IS 'Configuration rules - project-specific guidelines and conventions';



COMMENT ON COLUMN "public"."rules"."expertise_areas" IS 'Areas of expertise or domains this rule applies to (max 20)';



COMMENT ON COLUMN "public"."rules"."related_rules" IS 'Slugs of related rules that work well together (max 10)';



COMMENT ON COLUMN "public"."rules"."requirements" IS 'Prerequisites or requirements for using this rule (max 10)';



CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'skills'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "dependencies" "text"[],
    "difficulty" "text",
    "estimated_time" "text",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_skills_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "skills_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "skills_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "skills_category_check" CHECK (("category" = 'skills'::"text")),
    CONSTRAINT "skills_dependencies_check" CHECK ((("dependencies" IS NULL) OR ("array_length"("dependencies", 1) <= 20))),
    CONSTRAINT "skills_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "skills_difficulty_check" CHECK ((("difficulty" IS NULL) OR ("length"("difficulty") >= 3))),
    CONSTRAINT "skills_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "skills_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "skills_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "skills_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "skills_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "skills_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "skills_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."skills" IS 'Skills - reusable capabilities and knowledge modules';



CREATE TABLE IF NOT EXISTS "public"."statuslines" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'statuslines'::"text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "preview" "text",
    "refresh_rate_ms" integer,
    "installation" "jsonb",
    "troubleshooting" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "configuration" "jsonb",
    "statusline_type" "text",
    "requirements" "text"[],
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    CONSTRAINT "chk_statuslines_name_pattern" CHECK ((("slug" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text") OR ("slug" IS NULL))),
    CONSTRAINT "statuslines_author_check" CHECK (("length"("author") >= 2)),
    CONSTRAINT "statuslines_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "statuslines_category_check" CHECK (("category" = 'statuslines'::"text")),
    CONSTRAINT "statuslines_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "statuslines_documentation_url_check" CHECK ((("documentation_url" IS NULL) OR ("documentation_url" ~ '^https?://'::"text"))),
    CONSTRAINT "statuslines_features_check" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "statuslines_refresh_rate_ms_check" CHECK ((("refresh_rate_ms" IS NULL) OR ("refresh_rate_ms" >= 100))),
    CONSTRAINT "statuslines_requirements_check" CHECK ((("requirements" IS NULL) OR ("array_length"("requirements", 1) <= 10))),
    CONSTRAINT "statuslines_seo_title_check" CHECK ((("seo_title" IS NULL) OR ("length"("seo_title") <= 60))),
    CONSTRAINT "statuslines_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "statuslines_source_check" CHECK ((("source" IS NULL) OR ("length"("source") >= 3))),
    CONSTRAINT "statuslines_statusline_type_check" CHECK ((("statusline_type" IS NULL) OR ("statusline_type" = ANY (ARRAY['static'::"text", 'dynamic'::"text", 'interactive'::"text", 'data-driven'::"text"])))),
    CONSTRAINT "statuslines_tags_check" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "statuslines_use_cases_check" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."statuslines" OWNER TO "postgres";


COMMENT ON TABLE "public"."statuslines" IS 'Status line configurations - customizable status bar displays';



COMMENT ON COLUMN "public"."statuslines"."configuration" IS 'Statusline configuration settings and parameters';



COMMENT ON COLUMN "public"."statuslines"."statusline_type" IS 'Type of statusline: static, dynamic, interactive, data-driven';



COMMENT ON COLUMN "public"."statuslines"."requirements" IS 'Prerequisites or requirements for using this statusline (max 10)';



CREATE OR REPLACE VIEW "public"."content_base" AS
 SELECT "agents"."id",
    "agents"."slug",
    "agents"."description",
    "agents"."category",
    "agents"."author",
    "agents"."author_profile_url",
    "agents"."date_added",
    "agents"."tags",
    "agents"."created_at",
    "agents"."updated_at",
    'agents'::"text" AS "table_name"
   FROM "public"."agents"
UNION ALL
 SELECT "mcp"."id",
    "mcp"."slug",
    "mcp"."description",
    "mcp"."category",
    "mcp"."author",
    "mcp"."author_profile_url",
    "mcp"."date_added",
    "mcp"."tags",
    "mcp"."created_at",
    "mcp"."updated_at",
    'mcp'::"text" AS "table_name"
   FROM "public"."mcp"
UNION ALL
 SELECT "rules"."id",
    "rules"."slug",
    "rules"."description",
    "rules"."category",
    "rules"."author",
    "rules"."author_profile_url",
    "rules"."date_added",
    "rules"."tags",
    "rules"."created_at",
    "rules"."updated_at",
    'rules'::"text" AS "table_name"
   FROM "public"."rules"
UNION ALL
 SELECT "commands"."id",
    "commands"."slug",
    "commands"."description",
    "commands"."category",
    "commands"."author",
    "commands"."author_profile_url",
    "commands"."date_added",
    "commands"."tags",
    "commands"."created_at",
    "commands"."updated_at",
    'commands'::"text" AS "table_name"
   FROM "public"."commands"
UNION ALL
 SELECT "hooks"."id",
    "hooks"."slug",
    "hooks"."description",
    "hooks"."category",
    "hooks"."author",
    "hooks"."author_profile_url",
    "hooks"."date_added",
    "hooks"."tags",
    "hooks"."created_at",
    "hooks"."updated_at",
    'hooks'::"text" AS "table_name"
   FROM "public"."hooks"
UNION ALL
 SELECT "statuslines"."id",
    "statuslines"."slug",
    "statuslines"."description",
    "statuslines"."category",
    "statuslines"."author",
    "statuslines"."author_profile_url",
    "statuslines"."date_added",
    "statuslines"."tags",
    "statuslines"."created_at",
    "statuslines"."updated_at",
    'statuslines'::"text" AS "table_name"
   FROM "public"."statuslines"
UNION ALL
 SELECT "skills"."id",
    "skills"."slug",
    "skills"."description",
    "skills"."category",
    "skills"."author",
    "skills"."author_profile_url",
    "skills"."date_added",
    "skills"."tags",
    "skills"."created_at",
    "skills"."updated_at",
    'skills'::"text" AS "table_name"
   FROM "public"."skills"
UNION ALL
 SELECT "collections"."id",
    "collections"."slug",
    "collections"."description",
    "collections"."category",
    "collections"."author",
    "collections"."author_profile_url",
    "collections"."date_added",
    "collections"."tags",
    "collections"."created_at",
    "collections"."updated_at",
    'collections'::"text" AS "table_name"
   FROM "public"."collections"
UNION ALL
 SELECT "guides"."id",
    "guides"."slug",
    "guides"."description",
    "guides"."category",
    "guides"."author",
    "guides"."author_profile_url",
    "guides"."date_added",
    "guides"."tags",
    "guides"."created_at",
    "guides"."updated_at",
    'guides'::"text" AS "table_name"
   FROM "public"."guides"
UNION ALL
 SELECT "changelog"."id",
    "changelog"."slug",
    "changelog"."description",
    "changelog"."category",
    NULL::"text" AS "author",
    NULL::"text" AS "author_profile_url",
    "changelog"."date_added",
    "changelog"."tags",
    "changelog"."created_at",
    "changelog"."updated_at",
    'changelog'::"text" AS "table_name"
   FROM "public"."changelog";


ALTER VIEW "public"."content_base" OWNER TO "postgres";


COMMENT ON VIEW "public"."content_base" IS 'Unified view of base content fields across all content types. Uses SECURITY DEFINER intentionally to provide consistent access control across 11+ content tables. Security reviewed and approved 2025-10-29.';



CREATE TABLE IF NOT EXISTS "public"."content_generation_tracking" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "generated_by" "text" NOT NULL,
    "generation_trigger" "text",
    "generation_model" "text",
    "quality_score" numeric(3,2),
    "validation_passed" boolean DEFAULT false NOT NULL,
    "validation_errors" "text"[],
    "github_pr_url" "text",
    "discovery_metadata" "jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_generation_tracking_generated_by_check" CHECK (("generated_by" = ANY (ARRAY['ai'::"text", 'manual'::"text", 'import'::"text", 'migration'::"text"]))),
    CONSTRAINT "content_generation_tracking_github_pr_url_check" CHECK ((("github_pr_url" IS NULL) OR ("github_pr_url" ~ '^https://github\.com/.+/pull/[0-9]+$'::"text"))),
    CONSTRAINT "content_generation_tracking_quality_score_check" CHECK ((("quality_score" IS NULL) OR (("quality_score" >= (0)::numeric) AND ("quality_score" <= (1)::numeric))))
);


ALTER TABLE "public"."content_generation_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_generation_tracking" IS 'Tracks AI-generated and manually-created content to prevent duplicates and enable analytics';



COMMENT ON COLUMN "public"."content_generation_tracking"."quality_score" IS 'AI-calculated quality score (0.0 = low quality, 1.0 = high quality)';



COMMENT ON COLUMN "public"."content_generation_tracking"."discovery_metadata" IS 'Research metadata from content discovery workflow (trending sources, keyword analysis, etc.)';



CREATE TABLE IF NOT EXISTS "public"."content_generator_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "strategy" "text"[] DEFAULT ARRAY['item'::"text", 'defaults'::"text"],
    "defaults" "jsonb" NOT NULL,
    "tag_mapping" "jsonb",
    "template" "jsonb",
    "conditional_rules" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_generator_configs_category_check" CHECK (("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text"]))),
    CONSTRAINT "content_generator_configs_field_type_check" CHECK (("field_type" = ANY (ARRAY['installation'::"text", 'use_cases'::"text", 'troubleshooting'::"text", 'requirements'::"text", 'features'::"text"])))
);


ALTER TABLE "public"."content_generator_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_generator_configs" IS 'Generator configurations for auto-generating content fields. Replaces TypeScript generator-factories.ts logic.';



COMMENT ON COLUMN "public"."content_generator_configs"."strategy" IS 'Fallback strategy priority: [''item'', ''tags'', ''title'', ''defaults'']. Evaluated in order.';



COMMENT ON COLUMN "public"."content_generator_configs"."tag_mapping" IS 'Maps item tags to generated content. Used when strategy includes ''tags''.';



COMMENT ON COLUMN "public"."content_generator_configs"."template" IS 'Template with {title} placeholder for personalization. Used when strategy includes ''title''.';



CREATE TABLE IF NOT EXISTS "public"."content_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "git_hash" "text" NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE(("data" ->> 'name'::"text"), ("data" ->> 'title'::"text"), ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE(("data" ->> 'description'::"text"), ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"english"'::"regconfig", "public"."extract_tags_for_search"(("data" -> 'tags'::"text"))), 'C'::"char"))) STORED,
    CONSTRAINT "content_items_category_check" CHECK (("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'commands'::"text", 'rules'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text", 'jobs'::"text", 'changelog'::"text"]))),
    CONSTRAINT "content_items_git_hash_check" CHECK (("length"("git_hash") = 64)),
    CONSTRAINT "content_items_slug_check" CHECK ((("length"("slug") > 0) AND ("length"("slug") <= 255)))
);


ALTER TABLE "public"."content_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_items" IS 'Content directory items synced from Git /content/*.json files. RLS enabled with public read access. Service role key automatically bypasses RLS for sync operations.';



COMMENT ON COLUMN "public"."content_items"."category" IS 'Content category (agents, mcp, commands, etc). Maps to /content/{category}/ directory.';



COMMENT ON COLUMN "public"."content_items"."slug" IS 'URL-safe slug identifier. Maps to /content/{category}/{slug}.json filename.';



COMMENT ON COLUMN "public"."content_items"."data" IS 'Full JSON content object. Stored as JSONB for query flexibility and schema evolution.';



COMMENT ON COLUMN "public"."content_items"."git_hash" IS 'SHA256 hash of source JSON file. Used for incremental sync (only update if hash changed).';



COMMENT ON COLUMN "public"."content_items"."search_vector" IS 'Auto-generated full-text search vector. Combines name, description, and tags with weighted ranking.';



CREATE MATERIALIZED VIEW "public"."content_popularity" AS
 SELECT "content_type",
    "content_slug",
    "count"(DISTINCT "user_id") AS "bookmark_count",
    (0)::numeric AS "avg_rating",
    0 AS "rating_count",
    (("count"(DISTINCT "user_id") * 5))::numeric AS "popularity_score",
    "now"() AS "last_refreshed"
   FROM "public"."bookmarks" "b"
  GROUP BY "content_type", "content_slug"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."content_popularity" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."content_popularity" IS 'Content popularity materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



CREATE TABLE IF NOT EXISTS "public"."content_seo_overrides" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_id" "text" NOT NULL,
    "category" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "keywords" "text"[],
    "og_type" "text",
    "twitter_card" "text",
    "robots_index" boolean DEFAULT true,
    "robots_follow" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "notes" "text",
    CONSTRAINT "content_seo_overrides_category_check" CHECK (("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text", 'jobs'::"text", 'changelog'::"text"]))),
    CONSTRAINT "content_seo_overrides_description_check" CHECK ((("description" IS NULL) OR (("length"("description") >= 150) AND ("length"("description") <= 160)))),
    CONSTRAINT "content_seo_overrides_keywords_check" CHECK ((("keywords" IS NULL) OR (("array_length"("keywords", 1) >= 3) AND ("array_length"("keywords", 1) <= 10)))),
    CONSTRAINT "content_seo_overrides_og_type_check" CHECK ((("og_type" IS NULL) OR ("og_type" = ANY (ARRAY['website'::"text", 'article'::"text"])))),
    CONSTRAINT "content_seo_overrides_title_check" CHECK ((("title" IS NULL) OR (("length"("title") >= 53) AND ("length"("title") <= 65)))),
    CONSTRAINT "content_seo_overrides_twitter_card_check" CHECK ((("twitter_card" IS NULL) OR ("twitter_card" = 'summary_large_image'::"text")))
);


ALTER TABLE "public"."content_seo_overrides" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_seo_overrides" IS 'Manual SEO overrides for specific content items. Checked before template-based generation.';



COMMENT ON COLUMN "public"."content_seo_overrides"."content_id" IS 'The slug or ID of the content item (e.g., "code-reviewer" for an agent)';



COMMENT ON COLUMN "public"."content_seo_overrides"."category" IS 'The category of content (must match valid category IDs)';



COMMENT ON COLUMN "public"."content_seo_overrides"."notes" IS 'Internal notes explaining why this override exists';



CREATE TABLE IF NOT EXISTS "public"."content_similarities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_a_type" "text" NOT NULL,
    "content_a_slug" "text" NOT NULL,
    "content_b_type" "text" NOT NULL,
    "content_b_slug" "text" NOT NULL,
    "similarity_score" numeric(5,4) NOT NULL,
    "similarity_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_similarities_content_a_type_check" CHECK (("content_a_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text"]))),
    CONSTRAINT "content_similarities_content_b_type_check" CHECK (("content_b_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text"]))),
    CONSTRAINT "content_similarities_similarity_score_check" CHECK ((("similarity_score" >= (0)::numeric) AND ("similarity_score" <= (1)::numeric)))
);


ALTER TABLE "public"."content_similarities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "submission_type" "public"."submission_type" NOT NULL,
    "status" "public"."submission_status" DEFAULT 'pending'::"public"."submission_status" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "github_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "content_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "moderator_notes" "text",
    "moderated_at" timestamp with time zone,
    "moderated_by" "uuid",
    "github_pr_url" "text",
    "merged_at" timestamp with time zone,
    "spam_score" numeric(3,2) DEFAULT 0.0,
    "spam_reasons" "text"[],
    "submitter_id" "uuid",
    "submitter_email" "text",
    "submitter_ip" "inet",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_data_validation" CHECK (
CASE "submission_type"
    WHEN 'agents'::"public"."submission_type" THEN (("content_data" ? 'systemPrompt'::"text") AND ("jsonb_typeof"(("content_data" -> 'systemPrompt'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'systemPrompt'::"text")) >= 50))
    WHEN 'rules'::"public"."submission_type" THEN (("content_data" ? 'rulesContent'::"text") AND ("jsonb_typeof"(("content_data" -> 'rulesContent'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'rulesContent'::"text")) >= 50))
    WHEN 'commands'::"public"."submission_type" THEN (("content_data" ? 'commandContent'::"text") AND ("jsonb_typeof"(("content_data" -> 'commandContent'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'commandContent'::"text")) >= 50))
    WHEN 'hooks'::"public"."submission_type" THEN (("content_data" ? 'hookScript'::"text") AND ("content_data" ? 'hook_type'::"text") AND ("jsonb_typeof"(("content_data" -> 'hookScript'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'hookScript'::"text")) >= 20))
    WHEN 'statuslines'::"public"."submission_type" THEN (("content_data" ? 'statuslineScript'::"text") AND ("content_data" ? 'statusline_type'::"text") AND ("jsonb_typeof"(("content_data" -> 'statuslineScript'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'statuslineScript'::"text")) >= 20))
    WHEN 'mcp'::"public"."submission_type" THEN (("content_data" ? 'npmPackage'::"text") AND ("content_data" ? 'serverType'::"text") AND ("content_data" ? 'installCommand'::"text") AND ("jsonb_typeof"(("content_data" -> 'npmPackage'::"text")) = 'string'::"text"))
    WHEN 'skills'::"public"."submission_type" THEN (("content_data" ? 'skillContent'::"text") AND ("jsonb_typeof"(("content_data" -> 'skillContent'::"text")) = 'string'::"text") AND ("length"(("content_data" ->> 'skillContent'::"text")) >= 100))
    ELSE true
END),
    CONSTRAINT "content_submissions_author_check" CHECK ((("length"("author") >= 2) AND ("length"("author") <= 100))),
    CONSTRAINT "content_submissions_author_profile_url_check" CHECK ((("author_profile_url" IS NULL) OR ("author_profile_url" ~ '^https?://'::"text"))),
    CONSTRAINT "content_submissions_category_check" CHECK ((("length"("category") >= 2) AND ("length"("category") <= 50))),
    CONSTRAINT "content_submissions_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "content_submissions_github_pr_url_check" CHECK ((("github_pr_url" IS NULL) OR ("github_pr_url" ~ '^https://github\.com/.+/pull/[0-9]+$'::"text"))),
    CONSTRAINT "content_submissions_github_url_check" CHECK ((("github_url" IS NULL) OR ("github_url" ~ '^https://github\.com/'::"text"))),
    CONSTRAINT "content_submissions_name_check" CHECK ((("length"("name") >= 2) AND ("length"("name") <= 100))),
    CONSTRAINT "content_submissions_name_check1" CHECK (("name" ~ '^[a-zA-Z0-9\s\-_.]+$'::"text")),
    CONSTRAINT "content_submissions_spam_score_check" CHECK ((("spam_score" >= (0)::numeric) AND ("spam_score" <= (1)::numeric))),
    CONSTRAINT "content_submissions_submitter_email_check" CHECK ((("submitter_email" IS NULL) OR ("submitter_email" ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::"text")))
);


ALTER TABLE "public"."content_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_submissions" IS 'User-submitted content (agents, mcp, rules, etc.) for moderation and GitHub PR generation';



COMMENT ON COLUMN "public"."content_submissions"."content_data" IS 'Type-specific fields stored as JSONB for flexibility across submission types';



COMMENT ON COLUMN "public"."content_submissions"."spam_score" IS 'AI-calculated spam probability (0.0 = legitimate, 1.0 = spam)';



CREATE OR REPLACE VIEW "public"."content_unified" AS
 SELECT ("agents"."id")::"text" AS "id",
    "agents"."slug",
    "agents"."title",
    "agents"."description",
    "agents"."category",
    "agents"."author",
    "agents"."author_profile_url",
    ("agents"."date_added")::"text" AS "date_added",
    "agents"."tags",
    ("agents"."created_at")::"text" AS "created_at",
    ("agents"."updated_at")::"text" AS "updated_at",
    "agents"."features",
    "agents"."use_cases",
    "agents"."examples",
    "agents"."troubleshooting",
    "agents"."discovery_metadata",
    "agents"."fts_vector",
    'agents'::"text" AS "source_table"
   FROM "public"."agents"
UNION ALL
 SELECT ("mcp"."id")::"text" AS "id",
    "mcp"."slug",
    "mcp"."title",
    "mcp"."description",
    "mcp"."category",
    "mcp"."author",
    "mcp"."author_profile_url",
    ("mcp"."date_added")::"text" AS "date_added",
    "mcp"."tags",
    ("mcp"."created_at")::"text" AS "created_at",
    ("mcp"."updated_at")::"text" AS "updated_at",
    "mcp"."features",
    "mcp"."use_cases",
    "mcp"."examples",
    "mcp"."troubleshooting",
    "mcp"."discovery_metadata",
    "mcp"."fts_vector",
    'mcp'::"text" AS "source_table"
   FROM "public"."mcp"
UNION ALL
 SELECT ("rules"."id")::"text" AS "id",
    "rules"."slug",
    "rules"."title",
    "rules"."description",
    "rules"."category",
    "rules"."author",
    "rules"."author_profile_url",
    ("rules"."date_added")::"text" AS "date_added",
    "rules"."tags",
    ("rules"."created_at")::"text" AS "created_at",
    ("rules"."updated_at")::"text" AS "updated_at",
    "rules"."features",
    "rules"."use_cases",
    "rules"."examples",
    "rules"."troubleshooting",
    "rules"."discovery_metadata",
    "rules"."fts_vector",
    'rules'::"text" AS "source_table"
   FROM "public"."rules"
UNION ALL
 SELECT ("commands"."id")::"text" AS "id",
    "commands"."slug",
    "commands"."title",
    "commands"."description",
    "commands"."category",
    "commands"."author",
    "commands"."author_profile_url",
    ("commands"."date_added")::"text" AS "date_added",
    "commands"."tags",
    ("commands"."created_at")::"text" AS "created_at",
    ("commands"."updated_at")::"text" AS "updated_at",
    "commands"."features",
    "commands"."use_cases",
    "commands"."examples",
    "commands"."troubleshooting",
    "commands"."discovery_metadata",
    "commands"."fts_vector",
    'commands'::"text" AS "source_table"
   FROM "public"."commands"
UNION ALL
 SELECT ("hooks"."id")::"text" AS "id",
    "hooks"."slug",
    "hooks"."title",
    "hooks"."description",
    "hooks"."category",
    "hooks"."author",
    "hooks"."author_profile_url",
    ("hooks"."date_added")::"text" AS "date_added",
    "hooks"."tags",
    ("hooks"."created_at")::"text" AS "created_at",
    ("hooks"."updated_at")::"text" AS "updated_at",
    "hooks"."features",
    "hooks"."use_cases",
    "hooks"."examples",
    "hooks"."troubleshooting",
    "hooks"."discovery_metadata",
    "hooks"."fts_vector",
    'hooks'::"text" AS "source_table"
   FROM "public"."hooks"
UNION ALL
 SELECT ("statuslines"."id")::"text" AS "id",
    "statuslines"."slug",
    "statuslines"."title",
    "statuslines"."description",
    "statuslines"."category",
    "statuslines"."author",
    "statuslines"."author_profile_url",
    ("statuslines"."date_added")::"text" AS "date_added",
    "statuslines"."tags",
    ("statuslines"."created_at")::"text" AS "created_at",
    ("statuslines"."updated_at")::"text" AS "updated_at",
    "statuslines"."features",
    "statuslines"."use_cases",
    "statuslines"."examples",
    "statuslines"."troubleshooting",
    "statuslines"."discovery_metadata",
    "statuslines"."fts_vector",
    'statuslines'::"text" AS "source_table"
   FROM "public"."statuslines"
UNION ALL
 SELECT ("skills"."id")::"text" AS "id",
    "skills"."slug",
    "skills"."title",
    "skills"."description",
    "skills"."category",
    "skills"."author",
    "skills"."author_profile_url",
    ("skills"."date_added")::"text" AS "date_added",
    "skills"."tags",
    ("skills"."created_at")::"text" AS "created_at",
    ("skills"."updated_at")::"text" AS "updated_at",
    "skills"."features",
    "skills"."use_cases",
    "skills"."examples",
    "skills"."troubleshooting",
    "skills"."discovery_metadata",
    "skills"."fts_vector",
    'skills'::"text" AS "source_table"
   FROM "public"."skills"
UNION ALL
 SELECT ("collections"."id")::"text" AS "id",
    "collections"."slug",
    "collections"."title",
    "collections"."description",
    "collections"."category",
    "collections"."author",
    "collections"."author_profile_url",
    ("collections"."date_added")::"text" AS "date_added",
    "collections"."tags",
    ("collections"."created_at")::"text" AS "created_at",
    ("collections"."updated_at")::"text" AS "updated_at",
    "collections"."features",
    "collections"."use_cases",
    "collections"."examples",
    "collections"."troubleshooting",
    "collections"."discovery_metadata",
    "collections"."fts_vector",
    'collections'::"text" AS "source_table"
   FROM "public"."collections"
UNION ALL
 SELECT ("guides"."id")::"text" AS "id",
    "guides"."slug",
    "guides"."title",
    "guides"."description",
    "guides"."category",
    "guides"."author",
    "guides"."author_profile_url",
    ("guides"."date_added")::"text" AS "date_added",
    "guides"."tags",
    ("guides"."created_at")::"text" AS "created_at",
    ("guides"."updated_at")::"text" AS "updated_at",
    NULL::"text"[] AS "features",
    NULL::"text"[] AS "use_cases",
    NULL::"jsonb" AS "examples",
    NULL::"jsonb"[] AS "troubleshooting",
    NULL::"jsonb" AS "discovery_metadata",
    "guides"."fts_vector",
    'guides'::"text" AS "source_table"
   FROM "public"."guides";


ALTER VIEW "public"."content_unified" OWNER TO "postgres";


COMMENT ON VIEW "public"."content_unified" IS 'Unified view of complete content with enriched metadata. Uses SECURITY DEFINER intentionally to provide consistent access control across multiple content tables. Security reviewed and approved 2025-10-29.';



CREATE TABLE IF NOT EXISTS "public"."email_blocklist" (
    "email" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "email_blocklist_reason_check" CHECK (("reason" = ANY (ARRAY['spam_complaint'::"text", 'hard_bounce'::"text", 'repeated_soft_bounce'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."email_blocklist" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_blocklist" IS 'Emails blocked from future subscriptions due to bounces/complaints';



CREATE TABLE IF NOT EXISTS "public"."email_sequence_schedule" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sequence_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "step" integer NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_sequence_schedule_sequence_id_check" CHECK (("sequence_id" = 'onboarding'::"text")),
    CONSTRAINT "email_sequence_schedule_step_check" CHECK ((("step" >= 1) AND ("step" <= 5))),
    CONSTRAINT "valid_processed" CHECK (((("processed" = true) AND ("processed_at" IS NOT NULL)) OR (("processed" = false) AND ("processed_at" IS NULL))))
);


ALTER TABLE "public"."email_sequence_schedule" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_sequence_schedule" IS 'Email sequence scheduling queue (replaces Redis sorted sets email_sequence:due:{id}:{step})';



COMMENT ON COLUMN "public"."email_sequence_schedule"."due_at" IS 'When this email should be sent (replaces Redis sorted set score)';



COMMENT ON COLUMN "public"."email_sequence_schedule"."processed" IS 'Whether this email has been sent';



CREATE TABLE IF NOT EXISTS "public"."email_sequences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sequence_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "current_step" integer NOT NULL,
    "total_steps" integer DEFAULT 5 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_sequences_current_step_check" CHECK ((("current_step" >= 1) AND ("current_step" <= 5))),
    CONSTRAINT "email_sequences_email_check" CHECK ((("length"("email") >= 5) AND ("length"("email") <= 254) AND ("email" ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::"text"))),
    CONSTRAINT "email_sequences_sequence_id_check" CHECK (("sequence_id" = 'onboarding'::"text")),
    CONSTRAINT "email_sequences_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "email_sequences_total_steps_check" CHECK (("total_steps" = 5))
);


ALTER TABLE "public"."email_sequences" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_sequences" IS 'Email sequence state management (replaces Redis keys email_sequence:{id}:{email})';



COMMENT ON COLUMN "public"."email_sequences"."sequence_id" IS 'Sequence identifier (currently only onboarding)';



COMMENT ON COLUMN "public"."email_sequences"."current_step" IS 'Current step in sequence (1-5)';



COMMENT ON COLUMN "public"."email_sequences"."status" IS 'Sequence status: active (in progress), completed (finished), cancelled (user opted out)';



CREATE TABLE IF NOT EXISTS "public"."featured_configs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "week_start" "date" NOT NULL,
    "week_end" "date" NOT NULL,
    "rank" integer NOT NULL,
    "trending_score" numeric(5,2) DEFAULT 0,
    "rating_score" numeric(5,2) DEFAULT 0,
    "engagement_score" numeric(5,2) DEFAULT 0,
    "freshness_score" numeric(5,2) DEFAULT 0,
    "final_score" numeric(5,2) NOT NULL,
    "calculation_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "featured_configs_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text"]))),
    CONSTRAINT "featured_configs_engagement_score_check" CHECK ((("engagement_score" >= (0)::numeric) AND ("engagement_score" <= (100)::numeric))),
    CONSTRAINT "featured_configs_final_score_check" CHECK ((("final_score" >= (0)::numeric) AND ("final_score" <= (100)::numeric))),
    CONSTRAINT "featured_configs_freshness_score_check" CHECK ((("freshness_score" >= (0)::numeric) AND ("freshness_score" <= (100)::numeric))),
    CONSTRAINT "featured_configs_rank_check" CHECK ((("rank" >= 1) AND ("rank" <= 10))),
    CONSTRAINT "featured_configs_rating_score_check" CHECK ((("rating_score" >= (0)::numeric) AND ("rating_score" <= (100)::numeric))),
    CONSTRAINT "featured_configs_trending_score_check" CHECK ((("trending_score" >= (0)::numeric) AND ("trending_score" <= (100)::numeric)))
);


ALTER TABLE "public"."featured_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."followers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "followers_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_field_configs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "form_type" "text" NOT NULL,
    "field_group" "text" DEFAULT 'type_specific'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "field_name" "text" NOT NULL,
    "field_label" "text" NOT NULL,
    "field_type" "public"."form_field_type" NOT NULL,
    "required" boolean DEFAULT false NOT NULL,
    "placeholder" "text",
    "help_text" "text",
    "default_value" "text",
    "grid_column" "public"."form_grid_column" DEFAULT 'full'::"public"."form_grid_column" NOT NULL,
    "icon_name" "text",
    "icon_position" "public"."form_icon_position" DEFAULT 'left'::"public"."form_icon_position",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_field_configs_display_order_check" CHECK (("display_order" >= 0)),
    CONSTRAINT "form_field_configs_field_label_check" CHECK ((("length"("field_label") >= 1) AND ("length"("field_label") <= 200))),
    CONSTRAINT "form_field_configs_field_name_check" CHECK ((("length"("field_name") >= 1) AND ("length"("field_name") <= 100)))
);


ALTER TABLE "public"."form_field_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_field_configs" IS 'Form field configuration for dynamic form rendering. Replaces form-field-config.ts.';



COMMENT ON COLUMN "public"."form_field_configs"."form_type" IS 'Content type: agents, mcp, rules, commands, hooks, statuslines, skills';



COMMENT ON COLUMN "public"."form_field_configs"."field_group" IS 'Field grouping: common (all forms), type_specific (per form), tags (after type-specific)';



COMMENT ON COLUMN "public"."form_field_configs"."config" IS 'Type-specific configuration as JSONB (textarea rows, number min/max/step, select options)';



CREATE TABLE IF NOT EXISTS "public"."form_field_definitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_type" "public"."content_category",
    "field_scope" "public"."field_scope" DEFAULT 'type_specific'::"public"."field_scope" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_type" "public"."field_type" NOT NULL,
    "label" "text" NOT NULL,
    "placeholder" "text",
    "help_text" "text",
    "required" boolean DEFAULT false,
    "grid_column" "public"."grid_column" DEFAULT 'full'::"public"."grid_column",
    "field_order" integer NOT NULL,
    "icon" "text",
    "icon_position" "public"."icon_position" DEFAULT 'left'::"public"."icon_position",
    "field_properties" "jsonb" DEFAULT '{}'::"jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "form_field_definitions_check" CHECK (((("field_scope" = 'common'::"public"."field_scope") AND ("content_type" IS NULL)) OR (("field_scope" = 'type_specific'::"public"."field_scope") AND ("content_type" IS NOT NULL)) OR (("field_scope" = 'tags'::"public"."field_scope") AND ("content_type" IS NULL)))),
    CONSTRAINT "form_field_definitions_field_name_check" CHECK ((("length"("field_name") >= 1) AND ("length"("field_name") <= 100))),
    CONSTRAINT "form_field_definitions_help_text_check" CHECK ((("help_text" IS NULL) OR ("length"("help_text") <= 1000))),
    CONSTRAINT "form_field_definitions_icon_check" CHECK ((("icon" IS NULL) OR ("length"("icon") <= 50))),
    CONSTRAINT "form_field_definitions_label_check" CHECK ((("length"("label") >= 1) AND ("length"("label") <= 200))),
    CONSTRAINT "form_field_definitions_placeholder_check" CHECK ((("placeholder" IS NULL) OR ("length"("placeholder") <= 500)))
);


ALTER TABLE "public"."form_field_definitions" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_field_definitions" IS 'Dynamic form field configuration system - replaces hardcoded form-field-config.ts (579 LOC). Enables non-developers to modify forms, A/B testing, and versioning.';



CREATE TABLE IF NOT EXISTS "public"."form_field_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "field_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "field_data" "jsonb" NOT NULL,
    "change_summary" "text",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_field_versions_change_summary_check" CHECK (("length"("change_summary") <= 500)),
    CONSTRAINT "form_field_versions_version_number_check" CHECK (("version_number" > 0))
);


ALTER TABLE "public"."form_field_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_field_versions" IS 'Change tracking and rollback support for form field definitions. Automatically versioned on UPDATE.';



CREATE TABLE IF NOT EXISTS "public"."form_select_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "field_id" "uuid" NOT NULL,
    "option_value" "text" NOT NULL,
    "option_label" "text" NOT NULL,
    "option_order" integer NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_select_options_option_label_check" CHECK ((("length"("option_label") >= 1) AND ("length"("option_label") <= 200))),
    CONSTRAINT "form_select_options_option_order_check" CHECK (("option_order" >= 0)),
    CONSTRAINT "form_select_options_option_value_check" CHECK ((("length"("option_value") >= 1) AND ("length"("option_value") <= 200)))
);


ALTER TABLE "public"."form_select_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_select_options" IS 'Options for select-type form fields. Linked to form_field_definitions via field_id.';



CREATE TABLE IF NOT EXISTS "public"."metadata_templates" (
    "route_pattern" "text" NOT NULL,
    "title_formulas" "text"[] NOT NULL,
    "description_template" "text" NOT NULL,
    "default_keywords" "text"[] NOT NULL,
    "use_current_year" boolean DEFAULT true,
    "use_current_month_year" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "metadata_templates_route_pattern_check" CHECK (("route_pattern" ~ '^[A-Z_]+$'::"text"))
);


ALTER TABLE "public"."metadata_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."metadata_templates" IS 'Database-first metadata templates. Configuration only - formatting logic in TypeScript utilities.';



COMMENT ON COLUMN "public"."metadata_templates"."route_pattern" IS 'Route pattern name (e.g., HOMEPAGE, CATEGORY, CONTENT_DETAIL)';



COMMENT ON COLUMN "public"."metadata_templates"."title_formulas" IS 'Array of title formulas to try (in priority order). Uses {variable} placeholders.';



COMMENT ON COLUMN "public"."metadata_templates"."description_template" IS 'Description template with {variable} placeholders';



COMMENT ON COLUMN "public"."metadata_templates"."default_keywords" IS 'Default keywords for this route pattern';



COMMENT ON COLUMN "public"."metadata_templates"."use_current_year" IS 'Whether to inject current year into metadata';



COMMENT ON COLUMN "public"."metadata_templates"."use_current_month_year" IS 'Whether to inject current month-year into metadata';



CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_interactions_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text", 'skills'::"text", 'guides'::"text", 'jobs'::"text", 'changelog'::"text"]))),
    CONSTRAINT "user_interactions_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'copy'::"text", 'bookmark'::"text", 'click'::"text", 'time_spent'::"text"])))
);


ALTER TABLE "public"."user_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_interactions" IS 'User interaction tracking for personalization and analytics';



CREATE MATERIALIZED VIEW "public"."mv_analytics_summary" AS
 SELECT "content_type" AS "category",
    "content_slug" AS "slug",
    "count"(*) FILTER (WHERE ("interaction_type" = 'view'::"text")) AS "view_count",
    "count"(*) FILTER (WHERE ("interaction_type" = 'copy'::"text")) AS "copy_count",
    "count"(*) FILTER (WHERE ("interaction_type" = 'bookmark'::"text")) AS "bookmark_count",
    COALESCE("sum"((("metadata" ->> 'time_spent_seconds'::"text"))::integer) FILTER (WHERE ("interaction_type" = 'time_spent'::"text")), (0)::bigint) AS "total_time_spent_seconds",
    "max"("created_at") FILTER (WHERE ("interaction_type" = 'view'::"text")) AS "last_viewed_at",
    "max"("created_at") AS "last_interaction_at"
   FROM "public"."user_interactions" "ui"
  WHERE ("interaction_type" = ANY (ARRAY['view'::"text", 'copy'::"text", 'bookmark'::"text", 'time_spent'::"text"]))
  GROUP BY "content_type", "content_slug"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_analytics_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_analytics_summary" IS 'Public analytics summary - granted to anon for public content display';



CREATE MATERIALIZED VIEW "public"."mv_content_similarity" AS
 WITH "content_pairs" AS (
         SELECT "c1"."category" AS "source_category",
            "c1"."slug" AS "source_slug",
            "c1"."title" AS "source_title",
            "c1"."tags" AS "source_tags",
            "c1"."description" AS "source_description",
            "c2"."category" AS "target_category",
            "c2"."slug" AS "target_slug",
            "c2"."title" AS "target_title",
            "c2"."tags" AS "target_tags",
            "c2"."description" AS "target_description"
           FROM ("public"."content_unified" "c1"
             CROSS JOIN "public"."content_unified" "c2")
          WHERE ("c1"."slug" <> "c2"."slug")
        )
 SELECT "source_category",
    "source_slug",
    "target_category",
    "target_slug",
    ((("public"."similarity"("source_title", "target_title") * (0.4)::double precision) + ("public"."similarity"("source_description", "target_description") * (0.3)::double precision)) +
        CASE
            WHEN (("source_tags" IS NULL) OR ("target_tags" IS NULL)) THEN (0)::double precision
            WHEN (("array_length"("source_tags", 1) = 0) OR ("array_length"("target_tags", 1) = 0)) THEN (0)::double precision
            ELSE ((( SELECT ("count"(*))::double precision AS "count"
               FROM "unnest"("content_pairs"."source_tags") "tag"("tag")
              WHERE ("tag"."tag" = ANY ("content_pairs"."target_tags"))) / (NULLIF("array_length"(ARRAY( SELECT DISTINCT "unnest"(("content_pairs"."source_tags" || "content_pairs"."target_tags")) AS "unnest"), 1), 0))::double precision) * (0.3)::double precision)
        END) AS "similarity_score"
   FROM "content_pairs"
  WHERE ((("public"."similarity"("source_title", "target_title") * (0.4)::double precision) + ("public"."similarity"("source_description", "target_description") * (0.3)::double precision)) >= (0.20)::double precision)
  ORDER BY "source_category", "source_slug", ((("public"."similarity"("source_title", "target_title") * (0.4)::double precision) + ("public"."similarity"("source_description", "target_description") * (0.3)::double precision)) +
        CASE
            WHEN (("source_tags" IS NULL) OR ("target_tags" IS NULL)) THEN (0)::double precision
            WHEN (("array_length"("source_tags", 1) = 0) OR ("array_length"("target_tags", 1) = 0)) THEN (0)::double precision
            ELSE ((( SELECT ("count"(*))::double precision AS "count"
               FROM "unnest"("content_pairs"."source_tags") "tag"("tag")
              WHERE ("tag"."tag" = ANY ("content_pairs"."target_tags"))) / (NULLIF("array_length"(ARRAY( SELECT DISTINCT "unnest"(("content_pairs"."source_tags" || "content_pairs"."target_tags")) AS "unnest"), 1), 0))::double precision) * (0.3)::double precision)
        END) DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_content_similarity" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_content_similarity" IS 'Pre-computed content similarity matrix using pg_trgm. Refresh: daily via pg_cron. Replaces related-content/service.ts';



CREATE MATERIALIZED VIEW "public"."mv_content_stats" AS
 SELECT "cu"."category",
    "cu"."slug",
    "cu"."title",
    "cu"."description",
    "cu"."author",
    "cu"."tags",
    "cu"."created_at",
    "cu"."updated_at",
    COALESCE("a"."view_count", (0)::bigint) AS "view_count",
    COALESCE("a"."copy_count", (0)::bigint) AS "copy_count",
    COALESCE("a"."bookmark_count", (0)::bigint) AS "bookmark_count",
    COALESCE("a"."total_time_spent_seconds", (0)::bigint) AS "total_time_spent_seconds",
    (((((COALESCE("a"."view_count", (0)::bigint))::numeric * 0.5) + ((COALESCE("a"."copy_count", (0)::bigint))::numeric * 2.0)) + ((COALESCE("a"."bookmark_count", (0)::bigint))::numeric * 1.5)))::integer AS "popularity_score",
        CASE
            WHEN ("a"."last_viewed_at" IS NULL) THEN 0
            WHEN ("a"."last_viewed_at" < ("now"() - '7 days'::interval)) THEN 0
            ELSE (((COALESCE("a"."view_count", (0)::bigint))::numeric * "exp"((('-0.1'::numeric * EXTRACT(epoch FROM ("now"() - "a"."last_viewed_at"))) / 86400.0))))::integer
        END AS "trending_score",
    "a"."last_viewed_at",
    "a"."last_interaction_at"
   FROM ("public"."content_unified" "cu"
     LEFT JOIN "public"."mv_analytics_summary" "a" ON ((("cu"."category" = "a"."category") AND ("cu"."slug" = "a"."slug"))))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_content_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_content_stats" IS 'Comprehensive content statistics with popularity and trending scores. Refresh: hourly via pg_cron.';



CREATE MATERIALIZED VIEW "public"."mv_content_tag_index" AS
 SELECT "category",
    "slug",
    COALESCE(ARRAY( SELECT "jsonb_array_elements_text"(("content_items"."data" -> 'tags'::"text")) AS "jsonb_array_elements_text"), '{}'::"text"[]) AS "tags",
    COALESCE((("data" ->> 'featured'::"text"))::boolean, false) AS "featured",
    COALESCE((("data" ->> 'priority'::"text"))::integer, 0) AS "priority",
    COALESCE(("data" ->> 'title'::"text"), ("data" ->> 'name'::"text"), ''::"text") AS "title"
   FROM "public"."content_items"
  WHERE ("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'commands'::"text", 'rules'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text"]))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_content_tag_index" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_content_tag_index" IS 'Pre-computed tag index for faster related content queries. Refreshed daily via pg_cron.';



CREATE MATERIALIZED VIEW "public"."mv_featured_scores" AS
 WITH "content_stats" AS (
         SELECT "cu"."category",
            "cu"."slug",
            "cu"."date_added",
            COALESCE(( SELECT "count"(*) AS "count"
                   FROM "public"."user_interactions" "ui"
                  WHERE (("ui"."content_type" = "cu"."category") AND ("ui"."content_slug" = "cu"."slug") AND ("ui"."interaction_type" = 'view'::"text") AND ("ui"."created_at" > ("now"() - '24:00:00'::interval)))), (0)::bigint) AS "views_24h",
            COALESCE(( SELECT "count"(*) AS "count"
                   FROM "public"."user_interactions" "ui"
                  WHERE (("ui"."content_type" = "cu"."category") AND ("ui"."content_slug" = "cu"."slug") AND ("ui"."interaction_type" = 'view'::"text") AND ("ui"."created_at" > ("now"() - '48:00:00'::interval)) AND ("ui"."created_at" <= ("now"() - '24:00:00'::interval)))), (0)::bigint) AS "views_previous_24h",
            COALESCE(( SELECT "count"(*) AS "count"
                   FROM "public"."bookmarks" "b"
                  WHERE (("b"."content_type" = "cu"."category") AND ("b"."content_slug" = "cu"."slug"))), (0)::bigint) AS "bookmark_count",
            COALESCE(( SELECT "count"(*) AS "count"
                   FROM "public"."user_interactions" "ui"
                  WHERE (("ui"."content_type" = "cu"."category") AND ("ui"."content_slug" = "cu"."slug") AND ("ui"."interaction_type" = 'copy'::"text"))), (0)::bigint) AS "copy_count",
            (0)::bigint AS "comment_count",
            COALESCE(( SELECT "count"(*) AS "count"
                   FROM "public"."user_interactions" "ui"
                  WHERE (("ui"."content_type" = "cu"."category") AND ("ui"."content_slug" = "cu"."slug") AND ("ui"."interaction_type" = 'view'::"text"))), (0)::bigint) AS "total_views"
           FROM "public"."content_unified" "cu"
        ), "trending_scores" AS (
         SELECT "content_stats"."category",
            "content_stats"."slug",
            "content_stats"."date_added",
            "content_stats"."views_24h",
            "content_stats"."views_previous_24h",
            "content_stats"."bookmark_count",
            "content_stats"."copy_count",
            "content_stats"."comment_count",
            "content_stats"."total_views",
                CASE
                    WHEN ("content_stats"."views_previous_24h" > 0) THEN (((("content_stats"."views_24h")::double precision - ("content_stats"."views_previous_24h")::double precision) / ("content_stats"."views_previous_24h")::double precision) * (100.0)::double precision)
                    ELSE (0.0)::double precision
                END AS "growth_rate_pct",
            LEAST((100.0)::double precision, GREATEST((0.0)::double precision, ((100.0)::double precision / ((1.0)::double precision + "exp"((- ((
                CASE
                    WHEN ("content_stats"."views_previous_24h" > 0) THEN (((("content_stats"."views_24h")::double precision - ("content_stats"."views_previous_24h")::double precision) / ("content_stats"."views_previous_24h")::double precision) * (100.0)::double precision)
                    ELSE (0.0)::double precision
                END - (100.0)::double precision) / (100.0)::double precision))))))) AS "trending_score"
           FROM "content_stats"
        ), "engagement_scores" AS (
         SELECT "trending_scores"."category",
            "trending_scores"."slug",
            "trending_scores"."date_added",
            "trending_scores"."views_24h",
            "trending_scores"."views_previous_24h",
            "trending_scores"."bookmark_count",
            "trending_scores"."copy_count",
            "trending_scores"."comment_count",
            "trending_scores"."total_views",
            "trending_scores"."growth_rate_pct",
            "trending_scores"."trending_score",
            (((("trending_scores"."bookmark_count" * 5) + ("trending_scores"."copy_count" * 3)))::numeric + (("trending_scores"."total_views")::numeric / 10.0)) AS "raw_engagement",
            ("percent_rank"() OVER (PARTITION BY "trending_scores"."category" ORDER BY (((("trending_scores"."bookmark_count" * 5) + ("trending_scores"."copy_count" * 3)))::numeric + (("trending_scores"."total_views")::numeric / 10.0))) * (100.0)::double precision) AS "engagement_score"
           FROM "trending_scores"
        ), "freshness_scores" AS (
         SELECT "engagement_scores"."category",
            "engagement_scores"."slug",
            "engagement_scores"."date_added",
            "engagement_scores"."views_24h",
            "engagement_scores"."views_previous_24h",
            "engagement_scores"."bookmark_count",
            "engagement_scores"."copy_count",
            "engagement_scores"."comment_count",
            "engagement_scores"."total_views",
            "engagement_scores"."growth_rate_pct",
            "engagement_scores"."trending_score",
            "engagement_scores"."raw_engagement",
            "engagement_scores"."engagement_score",
            (EXTRACT(epoch FROM ("now"() - ("engagement_scores"."date_added")::timestamp with time zone)) / 86400.0) AS "days_old",
            GREATEST((0)::numeric, ((100)::numeric - ((EXTRACT(epoch FROM ("now"() - ("engagement_scores"."date_added")::timestamp with time zone)) / 86400.0) * (2)::numeric))) AS "freshness_score"
           FROM "engagement_scores"
        ), "final_scores" AS (
         SELECT "freshness_scores"."category",
            "freshness_scores"."slug",
            "freshness_scores"."date_added",
            "freshness_scores"."views_24h",
            "freshness_scores"."views_previous_24h",
            "freshness_scores"."bookmark_count",
            "freshness_scores"."copy_count",
            "freshness_scores"."comment_count",
            "freshness_scores"."total_views",
            "freshness_scores"."growth_rate_pct",
            "freshness_scores"."trending_score",
            "freshness_scores"."raw_engagement",
            "freshness_scores"."engagement_score",
            "freshness_scores"."days_old",
            "freshness_scores"."freshness_score",
            (0)::numeric AS "rating_score",
            (((("freshness_scores"."trending_score" * (0.4)::double precision) + (((0)::numeric * 0.3))::double precision) + ("freshness_scores"."engagement_score" * (0.2)::double precision)) + (("freshness_scores"."freshness_score")::double precision * (0.1)::double precision)) AS "final_score"
           FROM "freshness_scores"
        ), "ranked_content" AS (
         SELECT "final_scores"."category",
            "final_scores"."slug",
            "final_scores"."date_added",
            "final_scores"."views_24h",
            "final_scores"."views_previous_24h",
            "final_scores"."bookmark_count",
            "final_scores"."copy_count",
            "final_scores"."comment_count",
            "final_scores"."total_views",
            "final_scores"."growth_rate_pct",
            "final_scores"."trending_score",
            "final_scores"."raw_engagement",
            "final_scores"."engagement_score",
            "final_scores"."days_old",
            "final_scores"."freshness_score",
            "final_scores"."rating_score",
            "final_scores"."final_score",
            "row_number"() OVER (PARTITION BY "final_scores"."category" ORDER BY "final_scores"."final_score" DESC) AS "rank"
           FROM "final_scores"
        )
 SELECT "category" AS "content_type",
    "slug" AS "content_slug",
    "rank",
    "round"(("final_score")::numeric, 2) AS "final_score",
    "round"(("trending_score")::numeric, 2) AS "trending_score",
    "round"("rating_score", 2) AS "rating_score",
    "round"(("engagement_score")::numeric, 2) AS "engagement_score",
    "round"("freshness_score", 2) AS "freshness_score",
    "views_24h",
    "views_previous_24h",
    "round"(("growth_rate_pct")::numeric, 2) AS "growth_rate_pct",
    "bookmark_count",
    "copy_count",
    "comment_count",
    "total_views",
    "round"("days_old", 1) AS "days_old",
    "date_added",
    "now"() AS "calculated_at"
   FROM "ranked_content"
  WHERE ("rank" <= 10)
  ORDER BY "category", "rank"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_featured_scores" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_featured_scores" IS 'Featured content scores calculated via multi-factor algorithm. Refreshed hourly via pg_cron. Fixed comment_count type to bigint.';



CREATE TABLE IF NOT EXISTS "public"."user_affinities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "affinity_score" numeric(5,2) NOT NULL,
    "based_on" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_affinities_affinity_score_check" CHECK ((("affinity_score" >= (0)::numeric) AND ("affinity_score" <= (100)::numeric))),
    CONSTRAINT "user_affinities_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text"])))
);


ALTER TABLE "public"."user_affinities" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_for_you_feed" AS
 SELECT "ua"."user_id",
    "ua"."content_type",
    "ua"."content_slug",
    "ua"."affinity_score",
    "cs"."popularity_score",
    "cs"."trending_score",
    "cs"."view_count",
    "cs"."title",
    "cs"."description",
    "cs"."author",
    "cs"."tags",
    (((("ua"."affinity_score" * 0.6) + ((COALESCE("cs"."popularity_score", 0))::numeric * 0.2)) + ((COALESCE("cs"."trending_score", 0))::numeric * 0.2)))::integer AS "recommendation_score",
    "row_number"() OVER (PARTITION BY "ua"."user_id" ORDER BY ((("ua"."affinity_score" * 0.6) + ((COALESCE("cs"."popularity_score", 0))::numeric * 0.2)) + ((COALESCE("cs"."trending_score", 0))::numeric * 0.2)) DESC) AS "rank_for_user"
   FROM ("public"."user_affinities" "ua"
     JOIN "public"."mv_content_stats" "cs" ON ((("ua"."content_type" = "cs"."category") AND ("ua"."content_slug" = "cs"."slug"))))
  WHERE ("ua"."affinity_score" >= (30)::numeric)
  ORDER BY "ua"."user_id", ((((("ua"."affinity_score" * 0.6) + ((COALESCE("cs"."popularity_score", 0))::numeric * 0.2)) + ((COALESCE("cs"."trending_score", 0))::numeric * 0.2)))::integer) DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_for_you_feed" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_for_you_feed" IS 'Personalized content recommendations per user. Refresh: hourly via pg_cron. Replaces personalization/for-you-feed.ts';



CREATE MATERIALIZED VIEW "public"."mv_recommendation_scores" AS
 WITH "content_metadata" AS (
         SELECT "content_unified"."category",
            "content_unified"."slug",
            "content_unified"."title",
            "content_unified"."description",
            "content_unified"."author",
            "content_unified"."tags",
            ARRAY( SELECT "tag"."tag"
                   FROM "unnest"("content_unified"."tags") "tag"("tag")
                  WHERE ("tag"."tag" = ANY (ARRAY['code-review'::"text", 'api-development'::"text", 'frontend-development'::"text", 'data-science'::"text", 'content-creation'::"text", 'devops-infrastructure'::"text", 'testing-qa'::"text", 'security-audit'::"text"]))) AS "use_case_tags",
            ARRAY( SELECT "tag"."tag"
                   FROM "unnest"("content_unified"."tags") "tag"("tag")
                  WHERE ("tag"."tag" = ANY (ARRAY['github'::"text", 'database'::"text", 'aws'::"text", 'gcp'::"text", 'azure'::"text", 'communication'::"text"]))) AS "integration_tags",
            ARRAY( SELECT "tag"."tag"
                   FROM "unnest"("content_unified"."tags") "tag"("tag")
                  WHERE ("tag"."tag" = ANY (ARRAY['security'::"text", 'performance'::"text", 'documentation'::"text", 'testing'::"text", 'code-quality'::"text", 'automation'::"text"]))) AS "focus_area_tags",
                CASE
                    WHEN (('beginner'::"text" = ANY ("content_unified"."tags")) OR ("content_unified"."description" ~~* '%beginner%'::"text")) THEN 'beginner'::"text"
                    WHEN (('advanced'::"text" = ANY ("content_unified"."tags")) OR ("content_unified"."description" ~~* '%advanced%'::"text")) THEN 'advanced'::"text"
                    ELSE 'intermediate'::"text"
                END AS "suggested_experience_level"
           FROM "public"."content_unified"
        )
 SELECT "category",
    "slug",
    "title",
    "description",
    "author",
    "tags",
    "use_case_tags",
    "integration_tags",
    "focus_area_tags",
    "suggested_experience_level",
    "array_length"("use_case_tags", 1) AS "use_case_match_count",
    "array_length"("integration_tags", 1) AS "integration_match_count",
    "array_length"("focus_area_tags", 1) AS "focus_area_match_count"
   FROM "content_metadata"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_recommendation_scores" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_recommendation_scores" IS 'Pre-computed recommendation metadata for fast filtering. Refresh: every 6 hours via pg_cron. Replaces recommender/algorithm.ts';



CREATE MATERIALIZED VIEW "public"."mv_search_facets" AS
 WITH "tag_expansion" AS (
         SELECT "content_unified"."category",
            "content_unified"."author",
            "unnest"("content_unified"."tags") AS "tag"
           FROM "public"."content_unified"
        )
 SELECT "category",
    "count"(DISTINCT ROW("category", "author")) AS "content_count",
    "array_agg"(DISTINCT "author") FILTER (WHERE ("author" IS NOT NULL)) AS "authors",
    "array_agg"(DISTINCT "tag") FILTER (WHERE ("tag" IS NOT NULL)) AS "all_tags",
    "count"(DISTINCT "author") AS "author_count",
    "count"(DISTINCT "tag") AS "tag_count"
   FROM "tag_expansion"
  GROUP BY "category"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_search_facets" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_search_facets" IS 'Pre-computed search facets (categories, authors, tags with counts). Refresh: hourly via pg_cron.';



CREATE TABLE IF NOT EXISTS "public"."user_collections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "view_count" integer DEFAULT 0 NOT NULL,
    "bookmark_count" integer DEFAULT 0 NOT NULL,
    "item_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_collections_description_check" CHECK (("char_length"("description") <= 500)),
    CONSTRAINT "user_collections_description_length" CHECK ((("description" IS NULL) OR ("length"("description") <= 500))),
    CONSTRAINT "user_collections_name_check" CHECK ((("char_length"("name") >= 2) AND ("char_length"("name") <= 100))),
    CONSTRAINT "user_collections_name_length" CHECK ((("length"("name") >= 2) AND ("length"("name") <= 100))),
    CONSTRAINT "user_collections_slug_check" CHECK ((("char_length"("slug") >= 2) AND ("char_length"("slug") <= 100))),
    CONSTRAINT "user_collections_slug_pattern" CHECK ((("length"("slug") >= 2) AND ("length"("slug") <= 100) AND ("slug" ~ '^[a-z0-9\-]+$'::"text")))
);


ALTER TABLE "public"."user_collections" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_collections"."is_public" IS 'Whether collection is publicly visible (default: false, NOT NULL)';



COMMENT ON CONSTRAINT "user_collections_description_length" ON "public"."user_collections" IS 'Enforces description max 500 characters';



COMMENT ON CONSTRAINT "user_collections_name_length" ON "public"."user_collections" IS 'Enforces collection name between 2-100 characters';



COMMENT ON CONSTRAINT "user_collections_slug_pattern" ON "public"."user_collections" IS 'Enforces slug format: 2-100 chars, lowercase letters, numbers, hyphens only';



CREATE MATERIALIZED VIEW "public"."mv_site_urls" AS
 WITH "content_items" AS (
         SELECT "concat"('/', "cu"."category", '/', "cu"."slug") AS "path",
            COALESCE((NULLIF("cu"."updated_at", ''::"text"))::timestamp with time zone, (NULLIF("cu"."date_added", ''::"text"))::timestamp with time zone, "now"()) AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.70 AS "priority"
           FROM "public"."content_unified" "cu"
        ), "content_item_llms" AS (
         SELECT "concat"('/', "cu"."category", '/', "cu"."slug", '/llms.txt') AS "path",
            COALESCE((NULLIF("cu"."updated_at", ''::"text"))::timestamp with time zone, (NULLIF("cu"."date_added", ''::"text"))::timestamp with time zone, "now"()) AS "lastmod",
            'daily'::"text" AS "changefreq",
            0.75 AS "priority"
           FROM "public"."content_unified" "cu"
        ), "category_pages" AS (
         SELECT "concat"('/', "cu"."category") AS "path",
            COALESCE("max"(COALESCE((NULLIF("cu"."updated_at", ''::"text"))::timestamp with time zone, (NULLIF("cu"."date_added", ''::"text"))::timestamp with time zone)), "now"()) AS "lastmod",
            'daily'::"text" AS "changefreq",
            0.80 AS "priority"
           FROM "public"."content_unified" "cu"
          GROUP BY "cu"."category"
        ), "category_llms" AS (
         SELECT "concat"('/', SUBSTRING("category_pages"."path" FROM 2), '/llms.txt') AS "path",
            "category_pages"."lastmod",
            'daily'::"text" AS "changefreq",
            0.85 AS "priority"
           FROM "category_pages"
        ), "guides_pages" AS (
         SELECT "concat"('/guides/', "g"."subcategory", '/', "g"."slug") AS "path",
            COALESCE(("g"."date_updated")::timestamp with time zone, ("g"."date_modified")::timestamp with time zone, ("g"."date_added")::timestamp with time zone, "g"."created_at") AS "lastmod",
            'monthly'::"text" AS "changefreq",
            0.65 AS "priority"
           FROM "public"."guides" "g"
          WHERE ("g"."slug" IS NOT NULL)
        ), "guides_llms" AS (
         SELECT "concat"('/guides/', "g"."subcategory", '/', "g"."slug", '/llms.txt') AS "path",
            COALESCE(("g"."date_updated")::timestamp with time zone, ("g"."date_modified")::timestamp with time zone, ("g"."date_added")::timestamp with time zone, "g"."created_at") AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.70 AS "priority"
           FROM "public"."guides" "g"
          WHERE ("g"."slug" IS NOT NULL)
        ), "changelog_entries" AS (
         SELECT "concat"('/changelog/', "ce"."slug") AS "path",
            COALESCE(("ce"."release_date")::timestamp with time zone, "ce"."updated_at", "ce"."created_at", "now"()) AS "lastmod",
            'monthly'::"text" AS "changefreq",
            0.70 AS "priority"
           FROM "public"."changelog_entries" "ce"
        ), "changelog_entries_llms" AS (
         SELECT "concat"('/changelog/', "ce"."slug", '/llms.txt') AS "path",
            COALESCE(("ce"."release_date")::timestamp with time zone, "ce"."updated_at", "ce"."created_at", "now"()) AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.75 AS "priority"
           FROM "public"."changelog_entries" "ce"
        ), "changelog_meta" AS (
         SELECT "t"."path",
            "t"."lastmod",
            "t"."changefreq",
            "t"."priority"
           FROM ( VALUES ('/changelog'::"text",( SELECT COALESCE(("max"("ce"."release_date"))::timestamp with time zone, "now"()) AS "coalesce"
                           FROM "public"."changelog_entries" "ce"),'daily'::"text",0.80), ('/changelog/rss.xml'::"text",( SELECT COALESCE(("max"("ce"."release_date"))::timestamp with time zone, "now"()) AS "coalesce"
                           FROM "public"."changelog_entries" "ce"),'daily'::"text",0.80), ('/changelog/atom.xml'::"text",( SELECT COALESCE(("max"("ce"."release_date"))::timestamp with time zone, "now"()) AS "coalesce"
                           FROM "public"."changelog_entries" "ce"),'daily'::"text",0.80), ('/changelog/llms.txt'::"text",( SELECT COALESCE(("max"("ce"."release_date"))::timestamp with time zone, "now"()) AS "coalesce"
                           FROM "public"."changelog_entries" "ce"),'daily'::"text",0.85)) "t"("path", "lastmod", "changefreq", "priority")
        ), "jobs_pages" AS (
         SELECT "concat"('/jobs/', "j"."slug") AS "path",
            COALESCE("j"."posted_at", "j"."updated_at", "j"."created_at", "now"()) AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.65 AS "priority"
           FROM "public"."jobs" "j"
          WHERE (("j"."slug" IS NOT NULL) AND ("j"."active" = true))
        ), "user_profiles" AS (
         SELECT "concat"('/u/', "u"."slug") AS "path",
            COALESCE("u"."updated_at", "u"."created_at", "now"()) AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.50 AS "priority"
           FROM "public"."users" "u"
          WHERE (("u"."public" = true) AND ("u"."slug" IS NOT NULL))
        ), "collection_pages" AS (
         SELECT "concat"('/u/', "u"."slug", '/collections/', "uc"."slug") AS "path",
            COALESCE("uc"."updated_at", "uc"."created_at", "now"()) AS "lastmod",
            'weekly'::"text" AS "changefreq",
            0.50 AS "priority"
           FROM ("public"."user_collections" "uc"
             JOIN "public"."users" "u" ON (("u"."id" = "uc"."user_id")))
          WHERE (("uc"."is_public" = true) AND ("u"."slug" IS NOT NULL) AND ("u"."public" = true))
        ), "category_indexes" AS (
         SELECT "category_pages"."path",
            "category_pages"."lastmod",
            'daily'::"text" AS "changefreq",
            0.75 AS "priority"
           FROM "category_pages"
        ), "global_llms" AS (
         SELECT '/llms.txt'::"text" AS "path",
            "now"() AS "lastmod",
            'daily'::"text" AS "changefreq",
            0.90 AS "priority"
        ), "static_pages" AS (
         SELECT "t"."path",
            "t"."lastmod",
            "t"."changefreq",
            "t"."priority"
           FROM ( VALUES ('/'::"text","now"(),'daily'::"text",1.00), ('/guides'::"text","now"(),'daily'::"text",0.70), ('/trending'::"text","now"(),'daily'::"text",0.80), ('/jobs'::"text","now"(),'daily'::"text",0.60), ('/compare'::"text","now"(),'monthly'::"text",0.60), ('/submit'::"text","now"(),'weekly'::"text",0.50), ('/tools/config-recommender'::"text","now"(),'weekly'::"text",0.60)) "t"("path", "lastmod", "changefreq", "priority")
        )
 SELECT DISTINCT ON ("path") "path",
    COALESCE("lastmod", "now"()) AS "lastmod",
    "changefreq",
    "priority"
   FROM ( SELECT "content_items"."path",
            "content_items"."lastmod",
            "content_items"."changefreq",
            "content_items"."priority"
           FROM "content_items"
        UNION ALL
         SELECT "content_item_llms"."path",
            "content_item_llms"."lastmod",
            "content_item_llms"."changefreq",
            "content_item_llms"."priority"
           FROM "content_item_llms"
        UNION ALL
         SELECT "category_pages"."path",
            "category_pages"."lastmod",
            "category_pages"."changefreq",
            "category_pages"."priority"
           FROM "category_pages"
        UNION ALL
         SELECT "category_indexes"."path",
            "category_indexes"."lastmod",
            "category_indexes"."changefreq",
            "category_indexes"."priority"
           FROM "category_indexes"
        UNION ALL
         SELECT "category_llms"."path",
            "category_llms"."lastmod",
            "category_llms"."changefreq",
            "category_llms"."priority"
           FROM "category_llms"
        UNION ALL
         SELECT "guides_pages"."path",
            "guides_pages"."lastmod",
            "guides_pages"."changefreq",
            "guides_pages"."priority"
           FROM "guides_pages"
        UNION ALL
         SELECT "guides_llms"."path",
            "guides_llms"."lastmod",
            "guides_llms"."changefreq",
            "guides_llms"."priority"
           FROM "guides_llms"
        UNION ALL
         SELECT "changelog_entries"."path",
            "changelog_entries"."lastmod",
            "changelog_entries"."changefreq",
            "changelog_entries"."priority"
           FROM "changelog_entries"
        UNION ALL
         SELECT "changelog_entries_llms"."path",
            "changelog_entries_llms"."lastmod",
            "changelog_entries_llms"."changefreq",
            "changelog_entries_llms"."priority"
           FROM "changelog_entries_llms"
        UNION ALL
         SELECT "changelog_meta"."path",
            "changelog_meta"."lastmod",
            "changelog_meta"."changefreq",
            "changelog_meta"."priority"
           FROM "changelog_meta"
        UNION ALL
         SELECT "jobs_pages"."path",
            "jobs_pages"."lastmod",
            "jobs_pages"."changefreq",
            "jobs_pages"."priority"
           FROM "jobs_pages"
        UNION ALL
         SELECT "user_profiles"."path",
            "user_profiles"."lastmod",
            "user_profiles"."changefreq",
            "user_profiles"."priority"
           FROM "user_profiles"
        UNION ALL
         SELECT "collection_pages"."path",
            "collection_pages"."lastmod",
            "collection_pages"."changefreq",
            "collection_pages"."priority"
           FROM "collection_pages"
        UNION ALL
         SELECT "static_pages"."path",
            "static_pages"."lastmod",
            "static_pages"."changefreq",
            "static_pages"."priority"
           FROM "static_pages"
        UNION ALL
         SELECT "global_llms"."path",
            "global_llms"."lastmod",
            "global_llms"."changefreq",
            "global_llms"."priority"
           FROM "global_llms") "aggregated"
  ORDER BY "path", COALESCE("lastmod", "now"()) DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_site_urls" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_site_urls" IS 'Site URLs materialized view for sitemap generation. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



CREATE MATERIALIZED VIEW "public"."mv_trending_content" AS
 SELECT "category",
    "slug",
    "title",
    "description",
    "author",
    "tags",
    "trending_score",
    "view_count",
    "copy_count",
    "bookmark_count",
    "last_viewed_at",
    "row_number"() OVER (ORDER BY "trending_score" DESC, "view_count" DESC) AS "rank_overall",
    "row_number"() OVER (PARTITION BY "category" ORDER BY "trending_score" DESC, "view_count" DESC) AS "rank_in_category"
   FROM "public"."mv_content_stats" "cs"
  WHERE ("trending_score" > 0)
  ORDER BY "trending_score" DESC
 LIMIT 100
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_trending_content" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_trending_content" IS 'Pre-computed trending content rankings by view count. Refreshed daily via pg_cron.';



CREATE MATERIALIZED VIEW "public"."mv_weekly_new_content" AS
 WITH "recent_content" AS (
         SELECT "get_content_with_analytics"."category",
            "get_content_with_analytics"."slug",
            "get_content_with_analytics"."title",
            "get_content_with_analytics"."description",
            "get_content_with_analytics"."date_added",
            ("date_trunc"('week'::"text", "get_content_with_analytics"."date_added"))::"date" AS "week_start"
           FROM "public"."get_content_with_analytics"(NULL::"text", 1000) "get_content_with_analytics"("category", "slug", "title", "description", "date_added", "view_count", "copy_count", "bookmark_count")
          WHERE ("get_content_with_analytics"."date_added" >= (CURRENT_DATE - '90 days'::interval))
        )
 SELECT "week_start",
    "category",
    "slug",
    "title",
    "description",
    "date_added",
    "row_number"() OVER (PARTITION BY "week_start" ORDER BY "date_added" DESC) AS "week_rank"
   FROM "recent_content"
  ORDER BY "week_start" DESC, "date_added" DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_weekly_new_content" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_weekly_new_content" IS 'Pre-computed weekly new content rankings. Refreshed daily via pg_cron. Covers last 90 days.';



CREATE TABLE IF NOT EXISTS "public"."newsletter_subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text",
    "referrer" "text",
    "copy_type" "text",
    "copy_category" "text",
    "copy_slug" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "confirmed" boolean DEFAULT false,
    "confirmation_token" "text",
    "confirmed_at" timestamp with time zone,
    "ip_address" "inet",
    "user_agent" "text",
    "consent_given" boolean DEFAULT true,
    "subscribed_at" timestamp with time zone DEFAULT "now"(),
    "unsubscribed_at" timestamp with time zone,
    "last_email_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletter_subscriptions_copy_category_check" CHECK ((("copy_category" IS NULL) OR ("length"("copy_category") <= 50))),
    CONSTRAINT "newsletter_subscriptions_copy_slug_check" CHECK ((("copy_slug" IS NULL) OR ("length"("copy_slug") <= 200))),
    CONSTRAINT "newsletter_subscriptions_copy_type_check" CHECK ((("copy_type" IS NULL) OR ("copy_type" = ANY (ARRAY['llmstxt'::"text", 'markdown'::"text", 'code'::"text", 'link'::"text"])))),
    CONSTRAINT "newsletter_subscriptions_email_check" CHECK ((("length"("email") >= 5) AND ("length"("email") <= 254) AND ("email" ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::"text"))),
    CONSTRAINT "newsletter_subscriptions_referrer_check" CHECK ((("referrer" IS NULL) OR ("length"("referrer") <= 500))),
    CONSTRAINT "newsletter_subscriptions_source_check" CHECK ((("source" IS NULL) OR ("source" = ANY (ARRAY['footer'::"text", 'homepage'::"text", 'modal'::"text", 'content_page'::"text", 'inline'::"text", 'post_copy'::"text"])))),
    CONSTRAINT "newsletter_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'unsubscribed'::"text", 'bounced'::"text", 'complained'::"text"])))
);


ALTER TABLE "public"."newsletter_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."newsletter_subscriptions" IS 'Email newsletter subscriptions with GDPR compliance and signup attribution tracking';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."email" IS 'Normalized email address (lowercase, trimmed) - RFC 5322 compliant';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."source" IS 'Signup source for conversion attribution (footer, homepage, modal, etc.)';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."copy_type" IS 'Type of content copied when email captured (llmstxt, markdown, code, link)';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."status" IS 'Subscription status: active, unsubscribed, bounced, complained';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."ip_address" IS 'IP address at signup time (GDPR compliance)';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."consent_given" IS 'Explicit consent flag (GDPR compliance)';



CREATE TABLE IF NOT EXISTS "public"."notification_dismissals" (
    "user_id" "uuid" NOT NULL,
    "notification_id" "text" NOT NULL,
    "dismissed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_dismissals" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_dismissals" IS 'Tracks which users have dismissed which notifications';



COMMENT ON COLUMN "public"."notification_dismissals"."user_id" IS 'User who dismissed the notification';



COMMENT ON COLUMN "public"."notification_dismissals"."notification_id" IS 'Notification that was dismissed';



COMMENT ON COLUMN "public"."notification_dismissals"."dismissed_at" IS 'When the notification was dismissed';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "text" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "priority" "public"."notification_priority" DEFAULT 'medium'::"public"."notification_priority" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "action_label" "text",
    "action_href" "text",
    "action_onclick" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_action_href_check" CHECK ((("action_href" IS NULL) OR ("action_href" ~ '^/'::"text"))),
    CONSTRAINT "notifications_action_label_check" CHECK ((("action_label" IS NULL) OR ("length"("action_label") <= 50))),
    CONSTRAINT "notifications_action_onclick_check" CHECK ((("action_onclick" IS NULL) OR ("length"("action_onclick") <= 100))),
    CONSTRAINT "notifications_icon_check" CHECK ((("icon" IS NULL) OR ("length"("icon") <= 50))),
    CONSTRAINT "notifications_id_check" CHECK (("id" ~ '^[a-z0-9-]+$'::"text")),
    CONSTRAINT "notifications_message_check" CHECK ((("length"("message") >= 10) AND ("length"("message") <= 500))),
    CONSTRAINT "notifications_title_check" CHECK ((("length"("title") >= 5) AND ("length"("title") <= 100)))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Site-wide notification definitions with scheduling and priority';



COMMENT ON COLUMN "public"."notifications"."id" IS 'Unique identifier in kebab-case format (e.g., announcement-launch-2025-10)';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification category: announcement, feedback';



COMMENT ON COLUMN "public"."notifications"."priority" IS 'Display priority when multiple active (high > medium > low)';



COMMENT ON COLUMN "public"."notifications"."active" IS 'Admin toggle to enable/disable without deleting';



COMMENT ON COLUMN "public"."notifications"."expires_at" IS 'Notification hidden after this date (null = no expiration)';



COMMENT ON COLUMN "public"."notifications"."title" IS 'Notification title (5-100 characters, action-oriented)';



COMMENT ON COLUMN "public"."notifications"."message" IS 'Notification message (10-500 characters, 1-2 sentences max)';



COMMENT ON COLUMN "public"."notifications"."action_label" IS 'Optional CTA button label';



COMMENT ON COLUMN "public"."notifications"."action_href" IS 'Optional CTA href (relative URLs only)';



COMMENT ON COLUMN "public"."notifications"."action_onclick" IS 'Optional CTA onclick handler (function name)';



COMMENT ON COLUMN "public"."notifications"."icon" IS 'Optional Lucide icon name (e.g., "Sparkles", "MessageSquare")';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "polar_transaction_id" "text" NOT NULL,
    "polar_checkout_id" "text",
    "polar_customer_id" "text",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" NOT NULL,
    "product_type" "text" NOT NULL,
    "product_id" "uuid",
    "plan" "text",
    "metadata" "jsonb",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "url" "text",
    "vote_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "posts_content_length" CHECK ((("content" IS NULL) OR ("length"("content") <= 5000))),
    CONSTRAINT "posts_title_length" CHECK ((("length"("title") >= 3) AND ("length"("title") <= 300)))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON CONSTRAINT "posts_content_length" ON "public"."posts" IS 'Enforces post content max 5000 characters';



COMMENT ON CONSTRAINT "posts_title_length" ON "public"."posts" IS 'Enforces post title between 3-300 characters';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "bio" "text",
    "work" "text",
    "website" "text",
    "social_x_link" "text",
    "interests" "text"[],
    "profile_public" boolean DEFAULT true NOT NULL,
    "follow_email" boolean DEFAULT true NOT NULL,
    "reputation_score" integer DEFAULT 0 NOT NULL,
    "badges" "jsonb" DEFAULT '[]'::"jsonb",
    "total_submissions" integer DEFAULT 0 NOT NULL,
    "total_bookmarks" integer DEFAULT 0 NOT NULL,
    "total_views" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_bio_check" CHECK ((("bio" IS NULL) OR ("length"("bio") <= 500))),
    CONSTRAINT "profiles_display_name_check" CHECK ((("display_name" IS NULL) OR (("length"("display_name") >= 1) AND ("length"("display_name") <= 100)))),
    CONSTRAINT "profiles_interests_check" CHECK ((("interests" IS NULL) OR ("array_length"("interests", 1) <= 10))),
    CONSTRAINT "profiles_reputation_score_check" CHECK (("reputation_score" >= 0)),
    CONSTRAINT "profiles_social_x_link_check" CHECK ((("social_x_link" IS NULL) OR ("social_x_link" ~ '^https?://'::"text"))),
    CONSTRAINT "profiles_total_bookmarks_check" CHECK (("total_bookmarks" >= 0)),
    CONSTRAINT "profiles_total_submissions_check" CHECK (("total_submissions" >= 0)),
    CONSTRAINT "profiles_total_views_check" CHECK (("total_views" >= 0)),
    CONSTRAINT "profiles_website_check" CHECK ((("website" IS NULL) OR ("website" ~ '^https?://'::"text"))),
    CONSTRAINT "profiles_work_check" CHECK ((("work" IS NULL) OR ("length"("work") <= 100)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Extended user profile data beyond auth.users';



COMMENT ON COLUMN "public"."profiles"."reputation_score" IS 'Calculated reputation score based on contributions and community engagement';



COMMENT ON COLUMN "public"."profiles"."badges" IS 'Array of earned badges (JSONB for flexibility)';



CREATE TABLE IF NOT EXISTS "public"."quiz_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "display_order" integer NOT NULL,
    "icon_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_options" IS 'Quiz answer options. Supports A/B testing via SQL updates.';



CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "description" "text",
    "required" boolean DEFAULT false,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_questions" IS 'Database-first quiz configuration. Edit questions without deployments.';



CREATE MATERIALIZED VIEW "public"."recommended_content" AS
 WITH "user_high_affinities" AS (
         SELECT "user_affinities"."user_id",
            "user_affinities"."content_type",
            "user_affinities"."affinity_score"
           FROM "public"."user_affinities"
          WHERE ("user_affinities"."affinity_score" >= 60.0)
        ), "user_bookmarked_content" AS (
         SELECT "bookmarks"."user_id",
            "bookmarks"."content_type",
            "bookmarks"."content_slug"
           FROM "public"."bookmarks"
        ), "popular_content" AS (
         SELECT "content_popularity"."content_type",
            "content_popularity"."content_slug",
            "content_popularity"."popularity_score"
           FROM "public"."content_popularity"
          WHERE ("content_popularity"."popularity_score" > (0)::numeric)
        )
 SELECT "uha"."user_id",
    "pc"."content_type",
    "pc"."content_slug",
    "round"((("uha"."affinity_score" * 0.7) + (COALESCE("pc"."popularity_score", (0)::numeric) * 0.3)), 2) AS "recommendation_score",
    "uha"."affinity_score" AS "user_affinity",
    "pc"."popularity_score",
    "now"() AS "last_refreshed"
   FROM (("user_high_affinities" "uha"
     JOIN "popular_content" "pc" ON (("pc"."content_type" = "uha"."content_type")))
     LEFT JOIN "user_bookmarked_content" "ubc" ON ((("ubc"."user_id" = "uha"."user_id") AND ("ubc"."content_type" = "pc"."content_type") AND ("ubc"."content_slug" = "pc"."content_slug"))))
  WHERE ("ubc"."content_slug" IS NULL)
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."recommended_content" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."recommended_content" IS 'Recommended content materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."recommended_content"."recommendation_score" IS 'Combined score: user affinity (70%) + content popularity (30%). Range: 0-100. Higher = better recommendation.';



COMMENT ON COLUMN "public"."recommended_content"."user_affinity" IS 'User affinity score for this content type. From user_affinities table.';



CREATE TABLE IF NOT EXISTS "public"."reputation_actions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "action_type" "text" NOT NULL,
    "points" integer NOT NULL,
    "description" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reputation_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['post'::"text", 'vote_received'::"text", 'comment'::"text", 'submission_merged'::"text", 'review'::"text", 'bookmark_received'::"text", 'follower'::"text"]))),
    CONSTRAINT "reputation_actions_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 200))),
    CONSTRAINT "reputation_actions_points_check" CHECK (("points" >= 0))
);


ALTER TABLE "public"."reputation_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."reputation_actions" IS 'Point values for reputation-earning actions';



COMMENT ON COLUMN "public"."reputation_actions"."action_type" IS 'Type of action (post, vote_received, etc)';



COMMENT ON COLUMN "public"."reputation_actions"."points" IS 'Points awarded for this action';



COMMENT ON COLUMN "public"."reputation_actions"."active" IS 'Whether this action currently awards points';



CREATE TABLE IF NOT EXISTS "public"."reputation_tiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "min_score" integer NOT NULL,
    "max_score" integer,
    "color" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "description" "text" NOT NULL,
    "order" integer NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reputation_tiers_check" CHECK ((("max_score" IS NULL) OR ("max_score" >= "min_score"))),
    CONSTRAINT "reputation_tiers_color_check" CHECK (("color" = ANY (ARRAY['gray'::"text", 'blue'::"text", 'purple'::"text", 'orange'::"text", 'red'::"text", 'gold'::"text"]))),
    CONSTRAINT "reputation_tiers_description_check" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 100))),
    CONSTRAINT "reputation_tiers_icon_check" CHECK ((("length"("icon") >= 1) AND ("length"("icon") <= 10))),
    CONSTRAINT "reputation_tiers_min_score_check" CHECK (("min_score" >= 0)),
    CONSTRAINT "reputation_tiers_name_check" CHECK ((("length"("name") >= 2) AND ("length"("name") <= 50))),
    CONSTRAINT "reputation_tiers_order_check" CHECK (("order" >= 0))
);


ALTER TABLE "public"."reputation_tiers" OWNER TO "postgres";


COMMENT ON TABLE "public"."reputation_tiers" IS 'Reputation tier thresholds and display metadata';



COMMENT ON COLUMN "public"."reputation_tiers"."min_score" IS 'Minimum reputation score for this tier';



COMMENT ON COLUMN "public"."reputation_tiers"."max_score" IS 'Maximum reputation score (NULL for infinity on highest tier)';



COMMENT ON COLUMN "public"."reputation_tiers"."color" IS 'Theme color for tier badge';



COMMENT ON COLUMN "public"."reputation_tiers"."icon" IS 'Emoji icon for tier';



COMMENT ON COLUMN "public"."reputation_tiers"."order" IS 'Display order (0-based)';



CREATE TABLE IF NOT EXISTS "public"."review_helpful_votes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "review_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."review_helpful_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "helpful_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "review_ratings_content_slug_pattern" CHECK ((("content_slug" ~ '^[a-zA-Z0-9\-_/]+$'::"text") AND ("length"("content_slug") <= 200))),
    CONSTRAINT "review_ratings_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text", 'guides'::"text"]))),
    CONSTRAINT "review_ratings_helpful_count_check" CHECK (("helpful_count" >= 0)),
    CONSTRAINT "review_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "review_ratings_rating_range" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "review_ratings_review_text_length" CHECK ((("review_text" IS NULL) OR ("length"("review_text") <= 2000)))
);


ALTER TABLE "public"."review_ratings" OWNER TO "postgres";


COMMENT ON CONSTRAINT "review_ratings_content_slug_pattern" ON "public"."review_ratings" IS 'Enforces content slug format: letters, numbers, hyphens, underscores, slashes (max 200 chars)';



COMMENT ON CONSTRAINT "review_ratings_rating_range" ON "public"."review_ratings" IS 'Enforces rating must be 1-5 stars';



COMMENT ON CONSTRAINT "review_ratings_review_text_length" ON "public"."review_ratings" IS 'Enforces review text max 2000 characters';



CREATE TABLE IF NOT EXISTS "public"."seo_config" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seo_config_key_check" CHECK (("key" ~ '^[a-z_]+$'::"text"))
);


ALTER TABLE "public"."seo_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."seo_config" IS 'Database-first SEO global configuration. Replaces hardcoded METADATA_QUALITY_RULES and SEO_CONFIG constants.';



CREATE TABLE IF NOT EXISTS "public"."seo_enrichment_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "min_questions" integer DEFAULT 3 NOT NULL,
    "max_questions" integer DEFAULT 5 NOT NULL,
    "focus_areas" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "example_questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "seo_config" "jsonb" DEFAULT '{"optimizeForAI": true, "priorityBoost": false, "generateSchema": true}'::"jsonb" NOT NULL,
    "performance_config" "jsonb" DEFAULT '{"batchSize": 5, "enableCache": true}'::"jsonb" NOT NULL,
    "quality_standards" "jsonb" DEFAULT '{"issue": {"voice": "User perspective (What they see/experience)", "format": "Clear, specific question or error description", "maxLength": 80, "minLength": 40}, "solution": {"voice": "Imperative (Check, Verify, Run, Ensure, Add)", "format": "Step-by-step actionable solution", "maxLength": 200, "minLength": 100}}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seo_enrichment_rules_category_check" CHECK ((("length"("category") >= 1) AND ("length"("category") <= 50))),
    CONSTRAINT "seo_enrichment_rules_check" CHECK ((("max_questions" >= 1) AND ("max_questions" <= 10) AND ("max_questions" >= "min_questions"))),
    CONSTRAINT "seo_enrichment_rules_min_questions_check" CHECK ((("min_questions" >= 1) AND ("min_questions" <= 10)))
);


ALTER TABLE "public"."seo_enrichment_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."seo_enrichment_rules" IS 'SEO enrichment rules for FAQ generation. Replaces config/seo/enrichment/category-rules.ts.';



COMMENT ON COLUMN "public"."seo_enrichment_rules"."focus_areas" IS 'Array of focus area keys like ["installation_setup", "authentication_api_keys"]';



COMMENT ON COLUMN "public"."seo_enrichment_rules"."example_questions" IS 'Array of example question strings to guide FAQ generation style';



COMMENT ON COLUMN "public"."seo_enrichment_rules"."seo_config" IS 'SEO settings: generateSchema, optimizeForAI, priorityBoost';



COMMENT ON COLUMN "public"."seo_enrichment_rules"."performance_config" IS 'Performance settings: batchSize, enableCache';



CREATE TABLE IF NOT EXISTS "public"."sponsored_clicks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sponsored_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "target_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sponsored_clicks_target_url_length" CHECK (("length"("target_url") <= 500))
);


ALTER TABLE "public"."sponsored_clicks" OWNER TO "postgres";


COMMENT ON CONSTRAINT "sponsored_clicks_target_url_length" ON "public"."sponsored_clicks" IS 'Enforces target URL max 500 characters';



CREATE TABLE IF NOT EXISTS "public"."sponsored_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "tier" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "impression_limit" integer,
    "impression_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sponsored_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsored_impressions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sponsored_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "page_url" "text",
    "position" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sponsored_impressions_page_url_length" CHECK ((("page_url" IS NULL) OR ("length"("page_url") <= 500))),
    CONSTRAINT "sponsored_impressions_position_range" CHECK ((("position" IS NULL) OR (("position" >= 0) AND ("position" <= 100))))
);


ALTER TABLE "public"."sponsored_impressions" OWNER TO "postgres";


COMMENT ON CONSTRAINT "sponsored_impressions_page_url_length" ON "public"."sponsored_impressions" IS 'Enforces page URL max 500 characters';



COMMENT ON CONSTRAINT "sponsored_impressions_position_range" ON "public"."sponsored_impressions" IS 'Enforces position between 0-100 if provided';



CREATE TABLE IF NOT EXISTS "public"."structured_data_config" (
    "category" "text" NOT NULL,
    "generate_application" boolean DEFAULT false,
    "generate_source_code" boolean DEFAULT false,
    "generate_how_to" boolean DEFAULT false,
    "generate_creative_work" boolean DEFAULT false,
    "generate_faq" boolean DEFAULT false,
    "generate_breadcrumb" boolean DEFAULT true,
    "generate_speakable" boolean DEFAULT false,
    "generate_review" boolean DEFAULT false,
    "generate_aggregate_rating" boolean DEFAULT false,
    "generate_video_object" boolean DEFAULT false,
    "generate_course" boolean DEFAULT false,
    "generate_job_posting" boolean DEFAULT false,
    "generate_collection_page" boolean DEFAULT false,
    "category_display_name" "text" NOT NULL,
    "application_sub_category" "text",
    "default_keywords" "text"[] DEFAULT '{}'::"text"[],
    "default_requirements" "text"[] DEFAULT '{}'::"text"[],
    "creative_work_description" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "structured_data_config_category_check" CHECK (("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text", 'skills'::"text", 'guides'::"text", 'jobs'::"text", 'changelog'::"text"])))
);


ALTER TABLE "public"."structured_data_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."structured_data_config" IS 'Database-first structured data configuration. Replaces STRUCTURED_DATA_RULES from schema-types.ts';



CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "content_name" "text" NOT NULL,
    "pr_number" integer,
    "pr_url" "text",
    "branch_name" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submission_data" "jsonb" NOT NULL,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "merged_at" timestamp with time zone,
    CONSTRAINT "submissions_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text"]))),
    CONSTRAINT "submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'merged'::"text"])))
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."submission_stats_summary" AS
 SELECT "count"(*) AS "total",
    "count"(*) FILTER (WHERE ("status" = 'pending'::"text")) AS "pending",
    "count"(*) FILTER (WHERE (("status" = 'merged'::"text") AND ("merged_at" >= ("now"() - '7 days'::interval)))) AS "merged_this_week",
    "now"() AS "last_refreshed_at"
   FROM "public"."submissions"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."submission_stats_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."submission_stats_summary" IS 'Submission statistics summary materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."submission_stats_summary"."total" IS 'Total number of submissions across all statuses';



COMMENT ON COLUMN "public"."submission_stats_summary"."pending" IS 'Number of submissions with status=pending awaiting review';



COMMENT ON COLUMN "public"."submission_stats_summary"."merged_this_week" IS 'Number of submissions merged in the last 7 days';



COMMENT ON COLUMN "public"."submission_stats_summary"."last_refreshed_at" IS 'Timestamp of last materialized view refresh (updated hourly)';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "polar_subscription_id" "text" NOT NULL,
    "polar_customer_id" "text",
    "polar_product_id" "text",
    "plan_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "product_type" "text",
    "product_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cancelled_at" timestamp with time zone
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tier_display_config" (
    "tier" "text" NOT NULL,
    "label" "text" NOT NULL,
    "css_classes" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tier_display_config_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."tier_display_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."tier_display_config" IS 'UI display configuration for user account tiers - replaces hardcoded TIER_CONFIG in TypeScript';



COMMENT ON COLUMN "public"."tier_display_config"."tier" IS 'Tier identifier (must match users.tier values)';



COMMENT ON COLUMN "public"."tier_display_config"."label" IS 'Display label shown in UI';



COMMENT ON COLUMN "public"."tier_display_config"."css_classes" IS 'TailwindCSS classes for badge styling';



COMMENT ON COLUMN "public"."tier_display_config"."display_order" IS 'Sort order for display (0=first)';



CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."trending_content_24h" AS
 SELECT "b"."content_type",
    "b"."content_slug",
    "count"(DISTINCT "b"."user_id") AS "bookmark_count_24h",
    "count"(DISTINCT "p"."id") AS "post_count_24h",
    "count"(DISTINCT "v"."id") AS "vote_count_24h",
    (((((("count"(DISTINCT "b"."user_id") * 5) + ("count"(DISTINCT "p"."id") * 10)) + ("count"(DISTINCT "v"."id") * 2)))::numeric + GREATEST((0)::numeric, ((20)::numeric - (EXTRACT(epoch FROM ("now"() - "max"(GREATEST("b"."created_at", COALESCE("p"."created_at", "b"."created_at"), COALESCE("v"."created_at", "b"."created_at"))))) / (3600)::numeric)))))::integer AS "trending_score",
    "max"(COALESCE(GREATEST("b"."created_at", "p"."created_at", "v"."created_at"), "b"."created_at")) AS "latest_activity_at",
    "now"() AS "last_refreshed"
   FROM (("public"."bookmarks" "b"
     LEFT JOIN "public"."posts" "p" ON (("p"."created_at" >= ("now"() - '24:00:00'::interval))))
     LEFT JOIN "public"."votes" "v" ON (("v"."post_id" = "p"."id")))
  WHERE ("b"."created_at" >= ("now"() - '24:00:00'::interval))
  GROUP BY "b"."content_type", "b"."content_slug"
 HAVING (("count"(DISTINCT "b"."user_id") >= 2) OR ("count"(DISTINCT "p"."id") >= 1))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."trending_content_24h" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."trending_content_24h" IS '24-hour trending content materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."trending_content_24h"."trending_score" IS 'Weighted score: (bookmarks × 5) + (posts × 10) + (votes × 2) + recency_bonus(0-20). Higher = more trending.';



COMMENT ON COLUMN "public"."trending_content_24h"."latest_activity_at" IS 'Most recent activity timestamp (bookmark, post, or vote). Used for recency bonus calculation.';



CREATE MATERIALIZED VIEW "public"."user_activity_summary" AS
 SELECT "u"."id" AS "user_id",
    COALESCE("p"."total_posts", (0)::bigint) AS "total_posts",
    COALESCE("c"."total_comments", (0)::bigint) AS "total_comments",
    COALESCE("v"."total_votes", (0)::bigint) AS "total_votes",
    COALESCE("s"."total_submissions", (0)::bigint) AS "total_submissions",
    COALESCE("s"."merged_submissions", (0)::bigint) AS "merged_submissions",
    (((COALESCE("p"."total_posts", (0)::bigint) + COALESCE("c"."total_comments", (0)::bigint)) + COALESCE("v"."total_votes", (0)::bigint)) + COALESCE("s"."total_submissions", (0)::bigint)) AS "total_activity",
    "now"() AS "last_refreshed_at"
   FROM (((("public"."users" "u"
     LEFT JOIN ( SELECT "posts"."user_id",
            "count"(*) AS "total_posts"
           FROM "public"."posts"
          GROUP BY "posts"."user_id") "p" ON (("u"."id" = "p"."user_id")))
     LEFT JOIN ( SELECT "comments"."user_id",
            "count"(*) AS "total_comments"
           FROM "public"."comments"
          GROUP BY "comments"."user_id") "c" ON (("u"."id" = "c"."user_id")))
     LEFT JOIN ( SELECT "votes"."user_id",
            "count"(*) AS "total_votes"
           FROM "public"."votes"
          GROUP BY "votes"."user_id") "v" ON (("u"."id" = "v"."user_id")))
     LEFT JOIN ( SELECT "submissions"."user_id",
            "count"(*) AS "total_submissions",
            "count"(*) FILTER (WHERE ("submissions"."status" = 'merged'::"text")) AS "merged_submissions"
           FROM "public"."submissions"
          GROUP BY "submissions"."user_id") "s" ON (("u"."id" = "s"."user_id")))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_activity_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_activity_summary" IS 'User activity summary materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."user_activity_summary"."user_id" IS 'User ID (foreign key to users.id)';



COMMENT ON COLUMN "public"."user_activity_summary"."total_posts" IS 'Total number of posts created by user';



COMMENT ON COLUMN "public"."user_activity_summary"."total_comments" IS 'Total number of comments created by user';



COMMENT ON COLUMN "public"."user_activity_summary"."total_votes" IS 'Total number of votes cast by user (upvotes + downvotes)';



COMMENT ON COLUMN "public"."user_activity_summary"."total_submissions" IS 'Total number of content submissions by user (all statuses)';



COMMENT ON COLUMN "public"."user_activity_summary"."merged_submissions" IS 'Number of submissions approved and merged into production';



COMMENT ON COLUMN "public"."user_activity_summary"."total_activity" IS 'Sum of all activity types (posts + comments + votes + submissions)';



COMMENT ON COLUMN "public"."user_activity_summary"."last_refreshed_at" IS 'Timestamp of last materialized view refresh (updated daily at 2 AM UTC)';



CREATE MATERIALIZED VIEW "public"."user_affinity_scores" AS
 WITH "ranked_affinities" AS (
         SELECT "user_affinities"."user_id",
            "user_affinities"."content_type",
            "user_affinities"."content_slug",
            "user_affinities"."affinity_score",
            "user_affinities"."calculated_at",
            "row_number"() OVER (PARTITION BY "user_affinities"."user_id", "user_affinities"."content_type" ORDER BY "user_affinities"."affinity_score" DESC) AS "rank"
           FROM "public"."user_affinities"
        )
 SELECT "user_id",
    "content_type",
    "count"(*) AS "total_affinities",
    "round"("avg"("affinity_score"), 2) AS "avg_affinity_score",
    "round"("max"("affinity_score"), 2) AS "max_affinity_score",
    ARRAY( SELECT "ranked_affinities"."content_slug"
           FROM "ranked_affinities"
          WHERE (("ranked_affinities"."user_id" = "ra"."user_id") AND ("ranked_affinities"."content_type" = "ra"."content_type") AND ("ranked_affinities"."rank" <= 5))
          ORDER BY "ranked_affinities"."rank") AS "top_content_slugs",
    ARRAY( SELECT "ranked_affinities"."affinity_score"
           FROM "ranked_affinities"
          WHERE (("ranked_affinities"."user_id" = "ra"."user_id") AND ("ranked_affinities"."content_type" = "ra"."content_type") AND ("ranked_affinities"."rank" <= 5))
          ORDER BY "ranked_affinities"."rank") AS "top_affinity_scores",
    "max"("calculated_at") AS "last_calculated_at",
    "now"() AS "last_refreshed"
   FROM "ranked_affinities" "ra"
  GROUP BY "user_id", "content_type"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_affinity_scores" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_affinity_scores" IS 'User affinity scores materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."user_affinity_scores"."avg_affinity_score" IS 'Average affinity score for this content type. Range: 0-100. Higher = stronger interest.';



COMMENT ON COLUMN "public"."user_affinity_scores"."top_content_slugs" IS 'Array of top 5 content slugs by affinity score (ordered DESC). Parallels top_affinity_scores array.';



CREATE MATERIALIZED VIEW "public"."user_badge_stats" AS
 SELECT "u"."id" AS "user_id",
    COALESCE("u"."reputation_score", 0) AS "reputation",
    COALESCE("p"."post_count", (0)::bigint) AS "posts",
    COALESCE("c"."comment_count", (0)::bigint) AS "comments",
    COALESCE("v"."votes_received", (0)::bigint) AS "votes_received",
    COALESCE("f"."follower_count", (0)::bigint) AS "followers",
    0 AS "submissions",
    0 AS "reviews",
    0 AS "bookmarks_received",
    "now"() AS "last_updated"
   FROM (((("public"."users" "u"
     LEFT JOIN ( SELECT "posts"."user_id",
            "count"(*) AS "post_count"
           FROM "public"."posts"
          GROUP BY "posts"."user_id") "p" ON (("p"."user_id" = "u"."id")))
     LEFT JOIN ( SELECT "comments"."user_id",
            "count"(*) AS "comment_count"
           FROM "public"."comments"
          GROUP BY "comments"."user_id") "c" ON (("c"."user_id" = "u"."id")))
     LEFT JOIN ( SELECT "posts"."user_id",
            "sum"("posts"."vote_count") AS "votes_received"
           FROM "public"."posts"
          GROUP BY "posts"."user_id") "v" ON (("v"."user_id" = "u"."id")))
     LEFT JOIN ( SELECT "followers"."following_id" AS "user_id",
            "count"(*) AS "follower_count"
           FROM "public"."followers"
          GROUP BY "followers"."following_id") "f" ON (("f"."user_id" = "u"."id")))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_badge_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_badge_stats" IS 'User badge statistics materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



COMMENT ON COLUMN "public"."user_badge_stats"."reputation" IS 'Total reputation score from public.users.reputation_score (updated by calculate_user_reputation function)';



COMMENT ON COLUMN "public"."user_badge_stats"."posts" IS 'Total count of posts by this user';



COMMENT ON COLUMN "public"."user_badge_stats"."comments" IS 'Total count of comments by this user';



COMMENT ON COLUMN "public"."user_badge_stats"."votes_received" IS 'Total vote_count sum from all user posts';



COMMENT ON COLUMN "public"."user_badge_stats"."followers" IS 'Total count of followers (users following this user)';



COMMENT ON COLUMN "public"."user_badge_stats"."last_updated" IS 'Timestamp of last materialized view refresh';



CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb",
    "featured" boolean DEFAULT false
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "plan" "text" DEFAULT 'standard'::"text" NOT NULL,
    "active" boolean DEFAULT false,
    "featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "download_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_mcps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "logo" "text",
    "link" "text" NOT NULL,
    "mcp_link" "text",
    "plan" "text" DEFAULT 'standard'::"text" NOT NULL,
    "active" boolean DEFAULT false,
    "order" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_mcps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_similarities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_a_id" "uuid" NOT NULL,
    "user_b_id" "uuid" NOT NULL,
    "similarity_score" numeric(5,4) NOT NULL,
    "common_items" integer DEFAULT 0,
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_similarities_check" CHECK (("user_a_id" < "user_b_id")),
    CONSTRAINT "user_similarities_similarity_score_check" CHECK ((("similarity_score" >= (0)::numeric) AND ("similarity_score" <= (1)::numeric)))
);


ALTER TABLE "public"."user_similarities" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."user_stats" AS
 SELECT "u"."id" AS "user_id",
    "u"."reputation_score",
    COALESCE("p"."total_posts", (0)::bigint) AS "total_posts",
    COALESCE("p"."total_upvotes_received", (0)::bigint) AS "total_upvotes_received",
    COALESCE("b"."total_bookmarks", (0)::bigint) AS "total_bookmarks",
    COALESCE("c"."total_collections", (0)::bigint) AS "total_collections",
    COALESCE("c"."public_collections", (0)::bigint) AS "public_collections",
    COALESCE("r"."total_reviews", (0)::bigint) AS "total_reviews",
    COALESCE("r"."avg_rating_given", 0.0) AS "avg_rating_given",
    COALESCE("s"."total_submissions", (0)::bigint) AS "total_submissions",
    COALESCE("s"."approved_submissions", (0)::bigint) AS "approved_submissions",
    COALESCE("bd"."total_badges", (0)::bigint) AS "total_badges",
    COALESCE("bd"."featured_badges", (0)::bigint) AS "featured_badges",
    COALESCE("v"."total_votes_given", (0)::bigint) AS "total_votes_given",
    COALESCE("cm"."total_comments", (0)::bigint) AS "total_comments",
    "u"."created_at",
    (EXTRACT(epoch FROM ("now"() - "u"."created_at")) / (86400)::numeric) AS "account_age_days",
    "now"() AS "refreshed_at"
   FROM (((((((("public"."users" "u"
     LEFT JOIN ( SELECT "posts"."user_id",
            "count"(*) AS "total_posts",
            COALESCE("sum"("posts"."vote_count"), (0)::bigint) AS "total_upvotes_received"
           FROM "public"."posts"
          GROUP BY "posts"."user_id") "p" ON (("u"."id" = "p"."user_id")))
     LEFT JOIN ( SELECT "bookmarks"."user_id",
            "count"(*) AS "total_bookmarks"
           FROM "public"."bookmarks"
          GROUP BY "bookmarks"."user_id") "b" ON (("u"."id" = "b"."user_id")))
     LEFT JOIN ( SELECT "user_collections"."user_id",
            "count"(*) AS "total_collections",
            "count"(*) FILTER (WHERE ("user_collections"."is_public" = true)) AS "public_collections"
           FROM "public"."user_collections"
          GROUP BY "user_collections"."user_id") "c" ON (("u"."id" = "c"."user_id")))
     LEFT JOIN ( SELECT "review_ratings"."user_id",
            "count"(*) AS "total_reviews",
            ("avg"("review_ratings"."rating"))::numeric(3,1) AS "avg_rating_given"
           FROM "public"."review_ratings"
          GROUP BY "review_ratings"."user_id") "r" ON (("u"."id" = "r"."user_id")))
     LEFT JOIN ( SELECT "submissions"."user_id",
            "count"(*) AS "total_submissions",
            "count"(*) FILTER (WHERE ("submissions"."status" = 'approved'::"text")) AS "approved_submissions"
           FROM "public"."submissions"
          GROUP BY "submissions"."user_id") "s" ON (("u"."id" = "s"."user_id")))
     LEFT JOIN ( SELECT "user_badges"."user_id",
            "count"(*) AS "total_badges",
            "count"(*) FILTER (WHERE ("user_badges"."featured" = true)) AS "featured_badges"
           FROM "public"."user_badges"
          GROUP BY "user_badges"."user_id") "bd" ON (("u"."id" = "bd"."user_id")))
     LEFT JOIN ( SELECT "votes"."user_id",
            "count"(*) AS "total_votes_given"
           FROM "public"."votes"
          GROUP BY "votes"."user_id") "v" ON (("u"."id" = "v"."user_id")))
     LEFT JOIN ( SELECT "comments"."user_id",
            "count"(*) AS "total_comments"
           FROM "public"."comments"
          GROUP BY "comments"."user_id") "cm" ON (("u"."id" = "cm"."user_id")))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_stats" IS 'User statistics materialized view. Publicly accessible via API for performance. Refreshed periodically via pg_cron.';



CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "error" "text",
    "retry_count" integer DEFAULT 0,
    "next_retry_at" timestamp with time zone,
    "received_at" timestamp with time zone DEFAULT "now"(),
    "svix_id" "text",
    CONSTRAINT "valid_processed_at" CHECK (((("processed" = true) AND ("processed_at" IS NOT NULL)) OR (("processed" = false) AND ("processed_at" IS NULL)))),
    CONSTRAINT "webhook_events_data_check" CHECK (("jsonb_typeof"("data") = 'object'::"text")),
    CONSTRAINT "webhook_events_retry_count_check" CHECK (("retry_count" >= 0)),
    CONSTRAINT "webhook_events_type_check" CHECK (("type" = ANY (ARRAY['email.sent'::"text", 'email.delivered'::"text", 'email.delivery_delayed'::"text", 'email.complained'::"text", 'email.bounced'::"text", 'email.opened'::"text", 'email.clicked'::"text"])))
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."webhook_events" IS 'Stores Resend webhook events with nested data structure matching Resend payload';



COMMENT ON COLUMN "public"."webhook_events"."type" IS 'Event type from Resend (email.sent, email.delivered, etc)';



COMMENT ON COLUMN "public"."webhook_events"."created_at" IS 'Event timestamp from Resend (when event occurred)';



COMMENT ON COLUMN "public"."webhook_events"."data" IS 'Nested event data object from Resend payload (email_id, to, from, subject, etc)';



COMMENT ON COLUMN "public"."webhook_events"."svix_id" IS 'Svix webhook ID for idempotency checks (prevents duplicate processing)';



ALTER TABLE ONLY "public"."affinity_config"
    ADD CONSTRAINT "affinity_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."analytics_event_categories"
    ADD CONSTRAINT "analytics_event_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."analytics_event_categories"
    ADD CONSTRAINT "analytics_event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_event_name_key" UNIQUE ("event_name");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_pkey" PRIMARY KEY ("user_id", "announcement_id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_content_type_content_slug_key" UNIQUE ("user_id", "content_type", "content_slug");



ALTER TABLE ONLY "public"."category_configs"
    ADD CONSTRAINT "category_configs_content_loader_key" UNIQUE ("content_loader");



ALTER TABLE ONLY "public"."category_configs"
    ADD CONSTRAINT "category_configs_pkey" PRIMARY KEY ("category");



ALTER TABLE ONLY "public"."category_configs"
    ADD CONSTRAINT "category_configs_url_slug_key" UNIQUE ("url_slug");



ALTER TABLE ONLY "public"."changelog_changes"
    ADD CONSTRAINT "changelog_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelog_entries"
    ADD CONSTRAINT "changelog_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelog_entries"
    ADD CONSTRAINT "changelog_entries_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."changelog"
    ADD CONSTRAINT "changelog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelog"
    ADD CONSTRAINT "changelog_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_collection_id_content_type_content_slug_key" UNIQUE ("collection_id", "content_type", "content_slug");



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."content_generation_tracking"
    ADD CONSTRAINT "content_generation_tracking_category_slug_key" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_generation_tracking"
    ADD CONSTRAINT "content_generation_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_generator_configs"
    ADD CONSTRAINT "content_generator_configs_category_field_type_key" UNIQUE ("category", "field_type");



ALTER TABLE ONLY "public"."content_generator_configs"
    ADD CONSTRAINT "content_generator_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_category_slug_unique" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_seo_overrides"
    ADD CONSTRAINT "content_seo_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_seo_overrides"
    ADD CONSTRAINT "content_seo_overrides_unique" UNIQUE ("content_id", "category");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_content_a_type_content_a_slug_content__key" UNIQUE ("content_a_type", "content_a_slug", "content_b_type", "content_b_slug");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_submissions"
    ADD CONSTRAINT "content_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_blocklist"
    ADD CONSTRAINT "email_blocklist_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."email_sequence_schedule"
    ADD CONSTRAINT "email_sequence_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_sequence_schedule"
    ADD CONSTRAINT "email_sequence_schedule_unique_step" UNIQUE ("sequence_id", "email", "step");



COMMENT ON CONSTRAINT "email_sequence_schedule_unique_step" ON "public"."email_sequence_schedule" IS 'Prevent duplicate schedule records for same email+step.';



ALTER TABLE ONLY "public"."email_sequences"
    ADD CONSTRAINT "email_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_sequences"
    ADD CONSTRAINT "email_sequences_sequence_id_email_key" UNIQUE ("sequence_id", "email");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_content_type_content_slug_week_start_key" UNIQUE ("content_type", "content_slug", "week_start");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_field_configs"
    ADD CONSTRAINT "form_field_configs_form_type_field_name_key" UNIQUE ("form_type", "field_name");



ALTER TABLE ONLY "public"."form_field_configs"
    ADD CONSTRAINT "form_field_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_field_definitions"
    ADD CONSTRAINT "form_field_definitions_content_type_field_name_key" UNIQUE ("content_type", "field_name");



ALTER TABLE ONLY "public"."form_field_definitions"
    ADD CONSTRAINT "form_field_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_field_versions"
    ADD CONSTRAINT "form_field_versions_field_id_version_number_key" UNIQUE ("field_id", "version_number");



ALTER TABLE ONLY "public"."form_field_versions"
    ADD CONSTRAINT "form_field_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_select_options"
    ADD CONSTRAINT "form_select_options_field_id_option_value_key" UNIQUE ("field_id", "option_value");



ALTER TABLE ONLY "public"."form_select_options"
    ADD CONSTRAINT "form_select_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guides"
    ADD CONSTRAINT "guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guides"
    ADD CONSTRAINT "guides_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."hooks"
    ADD CONSTRAINT "hooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hooks"
    ADD CONSTRAINT "hooks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."mcp"
    ADD CONSTRAINT "mcp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mcp"
    ADD CONSTRAINT "mcp_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."metadata_templates"
    ADD CONSTRAINT "metadata_templates_pkey" PRIMARY KEY ("route_pattern");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_dismissals"
    ADD CONSTRAINT "notification_dismissals_pkey" PRIMARY KEY ("user_id", "notification_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_polar_transaction_id_key" UNIQUE ("polar_transaction_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_question_id_value_key" UNIQUE ("question_id", "value");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_question_id_key" UNIQUE ("question_id");



ALTER TABLE ONLY "public"."reputation_actions"
    ADD CONSTRAINT "reputation_actions_action_type_key" UNIQUE ("action_type");



ALTER TABLE ONLY "public"."reputation_actions"
    ADD CONSTRAINT "reputation_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reputation_tiers"
    ADD CONSTRAINT "reputation_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."reputation_tiers"
    ADD CONSTRAINT "reputation_tiers_order_key" UNIQUE ("order");



ALTER TABLE ONLY "public"."reputation_tiers"
    ADD CONSTRAINT "reputation_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_review_id_user_id_key" UNIQUE ("review_id", "user_id");



ALTER TABLE ONLY "public"."review_ratings"
    ADD CONSTRAINT "review_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_ratings"
    ADD CONSTRAINT "review_ratings_user_id_content_type_content_slug_key" UNIQUE ("user_id", "content_type", "content_slug");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."seo_config"
    ADD CONSTRAINT "seo_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."seo_enrichment_rules"
    ADD CONSTRAINT "seo_enrichment_rules_category_key" UNIQUE ("category");



ALTER TABLE ONLY "public"."seo_enrichment_rules"
    ADD CONSTRAINT "seo_enrichment_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sponsored_clicks"
    ADD CONSTRAINT "sponsored_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_content"
    ADD CONSTRAINT "sponsored_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_impressions"
    ADD CONSTRAINT "sponsored_impressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statuslines"
    ADD CONSTRAINT "statuslines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statuslines"
    ADD CONSTRAINT "statuslines_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."structured_data_config"
    ADD CONSTRAINT "structured_data_config_pkey" PRIMARY KEY ("category");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_content_type_content_slug_key" UNIQUE ("content_type", "content_slug");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_polar_subscription_id_key" UNIQUE ("polar_subscription_id");



ALTER TABLE ONLY "public"."tier_display_config"
    ADD CONSTRAINT "tier_display_config_pkey" PRIMARY KEY ("tier");



ALTER TABLE ONLY "public"."user_affinities"
    ADD CONSTRAINT "user_affinities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_affinities"
    ADD CONSTRAINT "user_affinities_user_id_content_type_content_slug_key" UNIQUE ("user_id", "content_type", "content_slug");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_user_id_slug_key" UNIQUE ("user_id", "slug");



ALTER TABLE ONLY "public"."user_content"
    ADD CONSTRAINT "user_content_content_type_slug_key" UNIQUE ("content_type", "slug");



ALTER TABLE ONLY "public"."user_content"
    ADD CONSTRAINT "user_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_mcps"
    ADD CONSTRAINT "user_mcps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_mcps"
    ADD CONSTRAINT "user_mcps_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_similarities"
    ADD CONSTRAINT "user_similarities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_similarities"
    ADD CONSTRAINT "user_similarities_user_a_id_user_b_id_key" UNIQUE ("user_a_id", "user_b_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_svix_id_key" UNIQUE ("svix_id");



CREATE INDEX "idx_agents_author" ON "public"."agents" USING "btree" ("author");



CREATE INDEX "idx_agents_content_fts" ON "public"."agents" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_agents_created_at" ON "public"."agents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_agents_date_added" ON "public"."agents" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_agents_fts" ON "public"."agents" USING "gin" ("fts_vector");



CREATE INDEX "idx_agents_homepage" ON "public"."agents" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_agents_slug" ON "public"."agents" USING "btree" ("slug");



CREATE INDEX "idx_agents_tags" ON "public"."agents" USING "gin" ("tags");



CREATE INDEX "idx_analytics_event_categories_order" ON "public"."analytics_event_categories" USING "btree" ("display_order") WHERE ("active" = true);



CREATE INDEX "idx_analytics_events_category" ON "public"."analytics_events" USING "btree" ("category") WHERE ("enabled" = true);



CREATE INDEX "idx_analytics_events_enabled" ON "public"."analytics_events" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_announcement_dismissals_user" ON "public"."announcement_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_announcements_active_dates" ON "public"."announcements" USING "btree" ("active", "start_date", "end_date", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_announcements_priority" ON "public"."announcements" USING "btree" ("priority" DESC, "start_date" DESC) WHERE ("active" = true);



CREATE INDEX "idx_badges_active" ON "public"."badges" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_badges_category" ON "public"."badges" USING "btree" ("category");



CREATE INDEX "idx_badges_rarity" ON "public"."badges" USING "btree" ("rarity");



CREATE INDEX "idx_bookmarks_content" ON "public"."bookmarks" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_bookmarks_content_slug" ON "public"."bookmarks" USING "btree" ("content_slug");



CREATE UNIQUE INDEX "idx_bookmarks_lookup" ON "public"."bookmarks" USING "btree" ("user_id", "content_type", "content_slug") INCLUDE ("id", "created_at");



CREATE INDEX "idx_bookmarks_user_id" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_bookmarks_user_recent" ON "public"."bookmarks" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_category_configs_show_on_homepage" ON "public"."category_configs" USING "btree" ("show_on_homepage") WHERE ("show_on_homepage" = true);



CREATE INDEX "idx_category_configs_url_slug" ON "public"."category_configs" USING "btree" ("url_slug");



CREATE INDEX "idx_changelog_changes_category" ON "public"."changelog_changes" USING "btree" ("category");



CREATE INDEX "idx_changelog_changes_entry_category" ON "public"."changelog_changes" USING "btree" ("changelog_entry_id", "category");



CREATE INDEX "idx_changelog_changes_entry_id" ON "public"."changelog_changes" USING "btree" ("changelog_entry_id");



CREATE INDEX "idx_changelog_content_fts" ON "public"."changelog" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "description")));



CREATE INDEX "idx_changelog_date_added" ON "public"."changelog" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_changelog_date_published" ON "public"."changelog" USING "btree" ("date_published" DESC NULLS LAST);



CREATE INDEX "idx_changelog_entries_changes" ON "public"."changelog_entries" USING "gin" ("changes");



CREATE INDEX "idx_changelog_entries_date" ON "public"."changelog_entries" USING "btree" ("release_date" DESC);



CREATE INDEX "idx_changelog_entries_featured" ON "public"."changelog_entries" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_changelog_entries_published" ON "public"."changelog_entries" USING "btree" ("published") WHERE ("published" = true);



CREATE INDEX "idx_changelog_entries_search" ON "public"."changelog_entries" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "content")));



CREATE INDEX "idx_changelog_entries_slug" ON "public"."changelog_entries" USING "btree" ("slug");



CREATE INDEX "idx_changelog_featured" ON "public"."changelog" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_changelog_git_tag" ON "public"."changelog" USING "btree" ("git_tag") WHERE ("git_tag" IS NOT NULL);



CREATE INDEX "idx_changelog_slug" ON "public"."changelog" USING "btree" ("slug");



CREATE INDEX "idx_changelog_tags" ON "public"."changelog" USING "gin" ("tags");



CREATE INDEX "idx_changelog_version" ON "public"."changelog" USING "btree" ("version") WHERE ("version" IS NOT NULL);



CREATE INDEX "idx_collection_items_collection_id" ON "public"."collection_items" USING "btree" ("collection_id");



CREATE INDEX "idx_collection_items_content" ON "public"."collection_items" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_collection_items_content_slug" ON "public"."collection_items" USING "btree" ("content_slug");



CREATE INDEX "idx_collection_items_order" ON "public"."collection_items" USING "btree" ("collection_id", "order");



CREATE INDEX "idx_collection_items_user_id" ON "public"."collection_items" USING "btree" ("user_id");



CREATE INDEX "idx_collections_author" ON "public"."collections" USING "btree" ("author");



CREATE INDEX "idx_collections_content_fts" ON "public"."collections" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_collections_created_at" ON "public"."collections" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_collections_date_added" ON "public"."collections" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_collections_fts" ON "public"."collections" USING "gin" ("fts_vector");



CREATE INDEX "idx_collections_homepage" ON "public"."collections" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_collections_items" ON "public"."collections" USING "gin" ("items");



CREATE INDEX "idx_collections_slug" ON "public"."collections" USING "btree" ("slug");



CREATE INDEX "idx_collections_tags" ON "public"."collections" USING "gin" ("tags");



CREATE INDEX "idx_collections_type" ON "public"."collections" USING "btree" ("collection_type") WHERE ("collection_type" IS NOT NULL);



CREATE INDEX "idx_commands_author" ON "public"."commands" USING "btree" ("author");



CREATE INDEX "idx_commands_content_fts" ON "public"."commands" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_commands_created_at" ON "public"."commands" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_commands_date_added" ON "public"."commands" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_commands_fts" ON "public"."commands" USING "gin" ("fts_vector");



CREATE INDEX "idx_commands_homepage" ON "public"."commands" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_commands_slug" ON "public"."commands" USING "btree" ("slug");



CREATE INDEX "idx_commands_tags" ON "public"."commands" USING "gin" ("tags");



CREATE INDEX "idx_comments_content_fts" ON "public"."comments" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("content", ''::"text")));



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user_created" ON "public"."comments" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_comments_user_created" IS 'Optimizes get_user_activity_timeline query for comments';



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_companies_featured" ON "public"."companies" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_companies_name" ON "public"."companies" USING "btree" ("name");



CREATE INDEX "idx_companies_name_trgm" ON "public"."companies" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_companies_owner_id" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_companies_owner_id_created_at" ON "public"."companies" USING "btree" ("owner_id", "created_at" DESC);



CREATE INDEX "idx_companies_search_vector" ON "public"."companies" USING "gin" ("search_vector");



CREATE INDEX "idx_companies_slug" ON "public"."companies" USING "btree" ("slug");



CREATE INDEX "idx_company_job_stats_active_jobs" ON "public"."company_job_stats" USING "btree" ("active_jobs" DESC) WHERE ("active_jobs" > 0);



CREATE UNIQUE INDEX "idx_company_job_stats_company_id" ON "public"."company_job_stats" USING "btree" ("company_id");



CREATE UNIQUE INDEX "idx_company_job_stats_company_slug" ON "public"."company_job_stats" USING "btree" ("company_slug");



CREATE INDEX "idx_company_job_stats_total_views" ON "public"."company_job_stats" USING "btree" ("total_views" DESC) WHERE ("total_views" > 0);



CREATE INDEX "idx_content_generation_category" ON "public"."content_generation_tracking" USING "btree" ("category");



CREATE INDEX "idx_content_generation_date" ON "public"."content_generation_tracking" USING "btree" ("generated_at" DESC);



CREATE INDEX "idx_content_generation_discovery" ON "public"."content_generation_tracking" USING "gin" ("discovery_metadata");



CREATE INDEX "idx_content_generation_generated_by" ON "public"."content_generation_tracking" USING "btree" ("generated_by");



CREATE INDEX "idx_content_generation_validation" ON "public"."content_generation_tracking" USING "btree" ("validation_passed");



CREATE INDEX "idx_content_items_category" ON "public"."content_items" USING "btree" ("category");



CREATE INDEX "idx_content_items_category_slug" ON "public"."content_items" USING "btree" ("category", "slug");



CREATE INDEX "idx_content_items_data_gin" ON "public"."content_items" USING "gin" ("data");



CREATE INDEX "idx_content_items_git_hash" ON "public"."content_items" USING "btree" ("git_hash");



CREATE INDEX "idx_content_items_search_vector" ON "public"."content_items" USING "gin" ("search_vector");



CREATE INDEX "idx_content_items_slug" ON "public"."content_items" USING "btree" ("slug");



CREATE INDEX "idx_content_items_synced_at" ON "public"."content_items" USING "btree" ("synced_at" DESC);



CREATE INDEX "idx_content_items_tags_gin" ON "public"."content_items" USING "gin" ((("data" -> 'tags'::"text")));



COMMENT ON INDEX "public"."idx_content_items_tags_gin" IS 'GIN index for fast tag array searches in related content queries.';



CREATE UNIQUE INDEX "idx_content_popularity_pk" ON "public"."content_popularity" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_content_popularity_score" ON "public"."content_popularity" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_content_popularity_type" ON "public"."content_popularity" USING "btree" ("content_type");



CREATE INDEX "idx_content_seo_overrides_category" ON "public"."content_seo_overrides" USING "btree" ("category");



CREATE INDEX "idx_content_seo_overrides_content_category" ON "public"."content_seo_overrides" USING "btree" ("content_id", "category");



CREATE INDEX "idx_content_similarities_content_a" ON "public"."content_similarities" USING "btree" ("content_a_type", "content_a_slug", "similarity_score" DESC);



CREATE INDEX "idx_content_similarities_content_b" ON "public"."content_similarities" USING "btree" ("content_b_type", "content_b_slug");



CREATE INDEX "idx_content_similarities_score" ON "public"."content_similarities" USING "btree" ("similarity_score" DESC) WHERE ("similarity_score" >= 0.3);



CREATE INDEX "idx_content_submissions_created" ON "public"."content_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_submissions_search" ON "public"."content_submissions" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("name" || ' '::"text") || "description")));



CREATE INDEX "idx_content_submissions_spam" ON "public"."content_submissions" USING "btree" ("spam_score") WHERE ("spam_score" > 0.5);



CREATE INDEX "idx_content_submissions_status" ON "public"."content_submissions" USING "btree" ("status");



CREATE INDEX "idx_content_submissions_submitter" ON "public"."content_submissions" USING "btree" ("submitter_id");



CREATE INDEX "idx_content_submissions_type" ON "public"."content_submissions" USING "btree" ("submission_type");



CREATE INDEX "idx_email_sequence_schedule_due" ON "public"."email_sequence_schedule" USING "btree" ("due_at") WHERE ("processed" = false);



CREATE INDEX "idx_email_sequence_schedule_due_processing" ON "public"."email_sequence_schedule" USING "btree" ("sequence_id", "processed", "due_at") WHERE ("processed" = false);



COMMENT ON INDEX "public"."idx_email_sequence_schedule_due_processing" IS 'Optimize get_due_sequence_emails() query.';



CREATE INDEX "idx_email_sequence_schedule_email" ON "public"."email_sequence_schedule" USING "btree" ("email");



CREATE INDEX "idx_email_sequences_email" ON "public"."email_sequences" USING "btree" ("email");



CREATE INDEX "idx_email_sequences_status" ON "public"."email_sequences" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_featured_configs_content" ON "public"."featured_configs" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_featured_configs_rank" ON "public"."featured_configs" USING "btree" ("rank", "final_score" DESC);



CREATE INDEX "idx_featured_configs_week" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "week_end" DESC);



CREATE INDEX "idx_featured_configs_week_rank" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "rank");



CREATE INDEX "idx_field_versions_changed_at" ON "public"."form_field_versions" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_field_versions_field_id" ON "public"."form_field_versions" USING "btree" ("field_id");



CREATE INDEX "idx_followers_follower_following" ON "public"."followers" USING "btree" ("follower_id", "following_id");



CREATE INDEX "idx_followers_follower_id" ON "public"."followers" USING "btree" ("follower_id");



CREATE INDEX "idx_followers_following_id" ON "public"."followers" USING "btree" ("following_id");



CREATE INDEX "idx_form_field_configs_display_order" ON "public"."form_field_configs" USING "btree" ("form_type", "display_order");



CREATE INDEX "idx_form_field_configs_enabled" ON "public"."form_field_configs" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_form_field_configs_form_type" ON "public"."form_field_configs" USING "btree" ("form_type");



CREATE INDEX "idx_form_fields_active" ON "public"."form_field_definitions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_form_fields_content_type" ON "public"."form_field_definitions" USING "btree" ("content_type");



CREATE INDEX "idx_form_fields_order" ON "public"."form_field_definitions" USING "btree" ("field_order");



CREATE INDEX "idx_form_fields_scope" ON "public"."form_field_definitions" USING "btree" ("field_scope");



CREATE INDEX "idx_guides_author" ON "public"."guides" USING "btree" ("author");



CREATE INDEX "idx_guides_category" ON "public"."guides" USING "btree" ("category");



CREATE INDEX "idx_guides_content_fts" ON "public"."guides" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "description")));



CREATE INDEX "idx_guides_created_at" ON "public"."guides" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_guides_date_published" ON "public"."guides" USING "btree" ("date_published" DESC NULLS LAST);



CREATE INDEX "idx_guides_date_updated" ON "public"."guides" USING "btree" ("date_updated" DESC NULLS LAST);



CREATE INDEX "idx_guides_difficulty" ON "public"."guides" USING "btree" ("difficulty") WHERE ("difficulty" IS NOT NULL);



CREATE INDEX "idx_guides_featured" ON "public"."guides" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_guides_fts" ON "public"."guides" USING "gin" ("fts_vector");



CREATE INDEX "idx_guides_homepage" ON "public"."guides" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_guides_keywords" ON "public"."guides" USING "gin" ("keywords");



CREATE INDEX "idx_guides_slug" ON "public"."guides" USING "btree" ("slug");



CREATE INDEX "idx_guides_subcategory" ON "public"."guides" USING "btree" ("subcategory");



CREATE INDEX "idx_guides_tags" ON "public"."guides" USING "gin" ("tags");



CREATE INDEX "idx_hooks_author" ON "public"."hooks" USING "btree" ("author");



CREATE INDEX "idx_hooks_content_fts" ON "public"."hooks" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_hooks_created_at" ON "public"."hooks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_hooks_date_added" ON "public"."hooks" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_hooks_event_types" ON "public"."hooks" USING "gin" ("event_types");



CREATE INDEX "idx_hooks_fts" ON "public"."hooks" USING "gin" ("fts_vector");



CREATE INDEX "idx_hooks_homepage" ON "public"."hooks" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_hooks_slug" ON "public"."hooks" USING "btree" ("slug");



CREATE INDEX "idx_hooks_tags" ON "public"."hooks" USING "gin" ("tags");



CREATE INDEX "idx_jobs_active" ON "public"."jobs" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_jobs_active_posted_at" ON "public"."jobs" USING "btree" ("active", "posted_at" DESC) WHERE (("active" = true) AND ("status" = 'active'::"text"));



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_expires_at" ON "public"."jobs" USING "btree" ("expires_at");



CREATE INDEX "idx_jobs_payment_status" ON "public"."jobs" USING "btree" ("payment_status", "created_at" DESC);



CREATE INDEX "idx_jobs_pending_review" ON "public"."jobs" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'pending_review'::"text");



CREATE INDEX "idx_jobs_plan" ON "public"."jobs" USING "btree" ("plan");



CREATE INDEX "idx_jobs_search_vector" ON "public"."jobs" USING "gin" ("search_vector");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_title_trgm" ON "public"."jobs" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_jobs_user_id" ON "public"."jobs" USING "btree" ("user_id");



CREATE INDEX "idx_jobs_user_id_status_created_at" ON "public"."jobs" USING "btree" ("user_id", "status", "created_at" DESC) WHERE ("status" <> 'deleted'::"text");



CREATE INDEX "idx_mcp_author" ON "public"."mcp" USING "btree" ("author");



CREATE INDEX "idx_mcp_content_fts" ON "public"."mcp" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_mcp_created_at" ON "public"."mcp" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mcp_date_added" ON "public"."mcp" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_mcp_fts" ON "public"."mcp" USING "gin" ("fts_vector");



CREATE INDEX "idx_mcp_homepage" ON "public"."mcp" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_mcp_slug" ON "public"."mcp" USING "btree" ("slug");



CREATE INDEX "idx_mcp_tags" ON "public"."mcp" USING "gin" ("tags");



CREATE UNIQUE INDEX "idx_mv_analytics_summary_content" ON "public"."mv_analytics_summary" USING "btree" ("category", "slug");



CREATE INDEX "idx_mv_analytics_summary_copies" ON "public"."mv_analytics_summary" USING "btree" ("copy_count" DESC);



CREATE INDEX "idx_mv_analytics_summary_views" ON "public"."mv_analytics_summary" USING "btree" ("view_count" DESC);



CREATE INDEX "idx_mv_content_similarity_score" ON "public"."mv_content_similarity" USING "btree" ("similarity_score" DESC);



CREATE INDEX "idx_mv_content_similarity_source" ON "public"."mv_content_similarity" USING "btree" ("source_category", "source_slug", "similarity_score" DESC);



CREATE INDEX "idx_mv_content_similarity_target" ON "public"."mv_content_similarity" USING "btree" ("target_category", "target_slug");



CREATE INDEX "idx_mv_content_stats_category" ON "public"."mv_content_stats" USING "btree" ("category");



CREATE INDEX "idx_mv_content_stats_popularity" ON "public"."mv_content_stats" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_mv_content_stats_slug" ON "public"."mv_content_stats" USING "btree" ("category", "slug");



CREATE INDEX "idx_mv_content_stats_tags" ON "public"."mv_content_stats" USING "gin" ("tags");



CREATE INDEX "idx_mv_content_stats_trending" ON "public"."mv_content_stats" USING "btree" ("trending_score" DESC);



CREATE INDEX "idx_mv_content_tag_index_category" ON "public"."mv_content_tag_index" USING "btree" ("category");



CREATE INDEX "idx_mv_content_tag_index_tags_gin" ON "public"."mv_content_tag_index" USING "gin" ("tags");



CREATE INDEX "idx_mv_for_you_feed_score" ON "public"."mv_for_you_feed" USING "btree" ("recommendation_score" DESC);



CREATE INDEX "idx_mv_for_you_feed_user" ON "public"."mv_for_you_feed" USING "btree" ("user_id", "rank_for_user");



CREATE INDEX "idx_mv_for_you_feed_user_content" ON "public"."mv_for_you_feed" USING "btree" ("user_id", "content_type", "content_slug");



CREATE INDEX "idx_mv_recommendation_scores_category" ON "public"."mv_recommendation_scores" USING "btree" ("category");



CREATE INDEX "idx_mv_recommendation_scores_experience" ON "public"."mv_recommendation_scores" USING "btree" ("suggested_experience_level");



CREATE INDEX "idx_mv_recommendation_scores_focus_areas" ON "public"."mv_recommendation_scores" USING "gin" ("focus_area_tags");



CREATE INDEX "idx_mv_recommendation_scores_integrations" ON "public"."mv_recommendation_scores" USING "gin" ("integration_tags");



CREATE INDEX "idx_mv_recommendation_scores_use_cases" ON "public"."mv_recommendation_scores" USING "gin" ("use_case_tags");



CREATE UNIQUE INDEX "idx_mv_search_facets_category" ON "public"."mv_search_facets" USING "btree" ("category");



CREATE INDEX "idx_mv_trending_content_category" ON "public"."mv_trending_content" USING "btree" ("category", "rank_in_category");



CREATE INDEX "idx_mv_trending_content_rank" ON "public"."mv_trending_content" USING "btree" ("rank_overall");



CREATE INDEX "idx_mv_trending_content_views" ON "public"."mv_trending_content" USING "btree" ("view_count" DESC);



CREATE INDEX "idx_mv_weekly_new_content_rank" ON "public"."mv_weekly_new_content" USING "btree" ("week_start", "week_rank");



CREATE INDEX "idx_mv_weekly_new_content_week" ON "public"."mv_weekly_new_content" USING "btree" ("week_start" DESC);



CREATE INDEX "idx_newsletter_confirmation_token" ON "public"."newsletter_subscriptions" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE INDEX "idx_newsletter_source" ON "public"."newsletter_subscriptions" USING "btree" ("source") WHERE ("source" IS NOT NULL);



CREATE INDEX "idx_newsletter_status" ON "public"."newsletter_subscriptions" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_newsletter_subscribed_at" ON "public"."newsletter_subscriptions" USING "btree" ("subscribed_at" DESC);



CREATE INDEX "idx_notification_dismissals_user" ON "public"."notification_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_active_expires" ON "public"."notifications" USING "btree" ("active", "expires_at", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_notifications_type_priority" ON "public"."notifications" USING "btree" ("type", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_payments_polar_transaction_id" ON "public"."payments" USING "btree" ("polar_transaction_id");



CREATE INDEX "idx_payments_product" ON "public"."payments" USING "btree" ("product_type", "product_id");



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_user_created" ON "public"."posts" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_posts_user_created" IS 'Optimizes get_user_activity_timeline query for posts';



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_posts_user_vote" ON "public"."posts" USING "btree" ("user_id", "vote_count" DESC, "created_at" DESC);



CREATE INDEX "idx_posts_vote_count" ON "public"."posts" USING "btree" ("vote_count" DESC);



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_profiles_public" ON "public"."profiles" USING "btree" ("profile_public") WHERE ("profile_public" = true);



CREATE INDEX "idx_profiles_reputation" ON "public"."profiles" USING "btree" ("reputation_score" DESC);



CREATE INDEX "idx_profiles_search" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("display_name", ''::"text") || ' '::"text") || COALESCE("bio", ''::"text")))) WHERE ("profile_public" = true);



CREATE INDEX "idx_quiz_options_order" ON "public"."quiz_options" USING "btree" ("display_order");



CREATE INDEX "idx_quiz_options_question" ON "public"."quiz_options" USING "btree" ("question_id");



CREATE INDEX "idx_quiz_questions_order" ON "public"."quiz_questions" USING "btree" ("display_order");



CREATE INDEX "idx_recommended_content_score" ON "public"."recommended_content" USING "btree" ("recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user" ON "public"."recommended_content" USING "btree" ("user_id", "recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user_type" ON "public"."recommended_content" USING "btree" ("user_id", "content_type", "recommendation_score" DESC);



CREATE INDEX "idx_reputation_actions_active" ON "public"."reputation_actions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_order" ON "public"."reputation_tiers" USING "btree" ("order") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_score_range" ON "public"."reputation_tiers" USING "btree" ("min_score", "max_score") WHERE ("active" = true);



CREATE INDEX "idx_review_helpful_votes_review" ON "public"."review_helpful_votes" USING "btree" ("review_id");



CREATE INDEX "idx_review_helpful_votes_user" ON "public"."review_helpful_votes" USING "btree" ("user_id");



CREATE INDEX "idx_review_ratings_content" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_helpful" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "helpful_count" DESC, "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_rating" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "rating" DESC, "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_slug_rating" ON "public"."review_ratings" USING "btree" ("content_slug", "rating");



CREATE INDEX "idx_review_ratings_helpful" ON "public"."review_ratings" USING "btree" ("helpful_count" DESC) WHERE ("helpful_count" > 0);



CREATE INDEX "idx_review_ratings_rating" ON "public"."review_ratings" USING "btree" ("rating", "created_at" DESC);



CREATE INDEX "idx_review_ratings_user" ON "public"."review_ratings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_rules_author" ON "public"."rules" USING "btree" ("author");



CREATE INDEX "idx_rules_content_fts" ON "public"."rules" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_rules_created_at" ON "public"."rules" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_rules_date_added" ON "public"."rules" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_rules_fts" ON "public"."rules" USING "gin" ("fts_vector");



CREATE INDEX "idx_rules_homepage" ON "public"."rules" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_rules_slug" ON "public"."rules" USING "btree" ("slug");



CREATE INDEX "idx_rules_tags" ON "public"."rules" USING "gin" ("tags");



CREATE INDEX "idx_select_options_active" ON "public"."form_select_options" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_select_options_field_id" ON "public"."form_select_options" USING "btree" ("field_id");



CREATE INDEX "idx_select_options_order" ON "public"."form_select_options" USING "btree" ("option_order");



CREATE INDEX "idx_seo_enrichment_rules_category" ON "public"."seo_enrichment_rules" USING "btree" ("category");



CREATE INDEX "idx_seo_enrichment_rules_enabled" ON "public"."seo_enrichment_rules" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_seo_enrichment_rules_focus_areas" ON "public"."seo_enrichment_rules" USING "gin" ("focus_areas");



CREATE INDEX "idx_skills_author" ON "public"."skills" USING "btree" ("author");



CREATE INDEX "idx_skills_content_fts" ON "public"."skills" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_skills_created_at" ON "public"."skills" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_skills_date_added" ON "public"."skills" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_skills_dependencies" ON "public"."skills" USING "gin" ("dependencies");



CREATE INDEX "idx_skills_difficulty" ON "public"."skills" USING "btree" ("difficulty") WHERE ("difficulty" IS NOT NULL);



CREATE INDEX "idx_skills_fts" ON "public"."skills" USING "gin" ("fts_vector");



CREATE INDEX "idx_skills_homepage" ON "public"."skills" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_skills_slug" ON "public"."skills" USING "btree" ("slug");



CREATE INDEX "idx_skills_tags" ON "public"."skills" USING "gin" ("tags");



CREATE INDEX "idx_sponsored_clicks_sponsored_id" ON "public"."sponsored_clicks" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_clicks_user_id" ON "public"."sponsored_clicks" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_content_active" ON "public"."sponsored_content" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_active_dates_tier" ON "public"."sponsored_content" USING "btree" ("active", "start_date", "end_date", "tier") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_dates" ON "public"."sponsored_content" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_sponsored_content_lookup" ON "public"."sponsored_content" USING "btree" ("content_id", "content_type", "active") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_user_id" ON "public"."sponsored_content" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_impressions_sponsored_id" ON "public"."sponsored_impressions" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_impressions_user_id" ON "public"."sponsored_impressions" USING "btree" ("user_id");



CREATE INDEX "idx_statuslines_author" ON "public"."statuslines" USING "btree" ("author");



CREATE INDEX "idx_statuslines_content_fts" ON "public"."statuslines" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_statuslines_created_at" ON "public"."statuslines" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_statuslines_date_added" ON "public"."statuslines" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_statuslines_fts" ON "public"."statuslines" USING "gin" ("fts_vector");



CREATE INDEX "idx_statuslines_homepage" ON "public"."statuslines" USING "btree" ("created_at" DESC, "date_added" DESC);



CREATE INDEX "idx_statuslines_slug" ON "public"."statuslines" USING "btree" ("slug");



CREATE INDEX "idx_statuslines_tags" ON "public"."statuslines" USING "gin" ("tags");



CREATE INDEX "idx_structured_data_config_active" ON "public"."structured_data_config" USING "btree" ("active") WHERE ("active" = true);



CREATE UNIQUE INDEX "idx_submission_stats_summary_singleton" ON "public"."submission_stats_summary" USING "btree" ((1));



CREATE INDEX "idx_submissions_content_type" ON "public"."submissions" USING "btree" ("content_type");



CREATE INDEX "idx_submissions_created_at" ON "public"."submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_submissions_pr_number" ON "public"."submissions" USING "btree" ("pr_number") WHERE ("pr_number" IS NOT NULL);



CREATE INDEX "idx_submissions_status" ON "public"."submissions" USING "btree" ("status");



CREATE INDEX "idx_submissions_status_merged_at" ON "public"."submissions" USING "btree" ("status", "merged_at" DESC) WHERE (("status" = 'merged'::"text") AND ("merged_at" IS NOT NULL));



CREATE INDEX "idx_submissions_user_created" ON "public"."submissions" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_submissions_user_created" IS 'Optimizes get_user_activity_timeline query for submissions';



CREATE INDEX "idx_submissions_user_id" ON "public"."submissions" USING "btree" ("user_id");



CREATE INDEX "idx_submissions_user_id_status" ON "public"."submissions" USING "btree" ("user_id", "status") WHERE ("status" = 'merged'::"text");



CREATE INDEX "idx_subscriptions_polar_id" ON "public"."subscriptions" USING "btree" ("polar_subscription_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_trending_content_24h_activity" ON "public"."trending_content_24h" USING "btree" ("latest_activity_at" DESC);



CREATE INDEX "idx_trending_content_24h_score" ON "public"."trending_content_24h" USING "btree" ("trending_score" DESC);



CREATE INDEX "idx_trending_content_24h_type" ON "public"."trending_content_24h" USING "btree" ("content_type", "trending_score" DESC);



CREATE UNIQUE INDEX "idx_trending_content_24h_unique" ON "public"."trending_content_24h" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_user_activity_summary_total_activity" ON "public"."user_activity_summary" USING "btree" ("total_activity" DESC);



CREATE UNIQUE INDEX "idx_user_activity_summary_user_id" ON "public"."user_activity_summary" USING "btree" ("user_id");



CREATE INDEX "idx_user_affinities_content" ON "public"."user_affinities" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_user_affinities_content_lookup" ON "public"."user_affinities" USING "btree" ("content_type", "content_slug", "affinity_score" DESC) WHERE ("affinity_score" >= (30)::numeric);



CREATE INDEX "idx_user_affinities_filtered_sort" ON "public"."user_affinities" USING "btree" ("user_id", "affinity_score" DESC, "content_type");



CREATE INDEX "idx_user_affinities_user_id" ON "public"."user_affinities" USING "btree" ("user_id", "affinity_score" DESC);



CREATE INDEX "idx_user_affinity_scores_type" ON "public"."user_affinity_scores" USING "btree" ("content_type", "avg_affinity_score" DESC);



CREATE UNIQUE INDEX "idx_user_affinity_scores_unique" ON "public"."user_affinity_scores" USING "btree" ("user_id", "content_type");



CREATE INDEX "idx_user_affinity_scores_user" ON "public"."user_affinity_scores" USING "btree" ("user_id", "avg_affinity_score" DESC);



CREATE INDEX "idx_user_badge_stats_posts" ON "public"."user_badge_stats" USING "btree" ("posts" DESC);



CREATE INDEX "idx_user_badge_stats_reputation" ON "public"."user_badge_stats" USING "btree" ("reputation" DESC);



CREATE UNIQUE INDEX "idx_user_badge_stats_user_id" ON "public"."user_badge_stats" USING "btree" ("user_id");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_featured" ON "public"."user_badges" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_user_badges_user_featured_earned" ON "public"."user_badges" USING "btree" ("user_id", "featured", "earned_at" DESC) WHERE ("featured" = true);



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "idx_user_collections_created_at" ON "public"."user_collections" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_collections_public" ON "public"."user_collections" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_user_collections_slug" ON "public"."user_collections" USING "btree" ("user_id", "slug");



CREATE INDEX "idx_user_collections_user_id" ON "public"."user_collections" USING "btree" ("user_id");



CREATE INDEX "idx_user_collections_view_count" ON "public"."user_collections" USING "btree" ("view_count" DESC) WHERE ("is_public" = true);



CREATE INDEX "idx_user_content_active" ON "public"."user_content" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_user_content_type" ON "public"."user_content" USING "btree" ("content_type");



CREATE INDEX "idx_user_content_user_id" ON "public"."user_content" USING "btree" ("user_id");



CREATE INDEX "idx_user_interactions_affinity_lookup" ON "public"."user_interactions" USING "btree" ("user_id", "content_type", "content_slug", "interaction_type") WHERE ("interaction_type" = ANY (ARRAY['view'::"text", 'bookmark'::"text", 'copy'::"text", 'time_spent'::"text"]));



COMMENT ON INDEX "public"."idx_user_interactions_affinity_lookup" IS 'Optimizes affinity score calculation queries. Filters only relevant interaction types.';



CREATE INDEX "idx_user_interactions_content" ON "public"."user_interactions" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_user_interactions_created" ON "public"."user_interactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_interactions_personalization" ON "public"."user_interactions" USING "btree" ("user_id", "interaction_type", "created_at" DESC);



CREATE INDEX "idx_user_interactions_recent_views" ON "public"."user_interactions" USING "btree" ("user_id", "created_at" DESC, "interaction_type") WHERE ("interaction_type" = ANY (ARRAY['view'::"text", 'bookmark'::"text", 'copy'::"text"]));



CREATE INDEX "idx_user_interactions_session" ON "public"."user_interactions" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_user_interactions_type" ON "public"."user_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_user_interactions_user" ON "public"."user_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_interactions_user_id" ON "public"."user_interactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_mcps_active" ON "public"."user_mcps" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_user_mcps_company_id" ON "public"."user_mcps" USING "btree" ("company_id");



CREATE INDEX "idx_user_mcps_plan" ON "public"."user_mcps" USING "btree" ("plan");



CREATE INDEX "idx_user_mcps_slug" ON "public"."user_mcps" USING "btree" ("slug");



CREATE INDEX "idx_user_mcps_user_id" ON "public"."user_mcps" USING "btree" ("user_id");



CREATE INDEX "idx_user_similarities_score" ON "public"."user_similarities" USING "btree" ("similarity_score" DESC) WHERE ("similarity_score" >= 0.5);



CREATE INDEX "idx_user_similarities_user_a" ON "public"."user_similarities" USING "btree" ("user_a_id", "similarity_score" DESC);



CREATE INDEX "idx_user_similarities_user_b" ON "public"."user_similarities" USING "btree" ("user_b_id", "similarity_score" DESC);



CREATE INDEX "idx_user_stats_badges" ON "public"."user_stats" USING "btree" ("total_badges" DESC, "user_id");



CREATE INDEX "idx_user_stats_posts" ON "public"."user_stats" USING "btree" ("total_posts" DESC, "user_id");



CREATE INDEX "idx_user_stats_reputation" ON "public"."user_stats" USING "btree" ("reputation_score" DESC, "user_id");



CREATE UNIQUE INDEX "idx_user_stats_user_id" ON "public"."user_stats" USING "btree" ("user_id");



CREATE INDEX "idx_users_bio_trgm" ON "public"."users" USING "gin" ("bio" "public"."gin_trgm_ops");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_name_trgm" ON "public"."users" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_users_reputation" ON "public"."users" USING "btree" ("reputation_score" DESC);



CREATE INDEX "idx_users_reputation_score" ON "public"."users" USING "btree" ("reputation_score" DESC) WHERE ("reputation_score" > 0);



COMMENT ON INDEX "public"."idx_users_reputation_score" IS 'Index for fast leaderboard queries and reputation-based sorting.';



CREATE INDEX "idx_users_search_vector" ON "public"."users" USING "gin" ("search_vector");



CREATE INDEX "idx_users_slug" ON "public"."users" USING "btree" ("slug");



CREATE INDEX "idx_users_tier" ON "public"."users" USING "btree" ("tier");



CREATE INDEX "idx_users_tier_name" ON "public"."users" USING "btree" ("tier_name") WHERE ("tier_name" IS NOT NULL);



COMMENT ON INDEX "public"."idx_users_tier_name" IS 'Index for fast tier-based filtering and analytics.';



CREATE INDEX "idx_votes_post_id" ON "public"."votes" USING "btree" ("post_id");



CREATE INDEX "idx_votes_user_created" ON "public"."votes" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_votes_user_created" IS 'Optimizes get_user_activity_timeline query for votes';



CREATE INDEX "idx_votes_user_id" ON "public"."votes" USING "btree" ("user_id");



CREATE INDEX "idx_webhook_events_bounce_email" ON "public"."webhook_events" USING "btree" ("type", (("data" ->> 'to'::"text"))) WHERE ("type" = 'email.bounced'::"text");



CREATE INDEX "idx_webhook_events_complaint_email" ON "public"."webhook_events" USING "btree" ("type", (("data" ->> 'to'::"text"))) WHERE ("type" = 'email.complained'::"text");



CREATE INDEX "idx_webhook_events_created_at" ON "public"."webhook_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_events_data" ON "public"."webhook_events" USING "gin" ("data");



CREATE INDEX "idx_webhook_events_next_retry" ON "public"."webhook_events" USING "btree" ("next_retry_at") WHERE ("next_retry_at" IS NOT NULL);



CREATE INDEX "idx_webhook_events_processed" ON "public"."webhook_events" USING "btree" ("processed") WHERE ("processed" = false);



CREATE INDEX "idx_webhook_events_type" ON "public"."webhook_events" USING "btree" ("type");



CREATE UNIQUE INDEX "mv_site_urls_path_idx" ON "public"."mv_site_urls" USING "btree" ("path");



CREATE STATISTICS "public"."stats_user_affinities_user_score_type" (ndistinct, dependencies) ON "user_id", "content_type", "affinity_score" FROM "public"."user_affinities";


ALTER STATISTICS "public"."stats_user_affinities_user_score_type" OWNER TO "postgres";


CREATE STATISTICS "public"."stats_user_interactions_user_time_type" (dependencies) ON "user_id", "interaction_type", "created_at" FROM "public"."user_interactions";


ALTER STATISTICS "public"."stats_user_interactions_user_time_type" OWNER TO "postgres";


CREATE OR REPLACE TRIGGER "agents_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "auto_award_badges_after_comment" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_comment" ON "public"."comments" IS 'Auto-awards badges after user creates a comment';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_follower" AFTER INSERT ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_follower" ON "public"."followers" IS 'Auto-awards badges after user gains a follower';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_post" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_post" ON "public"."posts" IS 'Auto-awards badges after user creates a post';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_submission" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW WHEN (("new"."status" = 'merged'::"text")) EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_submission" ON "public"."submissions" IS 'Auto-awards badges after user submission is merged';



CREATE OR REPLACE TRIGGER "auto_populate_agents_fields" BEFORE INSERT OR UPDATE ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_collections_fields" BEFORE INSERT OR UPDATE ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_commands_fields" BEFORE INSERT OR UPDATE ON "public"."commands" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_guides_fields" BEFORE INSERT OR UPDATE ON "public"."guides" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_hooks_fields" BEFORE INSERT OR UPDATE ON "public"."hooks" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_mcp_fields" BEFORE INSERT OR UPDATE ON "public"."mcp" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_rules_fields" BEFORE INSERT OR UPDATE ON "public"."rules" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "auto_populate_statuslines_fields" BEFORE INSERT OR UPDATE ON "public"."statuslines" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_generated_fields"();



CREATE OR REPLACE TRIGGER "collections_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "commands_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."commands" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "email_sequences_updated_at" BEFORE UPDATE ON "public"."email_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_sequences_updated_at"();



CREATE OR REPLACE TRIGGER "form_field_definitions_updated_at" BEFORE UPDATE ON "public"."form_field_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "form_field_version_on_update" AFTER UPDATE ON "public"."form_field_definitions" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."create_form_field_version"();



CREATE OR REPLACE TRIGGER "generate_job_slug" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_user_collections_slug" BEFORE INSERT OR UPDATE ON "public"."user_collections" FOR EACH ROW EXECUTE FUNCTION "public"."generate_collection_slug"();



CREATE OR REPLACE TRIGGER "generate_user_mcp_slug" BEFORE INSERT ON "public"."user_mcps" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_users_slug" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."generate_user_slug"();



CREATE OR REPLACE TRIGGER "guides_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags", "keywords" ON "public"."guides" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "hooks_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."hooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "mcp_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."mcp" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "newsletter_updated_at_trigger" BEFORE UPDATE ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_newsletter_updated_at"();



CREATE OR REPLACE TRIGGER "rules_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "skills_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "statuslines_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."statuslines" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "tier_display_config_updated_at" BEFORE UPDATE ON "public"."tier_display_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_check_badges_on_reputation" AFTER UPDATE OF "reputation_score" ON "public"."users" FOR EACH ROW WHEN (("old"."reputation_score" IS DISTINCT FROM "new"."reputation_score")) EXECUTE FUNCTION "public"."check_badges_after_reputation"();



CREATE OR REPLACE TRIGGER "trigger_process_webhook" BEFORE INSERT ON "public"."webhook_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_webhook_event"();



COMMENT ON TRIGGER "trigger_process_webhook" ON "public"."webhook_events" IS 'Automatically processes webhook events on insert. Handles bounces, complaints, sequences.';



CREATE OR REPLACE TRIGGER "trigger_reputation_on_comment" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_comment"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_helpful_review" AFTER UPDATE OF "helpful_count" ON "public"."review_ratings" FOR EACH ROW WHEN (("old"."helpful_count" IS DISTINCT FROM "new"."helpful_count")) EXECUTE FUNCTION "public"."update_reputation_on_helpful_review"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_post" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_post"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_submission" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_submission"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_delete" AFTER DELETE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_insert" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



CREATE OR REPLACE TRIGGER "trigger_sync_changelog_changes" AFTER INSERT OR UPDATE OF "changes" ON "public"."changelog_entries" FOR EACH ROW EXECUTE FUNCTION "public"."sync_changelog_changes_from_jsonb"();



CREATE OR REPLACE TRIGGER "trigger_update_helpful_count_on_delete" AFTER DELETE ON "public"."review_helpful_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_helpful_count"();



CREATE OR REPLACE TRIGGER "trigger_update_helpful_count_on_insert" AFTER INSERT ON "public"."review_helpful_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_helpful_count"();



CREATE OR REPLACE TRIGGER "update_agents_updated_at" BEFORE UPDATE ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_event_categories_updated_at" BEFORE UPDATE ON "public"."analytics_event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_events_updated_at" BEFORE UPDATE ON "public"."analytics_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_announcements_timestamp" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_announcements_updated_at"();



CREATE OR REPLACE TRIGGER "update_changelog_entries_updated_at" BEFORE UPDATE ON "public"."changelog_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_changelog_updated_at" BEFORE UPDATE ON "public"."changelog" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_delete" AFTER DELETE ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_insert" AFTER INSERT ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_collections_updated_at" BEFORE UPDATE ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_commands_updated_at" BEFORE UPDATE ON "public"."commands" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_generation_tracking_updated_at" BEFORE UPDATE ON "public"."content_generation_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_items_updated_at_trigger" BEFORE UPDATE ON "public"."content_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_items_updated_at"();



CREATE OR REPLACE TRIGGER "update_content_seo_overrides_updated_at" BEFORE UPDATE ON "public"."content_seo_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_submissions_updated_at" BEFORE UPDATE ON "public"."content_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_guides_updated_at" BEFORE UPDATE ON "public"."guides" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hooks_updated_at" BEFORE UPDATE ON "public"."hooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mcp_updated_at" BEFORE UPDATE ON "public"."mcp" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_timestamp" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reputation_actions_updated_at" BEFORE UPDATE ON "public"."reputation_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reputation_on_comment" AFTER INSERT OR DELETE OR UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_user_reputation"();



COMMENT ON TRIGGER "update_reputation_on_comment" ON "public"."comments" IS 'Auto-update user reputation when comments are created, updated, or deleted.';



CREATE OR REPLACE TRIGGER "update_reputation_on_post" AFTER INSERT OR DELETE OR UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_user_reputation"();



COMMENT ON TRIGGER "update_reputation_on_post" ON "public"."posts" IS 'Auto-update user reputation when posts are created, updated, or deleted.';



CREATE OR REPLACE TRIGGER "update_reputation_on_submission" AFTER INSERT OR DELETE OR UPDATE OF "status" ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_user_reputation"();



COMMENT ON TRIGGER "update_reputation_on_submission" ON "public"."submissions" IS 'Auto-update user reputation when submission status changes (especially merged).';



CREATE OR REPLACE TRIGGER "update_reputation_tiers_updated_at" BEFORE UPDATE ON "public"."reputation_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_review_ratings_updated_at" BEFORE UPDATE ON "public"."review_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rules_updated_at" BEFORE UPDATE ON "public"."rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_seo_config_updated_at" BEFORE UPDATE ON "public"."seo_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_seo_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_skills_updated_at" BEFORE UPDATE ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsored_content_updated_at" BEFORE UPDATE ON "public"."sponsored_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statuslines_updated_at" BEFORE UPDATE ON "public"."statuslines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_structured_data_config_updated_at" BEFORE UPDATE ON "public"."structured_data_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_structured_data_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_collections_updated_at" BEFORE UPDATE ON "public"."user_collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_content_updated_at" BEFORE UPDATE ON "public"."user_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_mcps_updated_at" BEFORE UPDATE ON "public"."user_mcps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vote_count_on_delete" AFTER DELETE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_vote_count"();



CREATE OR REPLACE TRIGGER "update_vote_count_on_insert" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_vote_count"();



CREATE OR REPLACE TRIGGER "validate_profiles_interests" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_interests_array"();



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_category_fkey" FOREIGN KEY ("category") REFERENCES "public"."analytics_event_categories"("name") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."changelog_changes"
    ADD CONSTRAINT "changelog_changes_changelog_entry_id_fkey" FOREIGN KEY ("changelog_entry_id") REFERENCES "public"."changelog_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_seo_overrides"
    ADD CONSTRAINT "content_seo_overrides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_submissions"
    ADD CONSTRAINT "content_submissions_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."content_submissions"
    ADD CONSTRAINT "content_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_field_definitions"
    ADD CONSTRAINT "form_field_definitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_field_versions"
    ADD CONSTRAINT "form_field_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_field_versions"
    ADD CONSTRAINT "form_field_versions_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."form_field_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_select_options"
    ADD CONSTRAINT "form_select_options_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."form_field_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_dismissals"
    ADD CONSTRAINT "notification_dismissals_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_dismissals"
    ADD CONSTRAINT "notification_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."review_ratings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_ratings"
    ADD CONSTRAINT "review_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsored_clicks"
    ADD CONSTRAINT "sponsored_clicks_sponsored_id_fkey" FOREIGN KEY ("sponsored_id") REFERENCES "public"."sponsored_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsored_clicks"
    ADD CONSTRAINT "sponsored_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sponsored_content"
    ADD CONSTRAINT "sponsored_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsored_impressions"
    ADD CONSTRAINT "sponsored_impressions_sponsored_id_fkey" FOREIGN KEY ("sponsored_id") REFERENCES "public"."sponsored_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsored_impressions"
    ADD CONSTRAINT "sponsored_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_affinities"
    ADD CONSTRAINT "user_affinities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_content"
    ADD CONSTRAINT "user_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_mcps"
    ADD CONSTRAINT "user_mcps_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_mcps"
    ADD CONSTRAINT "user_mcps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_similarities"
    ADD CONSTRAINT "user_similarities_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_similarities"
    ADD CONSTRAINT "user_similarities_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Active MCPs are viewable by everyone" ON "public"."user_mcps" FOR SELECT USING ((("active" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Active jobs are viewable by everyone" ON "public"."jobs" FOR SELECT USING ((("status" = 'active'::"text") OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Active sponsored content is viewable by everyone" ON "public"."sponsored_content" FOR SELECT USING ((("active" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Active user content is viewable by everyone" ON "public"."user_content" FOR SELECT USING ((("active" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Affinity config is publicly readable" ON "public"."affinity_config" FOR SELECT USING (true);



CREATE POLICY "Allow webhook inserts from external services" ON "public"."webhook_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Announcements are viewable by everyone" ON "public"."announcements" FOR SELECT USING (true);



CREATE POLICY "Anyone can insert interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can record sponsored clicks" ON "public"."sponsored_clicks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can record sponsored impressions" ON "public"."sponsored_impressions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can subscribe" ON "public"."newsletter_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view analytics events" ON "public"."analytics_events" FOR SELECT USING (true);



CREATE POLICY "Anyone can view event categories" ON "public"."analytics_event_categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reputation actions" ON "public"."reputation_actions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reputation tiers" ON "public"."reputation_tiers" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can comment" ON "public"."comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can create reviews" ON "public"."review_ratings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can mark reviews helpful" ON "public"."review_helpful_votes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can vote" ON "public"."votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (("active" = true));



CREATE POLICY "Category configs are publicly readable" ON "public"."category_configs" FOR SELECT USING (true);



CREATE POLICY "Category configs are service-writable" ON "public"."category_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Companies are viewable by everyone" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Company owners can update their companies" ON "public"."companies" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Content is publicly readable" ON "public"."agents" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."changelog" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."collections" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."commands" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."content_items" FOR SELECT USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."guides" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."hooks" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."mcp" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."rules" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."skills" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content is publicly readable" ON "public"."statuslines" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content similarities are viewable by everyone" ON "public"."content_similarities" FOR SELECT USING (true);



CREATE POLICY "Featured configs are viewable by everyone" ON "public"."featured_configs" FOR SELECT USING (true);



CREATE POLICY "Followers are viewable by everyone" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "Form field configs are viewable by everyone" ON "public"."form_field_configs" FOR SELECT USING (("enabled" = true));



CREATE POLICY "Form field definitions are publicly readable" ON "public"."form_field_definitions" FOR SELECT USING (("active" = true));



CREATE POLICY "Form field versions are publicly readable" ON "public"."form_field_versions" FOR SELECT USING (true);



CREATE POLICY "Form select options are publicly readable" ON "public"."form_select_options" FOR SELECT USING (("active" = true));



CREATE POLICY "Generator configs are publicly readable" ON "public"."content_generator_configs" FOR SELECT USING (true);



CREATE POLICY "Generator configs are service-writable" ON "public"."content_generator_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Helpful votes are viewable by everyone" ON "public"."review_helpful_votes" FOR SELECT USING (true);



CREATE POLICY "Metadata templates are publicly readable" ON "public"."metadata_templates" FOR SELECT USING (true);



CREATE POLICY "Moderators can update submissions" ON "public"."content_submissions" FOR UPDATE USING (( SELECT (EXISTS ( SELECT 1
           FROM "auth"."users"
          WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'moderator'::"text")))) AS "exists"));



CREATE POLICY "Notifications are viewable by everyone" ON "public"."notifications" FOR SELECT USING (true);



CREATE POLICY "Posts are viewable by everyone" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Profiles are viewable" ON "public"."profiles" FOR SELECT USING ((("profile_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "id")));



COMMENT ON POLICY "Profiles are viewable" ON "public"."profiles" IS 'Consolidated policy: public profiles viewable by everyone, users can always view their own. Optimized with SELECT wrapper.';



CREATE POLICY "Public collections are viewable by everyone" ON "public"."user_collections" FOR SELECT USING ((("is_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Public users are viewable by everyone" ON "public"."users" FOR SELECT USING ((("public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "id")));



CREATE POLICY "Published entries are viewable by everyone" ON "public"."changelog_entries" FOR SELECT USING (("published" = true));



CREATE POLICY "Quiz options publicly readable" ON "public"."quiz_options" FOR SELECT USING (true);



CREATE POLICY "Quiz options service writable" ON "public"."quiz_options" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Quiz questions publicly readable" ON "public"."quiz_questions" FOR SELECT USING (true);



CREATE POLICY "Quiz questions service writable" ON "public"."quiz_questions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Reviews are viewable by everyone" ON "public"."review_ratings" FOR SELECT USING (true);



CREATE POLICY "SEO config is publicly readable" ON "public"."seo_config" FOR SELECT USING (true);



CREATE POLICY "SEO enrichment rules are viewable by everyone" ON "public"."seo_enrichment_rules" FOR SELECT USING (("enabled" = true));



CREATE POLICY "Service role can manage SEO config" ON "public"."seo_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage affinity config" ON "public"."affinity_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage form field definitions" ON "public"."form_field_definitions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage form field versions" ON "public"."form_field_versions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage form select options" ON "public"."form_select_options" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage metadata templates" ON "public"."metadata_templates" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage structured data config" ON "public"."structured_data_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage webhook events" ON "public"."webhook_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to SEO rules" ON "public"."seo_enrichment_rules" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to affinities" ON "public"."user_affinities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to content similarities" ON "public"."content_similarities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to featured configs" ON "public"."featured_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to form configs" ON "public"."form_field_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to helpful votes" ON "public"."review_helpful_votes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to interactions" ON "public"."user_interactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to reviews" ON "public"."review_ratings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to submissions" ON "public"."submissions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to user similarities" ON "public"."user_similarities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Structured data config is publicly readable" ON "public"."structured_data_config" FOR SELECT USING (true);



CREATE POLICY "Tier display config is publicly readable" ON "public"."tier_display_config" FOR SELECT USING (("active" = true));



CREATE POLICY "User badges are viewable by everyone" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "Users and moderators can view submissions" ON "public"."content_submissions" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "submitter_id") OR ( SELECT (EXISTS ( SELECT 1
           FROM "auth"."users"
          WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'moderator'::"text")))) AS "exists")));



COMMENT ON POLICY "Users and moderators can view submissions" ON "public"."content_submissions" IS 'Consolidated policy: users can view their own submissions, moderators can view all. Optimized with SELECT wrappers.';



CREATE POLICY "Users can add items to their collections" ON "public"."collection_items" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create MCPs" ON "public"."user_mcps" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create companies" ON "public"."companies" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can create content" ON "public"."user_content" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create jobs" ON "public"."jobs" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create submissions" ON "public"."submissions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create their own collections" ON "public"."user_collections" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete items from their collections" ON "public"."collection_items" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own bookmarks" ON "public"."bookmarks" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own collections" ON "public"."user_collections" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own reviews" ON "public"."review_ratings" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can dismiss announcements" ON "public"."announcement_dismissals" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can dismiss notifications" ON "public"."notification_dismissals" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can feature their own badges" ON "public"."user_badges" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can follow others" ON "public"."followers" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert submissions" ON "public"."content_submissions" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "submitter_id") OR ("submitter_id" IS NULL)));



CREATE POLICY "Users can insert their own bookmarks" ON "public"."bookmarks" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own webhook events" ON "public"."webhook_events" FOR SELECT USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ((("data" ->> 'to'::"text") = (( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text")) OR (("data" -> 'to'::"text") ? (( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text")) OR (("data" -> 'to'::"text") @> "to_jsonb"(ARRAY[(( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text")])))));



CREATE POLICY "Users can remove their helpful votes" ON "public"."review_helpful_votes" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can remove their own votes" ON "public"."votes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can un-dismiss announcements" ON "public"."announcement_dismissals" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can un-dismiss notifications" ON "public"."notification_dismissals" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can unfollow others" ON "public"."followers" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can unsubscribe" ON "public"."newsletter_subscriptions" FOR UPDATE USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email")) WITH CHECK (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));



CREATE POLICY "Users can update items in their collections" ON "public"."collection_items" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own MCPs" ON "public"."user_mcps" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own collections" ON "public"."user_collections" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own content" ON "public"."user_content" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own jobs" ON "public"."jobs" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own reviews" ON "public"."review_ratings" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view items in their collections" ON "public"."collection_items" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_collections"
  WHERE (("user_collections"."id" = "collection_items"."collection_id") AND ("user_collections"."is_public" = true))))));



CREATE POLICY "Users can view own interactions" ON "public"."user_interactions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own submissions" ON "public"."submissions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own affinities" ON "public"."user_affinities" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own bookmarks" ON "public"."bookmarks" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own dismissals" ON "public"."announcement_dismissals" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own dismissals" ON "public"."notification_dismissals" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own newsletter subscription" ON "public"."newsletter_subscriptions" FOR SELECT USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own similarities" ON "public"."user_similarities" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_a_id") OR (( SELECT "auth"."uid"() AS "uid") = "user_b_id")));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Votes are viewable by everyone" ON "public"."votes" FOR SELECT USING (true);



ALTER TABLE "public"."affinity_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcement_dismissals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelog_changes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "changelog_changes_public_read" ON "public"."changelog_changes" FOR SELECT USING (true);



CREATE POLICY "changelog_changes_service_write" ON "public"."changelog_changes" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."changelog_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_generation_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_generator_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_seo_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_seo_overrides_delete_policy" ON "public"."content_seo_overrides" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "content_seo_overrides_insert_policy" ON "public"."content_seo_overrides" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "content_seo_overrides_select_policy" ON "public"."content_seo_overrides" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "content_seo_overrides_update_policy" ON "public"."content_seo_overrides" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."content_similarities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_sequence_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_select_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mcp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."metadata_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_dismissals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reputation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reputation_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_helpful_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_enrichment_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_changelog_entries_all" ON "public"."changelog_entries" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_impressions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."statuslines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."structured_data_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tier_display_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_affinities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_mcps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_similarities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;


















































































































































































































GRANT ALL ON FUNCTION "public"."auto_award_badges"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_award_badges"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_recalculate_all_reputation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" integer, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" bigint, "p_copy_count" bigint, "p_bookmark_count" bigint, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" integer, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" bigint, "p_copy_count" bigint, "p_bookmark_count" bigint, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" numeric, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" integer, "p_copy_count" integer, "p_bookmark_count" integer, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."build_enriched_content_base"("p_id" "uuid", "p_slug" "text", "p_title" "text", "p_description" "text", "p_author" "text", "p_author_profile_url" "text", "p_category" "text", "p_tags" "text"[], "p_source_table" "text", "p_created_at" timestamp with time zone, "p_updated_at" timestamp with time zone, "p_date_added" "date", "p_discovery_metadata" "jsonb", "p_examples" "jsonb", "p_features" "text"[], "p_troubleshooting" "jsonb"[], "p_use_cases" "text"[], "p_source" "text", "p_documentation_url" "text", "p_popularity_score" numeric, "p_content" "text", "p_seo_title" "text", "p_display_title" "text", "p_view_count" integer, "p_copy_count" integer, "p_bookmark_count" integer, "p_sponsored_id" "uuid", "p_sponsor_tier" "text", "p_sponsored_active" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_and_store_weekly_featured"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_and_store_weekly_featured"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) TO "anon";



GRANT ALL ON FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."calculate_user_reputation_score"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."cancel_email_sequence"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_email_sequence"("p_email" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."check_all_badges"("target_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_and_award_badge"("target_user_id" "uuid", "badge_slug" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_and_award_badges_manual"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_badges_manual"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_interactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enroll_in_email_sequence"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enroll_in_email_sequence"("p_email" "text") TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."jobs" TO "authenticated";
GRANT SELECT ON TABLE "public"."jobs" TO "anon";



GRANT ALL ON FUNCTION "public"."filter_jobs"("p_search_query" "text", "p_category" "text", "p_employment_type" "text", "p_remote_only" boolean, "p_experience_level" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."filter_jobs"("p_search_query" "text", "p_category" "text", "p_employment_type" "text", "p_remote_only" boolean, "p_experience_level" "text", "p_limit" integer, "p_offset" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."generate_metadata_for_route"("p_route_pattern" "text", "p_context" "jsonb", "p_route" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_metadata_for_route"("p_route_pattern" "text", "p_context" "jsonb", "p_route" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."get_active_sponsored_content"("p_content_type" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_sponsored_content"("p_content_type" "text", "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_all_content_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_content_categories"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_all_seo_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_seo_config"() TO "anon";



GRANT ALL ON FUNCTION "public"."get_all_structured_data_configs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_structured_data_configs"() TO "anon";



GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_affinity"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_affinity"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_due_sequence_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_sequence_emails"() TO "anon";



GRANT ALL ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_metadata_template"("p_route_pattern" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metadata_template"("p_route_pattern" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_category" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_personalized_feed"("p_user_id" "uuid", "p_category" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) TO "anon";



GRANT ALL ON FUNCTION "public"."get_reviews_with_stats"("p_content_type" "text", "p_content_slug" "text", "p_sort_by" "text", "p_offset" integer, "p_limit" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reviews_with_stats"("p_content_type" "text", "p_content_slug" "text", "p_sort_by" "text", "p_offset" integer, "p_limit" integer, "p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."get_search_count"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_search_count"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[]) TO "anon";



GRANT ALL ON FUNCTION "public"."get_search_suggestions"("p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_search_suggestions"("p_query" "text", "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_seo_config"("p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seo_config"("p_key" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."get_site_urls"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_site_urls"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_structured_data_config"("p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_structured_data_config"("p_category" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."get_trending_content"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_content"("p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_user_badges_with_details"("p_user_id" "uuid", "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "anon";



GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."mark_sequence_email_processed"("p_schedule_id" "uuid", "p_email" "text", "p_step" integer, "p_success" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_sequence_email_processed"("p_schedule_id" "uuid", "p_email" "text", "p_step" integer, "p_success" boolean) TO "anon";



GRANT ALL ON FUNCTION "public"."refresh_content_popularity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_content_popularity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_mv_site_urls"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."refresh_user_stat"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."refresh_user_stats"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."reorder_collection_items"("p_collection_id" "uuid", "p_user_id" "uuid", "p_items" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."schedule_next_sequence_step"("p_email" "text", "p_current_step" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_next_sequence_step"("p_email" "text", "p_current_step" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."search_by_popularity"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_by_popularity"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."companies" TO "authenticated";
GRANT SELECT ON TABLE "public"."companies" TO "anon";



GRANT ALL ON FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."search_content_optimized"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_content_optimized"("p_query" "text", "p_categories" "text"[], "p_tags" "text"[], "p_authors" "text"[], "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."search_jobs"("search_query" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_jobs"("search_query" "text", "result_limit" integer) TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT ON TABLE "public"."users" TO "anon";



GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text", "result_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") TO "service_role";






























GRANT SELECT ON TABLE "public"."affinity_config" TO "authenticated";
GRANT ALL ON TABLE "public"."affinity_config" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "service_role";
GRANT SELECT ON TABLE "public"."agents" TO "anon";
GRANT SELECT ON TABLE "public"."agents" TO "authenticated";



GRANT SELECT ON TABLE "public"."announcements" TO "anon";
GRANT SELECT ON TABLE "public"."announcements" TO "authenticated";



GRANT SELECT ON TABLE "public"."badges" TO "authenticated";
GRANT SELECT ON TABLE "public"."badges" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."bookmarks" TO "authenticated";



GRANT SELECT ON TABLE "public"."category_configs" TO "anon";



GRANT ALL ON TABLE "public"."changelog" TO "service_role";
GRANT SELECT ON TABLE "public"."changelog" TO "anon";
GRANT SELECT ON TABLE "public"."changelog" TO "authenticated";



GRANT ALL ON TABLE "public"."changelog_changes" TO "service_role";



GRANT SELECT ON TABLE "public"."changelog_entries" TO "authenticated";
GRANT SELECT ON TABLE "public"."changelog_entries" TO "anon";
GRANT ALL ON TABLE "public"."changelog_entries" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."collection_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."collection_items" TO "anon";



GRANT ALL ON TABLE "public"."collections" TO "service_role";
GRANT SELECT ON TABLE "public"."collections" TO "anon";
GRANT SELECT ON TABLE "public"."collections" TO "authenticated";



GRANT ALL ON TABLE "public"."commands" TO "service_role";
GRANT SELECT ON TABLE "public"."commands" TO "anon";
GRANT SELECT ON TABLE "public"."commands" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."comments" TO "anon";



GRANT SELECT ON TABLE "public"."company_job_stats" TO "authenticated";



GRANT ALL ON TABLE "public"."guides" TO "service_role";
GRANT SELECT ON TABLE "public"."guides" TO "anon";
GRANT SELECT ON TABLE "public"."guides" TO "authenticated";



GRANT ALL ON TABLE "public"."hooks" TO "service_role";
GRANT SELECT ON TABLE "public"."hooks" TO "anon";
GRANT SELECT ON TABLE "public"."hooks" TO "authenticated";



GRANT ALL ON TABLE "public"."mcp" TO "service_role";
GRANT SELECT ON TABLE "public"."mcp" TO "anon";
GRANT SELECT ON TABLE "public"."mcp" TO "authenticated";



GRANT ALL ON TABLE "public"."rules" TO "service_role";
GRANT SELECT ON TABLE "public"."rules" TO "anon";
GRANT SELECT ON TABLE "public"."rules" TO "authenticated";



GRANT ALL ON TABLE "public"."skills" TO "service_role";
GRANT SELECT ON TABLE "public"."skills" TO "anon";
GRANT SELECT ON TABLE "public"."skills" TO "authenticated";



GRANT ALL ON TABLE "public"."statuslines" TO "service_role";
GRANT SELECT ON TABLE "public"."statuslines" TO "anon";
GRANT SELECT ON TABLE "public"."statuslines" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_base" TO "anon";
GRANT SELECT ON TABLE "public"."content_base" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_popularity" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_popularity" TO "anon";



GRANT SELECT ON TABLE "public"."content_seo_overrides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."content_seo_overrides" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_similarities" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_similarities" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."content_submissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_unified" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_unified" TO "anon";



GRANT SELECT ON TABLE "public"."featured_configs" TO "authenticated";
GRANT SELECT ON TABLE "public"."featured_configs" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."followers" TO "authenticated";
GRANT SELECT ON TABLE "public"."followers" TO "anon";



GRANT SELECT ON TABLE "public"."form_field_configs" TO "anon";
GRANT SELECT ON TABLE "public"."form_field_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."form_field_configs" TO "service_role";



GRANT SELECT ON TABLE "public"."form_field_definitions" TO "anon";



GRANT SELECT ON TABLE "public"."form_select_options" TO "anon";



GRANT ALL ON TABLE "public"."metadata_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."metadata_templates" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."user_interactions" TO "authenticated";
GRANT INSERT ON TABLE "public"."user_interactions" TO "anon";



GRANT SELECT ON TABLE "public"."mv_analytics_summary" TO "anon";
GRANT SELECT ON TABLE "public"."mv_analytics_summary" TO "authenticated";



GRANT SELECT ON TABLE "public"."mv_content_similarity" TO "anon";



GRANT SELECT ON TABLE "public"."mv_content_stats" TO "anon";



GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "service_role";
GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "anon";



GRANT SELECT ON TABLE "public"."mv_featured_scores" TO "anon";
GRANT SELECT ON TABLE "public"."mv_featured_scores" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_affinities" TO "authenticated";



GRANT SELECT ON TABLE "public"."mv_search_facets" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_collections" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_collections" TO "anon";



GRANT SELECT ON TABLE "public"."mv_site_urls" TO "anon";
GRANT SELECT ON TABLE "public"."mv_site_urls" TO "authenticated";



GRANT SELECT ON TABLE "public"."mv_trending_content" TO "service_role";
GRANT SELECT ON TABLE "public"."mv_trending_content" TO "anon";



GRANT SELECT ON TABLE "public"."mv_weekly_new_content" TO "service_role";
GRANT SELECT ON TABLE "public"."mv_weekly_new_content" TO "anon";



GRANT SELECT ON TABLE "public"."payments" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."posts" TO "authenticated";
GRANT SELECT ON TABLE "public"."posts" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";



GRANT SELECT ON TABLE "public"."recommended_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."recommended_content" TO "service_role";
GRANT SELECT ON TABLE "public"."recommended_content" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."review_helpful_votes" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."review_ratings" TO "authenticated";



GRANT SELECT ON TABLE "public"."seo_config" TO "authenticated";
GRANT SELECT ON TABLE "public"."seo_config" TO "anon";



GRANT SELECT ON TABLE "public"."seo_enrichment_rules" TO "anon";
GRANT SELECT ON TABLE "public"."seo_enrichment_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_enrichment_rules" TO "service_role";



GRANT INSERT ON TABLE "public"."sponsored_clicks" TO "authenticated";



GRANT SELECT ON TABLE "public"."sponsored_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."sponsored_content" TO "anon";



GRANT INSERT ON TABLE "public"."sponsored_impressions" TO "authenticated";



GRANT SELECT ON TABLE "public"."structured_data_config" TO "authenticated";
GRANT SELECT ON TABLE "public"."structured_data_config" TO "anon";



GRANT SELECT ON TABLE "public"."submissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."submission_stats_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."submission_stats_summary" TO "anon";



GRANT SELECT ON TABLE "public"."subscriptions" TO "authenticated";



GRANT SELECT ON TABLE "public"."tier_display_config" TO "authenticated";
GRANT SELECT ON TABLE "public"."tier_display_config" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."votes" TO "authenticated";



GRANT SELECT ON TABLE "public"."trending_content_24h" TO "authenticated";
GRANT ALL ON TABLE "public"."trending_content_24h" TO "service_role";
GRANT SELECT ON TABLE "public"."trending_content_24h" TO "anon";



GRANT SELECT ON TABLE "public"."user_activity_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_activity_summary" TO "anon";



GRANT SELECT ON TABLE "public"."user_affinity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_affinity_scores" TO "service_role";



GRANT SELECT ON TABLE "public"."user_badge_stats" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_badge_stats" TO "anon";



GRANT SELECT ON TABLE "public"."user_badges" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_badges" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_content" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_mcps" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_mcps" TO "anon";



GRANT SELECT ON TABLE "public"."user_similarities" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_stats" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_stats" TO "anon";


































