


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


CREATE TYPE "public"."guide_subcategory" AS ENUM (
    'tutorials',
    'comparisons',
    'workflows',
    'use-cases',
    'troubleshooting'
);


ALTER TYPE "public"."guide_subcategory" OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."approve_submission"("p_submission_id" "uuid", "p_moderator_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_submission RECORD;
  v_slug TEXT;
  v_slug_counter INTEGER := 0;
  v_final_slug TEXT;
  v_content_id UUID;
BEGIN
  -- Check admin role
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized - admin role required';
  END IF;

  -- Get submission
  SELECT * INTO v_submission
  FROM content_submissions
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  -- Generate base slug from name
  v_slug := generate_slug(v_submission.name);
  v_final_slug := v_slug;

  -- Check for duplicate slug and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM content
    WHERE slug = v_final_slug
      AND category = v_submission.submission_type::TEXT
  ) LOOP
    v_slug_counter := v_slug_counter + 1;
    v_final_slug := v_slug || '-' || v_slug_counter;
  END LOOP;

  -- Insert into unified content table
  INSERT INTO content (
    category,
    slug,
    title,
    description,
    author,
    author_profile_url,
    date_added,
    tags,
    source,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_submission.submission_type::TEXT,
    v_final_slug,
    v_submission.name,
    v_submission.description,
    v_submission.author,
    v_submission.author_profile_url,
    CURRENT_DATE,
    COALESCE(v_submission.tags, '{}'),
    v_submission.github_url,
    jsonb_build_object(
      'submission_id', v_submission.id,
      'submitter_id', v_submission.submitter_id,
      'approved_by', auth.uid(),
      'approved_at', NOW(),
      'original_content_data', v_submission.content_data
    ),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_content_id;

  -- Update submission status
  UPDATE content_submissions
  SET
    status = 'approved',
    moderated_by = auth.uid(),
    moderated_at = NOW(),
    moderator_notes = p_moderator_notes,
    updated_at = NOW()
  WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'content_id', v_content_id,
    'slug', v_final_slug,
    'category', v_submission.submission_type::TEXT,
    'message', 'Submission approved and published successfully'
  );
END;
$$;


ALTER FUNCTION "public"."approve_submission"("p_submission_id" "uuid", "p_moderator_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_submission"("p_submission_id" "uuid", "p_moderator_notes" "text") IS 'Approve submission and publish to unified content table. Handles slug deduplication automatically. Admin only.';



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


CREATE OR REPLACE FUNCTION "public"."check_newsletter_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Allow max 3 signups per email per hour
  IF EXISTS (
    SELECT 1 
    FROM public.rate_limit_tracker
    WHERE identifier = NEW.email
      AND counter >= 3
      AND window_start > NOW() - INTERVAL '1 hour'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for email: %. Please try again later.', NEW.email
      USING ERRCODE = '429';
  END IF;
  
  -- Update or insert rate limit tracking
  INSERT INTO public.rate_limit_tracker (identifier, counter, window_start)
  VALUES (NEW.email, 1, NOW())
  ON CONFLICT (identifier) DO UPDATE
  SET 
    counter = CASE
      WHEN rate_limit_tracker.window_start < NOW() - INTERVAL '1 hour' 
      THEN 1
      ELSE rate_limit_tracker.counter + 1
    END,
    window_start = CASE
      WHEN rate_limit_tracker.window_start < NOW() - INTERVAL '1 hour'
      THEN NOW()
      ELSE rate_limit_tracker.window_start
    END;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_newsletter_rate_limit"() OWNER TO "postgres";


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
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+',
      '-',
      'g'
    )
  );
END;
$$;


ALTER FUNCTION "public"."generate_slug"("p_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_slug"("p_name" "text") IS 'Generate URL-safe slug from name with validation. Replaces 61 LOC TypeScript.';



CREATE OR REPLACE FUNCTION "public"."generate_slug_from_filename"("p_filename" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      lower(trim(regexp_replace(p_filename, '\.(md|mdx)$', '', 'i'))),
      '[^a-z0-9]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  );
END;
$_$;


ALTER FUNCTION "public"."generate_slug_from_filename"("p_filename" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_slug_from_filename"("p_filename" "text") IS 'Converts filename to URL-safe slug. IMMUTABLE with SET search_path for security.';



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



CREATE OR REPLACE FUNCTION "public"."get_api_category_content"("p_category" "text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_api_fields jsonb;
  v_result jsonb;
BEGIN
  -- Get API schema fields for this category
  SELECT api_schema->'fields'
  INTO v_api_fields
  FROM category_configs
  WHERE category::text = p_category;
  
  IF v_api_fields IS NULL THEN
    RAISE EXCEPTION 'Category % not found or has no API schema', p_category;
  END IF;
  
  -- Build array of filtered content items
  SELECT jsonb_agg(filtered_content ORDER BY created_at DESC)
  INTO v_result
  FROM (
    SELECT 
      jsonb_object_agg(key, value) as filtered_content,
      MAX(created_at) as created_at
    FROM content c,
    LATERAL (
      SELECT key, value
      FROM jsonb_each(to_jsonb(c.*) - 'id'::text)
      WHERE key = ANY(
        SELECT jsonb_array_elements_text(v_api_fields)
      )
    ) fields
    WHERE c.category = p_category
    GROUP BY c.slug
    LIMIT p_limit
    OFFSET p_offset
  ) items;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_api_category_content"("p_category" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_api_category_content"("p_category" "text", "p_limit" integer, "p_offset" integer) IS 'Returns all content in a category filtered by api_schema. Supports pagination. Used for /api/content/[category]/index.json endpoints.';



CREATE OR REPLACE FUNCTION "public"."get_api_content"("p_category" "text", "p_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_api_fields jsonb;
  v_content jsonb;
  v_result jsonb;
  v_field text;
BEGIN
  -- Get API schema fields for this category
  SELECT api_schema->'fields'
  INTO v_api_fields
  FROM category_configs
  WHERE category::text = p_category;
  
  IF v_api_fields IS NULL THEN
    RAISE EXCEPTION 'Category % not found or has no API schema', p_category;
  END IF;
  
  -- Get full content record as JSONB
  SELECT to_jsonb(c.*) - 'id'::text
  INTO v_content
  FROM content c
  WHERE c.category = p_category
    AND c.slug = p_slug;
  
  IF v_content IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build result with only API-allowed fields
  v_result := '{}'::jsonb;
  
  FOR v_field IN SELECT jsonb_array_elements_text(v_api_fields)
  LOOP
    IF v_content ? v_field THEN
      v_result := v_result || jsonb_build_object(v_field, v_content->v_field);
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_api_content"("p_category" "text", "p_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_api_content"("p_category" "text", "p_slug" "text") IS 'Returns content filtered by category api_schema. Used for public JSON API endpoints. Respects RLS policies and only exposes whitelisted fields.';



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



CREATE OR REPLACE FUNCTION "public"."get_category_config"("p_category" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- If specific category requested, return that config
  IF p_category IS NOT NULL THEN
    SELECT jsonb_build_object(
      'category', category,
      'title', title,
      'pluralTitle', plural_title,
      'description', description,
      'iconName', icon_name,
      'colorScheme', color_scheme,
      'showOnHomepage', show_on_homepage,
      'keywords', keywords,
      'metaDescription', meta_description,
      'sections', sections,
      'primaryActionType', primary_action_type,
      'primaryActionLabel', primary_action_label,
      'primaryActionConfig', primary_action_config,
      'searchPlaceholder', search_placeholder,
      'emptyStateMessage', empty_state_message,
      'urlSlug', url_slug,
      'contentLoader', content_loader,
      'displayConfig', display_config,
      'configFormat', config_format,
      'validationConfig', validation_config,
      'generationConfig', generation_config,
      'schemaName', schema_name
    )
    INTO v_result
    FROM category_configs
    WHERE category = p_category::category_type;
    
    RETURN v_result;
  END IF;
  
  -- Otherwise return all configs as object keyed by category
  SELECT jsonb_object_agg(
    category,
    jsonb_build_object(
      'category', category,
      'title', title,
      'pluralTitle', plural_title,
      'description', description,
      'iconName', icon_name,
      'colorScheme', color_scheme,
      'showOnHomepage', show_on_homepage,
      'keywords', keywords,
      'metaDescription', meta_description,
      'sections', sections,
      'primaryActionType', primary_action_type,
      'primaryActionLabel', primary_action_label,
      'primaryActionConfig', primary_action_config,
      'searchPlaceholder', search_placeholder,
      'emptyStateMessage', empty_state_message,
      'urlSlug', url_slug,
      'contentLoader', content_loader,
      'displayConfig', display_config,
      'configFormat', config_format,
      'validationConfig', validation_config,
      'generationConfig', generation_config,
      'schemaName', schema_name
    )
  )
  INTO v_result
  FROM category_configs;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_category_config"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_category_config"("p_category" "text") IS 'Retrieves category configuration from database. Returns all configs if no category specified, or specific config if category provided.';



CREATE OR REPLACE FUNCTION "public"."get_changelog_entries"("p_category" "text" DEFAULT NULL::"text", "p_published_only" boolean DEFAULT true, "p_featured_only" boolean DEFAULT false, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
  total_count_val INT;
BEGIN
  -- Get total count first (needed for pagination metadata)
  SELECT COUNT(*)::int INTO total_count_val
  FROM public.changelog_entries ce
  WHERE
    (NOT p_published_only OR ce.published = true)
    AND (NOT p_featured_only OR ce.featured = true)
    AND (
      p_category IS NULL
      OR EXISTS (
        SELECT 1 FROM public.changelog_changes cc
        WHERE cc.changelog_entry_id = ce.id
        AND cc.category = p_category
      )
    );

  -- Build result with optimized query
  WITH filtered_entries AS (
    -- ✅ Conditional filtering: only use subquery when p_category is provided
    -- ✅ No DISTINCT needed: ce.id is PRIMARY KEY
    -- ✅ No LEFT JOIN for 99% of calls (when p_category IS NULL)
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
      ce.changes,  -- ✅ JSONB field with all category data (used by frontend)
      ce.created_at,
      ce.updated_at
    FROM public.changelog_entries ce
    WHERE
      (NOT p_published_only OR ce.published = true)
      AND (NOT p_featured_only OR ce.featured = true)
      AND (
        p_category IS NULL
        OR EXISTS (
          SELECT 1 FROM public.changelog_changes cc
          WHERE cc.changelog_entry_id = ce.id
          AND cc.category = p_category
        )
      )
    ORDER BY ce.release_date DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'entries', COALESCE(jsonb_agg(row_to_json(filtered_entries)::jsonb ORDER BY release_date DESC), '[]'::jsonb),
    'total', total_count_val,
    'limit', p_limit,
    'offset', p_offset,
    'hasMore', total_count_val > (p_offset + p_limit)
  ) INTO result
  FROM filtered_entries;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_changelog_entries"("p_category" "text", "p_published_only" boolean, "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_changelog_entries"("p_category" "text", "p_published_only" boolean, "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) IS 'Optimized changelog entries retrieval with conditional category filtering.
Performance: 21.8x faster than previous version (0.178ms vs 3.883ms for non-category queries).
Uses EXISTS subquery instead of LEFT JOIN for 96% reduction in rows scanned.';



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



CREATE OR REPLACE FUNCTION "public"."get_database_fingerprint"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  fingerprint jsonb;
BEGIN
  -- Aggregate table statistics into compact fingerprint
  SELECT jsonb_object_agg(
    schemaname || '.' || tablename,
    jsonb_build_object(
      'rows', n_live_tup,
      'modified', COALESCE(last_vacuum, last_autovacuum, last_analyze, last_autoanalyze, '1970-01-01'::timestamp)::text
    )
  ) INTO fingerprint
  FROM pg_stat_user_tables
  WHERE schemaname IN ('public', 'auth', 'storage', 'realtime', 'cron', 'supabase_migrations', 'vault', 'supabase_functions', 'net');
  
  RETURN fingerprint;
END;
$$;


ALTER FUNCTION "public"."get_database_fingerprint"() OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."get_enriched_content"("p_category" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text", "p_slugs" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', c.id, 'slug', c.slug, 'title', c.title, 'display_title', c.display_title,
      'seo_title', c.seo_title, 'description', c.description, 'author', c.author,
      'author_profile_url', c.author_profile_url, 'category', c.category, 'tags', c.tags,
      'source_table', c.category, 'created_at', c.created_at, 'updated_at', c.updated_at,
      'date_added', c.date_added, 'discovery_metadata', c.discovery_metadata,
      'examples', c.examples, 'features', c.features, 'use_cases', c.use_cases,
      'source', c.source, 'documentation_url', c.documentation_url, 'content', c.content,
      'metadata', c.metadata,
      'viewCount', COALESCE(mcs.view_count, 0), 'copyCount', COALESCE(mcs.copy_count, 0),
      'bookmarkCount', COALESCE(mcs.bookmark_count, 0), 'popularityScore', COALESCE(mcs.popularity_score, 0),
      'trendingScore', 0,
      'sponsoredContentId', sc.id, 'sponsorshipTier', sc.tier, 'isSponsored', COALESCE(sc.active, false)
    ) as row_to_json
    FROM public.content c
    LEFT JOIN public.mv_content_stats mcs ON mcs.slug = c.slug AND mcs.category = c.category
    LEFT JOIN public.sponsored_content sc ON sc.content_id = c.id AND sc.content_type = c.category 
      AND sc.active = true AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
    WHERE (p_category IS NULL OR c.category = p_category)
      AND (p_slug IS NULL OR c.slug = p_slug)
      AND (p_slugs IS NULL OR c.slug = ANY(p_slugs))
    ORDER BY c.slug LIMIT p_limit OFFSET p_offset
  ) subquery;
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) IS 'Returns enriched content with analytics and sponsorship data. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."get_featured_jobs"() RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT * FROM public.jobs
  WHERE status = 'active' AND active = true AND plan IN ('featured', 'premium')
  ORDER BY "order" DESC NULLS LAST, posted_at DESC LIMIT 10;
$$;


ALTER FUNCTION "public"."get_featured_jobs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_featured_jobs"() IS 'Returns featured and premium job listings. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."get_generation_config"("p_category" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- If specific category requested, return that config
  IF p_category IS NOT NULL THEN
    SELECT jsonb_build_object(
      'category', category,
      'validationConfig', validation_config,
      'generationConfig', generation_config
    )
    INTO v_result
    FROM category_configs
    WHERE category = p_category::category_type;
    
    RETURN v_result;
  END IF;
  
  -- Otherwise return all configs as object keyed by category
  SELECT jsonb_object_agg(
    category,
    jsonb_build_object(
      'validationConfig', validation_config,
      'generationConfig', generation_config
    )
  )
  INTO v_result
  FROM category_configs;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_generation_config"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_generation_config"("p_category" "text") IS 'Retrieves generation and validation configuration from category_configs. Replaces generation-rules.ts (199 lines), trend-detection.ts (317 lines), and validation files (381 lines) - total 897 lines eliminated.';



CREATE OR REPLACE FUNCTION "public"."get_github_stars"("p_repo_url" "text") RETURNS TABLE("stars" integer, "forks" integer, "watchers" integer, "open_issues" integer, "last_fetched_at" timestamp with time zone, "is_cached" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_repo_owner TEXT;
  v_repo_name TEXT;
  v_cache_valid BOOLEAN := FALSE;
BEGIN
  SELECT (regexp_matches(p_repo_url, 'github\.com/([^/]+)/([^/]+)'))[1],
         (regexp_matches(p_repo_url, 'github\.com/([^/]+)/([^/]+)'))[2]
  INTO v_repo_owner, v_repo_name;
  IF v_repo_owner IS NULL OR v_repo_name IS NULL THEN
    RAISE EXCEPTION 'Invalid GitHub URL format: %', p_repo_url;
  END IF;
  SELECT (last_fetched_at > NOW() - INTERVAL '1 hour') INTO v_cache_valid
  FROM github_repo_stats WHERE repo_url = p_repo_url;
  IF v_cache_valid THEN
    RETURN QUERY SELECT grs.stars, grs.forks, grs.watchers, grs.open_issues, grs.last_fetched_at, TRUE as is_cached
    FROM github_repo_stats grs WHERE grs.repo_url = p_repo_url;
  ELSE
    RETURN QUERY SELECT COALESCE(grs.stars, 0) as stars, grs.forks, grs.watchers, grs.open_issues, grs.last_fetched_at, FALSE as is_cached
    FROM github_repo_stats grs WHERE grs.repo_url = p_repo_url LIMIT 1;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 0::INTEGER as stars, NULL::INTEGER as forks, NULL::INTEGER as watchers,
        NULL::INTEGER as open_issues, NULL::TIMESTAMPTZ as last_fetched_at, FALSE as is_cached;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_github_stars"("p_repo_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_github_stars"("p_repo_url" "text") IS 'Returns GitHub repo stats with caching. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



CREATE OR REPLACE FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_week_start DATE;
  v_category TEXT;
  v_category_data JSONB;
  v_result JSONB := '{}'::JSONB;
  v_stats JSONB := '{}'::JSONB;
BEGIN
  -- Calculate week start correctly (Monday of current week)
  -- Fix: Use DATE_TRUNC('week', CURRENT_DATE) which returns Monday by default in PostgreSQL
  v_week_start := COALESCE(
    p_week_start,
    DATE_TRUNC('week', CURRENT_DATE)::DATE
  );

  -- Build enriched category data (analytics + featured flags)
  FOR v_category IN SELECT unnest(p_category_ids)
  LOOP
    -- Get content for this category with analytics and featured data
    SELECT COALESCE(jsonb_agg(item_data), '[]'::jsonb)
    INTO v_category_data
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
        'category', c.category,
        'viewCount', COALESCE(a.view_count, 0),
        'copyCount', COALESCE(a.copy_count, 0),
        '_featured', CASE
          WHEN f.rank IS NOT NULL
          THEN jsonb_build_object('rank', f.rank, 'score', f.final_score)
          ELSE NULL
        END
      ) as item_data
      FROM content c
      LEFT JOIN mv_analytics_summary a
        ON a.category = c.category AND a.slug = c.slug
      LEFT JOIN featured_configs f
        ON f.content_type = c.category
        AND f.content_slug = c.slug
        AND f.week_start = v_week_start
      WHERE c.category = v_category
      ORDER BY c.created_at DESC
      LIMIT 100
    ) items;

    -- Add to result
    v_result := v_result || jsonb_build_object(v_category, v_category_data);

    -- Accumulate stats count
    v_stats := v_stats || jsonb_build_object(
      v_category,
      (SELECT COUNT(*)::integer FROM content WHERE category = v_category)
    );
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
    'guides', (SELECT COUNT(*)::integer FROM content WHERE category = 'guides'),
    'changelog', (SELECT COUNT(*)::integer FROM changelog_entries)
  );

  -- Return complete enriched data
  RETURN jsonb_build_object(
    'categoryData', v_result,
    'stats', v_stats,
    'weekStart', v_week_start
  );
END;
$$;


ALTER FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") IS 'FIXED week calculation: Uses DATE_TRUNC for correct Monday. Single table scan replaces 9 separate queries.';



CREATE OR REPLACE FUNCTION "public"."get_job_detail"("p_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job JSONB;
BEGIN
  -- Input validation
  IF p_slug IS NULL OR LENGTH(TRIM(p_slug)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Single indexed lookup (slug has UNIQUE constraint)
  SELECT jsonb_build_object(
    'id', j.id,
    'slug', j.slug,
    'title', j.title,
    'company', j.company,
    'description', j.description,
    'location', j.location,
    'remote', j.remote,
    'salary', j.salary,
    'type', j.type,
    'category', j.category,
    'tags', j.tags,
    'requirements', j.requirements,
    'benefits', j.benefits,
    'link', j.link,
    'contact_email', j.contact_email,
    'posted_at', j.posted_at,
    'expires_at', j.expires_at,
    'active', j.active,
    'status', j.status,
    'order', j.order,
    'created_at', j.created_at,
    'updated_at', j.updated_at
  ) INTO v_job
  FROM public.jobs j
  WHERE j.slug = p_slug
    AND j.status = 'active'
  LIMIT 1;

  RETURN v_job;
END;
$$;


ALTER FUNCTION "public"."get_job_detail"("p_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_job_detail"("p_slug" "text") IS 'Returns single job by slug for detail page';



CREATE OR REPLACE FUNCTION "public"."get_jobs_by_category"("p_category" "text") RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT * FROM public.jobs
  WHERE status = 'active' AND active = true AND category = p_category
  ORDER BY posted_at DESC;
$$;


ALTER FUNCTION "public"."get_jobs_by_category"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_jobs_by_category"("p_category" "text") IS 'Returns active jobs by category. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



CREATE OR REPLACE FUNCTION "public"."get_jobs_count"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT COUNT(*)::INTEGER FROM public.jobs WHERE status = 'active' AND active = true;
$$;


ALTER FUNCTION "public"."get_jobs_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_jobs_count"() IS 'Returns count of active jobs. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



CREATE OR REPLACE FUNCTION "public"."get_jobs_list"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_jobs JSONB;
BEGIN
  -- Single optimized query with proper ordering
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', j.id,
        'slug', j.slug,
        'title', j.title,
        'company', j.company,
        'description', j.description,
        'location', j.location,
        'remote', j.remote,
        'salary', j.salary,
        'type', j.type,
        'category', j.category,
        'tags', j.tags,
        'requirements', j.requirements,
        'benefits', j.benefits,
        'link', j.link,
        'contact_email', j.contact_email,
        'posted_at', j.posted_at,
        'expires_at', j.expires_at,
        'active', j.active,
        'status', j.status,
        'order', j.order,
        'created_at', j.created_at,
        'updated_at', j.updated_at
      ) ORDER BY j.order DESC, j.posted_at DESC
    ),
    '[]'::jsonb
  ) INTO v_jobs
  FROM public.jobs j
  WHERE j.status = 'active'
    AND j.active = true;

  RETURN v_jobs;
END;
$$;


ALTER FUNCTION "public"."get_jobs_list"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_jobs_list"() IS 'Returns all active jobs ordered by priority and date';



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



CREATE OR REPLACE FUNCTION "public"."get_my_submissions"("p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_submissions JSONB;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'submission_type', submission_type,
        'status', status,
        'name', name,
        'description', description,
        'category', category,
        'moderator_notes', moderator_notes,
        'created_at', created_at,
        'moderated_at', moderated_at
      ) ORDER BY created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_submissions
  FROM content_submissions
  WHERE submitter_id = v_user_id
  LIMIT p_limit
  OFFSET p_offset;

  RETURN v_submissions;
END;
$$;


ALTER FUNCTION "public"."get_my_submissions"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_submissions"("p_limit" integer, "p_offset" integer) IS 'Get current user''s submissions with status.';



CREATE OR REPLACE FUNCTION "public"."get_navigation_menu"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'primary', (
      -- Category-based routes (agents, commands, hooks, mcp, rules, statuslines, collections, guides)
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'path', '/' || url_slug,
          'title', plural_title,
          'description', description,
          'iconName', icon_name,
          'group', 'primary'
        ) ORDER BY title
      ), '[]'::jsonb)
      FROM category_configs
      WHERE show_on_homepage = true
    ),
    'secondary', (
      -- Static secondary routes
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'path', path,
          'title', title,
          'description', description,
          'iconName', icon_name,
          'group', 'secondary'
        ) ORDER BY sort_order
      ), '[]'::jsonb)
      FROM static_routes
      WHERE group_name = 'secondary' AND is_active = true
    ),
    'actions', (
      -- Static action routes
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'path', path,
          'title', title,
          'description', description,
          'iconName', icon_name,
          'group', 'actions'
        ) ORDER BY sort_order
      ), '[]'::jsonb)
      FROM static_routes
      WHERE group_name = 'actions' AND is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_navigation_menu"() OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."get_pending_submissions"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_filter_type" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_submissions JSONB;
BEGIN
  -- Check admin role
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized - admin role required';
  END IF;

  -- Get pending submissions
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', cs.id,
        'submission_type', cs.submission_type,
        'status', cs.status,
        'name', cs.name,
        'description', cs.description,
        'category', cs.category,
        'author', cs.author,
        'author_profile_url', cs.author_profile_url,
        'github_url', cs.github_url,
        'tags', cs.tags,
        'content_data', cs.content_data,
        'submitter_id', cs.submitter_id,
        'submitter_email', cs.submitter_email,
        'spam_score', cs.spam_score,
        'created_at', cs.created_at
      ) ORDER BY cs.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_submissions
  FROM content_submissions cs
  WHERE cs.status = 'pending'
    AND (p_filter_type IS NULL OR cs.submission_type::TEXT = p_filter_type)
  LIMIT p_limit
  OFFSET p_offset;

  RETURN v_submissions;
END;
$$;


ALTER FUNCTION "public"."get_pending_submissions"("p_limit" integer, "p_offset" integer, "p_filter_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_pending_submissions"("p_limit" integer, "p_offset" integer, "p_filter_type" "text") IS 'Get pending submissions for admin review.';



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



CREATE OR REPLACE FUNCTION "public"."get_sidebar_guides_data"("p_limit" integer DEFAULT 5) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'trending', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'slug', slug,
          'title', title,
          'view_count', view_count
        )
      ), '[]'::jsonb)
      FROM mv_trending_content
      WHERE category = 'guides'
      ORDER BY view_count DESC
      LIMIT p_limit
    ),
    'recent', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'slug', slug,
          'title', title,
          'created_at', created_at
        )
      ), '[]'::jsonb)
      FROM (
        SELECT slug, title, created_at
        FROM content
        WHERE category = 'guides'
        ORDER BY created_at DESC
        LIMIT p_limit
      ) recent_guides
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_sidebar_guides_data"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_similar_content"("p_content_type" "text", "p_content_slug" "text", "p_limit" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'similar_items', COALESCE(jsonb_agg(
      jsonb_build_object(
        'slug', c.slug,
        'title', COALESCE(c.title, c.slug),
        'description', COALESCE(c.description, ''),
        'category', c.category,
        'score', ROUND((cs.similarity_score * 100)::numeric, 0),
        'tags', COALESCE(c.tags, ARRAY[]::text[]),
        'similarity_factors', cs.similarity_factors,
        'calculated_at', cs.calculated_at
      ) ORDER BY cs.similarity_score DESC
    ), '[]'::jsonb),
    'source_item', jsonb_build_object(
      'slug', p_content_slug,
      'category', p_content_type
    ),
    'algorithm_version', 'v1.0'
  ) INTO v_result
  FROM content_similarities cs
  INNER JOIN content c ON c.category = cs.content_b_type AND c.slug = cs.content_b_slug
  WHERE cs.content_a_type = p_content_type AND cs.content_a_slug = p_content_slug
  LIMIT p_limit;

  RETURN COALESCE(v_result, jsonb_build_object(
    'similar_items', '[]'::jsonb,
    'source_item', jsonb_build_object('slug', p_content_slug, 'category', p_content_type),
    'algorithm_version', 'v1.0-fallback'
  ));
END;
$$;


ALTER FUNCTION "public"."get_similar_content"("p_content_type" "text", "p_content_slug" "text", "p_limit" integer) OWNER TO "postgres";


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
  v_trending JSONB;
  v_popular JSONB;
  v_recent JSONB;
  v_total_count INTEGER;
  v_display_limit INTEGER := 12; -- Fixed limit for curated display
BEGIN
  -- Get total count from unified content table
  SELECT COUNT(*)::INTEGER
  INTO v_total_count
  FROM content
  WHERE p_category IS NULL OR category = p_category;

  -- Get top 12 trending items (LIMIT in subquery BEFORE agg)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', category,
      'slug', slug,
      'title', title,
      'description', description,
      'author', author,
      'tags', tags,
      'trendingScore', trending_score,
      'viewCount', view_count,
      'copyCount', copy_count,
      'rankOverall', rank_overall,
      'rankInCategory', rank_in_category
    ) ORDER BY trending_score DESC
  ), '[]'::JSONB)
  INTO v_trending
  FROM (
    SELECT * FROM mv_trending_content
    WHERE (p_category IS NULL OR category = p_category)
    ORDER BY trending_score DESC
    LIMIT v_display_limit
  ) t;

  -- Get top 12 popular items (LIMIT in subquery)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', category,
      'slug', slug,
      'title', title,
      'description', description,
      'author', author,
      'tags', tags,
      'viewCount', view_count,
      'popularityScore', popularity_score
    ) ORDER BY view_count DESC
  ), '[]'::JSONB)
  INTO v_popular
  FROM (
    SELECT * FROM mv_content_stats
    WHERE (p_category IS NULL OR category = p_category)
    ORDER BY view_count DESC
    LIMIT v_display_limit
  ) cs;

  -- Get top 12 recent items (LIMIT in subquery)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', category,
      'slug', slug,
      'title', title,
      'description', description,
      'author', author,
      'tags', tags,
      'dateAdded', date_added,
      'viewCount', view_count
    ) ORDER BY date_added DESC
  ), '[]'::JSONB)
  INTO v_recent
  FROM (
    SELECT 
      c.category,
      c.slug,
      c.title,
      c.description,
      c.author,
      c.tags,
      c.date_added,
      COALESCE(a.view_count, 0) as view_count
    FROM content c
    LEFT JOIN mv_analytics_summary a ON (a.category = c.category AND a.slug = c.slug)
    WHERE (p_category IS NULL OR c.category = p_category)
      AND c.date_added >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY c.date_added DESC
    LIMIT v_display_limit
  ) r;

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
      'displayLimit', v_display_limit,
      'algorithm', 'curated_top_12'
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_trending_page"("p_period" "public"."trending_period", "p_metric" "public"."trending_metric", "p_category" "text", "p_page" integer, "p_limit" integer) IS 'Trending page with EXACTLY top 12 items per tab. Fixed with subquery LIMIT before aggregation.';



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



CREATE OR REPLACE FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_summary RECORD;
BEGIN
  SELECT
    COALESCE(total_posts, 0) as total_posts, COALESCE(total_comments, 0) as total_comments,
    COALESCE(total_votes, 0) as total_votes, COALESCE(total_submissions, 0) as total_submissions,
    COALESCE(merged_submissions, 0) as merged_submissions, COALESCE(total_activity, 0) as total_activity
  INTO v_summary FROM public.user_activity_summary WHERE user_id = p_user_id;
  IF v_summary IS NULL THEN
    RETURN jsonb_build_object(
      'total_posts', 0, 'total_comments', 0, 'total_votes', 0,
      'total_submissions', 0, 'merged_submissions', 0, 'total_activity', 0
    );
  END IF;
  RETURN row_to_json(v_summary)::JSONB;
END;
$$;


ALTER FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid") IS 'Returns user activity summary from materialized view. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."get_user_affinities"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_min_score" numeric DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_affinities JSONB;
  v_total_count INT;
  v_last_calculated TIMESTAMPTZ;
BEGIN
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id, 'user_id', user_id, 'content_type', content_type,
        'content_slug', content_slug, 'affinity_score', affinity_score,
        'based_on', based_on, 'calculated_at', calculated_at
      ) ORDER BY affinity_score DESC
    ), '[]'::jsonb),
    COUNT(*),
    MAX(calculated_at)
  INTO v_affinities, v_total_count, v_last_calculated
  FROM user_affinities
  WHERE user_id = p_user_id AND affinity_score >= p_min_score
  LIMIT p_limit;

  RETURN jsonb_build_object(
    'affinities', v_affinities,
    'total_count', COALESCE(v_total_count, 0),
    'last_calculated', COALESCE(v_last_calculated, NOW())
  );
END;
$$;


ALTER FUNCTION "public"."get_user_affinities"("p_user_id" "uuid", "p_limit" integer, "p_min_score" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_affinities"("p_user_id" "uuid", "p_limit" integer, "p_min_score" numeric) IS 'Returns user content affinities. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."get_user_collection_detail"("p_user_slug" "text", "p_collection_slug" "text", "p_viewer_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_collection_id UUID;
  v_result JSONB;
BEGIN
  -- Input validation
  IF p_user_slug IS NULL OR LENGTH(TRIM(p_user_slug)) = 0 OR
     p_collection_slug IS NULL OR LENGTH(TRIM(p_collection_slug)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Get user ID (indexed lookup)
  SELECT id INTO v_user_id
  FROM public.users
  WHERE slug = p_user_slug
  LIMIT 1;
  
  -- Early return if user not found
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get collection ID and verify it's public (indexed lookup)
  SELECT id INTO v_collection_id
  FROM public.user_collections
  WHERE user_id = v_user_id 
    AND slug = p_collection_slug
    AND is_public = true
  LIMIT 1;

  -- Early return if collection not found or not public
  IF v_collection_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build complete response with CTEs for efficiency
  WITH user_data AS (
    SELECT id, slug, name, image, tier
    FROM public.users
    WHERE id = v_user_id
  ),
  collection_data AS (
    SELECT 
      id, user_id, slug, name, description, is_public,
      item_count, view_count, created_at, updated_at
    FROM public.user_collections
    WHERE id = v_collection_id
  ),
  collection_items AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'collection_id', collection_id,
        'content_type', content_type,
        'content_slug', content_slug,
        'notes', notes,
        'order', "order",
        'added_at', added_at
      ) ORDER BY "order" ASC
    ) as items
    FROM public.collection_items
    WHERE collection_id = v_collection_id
    ORDER BY "order" ASC
  )
  SELECT jsonb_build_object(
    'user', (
      SELECT jsonb_build_object(
        'id', id,
        'slug', slug,
        'name', name,
        'image', image,
        'tier', tier
      )
      FROM user_data
    ),
    'collection', (
      SELECT jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'slug', slug,
        'name', name,
        'description', description,
        'is_public', is_public,
        'item_count', item_count,
        'view_count', view_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
      FROM collection_data
    ),
    'items', COALESCE((SELECT items FROM collection_items), '[]'::jsonb),
    'isOwner', (
      CASE
        WHEN p_viewer_id IS NULL THEN false
        ELSE p_viewer_id = v_user_id
      END
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_collection_detail"("p_user_slug" "text", "p_collection_slug" "text", "p_viewer_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_collection_detail"("p_user_slug" "text", "p_collection_slug" "text", "p_viewer_id" "uuid") IS 'Production-optimized collection detail RPC. Returns user, collection, and ordered items in single query. <30ms execution. Returns NULL for non-existent/private collections.';



CREATE OR REPLACE FUNCTION "public"."get_user_dashboard"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_submissions JSONB;
  v_companies JSONB;
  v_jobs JSONB;
BEGIN
  -- Fetch user submissions (all fields from submissions table)
  SELECT COALESCE(jsonb_agg(to_jsonb(s.*) ORDER BY s.created_at DESC), '[]'::jsonb)
  INTO v_submissions
  FROM submissions s
  WHERE s.user_id = p_user_id;

  -- Fetch user companies (all fields from companies table)
  SELECT COALESCE(jsonb_agg(to_jsonb(c.*) ORDER BY c.created_at DESC), '[]'::jsonb)
  INTO v_companies
  FROM companies c
  WHERE c.owner_id = p_user_id;

  -- Fetch user jobs excluding deleted (all fields from jobs table)
  SELECT COALESCE(jsonb_agg(to_jsonb(j.*) ORDER BY j.created_at DESC), '[]'::jsonb)
  INTO v_jobs
  FROM jobs j
  WHERE j.user_id = p_user_id AND j.status != 'deleted';

  -- Return combined dashboard data
  RETURN jsonb_build_object(
    'submissions', v_submissions,
    'companies', v_companies,
    'jobs', v_jobs
  );
END;
$$;


ALTER FUNCTION "public"."get_user_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."get_user_library"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Build complete library response with bookmarks, collections, and stats
  SELECT jsonb_build_object(
    'bookmarks', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'user_id', b.user_id,
          'content_type', b.content_type,
          'content_slug', b.content_slug,
          'notes', b.notes,
          'created_at', b.created_at,
          'updated_at', b.updated_at
        ) ORDER BY b.created_at DESC
      ), '[]'::jsonb)
      FROM public.bookmarks b
      WHERE b.user_id = p_user_id
    ),
    'collections', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'user_id', c.user_id,
          'slug', c.slug,
          'name', c.name,
          'description', c.description,
          'is_public', c.is_public,
          'item_count', c.item_count,
          'view_count', c.view_count,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) ORDER BY c.created_at DESC
      ), '[]'::jsonb)
      FROM public.user_collections c
      WHERE c.user_id = p_user_id
    ),
    'stats', jsonb_build_object(
      'bookmarkCount', (
        SELECT COUNT(*) 
        FROM public.bookmarks 
        WHERE user_id = p_user_id
      ),
      'collectionCount', (
        SELECT COUNT(*) 
        FROM public.user_collections 
        WHERE user_id = p_user_id
      ),
      'totalCollectionItems', (
        SELECT COALESCE(SUM(item_count), 0)
        FROM public.user_collections
        WHERE user_id = p_user_id
      ),
      'totalCollectionViews', (
        SELECT COALESCE(SUM(view_count), 0)
        FROM public.user_collections
        WHERE user_id = p_user_id
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_library"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_library"("p_user_id" "uuid") IS 'Returns complete user library data including bookmarks, collections, and aggregated stats. Single RPC replaces 2+ separate queries for library page.';



CREATE OR REPLACE FUNCTION "public"."get_user_profile"("p_user_slug" "text", "p_viewer_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Input validation
  IF p_user_slug IS NULL OR LENGTH(TRIM(p_user_slug)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Single indexed lookup for user (slug has UNIQUE index)
  SELECT id INTO v_user_id
  FROM public.users
  WHERE slug = p_user_slug 
    AND public = true
  LIMIT 1;
  
  -- Early return if user not found
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build complete profile with CTEs for efficiency
  WITH profile_data AS (
    SELECT 
      id, slug, name, image, bio, website, location, 
      tier, reputation_score, public, created_at
    FROM public.users
    WHERE id = v_user_id
  ),
  stats AS (
    SELECT
      (SELECT COUNT(*) FROM public.followers WHERE following_id = v_user_id) as follower_count,
      (SELECT COUNT(*) FROM public.followers WHERE follower_id = v_user_id) as following_count,
      (SELECT COUNT(*) FROM public.posts WHERE user_id = v_user_id) as posts_count,
      (SELECT COUNT(*) FROM public.user_collections WHERE user_id = v_user_id AND is_public = true) as collections_count,
      (SELECT COUNT(*) FROM public.user_content WHERE user_id = v_user_id AND active = true) as contributions_count
  ),
  recent_posts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'title', title,
        'content', content,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY created_at DESC
    ) as posts
    FROM (
      SELECT id, user_id, title, content, created_at, updated_at
      FROM public.posts
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT 10
    ) p
  ),
  public_collections AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'slug', slug,
        'name', name,
        'description', description,
        'is_public', is_public,
        'item_count', item_count,
        'view_count', view_count,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as collections
    FROM (
      SELECT id, slug, name, description, is_public, item_count, view_count, created_at
      FROM public.user_collections
      WHERE user_id = v_user_id AND is_public = true
      ORDER BY created_at DESC
      LIMIT 6
    ) c
  ),
  user_contributions AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'content_type', content_type,
        'content_slug', content_slug,
        'status', status,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as contributions
    FROM (
      SELECT id, content_type, content_slug, status, created_at
      FROM public.user_content
      WHERE user_id = v_user_id AND active = true
      ORDER BY created_at DESC
      LIMIT 12
    ) cont
  ),
  following_status AS (
    SELECT CASE
      WHEN p_viewer_id IS NULL THEN false
      WHEN p_viewer_id = v_user_id THEN false
      ELSE EXISTS (
        SELECT 1
        FROM public.followers
        WHERE follower_id = p_viewer_id 
          AND following_id = v_user_id
        LIMIT 1
      )
    END as is_following
  )
  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', id,
        'slug', slug,
        'name', name,
        'image', image,
        'bio', bio,
        'website', website,
        'location', location,
        'tier', tier,
        'reputation_score', reputation_score,
        'created_at', created_at
      )
      FROM profile_data
    ),
    'stats', (
      SELECT jsonb_build_object(
        'followerCount', follower_count,
        'followingCount', following_count,
        'postsCount', posts_count,
        'collectionsCount', collections_count,
        'contributionsCount', contributions_count
      )
      FROM stats
    ),
    'posts', COALESCE((SELECT posts FROM recent_posts), '[]'::jsonb),
    'collections', COALESCE((SELECT collections FROM public_collections), '[]'::jsonb),
    'contributions', COALESCE((SELECT contributions FROM user_contributions), '[]'::jsonb),
    'isFollowing', (SELECT is_following FROM following_status),
    'isOwner', (p_viewer_id IS NOT NULL AND p_viewer_id = v_user_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_profile"("p_user_slug" "text", "p_viewer_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_profile"("p_user_slug" "text", "p_viewer_id" "uuid") IS 'Production-optimized user profile RPC. Single query with CTEs, indexed lookups, efficient aggregations. Replaces 6+ queries with <50ms execution. Returns NULL for non-existent/private profiles.';



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



CREATE OR REPLACE FUNCTION "public"."import_redis_seed_data"("redis_data" "jsonb") RETURNS TABLE("total_processed" integer, "total_views_added" integer, "total_copies_added" integer, "items_processed" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  item JSONB;
  item_count INTEGER;
  total_rows INTEGER := 0;
  view_rows INTEGER := 0;
  copy_rows INTEGER := 0;
  items_count INTEGER := 0;
  batch_rows user_interactions[];
  batch_size CONSTANT INTEGER := 500;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(redis_data)
  LOOP
    item_count := (item->>'count')::INTEGER;
    items_count := items_count + 1;
    IF item->>'interaction_type' = 'view' THEN
      view_rows := view_rows + item_count;
    ELSE
      copy_rows := copy_rows + item_count;
    END IF;
    INSERT INTO user_interactions (content_type, content_slug, interaction_type, user_id, created_at)
    SELECT item->>'content_type', item->>'content_slug', (item->>'interaction_type')::text,
      NULL, NOW() - (random() * INTERVAL '90 days')
    FROM generate_series(1, item_count);
    total_rows := total_rows + item_count;
    IF items_count % 10 = 0 THEN
      RAISE NOTICE 'Processed % items, inserted % rows...', items_count, total_rows;
    END IF;
  END LOOP;
  RAISE NOTICE 'Import complete: % items processed, % total rows inserted', items_count, total_rows;
  RETURN QUERY SELECT total_rows, view_rows, copy_rows, items_count;
END;
$$;


ALTER FUNCTION "public"."import_redis_seed_data"("redis_data" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."increment_usage"("p_content_id" "uuid", "p_action_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  -- Always increment copy_count (unified "use count" for frontend display)
  UPDATE content
  SET copy_count = copy_count + 1
  WHERE id = p_content_id;
  
  -- Also increment specific tracker for backend analytics
  IF p_action_type = 'download_zip' THEN
    UPDATE content
    SET 
      download_count = download_count + 1,
      last_downloaded_at = NOW()
    WHERE id = p_content_id;
    
  ELSIF p_action_type = 'download_markdown' THEN
    UPDATE content
    SET markdown_download_count = markdown_download_count + 1
    WHERE id = p_content_id;
    
  ELSIF p_action_type = 'llmstxt' THEN
    UPDATE content
    SET llmstxt_copy_count = llmstxt_copy_count + 1
    WHERE id = p_content_id;
  END IF;
  
  -- Note: 'copy' action type just increments copy_count (already done above)
END;
$$;


ALTER FUNCTION "public"."increment_usage"("p_content_id" "uuid", "p_action_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"("p_user_id" "uuid") IS 'Check if user has admin role';



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


CREATE OR REPLACE FUNCTION "public"."manage_collection"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_collection_id UUID;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'update', 'delete', 'add_item', 'remove_item') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create, update, delete, add_item, or remove_item', p_action;
  END IF;

  -- CREATE COLLECTION
  IF p_action = 'create' THEN
    -- Generate slug if not provided
    v_slug := COALESCE(
      p_data->>'slug',
      LOWER(REGEXP_REPLACE(p_data->>'name', '[^a-zA-Z0-9]+', '-', 'g'))
    );
    
    -- Insert collection
    INSERT INTO user_collections (user_id, name, slug, description, is_public)
    VALUES (
      p_user_id,
      p_data->>'name',
      v_slug,
      p_data->>'description',
      COALESCE((p_data->>'is_public')::BOOLEAN, FALSE)
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'collection', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'name', name,
        'slug', slug,
        'description', description,
        'is_public', is_public,
        'view_count', view_count,
        'bookmark_count', bookmark_count,
        'item_count', item_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    RETURN v_result;

  -- UPDATE COLLECTION
  ELSIF p_action = 'update' THEN
    v_collection_id := (p_data->>'id')::UUID;
    v_slug := p_data->>'slug';
    
    -- Update with ownership verification (atomic)
    UPDATE user_collections
    SET
      name = p_data->>'name',
      slug = COALESCE(v_slug, slug),
      description = p_data->>'description',
      is_public = COALESCE((p_data->>'is_public')::BOOLEAN, is_public),
      updated_at = NOW()
    WHERE id = v_collection_id AND user_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'collection', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'name', name,
        'slug', slug,
        'description', description,
        'is_public', is_public,
        'view_count', view_count,
        'bookmark_count', bookmark_count,
        'item_count', item_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Collection not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;

  -- DELETE COLLECTION
  ELSIF p_action = 'delete' THEN
    v_collection_id := (p_data->>'id')::UUID;
    
    -- Delete with ownership verification (CASCADE handles items)
    DELETE FROM user_collections
    WHERE id = v_collection_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Collection not found or you do not have permission to delete it';
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);

  -- ADD ITEM TO COLLECTION
  ELSIF p_action = 'add_item' THEN
    v_collection_id := (p_data->>'collection_id')::UUID;
    
    -- Verify collection ownership
    IF NOT EXISTS (
      SELECT 1 FROM user_collections 
      WHERE id = v_collection_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Collection not found or you do not have permission';
    END IF;
    
    -- Insert item (unique constraint prevents duplicates)
    INSERT INTO collection_items (
      collection_id,
      user_id,
      content_type,
      content_slug,
      notes,
      "order"
    )
    VALUES (
      v_collection_id,
      p_user_id,
      p_data->>'content_type',
      p_data->>'content_slug',
      p_data->>'notes',
      COALESCE((p_data->>'order')::INTEGER, 0)
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'item', jsonb_build_object(
        'id', id,
        'collection_id', collection_id,
        'user_id', user_id,
        'content_type', content_type,
        'content_slug', content_slug,
        'notes', notes,
        'order', "order",
        'added_at', added_at
      )
    ) INTO v_result;
    
    RETURN v_result;

  -- REMOVE ITEM FROM COLLECTION
  ELSIF p_action = 'remove_item' THEN
    v_collection_id := (p_data->>'collection_id')::UUID;
    
    -- Verify collection ownership
    IF NOT EXISTS (
      SELECT 1 FROM user_collections 
      WHERE id = v_collection_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Collection not found or you do not have permission';
    END IF;
    
    -- Delete item
    DELETE FROM collection_items
    WHERE id = (p_data->>'id')::UUID;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item not found';
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_collection"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_collection"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated collection management - handles create, update, delete, add_item, remove_item operations with ownership verification';



CREATE OR REPLACE FUNCTION "public"."manage_comment"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_comment_id UUID;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'delete') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create or delete', p_action;
  END IF;

  -- CREATE COMMENT
  IF p_action = 'create' THEN
    -- Insert comment
    INSERT INTO comments (user_id, post_id, content)
    VALUES (
      p_user_id,
      (p_data->>'post_id')::UUID,
      p_data->>'content'
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'comment', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'post_id', post_id,
        'content', content,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    RETURN v_result;

  -- DELETE COMMENT
  ELSIF p_action = 'delete' THEN
    v_comment_id := (p_data->>'id')::UUID;
    
    -- Delete with ownership verification (atomic)
    DELETE FROM comments
    WHERE id = v_comment_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Comment not found or you do not have permission to delete it';
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_comment"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_comment"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated comment management - handles create and delete operations with ownership verification';



CREATE OR REPLACE FUNCTION "public"."manage_company"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_company_id UUID;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'update') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create or update', p_action;
  END IF;

  -- CREATE COMPANY
  IF p_action = 'create' THEN
    -- Generate slug from name if not provided
    v_slug := COALESCE(
      p_data->>'slug',
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p_data->>'name', '\s+', '-', 'g'), '[^a-z0-9\-]', '', 'g'))
    );
    
    -- Insert company
    INSERT INTO companies (
      owner_id,
      name,
      slug,
      logo,
      website,
      description,
      size,
      industry,
      using_cursor_since
    )
    VALUES (
      p_user_id,
      p_data->>'name',
      v_slug,
      p_data->>'logo',
      p_data->>'website',
      p_data->>'description',
      p_data->>'size',
      p_data->>'industry',
      CASE 
        WHEN p_data->>'using_cursor_since' IS NOT NULL 
        THEN (p_data->>'using_cursor_since')::DATE
        ELSE NULL
      END
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'company', jsonb_build_object(
        'id', id,
        'owner_id', owner_id,
        'name', name,
        'slug', slug,
        'logo', logo,
        'website', website,
        'description', description,
        'size', size,
        'industry', industry,
        'using_cursor_since', using_cursor_since,
        'featured', featured,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    RETURN v_result;

  -- UPDATE COMPANY
  ELSIF p_action = 'update' THEN
    v_company_id := (p_data->>'id')::UUID;
    
    -- Update with ownership verification (atomic)
    UPDATE companies
    SET
      name = COALESCE(p_data->>'name', name),
      slug = COALESCE(p_data->>'slug', slug),
      logo = CASE WHEN p_data ? 'logo' THEN p_data->>'logo' ELSE logo END,
      website = CASE WHEN p_data ? 'website' THEN p_data->>'website' ELSE website END,
      description = CASE WHEN p_data ? 'description' THEN p_data->>'description' ELSE description END,
      size = CASE WHEN p_data ? 'size' THEN p_data->>'size' ELSE size END,
      industry = CASE WHEN p_data ? 'industry' THEN p_data->>'industry' ELSE industry END,
      using_cursor_since = CASE 
        WHEN p_data ? 'using_cursor_since' AND p_data->>'using_cursor_since' IS NOT NULL
        THEN (p_data->>'using_cursor_since')::DATE
        WHEN p_data ? 'using_cursor_since' THEN NULL
        ELSE using_cursor_since
      END,
      updated_at = NOW()
    WHERE id = v_company_id AND owner_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'company', jsonb_build_object(
        'id', id,
        'owner_id', owner_id,
        'name', name,
        'slug', slug,
        'logo', logo,
        'website', website,
        'description', description,
        'size', size,
        'industry', industry,
        'using_cursor_since', using_cursor_since,
        'featured', featured,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Company not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_company"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_company"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated company management - handles create and update operations with auto-slug generation and ownership verification';



CREATE OR REPLACE FUNCTION "public"."manage_job"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job_id UUID;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'update', 'delete', 'toggle_status') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create, update, delete, or toggle_status', p_action;
  END IF;

  -- CREATE JOB
  IF p_action = 'create' THEN
    -- Generate slug from title
    v_slug := LOWER(REGEXP_REPLACE(
      REGEXP_REPLACE(p_data->>'title', '\s+', '-', 'g'),
      '[^a-z0-9\-]', '', 'g'
    )) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Insert job with business rules
    INSERT INTO jobs (
      user_id,
      title,
      company,
      description,
      type,
      category,
      link,
      location,
      salary,
      remote,
      workplace,
      experience,
      tags,
      requirements,
      benefits,
      contact_email,
      company_logo,
      company_id,
      slug,
      status,
      payment_amount,
      payment_status,
      plan
    )
    VALUES (
      p_user_id,
      p_data->>'title',
      p_data->>'company',
      p_data->>'description',
      p_data->>'type',
      p_data->>'category',
      p_data->>'link',
      p_data->>'location',
      p_data->>'salary',
      COALESCE((p_data->>'remote')::BOOLEAN, FALSE),
      p_data->>'workplace',
      p_data->>'experience',
      COALESCE(p_data->'tags', '[]'::JSONB),
      COALESCE(p_data->'requirements', '[]'::JSONB),
      COALESCE(p_data->'benefits', '[]'::JSONB),
      p_data->>'contact_email',
      p_data->>'company_logo',
      CASE WHEN p_data->>'company_id' IS NOT NULL THEN (p_data->>'company_id')::UUID ELSE NULL END,
      v_slug,
      'pending_review',
      299.0,  -- Business rule: standard job posting fee
      'unpaid',
      'standard'
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'job', to_jsonb(jobs.*),
      'requiresPayment', TRUE,
      'message', 'Job submitted for review! You will receive payment instructions via email after admin approval.'
    ) INTO v_result;
    
    RETURN v_result;

  -- UPDATE JOB
  ELSIF p_action = 'update' THEN
    v_job_id := (p_data->>'id')::UUID;
    
    -- Update with ownership verification
    UPDATE jobs
    SET
      title = COALESCE(p_data->>'title', title),
      company = COALESCE(p_data->>'company', company),
      description = COALESCE(p_data->>'description', description),
      type = COALESCE(p_data->>'type', type),
      category = COALESCE(p_data->>'category', category),
      link = COALESCE(p_data->>'link', link),
      location = CASE WHEN p_data ? 'location' THEN p_data->>'location' ELSE location END,
      salary = CASE WHEN p_data ? 'salary' THEN p_data->>'salary' ELSE salary END,
      remote = COALESCE((p_data->>'remote')::BOOLEAN, remote),
      workplace = CASE WHEN p_data ? 'workplace' THEN p_data->>'workplace' ELSE workplace END,
      experience = CASE WHEN p_data ? 'experience' THEN p_data->>'experience' ELSE experience END,
      tags = COALESCE(p_data->'tags', tags),
      requirements = COALESCE(p_data->'requirements', requirements),
      benefits = COALESCE(p_data->'benefits', benefits),
      contact_email = CASE WHEN p_data ? 'contact_email' THEN p_data->>'contact_email' ELSE contact_email END,
      company_logo = CASE WHEN p_data ? 'company_logo' THEN p_data->>'company_logo' ELSE company_logo END,
      company_id = CASE 
        WHEN p_data ? 'company_id' AND p_data->>'company_id' IS NOT NULL THEN (p_data->>'company_id')::UUID
        WHEN p_data ? 'company_id' THEN NULL
        ELSE company_id
      END,
      updated_at = NOW()
    WHERE id = v_job_id AND user_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'job', to_jsonb(jobs.*)
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Job not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;

  -- DELETE JOB (soft delete)
  ELSIF p_action = 'delete' THEN
    v_job_id := (p_data->>'id')::UUID;
    
    -- Soft delete with ownership verification
    UPDATE jobs
    SET status = 'deleted', updated_at = NOW()
    WHERE id = v_job_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Job not found or you do not have permission to delete it';
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);

  -- TOGGLE STATUS
  ELSIF p_action = 'toggle_status' THEN
    v_job_id := (p_data->>'id')::UUID;
    
    -- Update status with conditional posted_at
    UPDATE jobs
    SET
      status = p_data->>'status',
      posted_at = CASE 
        WHEN p_data->>'status' = 'active' AND posted_at IS NULL THEN NOW()
        ELSE posted_at
      END,
      updated_at = NOW()
    WHERE id = v_job_id AND user_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'job', to_jsonb(jobs.*)
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Job not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_job"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_job"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated job management - handles create, update, delete (soft), and status toggle operations with business rules and ownership verification';



CREATE OR REPLACE FUNCTION "public"."manage_post"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_post_id UUID;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'update', 'delete') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create, update, or delete', p_action;
  END IF;

  -- CREATE POST
  IF p_action = 'create' THEN
    -- Check for duplicate URL if provided
    IF p_data ? 'url' AND p_data->>'url' IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM posts WHERE url = p_data->>'url'
      ) THEN
        RAISE EXCEPTION 'This URL has already been submitted';
      END IF;
    END IF;
    
    -- Insert post
    INSERT INTO posts (user_id, title, content, url)
    VALUES (
      p_user_id,
      p_data->>'title',
      p_data->>'content',
      p_data->>'url'
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'post', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'title', title,
        'content', content,
        'url', url,
        'vote_count', vote_count,
        'comment_count', comment_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    RETURN v_result;

  -- UPDATE POST
  ELSIF p_action = 'update' THEN
    v_post_id := (p_data->>'id')::UUID;
    
    -- Update with ownership verification (atomic)
    UPDATE posts
    SET
      title = COALESCE(p_data->>'title', title),
      content = CASE 
        WHEN p_data ? 'content' THEN p_data->>'content'
        ELSE content
      END,
      updated_at = NOW()
    WHERE id = v_post_id AND user_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'post', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'title', title,
        'content', content,
        'url', url,
        'vote_count', vote_count,
        'comment_count', comment_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Post not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;

  -- DELETE POST
  ELSIF p_action = 'delete' THEN
    v_post_id := (p_data->>'id')::UUID;
    
    -- Delete with ownership verification (CASCADE handles comments, votes)
    DELETE FROM posts
    WHERE id = v_post_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Post not found or you do not have permission to delete it';
    END IF;
    
    RETURN jsonb_build_object('success', TRUE);
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_post"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_post"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated post management - handles create, update, delete operations with duplicate URL prevention and ownership verification';



CREATE OR REPLACE FUNCTION "public"."manage_review"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_review_id UUID;
  v_content_type TEXT;
  v_content_slug TEXT;
  v_result JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('create', 'update', 'delete') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be create, update, or delete', p_action;
  END IF;

  -- CREATE REVIEW
  IF p_action = 'create' THEN
    v_content_type := p_data->>'content_type';
    v_content_slug := p_data->>'content_slug';
    
    -- Check for existing review (prevent duplicates)
    IF EXISTS (
      SELECT 1 FROM review_ratings
      WHERE user_id = p_user_id
        AND content_type = v_content_type
        AND content_slug = v_content_slug
    ) THEN
      RAISE EXCEPTION 'You have already reviewed this content. Use the update action to modify your review.';
    END IF;
    
    -- Insert review with interaction tracking
    INSERT INTO review_ratings (
      user_id,
      content_type,
      content_slug,
      rating,
      review_text,
      helpful_count
    )
    VALUES (
      p_user_id,
      v_content_type,
      v_content_slug,
      (p_data->>'rating')::INTEGER,
      p_data->>'review_text',
      0
    )
    RETURNING jsonb_build_object(
      'success', TRUE,
      'review', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'content_type', content_type,
        'content_slug', content_slug,
        'rating', rating,
        'review_text', review_text,
        'helpful_count', helpful_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    -- Track interaction for personalization (atomic within transaction)
    INSERT INTO user_interactions (
      user_id,
      content_type,
      content_slug,
      interaction_type,
      session_id,
      metadata
    )
    VALUES (
      p_user_id,
      v_content_type,
      v_content_slug,
      'view',
      NULL,
      jsonb_build_object('source', 'review_creation')
    )
    ON CONFLICT DO NOTHING; -- Ignore if already exists
    
    RETURN v_result;

  -- UPDATE REVIEW
  ELSIF p_action = 'update' THEN
    v_review_id := (p_data->>'review_id')::UUID;
    
    -- Build dynamic update (only update provided fields)
    UPDATE review_ratings
    SET
      rating = COALESCE((p_data->>'rating')::INTEGER, rating),
      review_text = CASE 
        WHEN p_data ? 'review_text' THEN p_data->>'review_text'
        ELSE review_text
      END,
      updated_at = NOW()
    WHERE id = v_review_id AND user_id = p_user_id
    RETURNING jsonb_build_object(
      'success', TRUE,
      'review', jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'content_type', content_type,
        'content_slug', content_slug,
        'rating', rating,
        'review_text', review_text,
        'helpful_count', helpful_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
    ) INTO v_result;
    
    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Review not found or you do not have permission to update it';
    END IF;
    
    RETURN v_result;

  -- DELETE REVIEW
  ELSIF p_action = 'delete' THEN
    v_review_id := (p_data->>'review_id')::UUID;
    
    -- Fetch review info for return data before deletion
    SELECT content_type, content_slug
    INTO v_content_type, v_content_slug
    FROM review_ratings
    WHERE id = v_review_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Review not found or you can only delete your own reviews';
    END IF;
    
    -- Delete review (cascades to helpful votes via FK)
    DELETE FROM review_ratings
    WHERE id = v_review_id;
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'content_type', v_content_type,
      'content_slug', v_content_slug
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."manage_review"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."manage_review"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Consolidated review management - handles create, update, delete operations with duplicate prevention and ownership verification';



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



CREATE OR REPLACE FUNCTION "public"."notify_newsletter_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Call send-welcome-email Edge Function via pg_net (async, non-blocking)
  -- This replaces the fire-and-forget email-orchestration.server.ts logic
  PERFORM net.http_post(
    url := 'https://hxeckduifagerhxsktev.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY'),
      'X-Trigger-Source', 'newsletter_subscription'
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'source', NEW.source,
      'referrer', NEW.referrer,
      'copy_type', NEW.copy_type,
      'copy_category', NEW.copy_category,
      'copy_slug', NEW.copy_slug,
      'trigger_type', 'newsletter',
      'subscription_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_newsletter_subscription"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_newsletter_subscription"() IS 'Triggers send-welcome-email Edge Function when newsletter subscription is created. Replaces fire-and-forget email-orchestration.server.ts logic.';



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



CREATE OR REPLACE FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  auth_user RECORD;
  avatar_url TEXT;
  full_name TEXT;
  updated_profile RECORD;
BEGIN
  -- Get auth.users data
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Extract data from OAuth metadata
  avatar_url := COALESCE(
    auth_user.raw_user_meta_data->>'avatar_url',
    auth_user.raw_user_meta_data->>'picture'
  );
  
  full_name := COALESCE(
    auth_user.raw_user_meta_data->>'full_name',
    auth_user.raw_user_meta_data->>'name',
    auth_user.raw_user_meta_data->>'user_name'
  );
  
  -- Update public.users with latest OAuth data and return updated profile
  UPDATE public.users
  SET
    avatar_url = COALESCE(avatar_url, users.avatar_url),
    display_name = COALESCE(full_name, users.display_name),
    email = COALESCE(auth_user.email, users.email),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING * INTO updated_profile;
  
  -- Return profile as JSONB (includes slug for path revalidation)
  RETURN row_to_json(updated_profile)::JSONB;
END;
$$;


ALTER FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") IS 'Refreshes user profile from OAuth provider metadata. Returns updated profile including slug.';



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


CREATE OR REPLACE FUNCTION "public"."reject_submission"("p_submission_id" "uuid", "p_moderator_notes" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check admin role
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized - admin role required';
  END IF;

  -- Update submission status
  UPDATE content_submissions
  SET
    status = 'rejected',
    moderated_by = auth.uid(),
    moderated_at = NOW(),
    moderator_notes = p_moderator_notes,
    updated_at = NOW()
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'status', 'rejected'
  );
END;
$$;


ALTER FUNCTION "public"."reject_submission"("p_submission_id" "uuid", "p_moderator_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reject_submission"("p_submission_id" "uuid", "p_moderator_notes" "text") IS 'Reject submission with moderator notes. Admin only.';



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



CREATE OR REPLACE FUNCTION "public"."render_guide_sections_to_markdown"("sections" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  section JSONB;
  result TEXT := '';
  section_text TEXT;
  section_type TEXT;
  section_content TEXT;
BEGIN
  FOR section IN SELECT jsonb_array_elements(sections)
  LOOP
    section_type := section->>'type';
    section_content := COALESCE(section->>'content', '');
    CASE section_type
      WHEN 'tldr' THEN
        result := result || E'## TL;DR\n\n' || section_content || E'\n\n';
        IF section ? 'keyPoints' THEN
          result := result || E'**Key Points:**\n\n';
          FOR section_text IN SELECT jsonb_array_elements_text(section->'keyPoints')
          LOOP
            result := result || '- ' || COALESCE(section_text, '') || E'\n';
          END LOOP;
          result := result || E'\n';
        END IF;
      WHEN 'heading' THEN
        DECLARE
          level INT := COALESCE((section->>'level')::INT, 2);
          heading_prefix TEXT := repeat('#', level);
        BEGIN
          result := result || heading_prefix || ' ' || section_content || E'\n\n';
        END;
      WHEN 'text' THEN result := result || section_content || E'\n\n';
      WHEN 'callout' THEN
        result := result || E'> **' || COALESCE(section->>'title', 'Note') || E'**\n> \n';
        result := result || '> ' || replace(section_content, E'\n', E'\n> ') || E'\n\n';
      WHEN 'code' THEN
        DECLARE lang TEXT := COALESCE(section->>'language', '');
        BEGIN
          result := result || '```' || lang || E'\n' || section_content || E'\n```\n\n';
        END;
      WHEN 'steps' THEN
        IF section ? 'steps' THEN
          DECLARE step_item JSONB; step_num INT := 1;
          BEGIN
            FOR step_item IN SELECT jsonb_array_elements(section->'steps')
            LOOP
              result := result || step_num::TEXT || '. **' || COALESCE(step_item->>'title', '') || E'**\n';
              result := result || '   ' || replace(COALESCE(step_item->>'content', ''), E'\n', E'\n   ') || E'\n\n';
              step_num := step_num + 1;
            END LOOP;
          END;
        END IF;
      WHEN 'checklist' THEN
        IF section ? 'items' THEN
          FOR section_text IN SELECT jsonb_array_elements_text(section->'items')
          LOOP
            result := result || '- [ ] ' || COALESCE(section_text, '') || E'\n';
          END LOOP;
          result := result || E'\n';
        END IF;
      WHEN 'faq' THEN
        IF section ? 'items' THEN
          DECLARE faq_item JSONB;
          BEGIN
            result := result || E'## FAQ\n\n';
            FOR faq_item IN SELECT jsonb_array_elements(section->'items')
            LOOP
              result := result || E'**Q: ' || COALESCE(faq_item->>'question', '') || E'**\n\n';
              result := result || 'A: ' || COALESCE(faq_item->>'answer', '') || E'\n\n';
            END LOOP;
          END;
        END IF;
      ELSE
        result := result || E'<!-- Section type: ' || COALESCE(section_type, 'unknown') || E' -->\n\n';
    END CASE;
  END LOOP;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."render_guide_sections_to_markdown"("sections" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."render_guide_sections_to_markdown"("sections" "jsonb") IS 'Renders guides JSONB sections array to markdown text for content column.
Handles: tldr, heading, text, callout, code, steps, checklist, faq.
Complex interactive sections (feature_grid, tabs) are preserved in metadata for React rendering.
NULL-safe: Uses COALESCE to handle missing content fields.';



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


CREATE OR REPLACE FUNCTION "public"."set_title_from_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.title IS NULL THEN
    NEW.title := slug_to_title(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_title_from_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."slug_to_title"("p_slug" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  v_words TEXT[];
  v_word TEXT;
  v_result TEXT := '';
  v_acronyms TEXT[] := ARRAY['API', 'AWS', 'CSS', 'JSON', 'SCSS', 'HTML', 'XML', 'HTTP', 'HTTPS', 'URL', 'URI', 'SQL', 'NoSQL', 'REST', 'GraphQL', 'JWT', 'SSH', 'FTP', 'SMTP', 'DNS', 'CDN', 'SDK', 'CLI', 'IDE', 'UI', 'UX', 'AI', 'ML', 'NPM', 'CI', 'CD', 'CI/CD', 'PDF', 'CSV', 'SVG', 'PNG', 'JPG', 'JPEG', 'GIF', 'TCP', 'UDP', 'IP', 'VPN', 'SSL', 'TLS', 'OAuth', 'SAML', 'LDAP', 'DB', 'CRUD', 'ORM', 'MVC', 'MVP', 'MVVM', 'SPA', 'PWA', 'SEO', 'CMS', 'CRM', 'SaaS', 'PaaS', 'IaaS', 'E2E', 'QA', 'TDD', 'BDD', 'CORS', 'CSRF', 'XSS', 'MCP', 'LLM', 'GPT', 'SRE', 'DevOps'];
  v_acronym TEXT;
  v_base_word TEXT;
BEGIN
  -- Split slug by hyphens
  v_words := string_to_array(p_slug, '-');
  
  -- Process each word
  FOREACH v_word IN ARRAY v_words
  LOOP
    IF v_result != '' THEN
      v_result := v_result || ' ';
    END IF;
    
    -- Check if word matches an acronym (case-insensitive)
    v_acronym := NULL;
    FOREACH v_acronym IN ARRAY v_acronyms
    LOOP
      IF LOWER(v_word) = LOWER(v_acronym) THEN
        v_result := v_result || v_acronym;
        EXIT;
      END IF;
    END LOOP;
    
    -- If acronym found, continue to next word
    IF v_acronym IS NOT NULL AND LOWER(v_word) = LOWER(v_acronym) THEN
      CONTINUE;
    END IF;
    
    -- Handle special .js suffix case (nextjs, vuejs, etc)
    IF LOWER(v_word) LIKE '%js' AND LENGTH(v_word) > 2 THEN
      v_base_word := substring(v_word from 1 for LENGTH(v_word) - 2);
      v_acronym := NULL;
      FOREACH v_acronym IN ARRAY v_acronyms
      LOOP
        IF LOWER(v_base_word) = LOWER(v_acronym) THEN
          v_result := v_result || v_acronym || '.js';
          EXIT;
        END IF;
      END LOOP;
      
      IF v_acronym IS NOT NULL AND LOWER(v_base_word) = LOWER(v_acronym) THEN
        CONTINUE;
      END IF;
    END IF;
    
    -- Handle CloudFormation special case
    IF LOWER(v_word) = 'cloudformation' THEN
      v_result := v_result || 'CloudFormation';
      CONTINUE;
    END IF;
    
    -- Default: Title Case
    v_result := v_result || UPPER(substring(v_word from 1 for 1)) || substring(v_word from 2);
  END LOOP;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."slug_to_title"("p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_content_for_review"("p_submission_type" "text", "p_name" "text", "p_description" "text", "p_category" "text", "p_author" "text", "p_content_data" "jsonb", "p_author_profile_url" "text" DEFAULT NULL::"text", "p_github_url" "text" DEFAULT NULL::"text", "p_tags" "text"[] DEFAULT '{}'::"text"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_submission_id UUID;
  v_submitter_id UUID;
  v_submitter_email TEXT;
BEGIN
  -- Get authenticated user
  v_submitter_id := auth.uid();

  IF v_submitter_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get user email from auth.users
  SELECT email INTO v_submitter_email
  FROM auth.users
  WHERE id = v_submitter_id;

  -- Insert submission (CHECK constraints enforce all validation)
  INSERT INTO content_submissions (
    submission_type,
    status,
    name,
    description,
    category,
    author,
    author_profile_url,
    github_url,
    tags,
    content_data,
    submitter_id,
    submitter_email,
    spam_score
  ) VALUES (
    p_submission_type::submission_type,
    'pending'::submission_status,
    p_name,
    p_description,
    p_category,
    p_author,
    p_author_profile_url,
    p_github_url,
    p_tags,
    p_content_data,
    v_submitter_id,
    v_submitter_email,
    0.0
  )
  RETURNING id INTO v_submission_id;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'status', 'pending',
    'message', 'Submission received and pending review'
  );
END;
$$;


ALTER FUNCTION "public"."submit_content_for_review"("p_submission_type" "text", "p_name" "text", "p_description" "text", "p_category" "text", "p_author" "text", "p_content_data" "jsonb", "p_author_profile_url" "text", "p_github_url" "text", "p_tags" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."submit_content_for_review"("p_submission_type" "text", "p_name" "text", "p_description" "text", "p_category" "text", "p_author" "text", "p_content_data" "jsonb", "p_author_profile_url" "text", "p_github_url" "text", "p_tags" "text"[]) IS 'Submit content for admin review. All validation via CHECK constraints.';



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


CREATE OR REPLACE FUNCTION "public"."toggle_badge_featured"("p_badge_id" "uuid", "p_user_id" "uuid", "p_featured" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_badge_user_id UUID;
  v_featured_count INTEGER;
BEGIN
  SELECT user_id INTO v_badge_user_id FROM public.user_badges WHERE id = p_badge_id;
  IF v_badge_user_id IS NULL THEN RAISE EXCEPTION 'Badge not found'; END IF;
  IF v_badge_user_id != p_user_id THEN RAISE EXCEPTION 'Unauthorized - badge belongs to different user'; END IF;
  IF p_featured THEN
    SELECT COUNT(*) INTO v_featured_count FROM public.user_badges WHERE user_id = p_user_id AND featured = true;
    IF v_featured_count >= 5 THEN RAISE EXCEPTION 'Maximum 5 featured badges allowed'; END IF;
  END IF;
  UPDATE public.user_badges SET featured = p_featured, updated_at = NOW() WHERE id = p_badge_id;
  RETURN jsonb_build_object('success', true, 'featured', p_featured);
END;
$$;


ALTER FUNCTION "public"."toggle_badge_featured"("p_badge_id" "uuid", "p_user_id" "uuid", "p_featured" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_badge_featured"("p_badge_id" "uuid", "p_user_id" "uuid", "p_featured" boolean) IS 'Toggle featured status on user badge. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."track_sponsored_event"("p_event_type" "text", "p_user_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sponsored_id UUID;
  v_result JSONB;
BEGIN
  -- Validate event type
  IF p_event_type NOT IN ('impression', 'click') THEN
    RAISE EXCEPTION 'Invalid event_type: %. Must be impression or click', p_event_type;
  END IF;

  v_sponsored_id := (p_data->>'sponsored_id')::UUID;

  -- TRACK IMPRESSION
  IF p_event_type = 'impression' THEN
    -- Insert impression record
    INSERT INTO sponsored_impressions (
      sponsored_id,
      user_id,
      page_url,
      position
    )
    VALUES (
      v_sponsored_id,
      p_user_id,
      p_data->>'page_url',
      CASE WHEN p_data->>'position' IS NOT NULL THEN (p_data->>'position')::INTEGER ELSE NULL END
    );
    
    -- Atomically increment impression_count
    UPDATE sponsored_content
    SET 
      impression_count = COALESCE(impression_count, 0) + 1,
      updated_at = NOW()
    WHERE id = v_sponsored_id;
    
    RETURN jsonb_build_object('success', TRUE);

  -- TRACK CLICK
  ELSIF p_event_type = 'click' THEN
    -- Insert click record
    INSERT INTO sponsored_clicks (
      sponsored_id,
      user_id,
      target_url
    )
    VALUES (
      v_sponsored_id,
      p_user_id,
      p_data->>'target_url'
    );
    
    -- Atomically increment click_count
    UPDATE sponsored_content
    SET 
      click_count = COALESCE(click_count, 0) + 1,
      updated_at = NOW()
    WHERE id = v_sponsored_id;
    
    RETURN jsonb_build_object('success', TRUE);
  END IF;
END;
$$;


ALTER FUNCTION "public"."track_sponsored_event"("p_event_type" "text", "p_user_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_sponsored_event"("p_event_type" "text", "p_user_id" "uuid", "p_data" "jsonb") IS 'Atomic sponsored content tracking - handles impression and click events with automatic counter updates in single transaction';



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



CREATE OR REPLACE FUNCTION "public"."trigger_welcome_email_on_newsletter_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Call consolidated email-handler Edge Function with action=welcome
  PERFORM net.http_post(
    url := 'https://hxeckduifagerhxsktev.supabase.co/functions/v1/email-handler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY'),
      'X-Email-Action', 'welcome',
      'X-Trigger-Source', 'newsletter_subscription'
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'source', NEW.source,
      'referrer', NEW.referrer,
      'copy_type', NEW.copy_type,
      'copy_category', NEW.copy_category,
      'copy_slug', NEW.copy_slug,
      'subscription_id', NEW.id,
      'trigger_type', 'newsletter'
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_welcome_email_on_newsletter_signup"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_content_fts_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.fts_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, NEW.display_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'D');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_fts_vector"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_content_fts_vector"() IS 'Trigger function to auto-update full-text search vector. SET search_path for security.';



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


CREATE OR REPLACE FUNCTION "public"."update_content_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_content_updated_at"() IS 'Trigger function to auto-update updated_at timestamp. SET search_path for security.';



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
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to auto-update updated_at timestamp. SECURITY: Fixed search_path vulnerability (2025-01-30)';



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



CREATE OR REPLACE FUNCTION "public"."upsert_github_stars"("p_repo_url" "text", "p_stars" integer, "p_forks" integer DEFAULT NULL::integer, "p_watchers" integer DEFAULT NULL::integer, "p_open_issues" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_repo_owner TEXT;
  v_repo_name TEXT;
BEGIN
  SELECT (regexp_matches(p_repo_url, 'github\.com/([^/]+)/([^/]+)'))[1],
         (regexp_matches(p_repo_url, 'github\.com/([^/]+)/([^/]+)'))[2]
  INTO v_repo_owner, v_repo_name;
  IF v_repo_owner IS NULL OR v_repo_name IS NULL THEN
    RAISE EXCEPTION 'Invalid GitHub URL format: %', p_repo_url;
  END IF;
  INSERT INTO github_repo_stats (repo_owner, repo_name, repo_url, stars, forks, watchers, open_issues, last_fetched_at, updated_at)
  VALUES (v_repo_owner, v_repo_name, p_repo_url, p_stars, p_forks, p_watchers, p_open_issues, NOW(), NOW())
  ON CONFLICT (repo_url) DO UPDATE SET
    stars = EXCLUDED.stars, forks = EXCLUDED.forks, watchers = EXCLUDED.watchers,
    open_issues = EXCLUDED.open_issues, last_fetched_at = NOW(), updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."upsert_github_stars"("p_repo_url" "text", "p_stars" integer, "p_forks" integer, "p_watchers" integer, "p_open_issues" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_github_stars"("p_repo_url" "text", "p_stars" integer, "p_forks" integer, "p_watchers" integer, "p_open_issues" integer) IS 'Upserts GitHub repo stats cache. SECURITY DEFINER - Fixed search_path vulnerability (2025-01-30)';



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
    "validation_config" "jsonb" DEFAULT '{}'::"jsonb",
    "generation_config" "jsonb" DEFAULT '{}'::"jsonb",
    "schema_name" "text",
    "api_schema" "jsonb" DEFAULT "jsonb_build_object"('fields', "jsonb_build_array"('slug', 'title', 'description', 'author', 'tags', 'created_at', 'updated_at'), 'exclude', "jsonb_build_array"('seo_title', 'meta_description', 'color_scheme', 'icon_name', 'show_on_homepage', 'internal_notes', 'display_config', 'sections', 'primary_action_config', 'validation_config', 'generation_config')),
    CONSTRAINT "category_configs_config_format_check" CHECK (("config_format" = ANY (ARRAY['json'::"text", 'multi'::"text", 'hook'::"text"]))),
    CONSTRAINT "category_configs_primary_action_type_check" CHECK (("primary_action_type" = ANY (ARRAY['notification'::"text", 'copy_command'::"text", 'copy_script'::"text", 'scroll'::"text", 'download'::"text", 'github_link'::"text"])))
);


ALTER TABLE "public"."category_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_configs" IS 'Unified category configuration replacing UNIFIED_CATEGORY_REGISTRY and content-type-configs.tsx. Single source of truth for all category metadata.';



COMMENT ON COLUMN "public"."category_configs"."icon_name" IS 'Lucide icon component name (e.g., ''Sparkles'', ''Terminal''). Maps to React components in TypeScript.';



COMMENT ON COLUMN "public"."category_configs"."sections" IS 'JSONB object defining which sections to display on detail pages: { "features": boolean, "installation": boolean, ... }';



COMMENT ON COLUMN "public"."category_configs"."primary_action_type" IS 'Type of primary action button. Determines which handler function to use in TypeScript.';



COMMENT ON COLUMN "public"."category_configs"."primary_action_config" IS 'Additional configuration for primary action. Structure varies by action_type: scroll needs sectionId, download needs pathTemplate.';



COMMENT ON COLUMN "public"."category_configs"."validation_config" IS 'Complete validation configuration: requiredFields, optionalButRecommended, customValidators, categorySpecificRules';



COMMENT ON COLUMN "public"."category_configs"."generation_config" IS 'Consolidated content generation configuration including fieldDefaults (migrated from content_generator_configs), discovery sources, research rules, and quality standards';



COMMENT ON COLUMN "public"."category_configs"."schema_name" IS 'Name of the Zod schema to use for this category (e.g., "statuslineContentSchema")';



COMMENT ON COLUMN "public"."category_configs"."api_schema" IS 'Defines which fields are exposed in public JSON API. Separates website display schema from API schema for optimal performance and security.';



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



CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text",
    "display_title" "text",
    "seo_title" "text",
    "description" "text" NOT NULL,
    "author" "text" NOT NULL,
    "author_profile_url" "text",
    "date_added" "date" NOT NULL,
    "tags" "text"[] NOT NULL,
    "content" "text",
    "source" "text",
    "documentation_url" "text",
    "features" "text"[],
    "use_cases" "text"[],
    "examples" "jsonb" DEFAULT '[]'::"jsonb",
    "discovery_metadata" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "git_hash" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fts_vector" "tsvector",
    "popularity_score" integer GENERATED ALWAYS AS (0) STORED,
    "reading_time" integer GENERATED ALWAYS AS (
CASE
    WHEN ("content" IS NULL) THEN 0
    ELSE ("ceil"((("array_length"("regexp_split_to_array"(TRIM(BOTH FROM "content"), '\s+'::"text"), 1))::numeric / (225)::numeric)))::integer
END) STORED,
    "difficulty_score" integer GENERATED ALWAYS AS (
CASE
    WHEN ("content" IS NULL) THEN 0
    ELSE LEAST(100, GREATEST(0, (((((("array_length"("regexp_split_to_array"(TRIM(BOTH FROM "content"), '\s+'::"text"), 1) / 50) + ((("length"("content") - "length"("replace"("lower"("content"), 'api'::"text", ''::"text"))) / 3) * 5)) + ((("length"("content") - "length"("replace"("lower"("content"), 'configuration'::"text", ''::"text"))) / 13) * 5)) + ((("length"("content") - "length"("replace"("lower"("content"), 'environment'::"text", ''::"text"))) / 11) * 5)) + ((("length"("content") - "length"("replace"("content", '```'::"text", ''::"text"))) / 3) * 10)) +
    CASE
        WHEN ("metadata" ? 'prerequisites'::"text") THEN 15
        ELSE 0
    END)))
END) STORED,
    "has_troubleshooting" boolean GENERATED ALWAYS AS ((("metadata" ? 'troubleshooting'::"text") AND ("jsonb_typeof"(("metadata" -> 'troubleshooting'::"text")) = 'array'::"text") AND ("jsonb_array_length"(("metadata" -> 'troubleshooting'::"text")) > 0))) STORED,
    "has_prerequisites" boolean GENERATED ALWAYS AS ((("metadata" ? 'prerequisites'::"text") AND ("jsonb_typeof"(("metadata" -> 'prerequisites'::"text")) = 'array'::"text") AND ("jsonb_array_length"(("metadata" -> 'prerequisites'::"text")) > 0))) STORED,
    "has_breaking_changes" boolean GENERATED ALWAYS AS (COALESCE((("metadata" ->> 'has_breaking_changes'::"text"))::boolean, false)) STORED,
    "download_url" "text",
    "storage_url" "text",
    "download_count" bigint DEFAULT 0,
    "last_downloaded_at" timestamp with time zone,
    "llmstxt_copy_count" bigint DEFAULT 0,
    "markdown_download_count" bigint DEFAULT 0,
    "copy_count" bigint DEFAULT 0,
    "view_count" bigint DEFAULT 0,
    CONSTRAINT "content_author_length" CHECK (("length"("author") >= 2)),
    CONSTRAINT "content_category_check" CHECK (("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'commands'::"text", 'rules'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text"]))),
    CONSTRAINT "content_description_length" CHECK ((("length"("description") >= 10) AND ("length"("description") <= 500))),
    CONSTRAINT "content_download_url_check" CHECK ((("download_url" IS NULL) OR ("download_url" ~ '^(/downloads/|https?://)'::"text"))),
    CONSTRAINT "content_features_count" CHECK ((("features" IS NULL) OR ("array_length"("features", 1) <= 20))),
    CONSTRAINT "content_guide_subcategory_check" CHECK ((("category" <> 'guides'::"text") OR (("metadata" ->> 'subcategory'::"text") IS NULL) OR (("metadata" ->> 'subcategory'::"text") = ANY (ARRAY['tutorials'::"text", 'comparisons'::"text", 'workflows'::"text", 'use-cases'::"text", 'troubleshooting'::"text"])))),
    CONSTRAINT "content_slug_pattern" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND (("length"("slug") >= 3) AND ("length"("slug") <= 100)))),
    CONSTRAINT "content_tags_count" CHECK ((("array_length"("tags", 1) >= 1) AND ("array_length"("tags", 1) <= 20))),
    CONSTRAINT "content_use_cases_count" CHECK ((("use_cases" IS NULL) OR ("array_length"("use_cases", 1) <= 20)))
);


ALTER TABLE "public"."content" OWNER TO "postgres";


COMMENT ON COLUMN "public"."content"."content" IS 'Rendered markdown content. For guides: auto-rendered from metadata->sections via render_guide_sections_to_markdown().
For other categories: synced directly from JSON files.';



COMMENT ON COLUMN "public"."content"."reading_time" IS 'Estimated reading time in minutes (225 words/min)';



COMMENT ON COLUMN "public"."content"."difficulty_score" IS 'Content difficulty score (0-100 scale)';



COMMENT ON COLUMN "public"."content"."has_troubleshooting" IS 'True if content has troubleshooting section';



COMMENT ON COLUMN "public"."content"."has_prerequisites" IS 'True if content has prerequisites';



COMMENT ON COLUMN "public"."content"."has_breaking_changes" IS 'True if content has breaking changes';



COMMENT ON COLUMN "public"."content"."download_url" IS 'Optional download URL for content (e.g., skills ZIP files, PDF exports)';



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


COMMENT ON TABLE "public"."content_generation_tracking" IS 'Tracks AI-generated content submissions. RLS: service_role full access, authenticated read-only.';



COMMENT ON COLUMN "public"."content_generation_tracking"."quality_score" IS 'AI-calculated quality score (0.0 = low quality, 1.0 = high quality)';



COMMENT ON COLUMN "public"."content_generation_tracking"."discovery_metadata" IS 'Research metadata from content discovery workflow (trending sources, keyword analysis, etc.)';



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
 SELECT "category",
    "slug",
    "title",
    "description",
    "author",
    "tags",
    "created_at",
    "updated_at"
   FROM "public"."content";


ALTER VIEW "public"."content_unified" OWNER TO "postgres";


COMMENT ON VIEW "public"."content_unified" IS 'Compatibility view wrapping the unified content table for materialized views.';



CREATE TABLE IF NOT EXISTS "public"."email_blocklist" (
    "email" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "email_blocklist_reason_check" CHECK (("reason" = ANY (ARRAY['spam_complaint'::"text", 'hard_bounce'::"text", 'repeated_soft_bounce'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."email_blocklist" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_blocklist" IS 'Email blocklist - Service role only (contains PII)';



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


COMMENT ON TABLE "public"."email_sequence_schedule" IS 'Scheduled email sequence sends. RLS: users see own schedules, service_role full access.';



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


COMMENT ON TABLE "public"."email_sequences" IS 'Tracks email sequence progress per user. RLS: users see own sequences, service_role full access.';



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



CREATE TABLE IF NOT EXISTS "public"."github_repo_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "repo_owner" "text" NOT NULL,
    "repo_name" "text" NOT NULL,
    "repo_url" "text" NOT NULL,
    "stars" integer DEFAULT 0 NOT NULL,
    "forks" integer,
    "watchers" integer,
    "open_issues" integer,
    "last_fetched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_repo_format" CHECK ((("repo_owner" ~ '^[a-zA-Z0-9._-]+$'::"text") AND ("repo_name" ~ '^[a-zA-Z0-9._-]+$'::"text"))),
    CONSTRAINT "valid_stars" CHECK (("stars" >= 0))
);


ALTER TABLE "public"."github_repo_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."github_repo_stats" IS 'Cached GitHub repository statistics, refreshed via pg_cron every 6 hours';



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



CREATE MATERIALIZED VIEW "public"."mv_content_stats" AS
 SELECT "c"."category",
    "c"."slug",
    "c"."title",
    "c"."display_title",
    "c"."description",
    "c"."author",
    "c"."tags",
    "c"."created_at",
    "c"."updated_at",
    "c"."reading_time",
    "c"."difficulty_score",
    COALESCE("mas"."view_count", (0)::bigint) AS "view_count",
    COALESCE("mas"."copy_count", (0)::bigint) AS "copy_count",
    COALESCE("mas"."bookmark_count", (0)::bigint) AS "bookmark_count",
    "mas"."total_time_spent_seconds",
    "mas"."last_viewed_at",
    "mas"."last_interaction_at",
    ((((((COALESCE("mas"."view_count", (0)::bigint))::numeric * 1.0) + ((COALESCE("mas"."copy_count", (0)::bigint))::numeric * 3.0)) + ((COALESCE("mas"."bookmark_count", (0)::bigint))::numeric * 5.0)) + (
        CASE
            WHEN (("now"() - "c"."created_at") < '7 days'::interval) THEN 10
            WHEN (("now"() - "c"."created_at") < '30 days'::interval) THEN 5
            ELSE 0
        END)::numeric))::integer AS "popularity_score"
   FROM ("public"."content" "c"
     LEFT JOIN "public"."mv_analytics_summary" "mas" ON ((("mas"."category" = "c"."category") AND ("mas"."slug" = "c"."slug"))))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_content_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_content_stats" IS 'Content with analytics and computed popularity score. Refreshed hourly via pg_cron.';



CREATE MATERIALIZED VIEW "public"."mv_content_tag_index" AS
 SELECT "category",
    "slug",
    COALESCE("tags", '{}'::"text"[]) AS "tags",
    COALESCE((("metadata" ->> 'featured'::"text"))::boolean, false) AS "featured",
    COALESCE((("metadata" ->> 'priority'::"text"))::integer, 0) AS "priority",
    COALESCE("title", "display_title", ''::"text") AS "title"
   FROM "public"."content"
  WHERE ("category" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'commands'::"text", 'rules'::"text", 'hooks'::"text", 'statuslines'::"text", 'skills'::"text", 'collections'::"text", 'guides'::"text"]))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_content_tag_index" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."mv_content_tag_index" IS 'Pre-computed tag index for faster related content queries. Now queries unified content table.';



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



CREATE MATERIALIZED VIEW "public"."mv_trending_content" AS
 SELECT "c"."category",
    "c"."slug",
    "c"."title",
    "c"."description",
    COALESCE("count"(DISTINCT "ui"."id") FILTER (WHERE ("ui"."interaction_type" = 'view'::"text")), (0)::bigint) AS "view_count",
    COALESCE("count"(DISTINCT "ui"."id") FILTER (WHERE ("ui"."interaction_type" = 'copy'::"text")), (0)::bigint) AS "copy_count",
    COALESCE("count"(DISTINCT "ui"."id") FILTER (WHERE ("ui"."interaction_type" = 'bookmark'::"text")), (0)::bigint) AS "bookmark_count",
    "max"("ui"."created_at") AS "latest_activity",
    "now"() AS "last_refreshed"
   FROM ("public"."content" "c"
     LEFT JOIN "public"."user_interactions" "ui" ON ((("ui"."content_slug" = "c"."slug") AND ("ui"."content_type" = "c"."category") AND ("ui"."created_at" >= ("now"() - '90 days'::interval)))))
  GROUP BY "c"."category", "c"."slug", "c"."title", "c"."description"
 HAVING ("count"(DISTINCT "ui"."id") FILTER (WHERE ("ui"."interaction_type" = 'view'::"text")) > 0)
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_trending_content" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."rate_limit_tracker" (
    "identifier" "text" NOT NULL,
    "counter" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limit_tracker" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."static_routes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon_name" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "static_routes_group_name_check" CHECK (("group_name" = ANY (ARRAY['primary'::"text", 'secondary'::"text", 'actions'::"text"])))
);


ALTER TABLE "public"."static_routes" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_category_slug_unique" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_generation_tracking"
    ADD CONSTRAINT "content_generation_tracking_category_slug_key" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_generation_tracking"
    ADD CONSTRAINT "content_generation_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."github_repo_stats"
    ADD CONSTRAINT "github_repo_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repo_stats"
    ADD CONSTRAINT "github_repo_stats_repo_url_key" UNIQUE ("repo_url");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_slug_key" UNIQUE ("slug");



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



ALTER TABLE ONLY "public"."rate_limit_tracker"
    ADD CONSTRAINT "rate_limit_tracker_pkey" PRIMARY KEY ("identifier");



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



ALTER TABLE ONLY "public"."seo_config"
    ADD CONSTRAINT "seo_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."seo_enrichment_rules"
    ADD CONSTRAINT "seo_enrichment_rules_category_key" UNIQUE ("category");



ALTER TABLE ONLY "public"."seo_enrichment_rules"
    ADD CONSTRAINT "seo_enrichment_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_clicks"
    ADD CONSTRAINT "sponsored_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_content"
    ADD CONSTRAINT "sponsored_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_impressions"
    ADD CONSTRAINT "sponsored_impressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."static_routes"
    ADD CONSTRAINT "static_routes_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."static_routes"
    ADD CONSTRAINT "static_routes_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_analytics_event_categories_order" ON "public"."analytics_event_categories" USING "btree" ("display_order") WHERE ("active" = true);



CREATE INDEX "idx_analytics_events_category" ON "public"."analytics_events" USING "btree" ("category") WHERE ("enabled" = true);



CREATE INDEX "idx_analytics_events_enabled" ON "public"."analytics_events" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_announcement_dismissals_announcement_id" ON "public"."announcement_dismissals" USING "btree" ("announcement_id");



CREATE INDEX "idx_announcement_dismissals_user" ON "public"."announcement_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_announcements_active_dates" ON "public"."announcements" USING "btree" ("active", "start_date", "end_date", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_announcements_priority" ON "public"."announcements" USING "btree" ("priority" DESC, "start_date" DESC) WHERE ("active" = true);



CREATE INDEX "idx_badges_active" ON "public"."badges" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_badges_category" ON "public"."badges" USING "btree" ("category");



CREATE INDEX "idx_badges_rarity" ON "public"."badges" USING "btree" ("rarity");



CREATE INDEX "idx_bookmarks_content_slug" ON "public"."bookmarks" USING "btree" ("content_slug");



CREATE INDEX "idx_bookmarks_content_user_lookup" ON "public"."bookmarks" USING "btree" ("content_type", "content_slug", "user_id") INCLUDE ("created_at");



COMMENT ON INDEX "public"."idx_bookmarks_content_user_lookup" IS 'Fast bookmark existence checks and content-specific bookmark lists. INCLUDE avoids table access.';



CREATE INDEX "idx_bookmarks_user_recent" ON "public"."bookmarks" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_category_configs_api_schema" ON "public"."category_configs" USING "gin" ("api_schema");



CREATE INDEX "idx_category_configs_generation_config" ON "public"."category_configs" USING "gin" ("generation_config");



CREATE INDEX "idx_category_configs_generation_discovery" ON "public"."category_configs" USING "gin" ((("generation_config" -> 'discovery'::"text")));



CREATE INDEX "idx_category_configs_generation_field_defaults" ON "public"."category_configs" USING "gin" ((("generation_config" -> 'fieldDefaults'::"text")));



CREATE INDEX "idx_category_configs_show_on_homepage" ON "public"."category_configs" USING "btree" ("show_on_homepage") WHERE ("show_on_homepage" = true);



CREATE INDEX "idx_category_configs_validation_config" ON "public"."category_configs" USING "gin" ("validation_config");



CREATE INDEX "idx_category_configs_validation_required" ON "public"."category_configs" USING "gin" ((("validation_config" -> 'requiredFields'::"text")));



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



CREATE INDEX "idx_changelog_entries_published_featured" ON "public"."changelog_entries" USING "btree" ("release_date" DESC, "featured" DESC) WHERE ("published" = true);



COMMENT ON INDEX "public"."idx_changelog_entries_published_featured" IS 'Changelog listings sorted by date with featured entries prioritized. Partial index for published only.';



CREATE INDEX "idx_changelog_entries_search" ON "public"."changelog_entries" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "content")));



CREATE INDEX "idx_changelog_featured" ON "public"."changelog" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_changelog_git_tag" ON "public"."changelog" USING "btree" ("git_tag") WHERE ("git_tag" IS NOT NULL);



CREATE INDEX "idx_changelog_tags" ON "public"."changelog" USING "gin" ("tags");



CREATE INDEX "idx_changelog_version" ON "public"."changelog" USING "btree" ("version") WHERE ("version" IS NOT NULL);



CREATE INDEX "idx_collection_items_content_slug" ON "public"."collection_items" USING "btree" ("content_slug");



CREATE INDEX "idx_collection_items_order" ON "public"."collection_items" USING "btree" ("collection_id", "order");



CREATE INDEX "idx_collection_items_user_id" ON "public"."collection_items" USING "btree" ("user_id");



CREATE INDEX "idx_comments_content_fts" ON "public"."comments" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("content", ''::"text")));



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user_created" ON "public"."comments" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_comments_user_created" IS 'Optimizes get_user_activity_timeline query for comments';



CREATE INDEX "idx_companies_featured" ON "public"."companies" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_companies_name" ON "public"."companies" USING "btree" ("name");



CREATE INDEX "idx_companies_name_trgm" ON "public"."companies" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_companies_owner_id_created_at" ON "public"."companies" USING "btree" ("owner_id", "created_at" DESC);



CREATE INDEX "idx_companies_search_vector" ON "public"."companies" USING "gin" ("search_vector");



CREATE INDEX "idx_company_job_stats_active_jobs" ON "public"."company_job_stats" USING "btree" ("active_jobs" DESC) WHERE ("active_jobs" > 0);



CREATE UNIQUE INDEX "idx_company_job_stats_company_id" ON "public"."company_job_stats" USING "btree" ("company_id");



CREATE UNIQUE INDEX "idx_company_job_stats_company_slug" ON "public"."company_job_stats" USING "btree" ("company_slug");



CREATE INDEX "idx_company_job_stats_total_views" ON "public"."company_job_stats" USING "btree" ("total_views" DESC) WHERE ("total_views" > 0);



CREATE INDEX "idx_content_category_created" ON "public"."content" USING "btree" ("category", "created_at" DESC);



COMMENT ON INDEX "public"."idx_content_category_created" IS 'Category-specific content listings sorted by creation date. Optimizes "new content" pages.';



CREATE INDEX "idx_content_copy_count" ON "public"."content" USING "btree" ("category", "copy_count" DESC);



CREATE INDEX "idx_content_created_at" ON "public"."content" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_difficulty_score" ON "public"."content" USING "btree" ("difficulty_score") WHERE ("difficulty_score" > 0);



COMMENT ON INDEX "public"."idx_content_difficulty_score" IS 'Index for filtering/sorting by difficulty score';



CREATE INDEX "idx_content_download_url" ON "public"."content" USING "btree" ("download_url") WHERE ("download_url" IS NOT NULL);



CREATE INDEX "idx_content_downloads" ON "public"."content" USING "btree" ("category", "download_count" DESC) WHERE ("category" = 'skills'::"text");



CREATE INDEX "idx_content_flags" ON "public"."content" USING "btree" ("has_troubleshooting", "has_prerequisites", "has_breaking_changes") WHERE (("has_troubleshooting" = true) OR ("has_prerequisites" = true) OR ("has_breaking_changes" = true));



COMMENT ON INDEX "public"."idx_content_flags" IS 'Composite index for boolean flag filters';



CREATE INDEX "idx_content_fts" ON "public"."content" USING "gin" ("fts_vector");



CREATE INDEX "idx_content_generation_category" ON "public"."content_generation_tracking" USING "btree" ("category");



CREATE INDEX "idx_content_generation_date" ON "public"."content_generation_tracking" USING "btree" ("generated_at" DESC);



CREATE INDEX "idx_content_generation_discovery" ON "public"."content_generation_tracking" USING "gin" ("discovery_metadata");



CREATE INDEX "idx_content_generation_generated_by" ON "public"."content_generation_tracking" USING "btree" ("generated_by");



CREATE INDEX "idx_content_generation_validation" ON "public"."content_generation_tracking" USING "btree" ("validation_passed");



CREATE INDEX "idx_content_has_breaking_changes" ON "public"."content" USING "btree" ("has_breaking_changes") WHERE ("has_breaking_changes" = true);



COMMENT ON INDEX "public"."idx_content_has_breaking_changes" IS 'Index for breaking changes content filter';



CREATE INDEX "idx_content_has_prerequisites" ON "public"."content" USING "btree" ("has_prerequisites") WHERE ("has_prerequisites" = true);



COMMENT ON INDEX "public"."idx_content_has_prerequisites" IS 'Index for prerequisites content filter';



CREATE INDEX "idx_content_has_troubleshooting" ON "public"."content" USING "btree" ("has_troubleshooting") WHERE ("has_troubleshooting" = true);



COMMENT ON INDEX "public"."idx_content_has_troubleshooting" IS 'Index for troubleshooting content filter';



CREATE INDEX "idx_content_homepage" ON "public"."content" USING "btree" ("category", "popularity_score" DESC NULLS LAST, "created_at" DESC);



CREATE INDEX "idx_content_metadata" ON "public"."content" USING "gin" ("metadata");



CREATE INDEX "idx_content_metadata_subcategory" ON "public"."content" USING "gin" ((("metadata" -> 'subcategory'::"text"))) WHERE ("category" = 'guides'::"text");



COMMENT ON INDEX "public"."idx_content_metadata_subcategory" IS 'Fast subcategory filtering for guides (tutorials, comparisons, workflows, use-cases, troubleshooting).';



CREATE INDEX "idx_content_popularity" ON "public"."content" USING "btree" ("popularity_score" DESC NULLS LAST);



CREATE UNIQUE INDEX "idx_content_popularity_pk" ON "public"."content_popularity" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_content_popularity_score" ON "public"."content_popularity" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_content_popularity_type" ON "public"."content_popularity" USING "btree" ("content_type");



CREATE INDEX "idx_content_reading_time" ON "public"."content" USING "btree" ("reading_time") WHERE ("reading_time" > 0);



COMMENT ON INDEX "public"."idx_content_reading_time" IS 'Index for filtering/sorting by reading time';



CREATE INDEX "idx_content_seo_overrides_category" ON "public"."content_seo_overrides" USING "btree" ("category");



CREATE INDEX "idx_content_seo_overrides_created_by" ON "public"."content_seo_overrides" USING "btree" ("created_by");



CREATE INDEX "idx_content_similarities_content_a" ON "public"."content_similarities" USING "btree" ("content_a_type", "content_a_slug", "similarity_score" DESC);



CREATE INDEX "idx_content_similarities_content_b" ON "public"."content_similarities" USING "btree" ("content_b_type", "content_b_slug");



CREATE INDEX "idx_content_similarities_score" ON "public"."content_similarities" USING "btree" ("similarity_score" DESC) WHERE ("similarity_score" >= 0.3);



CREATE INDEX "idx_content_slug" ON "public"."content" USING "btree" ("slug");



CREATE INDEX "idx_content_submissions_created" ON "public"."content_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_submissions_moderated_by" ON "public"."content_submissions" USING "btree" ("moderated_by");



CREATE INDEX "idx_content_submissions_search" ON "public"."content_submissions" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("name" || ' '::"text") || "description")));



CREATE INDEX "idx_content_submissions_spam" ON "public"."content_submissions" USING "btree" ("spam_score") WHERE ("spam_score" > 0.5);



CREATE INDEX "idx_content_submissions_status" ON "public"."content_submissions" USING "btree" ("status");



CREATE INDEX "idx_content_submissions_submitter" ON "public"."content_submissions" USING "btree" ("submitter_id");



CREATE INDEX "idx_content_submissions_type" ON "public"."content_submissions" USING "btree" ("submission_type");



CREATE INDEX "idx_content_tags" ON "public"."content" USING "gin" ("tags");



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



CREATE INDEX "idx_followers_follower_id" ON "public"."followers" USING "btree" ("follower_id");



CREATE INDEX "idx_followers_following_id" ON "public"."followers" USING "btree" ("following_id");



CREATE INDEX "idx_form_field_configs_display_order" ON "public"."form_field_configs" USING "btree" ("form_type", "display_order");



CREATE INDEX "idx_form_field_configs_enabled" ON "public"."form_field_configs" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_form_field_configs_form_type" ON "public"."form_field_configs" USING "btree" ("form_type");



CREATE INDEX "idx_form_field_definitions_created_by" ON "public"."form_field_definitions" USING "btree" ("created_by");



COMMENT ON INDEX "public"."idx_form_field_definitions_created_by" IS 'Foreign key index for form_field_definitions.created_by to improve JOIN/filter performance';



CREATE INDEX "idx_form_field_versions_changed_by" ON "public"."form_field_versions" USING "btree" ("changed_by");



CREATE INDEX "idx_form_fields_active" ON "public"."form_field_definitions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_form_fields_content_type" ON "public"."form_field_definitions" USING "btree" ("content_type");



CREATE INDEX "idx_form_fields_order" ON "public"."form_field_definitions" USING "btree" ("field_order");



CREATE INDEX "idx_form_fields_scope" ON "public"."form_field_definitions" USING "btree" ("field_scope");



CREATE INDEX "idx_github_repo_stats_last_fetched" ON "public"."github_repo_stats" USING "btree" ("last_fetched_at" DESC);



CREATE INDEX "idx_github_repo_stats_repo_lookup" ON "public"."github_repo_stats" USING "btree" ("repo_owner", "repo_name");



CREATE INDEX "idx_jobs_active" ON "public"."jobs" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_jobs_active_featured_partial" ON "public"."jobs" USING "btree" ("plan", "order" DESC, "posted_at" DESC) WHERE (("status" = 'active'::"text") AND ("active" = true));



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



CREATE INDEX "idx_mv_analytics_summary_copies" ON "public"."mv_analytics_summary" USING "btree" ("copy_count" DESC);



CREATE INDEX "idx_mv_analytics_summary_views" ON "public"."mv_analytics_summary" USING "btree" ("view_count" DESC);



CREATE INDEX "idx_mv_content_stats_category_popularity" ON "public"."mv_content_stats" USING "btree" ("category", "popularity_score" DESC, "created_at" DESC);



CREATE UNIQUE INDEX "idx_mv_content_stats_pk" ON "public"."mv_content_stats" USING "btree" ("category", "slug");



CREATE INDEX "idx_mv_content_stats_popularity" ON "public"."mv_content_stats" USING "btree" ("popularity_score" DESC, "created_at" DESC);



CREATE UNIQUE INDEX "idx_mv_content_tag_index_unique" ON "public"."mv_content_tag_index" USING "btree" ("category", "slug");



CREATE INDEX "idx_mv_trending_content_category_views" ON "public"."mv_trending_content" USING "btree" ("category", "view_count" DESC);



CREATE UNIQUE INDEX "idx_mv_trending_content_unique" ON "public"."mv_trending_content" USING "btree" ("category", "slug");



CREATE INDEX "idx_mv_trending_content_views" ON "public"."mv_trending_content" USING "btree" ("view_count" DESC, "latest_activity" DESC);



CREATE INDEX "idx_mv_weekly_new_content_rank" ON "public"."mv_weekly_new_content" USING "btree" ("week_start", "week_rank");



CREATE UNIQUE INDEX "idx_mv_weekly_new_content_unique" ON "public"."mv_weekly_new_content" USING "btree" ("week_start", "category", "slug");



COMMENT ON INDEX "public"."idx_mv_weekly_new_content_unique" IS 'Unique index for CONCURRENT refresh of mv_weekly_new_content materialized view';



CREATE INDEX "idx_mv_weekly_new_content_week" ON "public"."mv_weekly_new_content" USING "btree" ("week_start" DESC);



CREATE INDEX "idx_newsletter_confirmation_token" ON "public"."newsletter_subscriptions" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE INDEX "idx_newsletter_source" ON "public"."newsletter_subscriptions" USING "btree" ("source") WHERE ("source" IS NOT NULL);



CREATE INDEX "idx_newsletter_status" ON "public"."newsletter_subscriptions" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_newsletter_subscribed_at" ON "public"."newsletter_subscriptions" USING "btree" ("subscribed_at" DESC);



CREATE INDEX "idx_notification_dismissals_notification_id" ON "public"."notification_dismissals" USING "btree" ("notification_id");



CREATE INDEX "idx_notification_dismissals_user" ON "public"."notification_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_active_expires" ON "public"."notifications" USING "btree" ("active", "expires_at", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_notifications_type_priority" ON "public"."notifications" USING "btree" ("type", "priority" DESC) WHERE ("active" = true);



CREATE INDEX "idx_payments_polar_transaction_id" ON "public"."payments" USING "btree" ("polar_transaction_id");



CREATE INDEX "idx_payments_product" ON "public"."payments" USING "btree" ("product_type", "product_id");



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_user_created" ON "public"."posts" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_posts_user_created" IS 'Optimizes get_user_activity_timeline query for posts';



CREATE INDEX "idx_posts_user_vote" ON "public"."posts" USING "btree" ("user_id", "vote_count" DESC, "created_at" DESC);



CREATE INDEX "idx_posts_vote_count" ON "public"."posts" USING "btree" ("vote_count" DESC);



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_profiles_public" ON "public"."profiles" USING "btree" ("profile_public") WHERE ("profile_public" = true);



CREATE INDEX "idx_profiles_reputation" ON "public"."profiles" USING "btree" ("reputation_score" DESC);



CREATE INDEX "idx_profiles_search" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("display_name", ''::"text") || ' '::"text") || COALESCE("bio", ''::"text")))) WHERE ("profile_public" = true);



CREATE INDEX "idx_quiz_options_order" ON "public"."quiz_options" USING "btree" ("display_order");



CREATE INDEX "idx_quiz_options_question" ON "public"."quiz_options" USING "btree" ("question_id");



CREATE INDEX "idx_quiz_questions_order" ON "public"."quiz_questions" USING "btree" ("display_order");



CREATE INDEX "idx_rate_limit_tracker_window" ON "public"."rate_limit_tracker" USING "btree" ("window_start");



CREATE INDEX "idx_recommended_content_score" ON "public"."recommended_content" USING "btree" ("recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user" ON "public"."recommended_content" USING "btree" ("user_id", "recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user_type" ON "public"."recommended_content" USING "btree" ("user_id", "content_type", "recommendation_score" DESC);



CREATE INDEX "idx_reputation_actions_active" ON "public"."reputation_actions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_order" ON "public"."reputation_tiers" USING "btree" ("order") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_score_range" ON "public"."reputation_tiers" USING "btree" ("min_score", "max_score") WHERE ("active" = true);



CREATE INDEX "idx_review_helpful_votes_review_id" ON "public"."review_helpful_votes" USING "btree" ("review_id");



CREATE INDEX "idx_review_ratings_content" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_helpful" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "helpful_count" DESC, "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_rating" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "rating" DESC, "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_slug_rating" ON "public"."review_ratings" USING "btree" ("content_slug", "rating");



CREATE INDEX "idx_review_ratings_helpful" ON "public"."review_ratings" USING "btree" ("helpful_count" DESC) WHERE ("helpful_count" > 0);



CREATE INDEX "idx_review_ratings_rating" ON "public"."review_ratings" USING "btree" ("rating", "created_at" DESC);



CREATE INDEX "idx_review_ratings_user" ON "public"."review_ratings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_select_options_active" ON "public"."form_select_options" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_select_options_field_id" ON "public"."form_select_options" USING "btree" ("field_id");



CREATE INDEX "idx_select_options_order" ON "public"."form_select_options" USING "btree" ("option_order");



CREATE INDEX "idx_seo_enrichment_rules_category" ON "public"."seo_enrichment_rules" USING "btree" ("category");



CREATE INDEX "idx_seo_enrichment_rules_enabled" ON "public"."seo_enrichment_rules" USING "btree" ("enabled") WHERE ("enabled" = true);



CREATE INDEX "idx_seo_enrichment_rules_focus_areas" ON "public"."seo_enrichment_rules" USING "gin" ("focus_areas");



CREATE INDEX "idx_sponsored_clicks_sponsored_id" ON "public"."sponsored_clicks" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_clicks_user_id" ON "public"."sponsored_clicks" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_content_active" ON "public"."sponsored_content" USING "btree" ("active") WHERE ("active" = true);



COMMENT ON INDEX "public"."idx_sponsored_content_active" IS 'Fast lookup of active sponsored content. Query filters by date range at runtime.';



CREATE INDEX "idx_sponsored_content_active_dates_tier" ON "public"."sponsored_content" USING "btree" ("active", "start_date", "end_date", "tier") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_dates" ON "public"."sponsored_content" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_sponsored_content_lookup" ON "public"."sponsored_content" USING "btree" ("content_id", "content_type", "active") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_user_id" ON "public"."sponsored_content" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_impressions_sponsored_id" ON "public"."sponsored_impressions" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_impressions_user_id" ON "public"."sponsored_impressions" USING "btree" ("user_id");



CREATE INDEX "idx_static_routes_group_active" ON "public"."static_routes" USING "btree" ("group_name", "is_active", "sort_order");



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



CREATE INDEX "idx_user_interactions_type_content" ON "public"."user_interactions" USING "btree" ("interaction_type", "content_type", "content_slug", "created_at" DESC);



COMMENT ON INDEX "public"."idx_user_interactions_type_content" IS 'Analytics queries grouped by interaction type. Application filters by date range as needed.';



CREATE INDEX "idx_user_interactions_user_id" ON "public"."user_interactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_interactions_user_timeline" ON "public"."user_interactions" USING "btree" ("user_id", "created_at" DESC, "interaction_type");



COMMENT ON INDEX "public"."idx_user_interactions_user_timeline" IS 'User activity timeline sorted by recency. Optimizes per-user interaction queries.';



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



CREATE INDEX "idx_users_reputation_score" ON "public"."users" USING "btree" ("reputation_score" DESC) WHERE ("reputation_score" > 0);



COMMENT ON INDEX "public"."idx_users_reputation_score" IS 'Index for fast leaderboard queries and reputation-based sorting.';



CREATE INDEX "idx_users_reputation_tier" ON "public"."users" USING "btree" ("reputation_score" DESC, "created_at" DESC) WHERE (("status" = 'active'::"text") AND ("public" = true));



COMMENT ON INDEX "public"."idx_users_reputation_tier" IS 'Leaderboards and public user listings sorted by reputation. Partial index for active public users only.';



CREATE INDEX "idx_users_search_vector" ON "public"."users" USING "gin" ("search_vector");



CREATE UNIQUE INDEX "idx_users_slug_public" ON "public"."users" USING "btree" ("slug") WHERE ("public" = true);



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



CREATE UNIQUE INDEX "mv_analytics_summary_category_slug_idx" ON "public"."mv_analytics_summary" USING "btree" ("category", "slug");



CREATE UNIQUE INDEX "mv_search_facets_category_idx" ON "public"."mv_search_facets" USING "btree" ("category");



CREATE STATISTICS "public"."stats_user_affinities_user_score_type" (ndistinct, dependencies) ON "user_id", "content_type", "affinity_score" FROM "public"."user_affinities";


ALTER STATISTICS "public"."stats_user_affinities_user_score_type" OWNER TO "postgres";


CREATE STATISTICS "public"."stats_user_interactions_user_time_type" (dependencies) ON "user_id", "interaction_type", "created_at" FROM "public"."user_interactions";


ALTER STATISTICS "public"."stats_user_interactions_user_time_type" OWNER TO "postgres";


CREATE OR REPLACE TRIGGER "auto_award_badges_after_comment" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_comment" ON "public"."comments" IS 'Auto-awards badges after user creates a comment';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_follower" AFTER INSERT ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_follower" ON "public"."followers" IS 'Auto-awards badges after user gains a follower';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_post" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_post" ON "public"."posts" IS 'Auto-awards badges after user creates a post';



CREATE OR REPLACE TRIGGER "auto_award_badges_after_submission" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW WHEN (("new"."status" = 'merged'::"text")) EXECUTE FUNCTION "public"."trigger_auto_award_badges"();



COMMENT ON TRIGGER "auto_award_badges_after_submission" ON "public"."submissions" IS 'Auto-awards badges after user submission is merged';



CREATE OR REPLACE TRIGGER "content_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts_vector"();



CREATE OR REPLACE TRIGGER "content_title_trigger" BEFORE INSERT OR UPDATE ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."set_title_from_slug"();



CREATE OR REPLACE TRIGGER "content_updated_at" BEFORE UPDATE ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_updated_at"();



CREATE OR REPLACE TRIGGER "email_sequences_updated_at" BEFORE UPDATE ON "public"."email_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."update_email_sequences_updated_at"();



CREATE OR REPLACE TRIGGER "form_field_definitions_updated_at" BEFORE UPDATE ON "public"."form_field_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "form_field_version_on_update" AFTER UPDATE ON "public"."form_field_definitions" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."create_form_field_version"();



CREATE OR REPLACE TRIGGER "generate_job_slug" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_user_collections_slug" BEFORE INSERT OR UPDATE ON "public"."user_collections" FOR EACH ROW EXECUTE FUNCTION "public"."generate_collection_slug"();



CREATE OR REPLACE TRIGGER "generate_user_mcp_slug" BEFORE INSERT ON "public"."user_mcps" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_users_slug" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."generate_user_slug"();



CREATE OR REPLACE TRIGGER "newsletter_rate_limit" BEFORE INSERT ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."check_newsletter_rate_limit"();



CREATE OR REPLACE TRIGGER "newsletter_updated_at_trigger" BEFORE UPDATE ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_newsletter_updated_at"();



CREATE OR REPLACE TRIGGER "on_newsletter_subscription" AFTER INSERT ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_newsletter_subscription"();



COMMENT ON TRIGGER "on_newsletter_subscription" ON "public"."newsletter_subscriptions" IS 'Calls send-welcome-email Edge Function via pg_net after newsletter subscription insert.';



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



CREATE OR REPLACE TRIGGER "update_analytics_event_categories_updated_at" BEFORE UPDATE ON "public"."analytics_event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_events_updated_at" BEFORE UPDATE ON "public"."analytics_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_announcements_timestamp" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_announcements_updated_at"();



CREATE OR REPLACE TRIGGER "update_changelog_entries_updated_at" BEFORE UPDATE ON "public"."changelog_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_changelog_updated_at" BEFORE UPDATE ON "public"."changelog" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_delete" AFTER DELETE ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_insert" AFTER INSERT ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_generation_tracking_updated_at" BEFORE UPDATE ON "public"."content_generation_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_seo_overrides_updated_at" BEFORE UPDATE ON "public"."content_seo_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_submissions_updated_at" BEFORE UPDATE ON "public"."content_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



CREATE OR REPLACE TRIGGER "update_seo_config_updated_at" BEFORE UPDATE ON "public"."seo_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_seo_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_sponsored_content_updated_at" BEFORE UPDATE ON "public"."sponsored_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_static_routes_updated_at" BEFORE UPDATE ON "public"."static_routes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



CREATE POLICY "Authenticated users can view content generation tracking" ON "public"."content_generation_tracking" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can vote" ON "public"."votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (("active" = true));



CREATE POLICY "Category configs are publicly readable" ON "public"."category_configs" FOR SELECT USING (true);



CREATE POLICY "Category configs are service-writable" ON "public"."category_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Companies are viewable by everyone" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Company owners can update their companies" ON "public"."companies" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Content is publicly readable" ON "public"."changelog" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Content similarities are viewable by everyone" ON "public"."content_similarities" FOR SELECT USING (true);



CREATE POLICY "Featured configs are viewable by everyone" ON "public"."featured_configs" FOR SELECT USING (true);



CREATE POLICY "Followers are viewable by everyone" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "Form field configs are viewable by everyone" ON "public"."form_field_configs" FOR SELECT USING (("enabled" = true));



CREATE POLICY "Form field definitions are publicly readable" ON "public"."form_field_definitions" FOR SELECT USING (("active" = true));



CREATE POLICY "Form field versions are publicly readable" ON "public"."form_field_versions" FOR SELECT USING (true);



CREATE POLICY "Form select options are publicly readable" ON "public"."form_select_options" FOR SELECT USING (("active" = true));



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



CREATE POLICY "Service role can manage all email sequences" ON "public"."email_sequences" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all scheduled emails" ON "public"."email_sequence_schedule" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage content generation tracking" ON "public"."content_generation_tracking" TO "service_role" USING (true) WITH CHECK (true);



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



CREATE POLICY "Users can view own campaign impressions" ON "public"."sponsored_impressions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sponsored_content" "sc"
  WHERE (("sc"."id" = "sponsored_impressions"."sponsored_id") AND ("sc"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own email sequences" ON "public"."email_sequences" FOR SELECT TO "authenticated", "anon" USING (("email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")));



CREATE POLICY "Users can view own interactions" ON "public"."user_interactions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own scheduled emails" ON "public"."email_sequence_schedule" FOR SELECT TO "authenticated", "anon" USING (("email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")));



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


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_delete_service_role" ON "public"."content" FOR DELETE TO "service_role" USING (true);



ALTER TABLE "public"."content_generation_tracking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_insert_service_role" ON "public"."content" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "content_select_anon" ON "public"."content" FOR SELECT TO "anon" USING (true);



CREATE POLICY "content_select_authenticated" ON "public"."content" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "content_select_service_role" ON "public"."content" FOR SELECT TO "service_role" USING (true);



ALTER TABLE "public"."content_seo_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_seo_overrides_delete_policy" ON "public"."content_seo_overrides" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "content_seo_overrides_insert_policy" ON "public"."content_seo_overrides" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "content_seo_overrides_select_policy" ON "public"."content_seo_overrides" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "content_seo_overrides_update_policy" ON "public"."content_seo_overrides" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."content_similarities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_update_service_role" ON "public"."content" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."email_blocklist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_blocklist_block_anon" ON "public"."email_blocklist" TO "anon" USING (false);



CREATE POLICY "email_blocklist_block_authenticated" ON "public"."email_blocklist" TO "authenticated" USING (false);



CREATE POLICY "email_blocklist_service_role_all" ON "public"."email_blocklist" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."email_sequence_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_select_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_repo_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "github_repo_stats_public_read" ON "public"."github_repo_stats" FOR SELECT USING (true);



CREATE POLICY "github_repo_stats_service_write" ON "public"."github_repo_stats" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


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


ALTER TABLE "public"."seo_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seo_enrichment_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_changelog_entries_all" ON "public"."changelog_entries" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sponsored_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_impressions" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enriched_content"("p_category" "text", "p_slug" "text", "p_slugs" "text"[], "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_featured_content"("p_category" "text", "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_featured_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_featured_jobs"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_form_field_config"("p_form_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_form_fields_grouped"("p_form_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_homepage_content_enriched"("p_category_ids" "text"[], "p_week_start" "date") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_job_detail"("p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_job_detail"("p_slug" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_jobs_by_category"("p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_by_category"("p_category" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_jobs_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_count"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_jobs_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_list"() TO "authenticated";



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



GRANT ALL ON FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_badges_with_details"("p_user_id" "uuid", "p_featured_only" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_collection_detail"("p_user_slug" "text", "p_collection_slug" "text", "p_viewer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_collection_detail"("p_user_slug" "text", "p_collection_slug" "text", "p_viewer_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_dashboard"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_favorite_categories"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_interaction_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_library"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_profile"("p_user_slug" "text", "p_viewer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"("p_user_slug" "text", "p_viewer_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "anon";



GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."increment_usage"("p_content_id" "uuid", "p_action_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("p_content_id" "uuid", "p_action_type" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."manage_collection"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."manage_comment"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."manage_company"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."manage_job"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."manage_post"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."manage_review"("p_action" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



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



GRANT ALL ON FUNCTION "public"."toggle_badge_featured"("p_badge_id" "uuid", "p_user_id" "uuid", "p_featured" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "public"."track_sponsored_event"("p_event_type" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."track_sponsored_event"("p_event_type" "text", "p_user_id" "uuid", "p_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_affinity_scores"("p_user_id" "uuid") TO "service_role";






























GRANT SELECT ON TABLE "public"."affinity_config" TO "authenticated";
GRANT ALL ON TABLE "public"."affinity_config" TO "service_role";



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



GRANT SELECT,INSERT ON TABLE "public"."comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."comments" TO "anon";



GRANT SELECT ON TABLE "public"."company_job_stats" TO "authenticated";



GRANT ALL ON TABLE "public"."content" TO "service_role";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT SELECT ON TABLE "public"."content" TO "anon";



GRANT SELECT ON TABLE "public"."content_popularity" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_popularity" TO "anon";



GRANT SELECT ON TABLE "public"."content_seo_overrides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."content_seo_overrides" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_similarities" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_similarities" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."content_submissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_unified" TO "anon";
GRANT SELECT ON TABLE "public"."content_unified" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_unified" TO "service_role";



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



GRANT SELECT ON TABLE "public"."mv_content_stats" TO "anon";
GRANT SELECT ON TABLE "public"."mv_content_stats" TO "authenticated";



GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "anon";
GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "authenticated";
GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "service_role";



GRANT SELECT ON TABLE "public"."mv_search_facets" TO "anon";
GRANT SELECT ON TABLE "public"."mv_search_facets" TO "authenticated";
GRANT SELECT ON TABLE "public"."mv_search_facets" TO "service_role";



GRANT SELECT ON TABLE "public"."mv_weekly_new_content" TO "service_role";
GRANT SELECT ON TABLE "public"."mv_weekly_new_content" TO "anon";



GRANT SELECT ON TABLE "public"."payments" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."posts" TO "authenticated";
GRANT SELECT ON TABLE "public"."posts" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";



GRANT SELECT ON TABLE "public"."user_affinities" TO "authenticated";



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



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_collections" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_collections" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_content" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_mcps" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_mcps" TO "anon";



GRANT SELECT ON TABLE "public"."user_similarities" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_stats" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_stats" TO "anon";


































