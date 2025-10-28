


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



CREATE OR REPLACE FUNCTION "public"."batch_recalculate_all_reputation"() RETURNS TABLE("user_id" "uuid", "old_score" integer, "new_score" integer, "updated" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
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



CREATE OR REPLACE FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
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


CREATE OR REPLACE FUNCTION "public"."extract_tags_for_search"("tags" "jsonb") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
  SELECT COALESCE(string_agg(value::text, ' '), '')
  FROM jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb))
$$;


ALTER FUNCTION "public"."extract_tags_for_search"("tags" "jsonb") OWNER TO "postgres";


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



CREATE OR REPLACE FUNCTION "public"."get_content_with_analytics"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "date_added" timestamp with time zone, "view_count" bigint, "copy_count" bigint, "bookmark_count" bigint)
    LANGUAGE "plpgsql" STABLE
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



CREATE OR REPLACE FUNCTION "public"."get_featured_content"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 10) RETURNS TABLE("content_type" "text", "content_slug" "text", "rank" bigint, "final_score" numeric, "trending_score" numeric, "rating_score" numeric, "engagement_score" numeric, "freshness_score" numeric, "views_24h" bigint, "growth_rate_pct" numeric, "bookmark_count" bigint, "copy_count" bigint, "comment_count" bigint, "total_views" bigint, "days_old" numeric, "calculated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
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



CREATE OR REPLACE FUNCTION "public"."get_form_fields_for_content_type"("p_content_type" "public"."content_category") RETURNS TABLE("id" "uuid", "field_scope" "public"."field_scope", "field_name" "text", "field_type" "public"."field_type", "label" "text", "placeholder" "text", "help_text" "text", "required" boolean, "grid_column" "public"."grid_column", "field_order" integer, "icon" "text", "icon_position" "public"."icon_position", "field_properties" "jsonb", "select_options" "jsonb")
    LANGUAGE "plpgsql"
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



CREATE OR REPLACE FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer DEFAULT 5) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "date_added" timestamp with time zone, "url" "text")
    LANGUAGE "plpgsql" STABLE
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


CREATE OR REPLACE FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[] DEFAULT ARRAY[]::"text"[], "p_focus_areas" "text"[] DEFAULT ARRAY[]::"text"[], "p_limit" integer DEFAULT 10) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "author" "text", "tags" "text"[], "match_score" integer, "match_percentage" integer, "primary_reason" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.category::TEXT,
    rs.slug,
    rs.title,
    rs.description,
    rs.author,
    rs.tags,
    -- Calculate match score (0-100)
    (
      -- Tool preference match (40%)
      (CASE WHEN rs.category = ANY(p_tool_preferences) THEN 40 ELSE 0 END) +
      -- Use case match (25%)
      (CASE WHEN p_use_case = ANY(rs.use_case_tags) THEN 25 ELSE 0 END) +
      -- Integration match (20%)
      (
        CASE
          WHEN array_length(p_integrations, 1) = 0 THEN 0
          WHEN array_length(p_integrations, 1) > 0 THEN
            (
              (SELECT COUNT(*)::FLOAT FROM unnest(p_integrations) int WHERE int = ANY(rs.integration_tags)) /
              array_length(p_integrations, 1)
            ) * 20
          ELSE 0
        END
      )::INTEGER +
      -- Focus area match (10%)
      (
        CASE
          WHEN array_length(p_focus_areas, 1) = 0 THEN 0
          WHEN array_length(p_focus_areas, 1) > 0 THEN
            (
              (SELECT COUNT(*)::FLOAT FROM unnest(p_focus_areas) fa WHERE fa = ANY(rs.focus_area_tags)) /
              array_length(p_focus_areas, 1)
            ) * 10
          ELSE 0
        END
      )::INTEGER +
      -- Experience level match (5%)
      (CASE WHEN rs.suggested_experience_level = p_experience_level THEN 5 ELSE 0 END)
    ) as match_score,
    -- Match percentage (same as match_score, capped at 100)
    LEAST(
      (
        (CASE WHEN rs.category = ANY(p_tool_preferences) THEN 40 ELSE 0 END) +
        (CASE WHEN p_use_case = ANY(rs.use_case_tags) THEN 25 ELSE 0 END) +
        (
          CASE
            WHEN array_length(p_integrations, 1) = 0 THEN 0
            WHEN array_length(p_integrations, 1) > 0 THEN
              (
                (SELECT COUNT(*)::FLOAT FROM unnest(p_integrations) int WHERE int = ANY(rs.integration_tags)) /
                array_length(p_integrations, 1)
              ) * 20
            ELSE 0
          END
        )::INTEGER +
        (
          CASE
            WHEN array_length(p_focus_areas, 1) = 0 THEN 0
            WHEN array_length(p_focus_areas, 1) > 0 THEN
              (
                (SELECT COUNT(*)::FLOAT FROM unnest(p_focus_areas) fa WHERE fa = ANY(rs.focus_area_tags)) /
                array_length(p_focus_areas, 1)
              ) * 10
            ELSE 0
          END
        )::INTEGER +
        (CASE WHEN rs.suggested_experience_level = p_experience_level THEN 5 ELSE 0 END)
      ),
      100
    ) as match_percentage,
    -- Primary reason for recommendation
    CASE
      WHEN rs.category = ANY(p_tool_preferences) AND p_use_case = ANY(rs.use_case_tags) THEN 'Perfect match for your use case and tool preference'
      WHEN rs.category = ANY(p_tool_preferences) THEN 'Matches your preferred tool type'
      WHEN p_use_case = ANY(rs.use_case_tags) THEN 'Great fit for your use case'
      WHEN array_length(p_integrations, 1) > 0 AND EXISTS (SELECT 1 FROM unnest(p_integrations) int WHERE int = ANY(rs.integration_tags)) THEN 'Supports your required integrations'
      WHEN rs.suggested_experience_level = p_experience_level THEN 'Matches your experience level'
      ELSE 'Recommended based on popularity'
    END as primary_reason
  FROM mv_recommendation_scores rs
  WHERE
    -- Only include items with minimum score threshold (20%)
    (
      (CASE WHEN rs.category = ANY(p_tool_preferences) THEN 40 ELSE 0 END) +
      (CASE WHEN p_use_case = ANY(rs.use_case_tags) THEN 25 ELSE 0 END)
    ) >= 20
  ORDER BY match_score DESC, rs.title ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[], "p_focus_areas" "text"[], "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_recommendations"("p_use_case" "text", "p_experience_level" "text", "p_tool_preferences" "text"[], "p_integrations" "text"[], "p_focus_areas" "text"[], "p_limit" integer) IS 'Returns ranked recommendations based on user preferences. Replaces recommender/algorithm.ts matching logic.';



CREATE OR REPLACE FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[] DEFAULT '{}'::"text"[], "p_limit" integer DEFAULT 3, "p_exclude_slugs" "text"[] DEFAULT '{}'::"text"[]) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "author" "text", "date_added" timestamp with time zone, "tags" "text"[], "score" numeric, "match_type" "text", "views" bigint, "matched_tags" "text"[])
    LANGUAGE "plpgsql" STABLE
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



CREATE OR REPLACE FUNCTION "public"."get_tier_name_from_score"("p_score" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
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



CREATE OR REPLACE FUNCTION "public"."get_trending_content"("p_limit" integer DEFAULT 3) RETURNS TABLE("category" "text", "slug" "text", "title" "text", "description" "text", "view_count" bigint, "url" "text")
    LANGUAGE "plpgsql" STABLE
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



CREATE OR REPLACE FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "slug" "text" NOT NULL,
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


CREATE OR REPLACE FUNCTION "public"."trigger_update_user_reputation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


CREATE OR REPLACE FUNCTION "public"."update_newsletter_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newsletter_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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



CREATE OR REPLACE FUNCTION "public"."validate_interests_array"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


COMMENT ON VIEW "public"."content_base" IS 'Unified view of common fields across all content tables (excludes jobs table). Used for type generation and cross-content queries.';



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


COMMENT ON VIEW "public"."content_unified" IS 'Unified view of all content types with PostgreSQL full-text search (fts_vector).
Enables server-side fuzzy search, eliminates client-side fuzzysort package.
Used for type generation via supabase gen types.';



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
    CONSTRAINT "featured_configs_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text"]))),
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


COMMENT ON MATERIALIZED VIEW "public"."mv_analytics_summary" IS 'Pre-computed analytics per content item. Refresh: every 30 minutes via pg_cron.';



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
            0 AS "comment_count",
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
                    WHEN ("content_stats"."views_previous_24h" > 0) THEN (((("content_stats"."views_24h")::double precision - ("content_stats"."views_previous_24h")::double precision) / ("content_stats"."views_previous_24h")::double precision) * (100)::double precision)
                    ELSE (0)::double precision
                END AS "growth_rate_pct",
            LEAST((100)::double precision, GREATEST((0)::double precision, ((100.0)::double precision / ((1)::double precision + "exp"(((- (
                CASE
                    WHEN ("content_stats"."views_previous_24h" > 0) THEN (((("content_stats"."views_24h")::double precision - ("content_stats"."views_previous_24h")::double precision) / ("content_stats"."views_previous_24h")::double precision) * (100)::double precision)
                    ELSE (0)::double precision
                END - (100)::double precision)) / (100.0)::double precision)))))) AS "trending_score"
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
            ("percent_rank"() OVER (PARTITION BY "trending_scores"."category" ORDER BY (((("trending_scores"."bookmark_count" * 5) + ("trending_scores"."copy_count" * 3)))::numeric + (("trending_scores"."total_views")::numeric / 10.0))) * (100)::double precision) AS "engagement_score"
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
            (EXTRACT(epoch FROM ("now"() - (("engagement_scores"."date_added")::timestamp without time zone)::timestamp with time zone)) / 86400.0) AS "days_old",
            GREATEST((0)::numeric, ((100)::numeric - ((EXTRACT(epoch FROM ("now"() - (("engagement_scores"."date_added")::timestamp without time zone)::timestamp with time zone)) / 86400.0) * (2)::numeric))) AS "freshness_score"
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
            (((("freshness_scores"."trending_score" * (0.4)::double precision) + (((0)::numeric * 0.3))::double precision) + ("freshness_scores"."engagement_score" * (0.2)::double precision)) + (("freshness_scores"."freshness_score" * 0.1))::double precision) AS "final_score"
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
            "final_scores"."rating_score",
            "final_scores"."engagement_score",
            "final_scores"."freshness_score",
            "final_scores"."final_score",
            "final_scores"."days_old",
            "final_scores"."raw_engagement",
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


COMMENT ON MATERIALIZED VIEW "public"."mv_featured_scores" IS 'Featured content scores calculated via multi-factor algorithm. Refreshed hourly via pg_cron.';



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


COMMENT ON MATERIALIZED VIEW "public"."recommended_content" IS 'Personalized content recommendations per user. Refreshed every 2 hours. Formula: (affinity × 0.7) + (popularity × 0.3).';



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


COMMENT ON MATERIALIZED VIEW "public"."submission_stats_summary" IS 'Aggregated submission statistics for dashboard - refreshed hourly via pg_cron';



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


COMMENT ON MATERIALIZED VIEW "public"."trending_content_24h" IS 'Trending content in last 24 hours. Refreshed every 30 minutes. Sorted by trending score (bookmarks, posts, votes, recency).';



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


COMMENT ON MATERIALIZED VIEW "public"."user_activity_summary" IS 'Aggregated user activity statistics - refreshed daily via pg_cron. Replaces 5 parallel queries with 1 indexed query.';



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


COMMENT ON MATERIALIZED VIEW "public"."user_affinity_scores" IS 'Aggregated user affinity data. Refreshed every 6 hours. Used for personalization and recommendations.';



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


COMMENT ON MATERIALIZED VIEW "public"."user_badge_stats" IS 'Pre-computed user statistics for badge evaluation. Refreshed hourly via pg_cron. NO AUTH.USERS DEPENDENCY (security hardened).';



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



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_category_slug_unique" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_content_a_type_content_a_slug_content__key" UNIQUE ("content_a_type", "content_a_slug", "content_b_type", "content_b_slug");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_submissions"
    ADD CONSTRAINT "content_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_content_type_content_slug_week_start_key" UNIQUE ("content_type", "content_slug", "week_start");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_content_type_content_slug_key" UNIQUE ("content_type", "content_slug");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_polar_subscription_id_key" UNIQUE ("polar_subscription_id");



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



CREATE INDEX "idx_agents_category" ON "public"."agents" USING "btree" ("category");



CREATE INDEX "idx_agents_content_fts" ON "public"."agents" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_agents_created_at" ON "public"."agents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_agents_date_added" ON "public"."agents" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_agents_fts" ON "public"."agents" USING "gin" ("fts_vector");



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



CREATE INDEX "idx_bookmarks_content" ON "public"."bookmarks" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_bookmarks_content_slug" ON "public"."bookmarks" USING "btree" ("content_slug");



CREATE UNIQUE INDEX "idx_bookmarks_lookup" ON "public"."bookmarks" USING "btree" ("user_id", "content_type", "content_slug") INCLUDE ("id", "created_at");



CREATE INDEX "idx_bookmarks_user_id" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_bookmarks_user_recent" ON "public"."bookmarks" USING "btree" ("user_id", "created_at" DESC);



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



CREATE INDEX "idx_collections_category" ON "public"."collections" USING "btree" ("category");



CREATE INDEX "idx_collections_content_fts" ON "public"."collections" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_collections_created_at" ON "public"."collections" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_collections_date_added" ON "public"."collections" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_collections_fts" ON "public"."collections" USING "gin" ("fts_vector");



CREATE INDEX "idx_collections_items" ON "public"."collections" USING "gin" ("items");



CREATE INDEX "idx_collections_slug" ON "public"."collections" USING "btree" ("slug");



CREATE INDEX "idx_collections_tags" ON "public"."collections" USING "gin" ("tags");



CREATE INDEX "idx_collections_type" ON "public"."collections" USING "btree" ("collection_type") WHERE ("collection_type" IS NOT NULL);



CREATE INDEX "idx_commands_author" ON "public"."commands" USING "btree" ("author");



CREATE INDEX "idx_commands_category" ON "public"."commands" USING "btree" ("category");



CREATE INDEX "idx_commands_content_fts" ON "public"."commands" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_commands_created_at" ON "public"."commands" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_commands_date_added" ON "public"."commands" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_commands_fts" ON "public"."commands" USING "gin" ("fts_vector");



CREATE INDEX "idx_commands_slug" ON "public"."commands" USING "btree" ("slug");



CREATE INDEX "idx_commands_tags" ON "public"."commands" USING "gin" ("tags");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_companies_featured" ON "public"."companies" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_companies_name" ON "public"."companies" USING "btree" ("name");



CREATE INDEX "idx_companies_name_trgm" ON "public"."companies" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_companies_owner_id" ON "public"."companies" USING "btree" ("owner_id");



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



CREATE INDEX "idx_content_similarities_content_a" ON "public"."content_similarities" USING "btree" ("content_a_type", "content_a_slug", "similarity_score" DESC);



CREATE INDEX "idx_content_similarities_content_b" ON "public"."content_similarities" USING "btree" ("content_b_type", "content_b_slug");



CREATE INDEX "idx_content_similarities_score" ON "public"."content_similarities" USING "btree" ("similarity_score" DESC) WHERE ("similarity_score" >= 0.3);



CREATE INDEX "idx_content_submissions_created" ON "public"."content_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_submissions_search" ON "public"."content_submissions" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("name" || ' '::"text") || "description")));



CREATE INDEX "idx_content_submissions_spam" ON "public"."content_submissions" USING "btree" ("spam_score") WHERE ("spam_score" > 0.5);



CREATE INDEX "idx_content_submissions_status" ON "public"."content_submissions" USING "btree" ("status");



CREATE INDEX "idx_content_submissions_submitter" ON "public"."content_submissions" USING "btree" ("submitter_id");



CREATE INDEX "idx_content_submissions_type" ON "public"."content_submissions" USING "btree" ("submission_type");



CREATE INDEX "idx_featured_configs_content" ON "public"."featured_configs" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_featured_configs_rank" ON "public"."featured_configs" USING "btree" ("rank", "final_score" DESC);



CREATE INDEX "idx_featured_configs_week" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "week_end" DESC);



CREATE INDEX "idx_featured_configs_week_rank" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "rank");



CREATE INDEX "idx_field_versions_changed_at" ON "public"."form_field_versions" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_field_versions_field_id" ON "public"."form_field_versions" USING "btree" ("field_id");



CREATE INDEX "idx_followers_follower_id" ON "public"."followers" USING "btree" ("follower_id");



CREATE INDEX "idx_followers_following_id" ON "public"."followers" USING "btree" ("following_id");



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



CREATE INDEX "idx_guides_keywords" ON "public"."guides" USING "gin" ("keywords");



CREATE INDEX "idx_guides_slug" ON "public"."guides" USING "btree" ("slug");



CREATE INDEX "idx_guides_subcategory" ON "public"."guides" USING "btree" ("subcategory");



CREATE INDEX "idx_guides_tags" ON "public"."guides" USING "gin" ("tags");



CREATE INDEX "idx_hooks_author" ON "public"."hooks" USING "btree" ("author");



CREATE INDEX "idx_hooks_category" ON "public"."hooks" USING "btree" ("category");



CREATE INDEX "idx_hooks_content_fts" ON "public"."hooks" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_hooks_created_at" ON "public"."hooks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_hooks_date_added" ON "public"."hooks" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_hooks_event_types" ON "public"."hooks" USING "gin" ("event_types");



CREATE INDEX "idx_hooks_fts" ON "public"."hooks" USING "gin" ("fts_vector");



CREATE INDEX "idx_hooks_slug" ON "public"."hooks" USING "btree" ("slug");



CREATE INDEX "idx_hooks_tags" ON "public"."hooks" USING "gin" ("tags");



CREATE INDEX "idx_jobs_active" ON "public"."jobs" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_expires_at" ON "public"."jobs" USING "btree" ("expires_at");



CREATE INDEX "idx_jobs_payment_status" ON "public"."jobs" USING "btree" ("payment_status", "created_at" DESC);



CREATE INDEX "idx_jobs_pending_review" ON "public"."jobs" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'pending_review'::"text");



CREATE INDEX "idx_jobs_plan" ON "public"."jobs" USING "btree" ("plan");



CREATE INDEX "idx_jobs_search_vector" ON "public"."jobs" USING "gin" ("search_vector");



CREATE INDEX "idx_jobs_slug" ON "public"."jobs" USING "btree" ("slug");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_title_trgm" ON "public"."jobs" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_jobs_user_id" ON "public"."jobs" USING "btree" ("user_id");



CREATE INDEX "idx_mcp_author" ON "public"."mcp" USING "btree" ("author");



CREATE INDEX "idx_mcp_category" ON "public"."mcp" USING "btree" ("category");



CREATE INDEX "idx_mcp_content_fts" ON "public"."mcp" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_mcp_created_at" ON "public"."mcp" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mcp_date_added" ON "public"."mcp" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_mcp_fts" ON "public"."mcp" USING "gin" ("fts_vector");



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



CREATE INDEX "idx_mv_featured_scores_category" ON "public"."mv_featured_scores" USING "btree" ("content_type");



CREATE UNIQUE INDEX "idx_mv_featured_scores_content_rank" ON "public"."mv_featured_scores" USING "btree" ("content_type", "content_slug", "rank");



CREATE INDEX "idx_mv_featured_scores_final_score" ON "public"."mv_featured_scores" USING "btree" ("final_score" DESC);



CREATE INDEX "idx_mv_featured_scores_rank" ON "public"."mv_featured_scores" USING "btree" ("content_type", "rank");



CREATE UNIQUE INDEX "idx_mv_featured_scores_unique" ON "public"."mv_featured_scores" USING "btree" ("content_type", "content_slug");



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



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_posts_user_vote" ON "public"."posts" USING "btree" ("user_id", "vote_count" DESC, "created_at" DESC);



CREATE INDEX "idx_posts_vote_count" ON "public"."posts" USING "btree" ("vote_count" DESC);



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_profiles_public" ON "public"."profiles" USING "btree" ("profile_public") WHERE ("profile_public" = true);



CREATE INDEX "idx_profiles_reputation" ON "public"."profiles" USING "btree" ("reputation_score" DESC);



CREATE INDEX "idx_profiles_search" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("display_name", ''::"text") || ' '::"text") || COALESCE("bio", ''::"text")))) WHERE ("profile_public" = true);



CREATE INDEX "idx_recommended_content_score" ON "public"."recommended_content" USING "btree" ("recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user" ON "public"."recommended_content" USING "btree" ("user_id", "recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user_type" ON "public"."recommended_content" USING "btree" ("user_id", "content_type", "recommendation_score" DESC);



CREATE INDEX "idx_reputation_actions_active" ON "public"."reputation_actions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_order" ON "public"."reputation_tiers" USING "btree" ("order") WHERE ("active" = true);



CREATE INDEX "idx_reputation_tiers_score_range" ON "public"."reputation_tiers" USING "btree" ("min_score", "max_score") WHERE ("active" = true);



CREATE INDEX "idx_review_helpful_votes_review" ON "public"."review_helpful_votes" USING "btree" ("review_id");



CREATE INDEX "idx_review_helpful_votes_user" ON "public"."review_helpful_votes" USING "btree" ("user_id");



CREATE INDEX "idx_review_ratings_content" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_slug_rating" ON "public"."review_ratings" USING "btree" ("content_slug", "rating");



CREATE INDEX "idx_review_ratings_helpful" ON "public"."review_ratings" USING "btree" ("helpful_count" DESC) WHERE ("helpful_count" > 0);



CREATE INDEX "idx_review_ratings_rating" ON "public"."review_ratings" USING "btree" ("rating", "created_at" DESC);



CREATE INDEX "idx_review_ratings_user" ON "public"."review_ratings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_rules_author" ON "public"."rules" USING "btree" ("author");



CREATE INDEX "idx_rules_category" ON "public"."rules" USING "btree" ("category");



CREATE INDEX "idx_rules_content_fts" ON "public"."rules" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_rules_created_at" ON "public"."rules" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_rules_date_added" ON "public"."rules" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_rules_fts" ON "public"."rules" USING "gin" ("fts_vector");



CREATE INDEX "idx_rules_slug" ON "public"."rules" USING "btree" ("slug");



CREATE INDEX "idx_rules_tags" ON "public"."rules" USING "gin" ("tags");



CREATE INDEX "idx_select_options_active" ON "public"."form_select_options" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_select_options_field_id" ON "public"."form_select_options" USING "btree" ("field_id");



CREATE INDEX "idx_select_options_order" ON "public"."form_select_options" USING "btree" ("option_order");



CREATE INDEX "idx_skills_author" ON "public"."skills" USING "btree" ("author");



CREATE INDEX "idx_skills_category" ON "public"."skills" USING "btree" ("category");



CREATE INDEX "idx_skills_content_fts" ON "public"."skills" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_skills_created_at" ON "public"."skills" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_skills_date_added" ON "public"."skills" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_skills_dependencies" ON "public"."skills" USING "gin" ("dependencies");



CREATE INDEX "idx_skills_difficulty" ON "public"."skills" USING "btree" ("difficulty") WHERE ("difficulty" IS NOT NULL);



CREATE INDEX "idx_skills_fts" ON "public"."skills" USING "gin" ("fts_vector");



CREATE INDEX "idx_skills_slug" ON "public"."skills" USING "btree" ("slug");



CREATE INDEX "idx_skills_tags" ON "public"."skills" USING "gin" ("tags");



CREATE INDEX "idx_sponsored_clicks_sponsored_id" ON "public"."sponsored_clicks" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_clicks_user_id" ON "public"."sponsored_clicks" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_content_active" ON "public"."sponsored_content" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_dates" ON "public"."sponsored_content" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_sponsored_content_user_id" ON "public"."sponsored_content" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_impressions_sponsored_id" ON "public"."sponsored_impressions" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_impressions_user_id" ON "public"."sponsored_impressions" USING "btree" ("user_id");



CREATE INDEX "idx_statuslines_author" ON "public"."statuslines" USING "btree" ("author");



CREATE INDEX "idx_statuslines_category" ON "public"."statuslines" USING "btree" ("category");



CREATE INDEX "idx_statuslines_content_fts" ON "public"."statuslines" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_statuslines_created_at" ON "public"."statuslines" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_statuslines_date_added" ON "public"."statuslines" USING "btree" ("date_added" DESC);



CREATE INDEX "idx_statuslines_fts" ON "public"."statuslines" USING "gin" ("fts_vector");



CREATE INDEX "idx_statuslines_slug" ON "public"."statuslines" USING "btree" ("slug");



CREATE INDEX "idx_statuslines_tags" ON "public"."statuslines" USING "gin" ("tags");



CREATE UNIQUE INDEX "idx_submission_stats_summary_singleton" ON "public"."submission_stats_summary" USING "btree" ((1));



CREATE INDEX "idx_submissions_content_type" ON "public"."submissions" USING "btree" ("content_type");



CREATE INDEX "idx_submissions_created_at" ON "public"."submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_submissions_pr_number" ON "public"."submissions" USING "btree" ("pr_number") WHERE ("pr_number" IS NOT NULL);



CREATE INDEX "idx_submissions_status" ON "public"."submissions" USING "btree" ("status");



CREATE INDEX "idx_submissions_user_id" ON "public"."submissions" USING "btree" ("user_id");



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



CREATE INDEX "idx_votes_user_id" ON "public"."votes" USING "btree" ("user_id");



CREATE INDEX "idx_webhook_events_created_at" ON "public"."webhook_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_events_data" ON "public"."webhook_events" USING "gin" ("data");



CREATE INDEX "idx_webhook_events_next_retry" ON "public"."webhook_events" USING "btree" ("next_retry_at") WHERE ("next_retry_at" IS NOT NULL);



CREATE INDEX "idx_webhook_events_processed" ON "public"."webhook_events" USING "btree" ("processed") WHERE ("processed" = false);



CREATE INDEX "idx_webhook_events_type" ON "public"."webhook_events" USING "btree" ("type");



CREATE STATISTICS "public"."stats_user_affinities_user_score_type" (ndistinct, dependencies) ON "user_id", "content_type", "affinity_score" FROM "public"."user_affinities";


ALTER STATISTICS "public"."stats_user_affinities_user_score_type" OWNER TO "postgres";


CREATE STATISTICS "public"."stats_user_interactions_user_time_type" (dependencies) ON "user_id", "interaction_type", "created_at" FROM "public"."user_interactions";


ALTER STATISTICS "public"."stats_user_interactions_user_time_type" OWNER TO "postgres";


CREATE OR REPLACE TRIGGER "agents_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "collections_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



CREATE OR REPLACE TRIGGER "commands_fts_update" BEFORE INSERT OR UPDATE OF "title", "description", "tags" ON "public"."commands" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_fts"();



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



CREATE OR REPLACE TRIGGER "trigger_check_badges_on_reputation" AFTER UPDATE OF "reputation_score" ON "public"."users" FOR EACH ROW WHEN (("old"."reputation_score" IS DISTINCT FROM "new"."reputation_score")) EXECUTE FUNCTION "public"."check_badges_after_reputation"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_comment" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_comment"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_helpful_review" AFTER UPDATE OF "helpful_count" ON "public"."review_ratings" FOR EACH ROW WHEN (("old"."helpful_count" IS DISTINCT FROM "new"."helpful_count")) EXECUTE FUNCTION "public"."update_reputation_on_helpful_review"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_post" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_post"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_submission" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_submission"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_delete" AFTER DELETE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_insert" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



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



CREATE OR REPLACE TRIGGER "update_skills_updated_at" BEFORE UPDATE ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsored_content_updated_at" BEFORE UPDATE ON "public"."sponsored_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statuslines_updated_at" BEFORE UPDATE ON "public"."statuslines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



CREATE POLICY "Form field definitions are publicly readable" ON "public"."form_field_definitions" FOR SELECT USING (("active" = true));



CREATE POLICY "Form field versions are publicly readable" ON "public"."form_field_versions" FOR SELECT USING (true);



CREATE POLICY "Form select options are publicly readable" ON "public"."form_select_options" FOR SELECT USING (("active" = true));



CREATE POLICY "Helpful votes are viewable by everyone" ON "public"."review_helpful_votes" FOR SELECT USING (true);



CREATE POLICY "Moderators can update submissions" ON "public"."content_submissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'moderator'::"text")))));



CREATE POLICY "Moderators can view all submissions" ON "public"."content_submissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'moderator'::"text")))));



CREATE POLICY "Notifications are viewable by everyone" ON "public"."notifications" FOR SELECT USING (true);



CREATE POLICY "Posts are viewable by everyone" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Public collections are viewable by everyone" ON "public"."user_collections" FOR SELECT USING ((("is_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (("profile_public" = true));



CREATE POLICY "Public users are viewable by everyone" ON "public"."users" FOR SELECT USING ((("public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "id")));



CREATE POLICY "Published entries are viewable by everyone" ON "public"."changelog_entries" FOR SELECT USING (("published" = true));



CREATE POLICY "Reviews are viewable by everyone" ON "public"."review_ratings" FOR SELECT USING (true);



CREATE POLICY "Service role can manage form field definitions" ON "public"."form_field_definitions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage form field versions" ON "public"."form_field_versions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage form select options" ON "public"."form_select_options" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage webhook events" ON "public"."webhook_events" USING (true);



CREATE POLICY "Service role has full access to affinities" ON "public"."user_affinities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to content similarities" ON "public"."content_similarities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to featured configs" ON "public"."featured_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to helpful votes" ON "public"."review_helpful_votes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to interactions" ON "public"."user_interactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to reviews" ON "public"."review_ratings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to submissions" ON "public"."submissions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to user similarities" ON "public"."user_similarities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "User badges are viewable by everyone" ON "public"."user_badges" FOR SELECT USING (true);



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



CREATE POLICY "Users can dismiss announcements" ON "public"."announcement_dismissals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can dismiss notifications" ON "public"."notification_dismissals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can feature their own badges" ON "public"."user_badges" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can follow others" ON "public"."followers" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert submissions" ON "public"."content_submissions" FOR INSERT WITH CHECK ((("auth"."uid"() = "submitter_id") OR ("submitter_id" IS NULL)));



CREATE POLICY "Users can insert their own bookmarks" ON "public"."bookmarks" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own webhook events" ON "public"."webhook_events" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("data" ->> 'to'::"text") = ("auth"."jwt"() ->> 'email'::"text")) OR (("data" -> 'to'::"text") ? ("auth"."jwt"() ->> 'email'::"text")) OR (("data" -> 'to'::"text") @> "to_jsonb"(ARRAY[("auth"."jwt"() ->> 'email'::"text")])))));



CREATE POLICY "Users can remove their helpful votes" ON "public"."review_helpful_votes" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can remove their own votes" ON "public"."votes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can un-dismiss announcements" ON "public"."announcement_dismissals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can un-dismiss notifications" ON "public"."notification_dismissals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unfollow others" ON "public"."followers" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can unsubscribe" ON "public"."newsletter_subscriptions" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = "email")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = "email"));



CREATE POLICY "Users can update items in their collections" ON "public"."collection_items" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



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



CREATE POLICY "Users can view own interactions" ON "public"."user_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own submissions" ON "public"."content_submissions" FOR SELECT USING (("auth"."uid"() = "submitter_id"));



CREATE POLICY "Users can view own submissions" ON "public"."submissions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own affinities" ON "public"."user_affinities" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own bookmarks" ON "public"."bookmarks" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own dismissals" ON "public"."announcement_dismissals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own dismissals" ON "public"."notification_dismissals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own interactions" ON "public"."user_interactions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own newsletter subscription" ON "public"."newsletter_subscriptions" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own similarities" ON "public"."user_similarities" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_a_id") OR (( SELECT "auth"."uid"() AS "uid") = "user_b_id")));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Votes are viewable by everyone" ON "public"."votes" FOR SELECT USING (true);



ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcement_dismissals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelog_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_generation_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_similarities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_field_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_select_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mcp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_dismissals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reputation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reputation_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_helpful_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_impressions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."statuslines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


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


















































































































































































































GRANT ALL ON FUNCTION "public"."batch_recalculate_all_reputation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_tag_similarity"("p_tags_a" "text"[], "p_tags_b" "text"[]) TO "anon";



GRANT ALL ON FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."calculate_user_reputation_score"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_all_badges"("target_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_and_award_badge"("target_user_id" "uuid", "badge_slug" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."cleanup_old_interactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bookmark_counts_by_category"("category_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats_realtime"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_with_analytics"("p_category" "text", "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_new_content_for_week"("p_week_start" "date", "p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_related_content"("p_category" "text", "p_slug" "text", "p_tags" "text"[], "p_limit" integer, "p_exclude_slugs" "text"[]) TO "anon";



GRANT ALL ON FUNCTION "public"."get_trending_content"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_content"("p_limit" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reputation_breakdown"("p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_digest"("p_week_start" "date") TO "anon";



GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "row_id" "uuid", "column_name" "text", "increment_by" integer) TO "anon";



GRANT ALL ON FUNCTION "public"."refresh_content_popularity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_content_popularity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_profile_from_oauth"("user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."refresh_user_stat"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."refresh_user_stats"() TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."companies" TO "authenticated";
GRANT SELECT ON TABLE "public"."companies" TO "anon";



GRANT ALL ON FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_companies"("search_query" "text", "result_limit" integer) TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."jobs" TO "authenticated";
GRANT SELECT ON TABLE "public"."jobs" TO "anon";



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



GRANT SELECT ON TABLE "public"."badges" TO "authenticated";
GRANT SELECT ON TABLE "public"."badges" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."bookmarks" TO "authenticated";



GRANT ALL ON TABLE "public"."changelog" TO "service_role";



GRANT SELECT ON TABLE "public"."changelog_entries" TO "authenticated";
GRANT SELECT ON TABLE "public"."changelog_entries" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."collection_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."collection_items" TO "anon";



GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."commands" TO "service_role";



GRANT SELECT,INSERT ON TABLE "public"."comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."comments" TO "anon";



GRANT SELECT ON TABLE "public"."company_job_stats" TO "authenticated";



GRANT ALL ON TABLE "public"."guides" TO "service_role";



GRANT ALL ON TABLE "public"."hooks" TO "service_role";



GRANT ALL ON TABLE "public"."mcp" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "service_role";



GRANT ALL ON TABLE "public"."statuslines" TO "service_role";



GRANT SELECT ON TABLE "public"."content_base" TO "anon";
GRANT SELECT ON TABLE "public"."content_base" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_popularity" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_similarities" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_similarities" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."content_submissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_unified" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_unified" TO "anon";



GRANT SELECT ON TABLE "public"."featured_configs" TO "authenticated";
GRANT SELECT ON TABLE "public"."featured_configs" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."followers" TO "authenticated";
GRANT SELECT ON TABLE "public"."followers" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."user_interactions" TO "authenticated";
GRANT INSERT ON TABLE "public"."user_interactions" TO "anon";



GRANT SELECT ON TABLE "public"."mv_content_tag_index" TO "service_role";



GRANT SELECT ON TABLE "public"."user_affinities" TO "authenticated";



GRANT SELECT ON TABLE "public"."mv_trending_content" TO "service_role";



GRANT SELECT ON TABLE "public"."mv_weekly_new_content" TO "service_role";



GRANT SELECT ON TABLE "public"."payments" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."posts" TO "authenticated";
GRANT SELECT ON TABLE "public"."posts" TO "anon";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";



GRANT SELECT ON TABLE "public"."recommended_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."recommended_content" TO "service_role";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."review_helpful_votes" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."review_ratings" TO "authenticated";



GRANT INSERT ON TABLE "public"."sponsored_clicks" TO "authenticated";



GRANT SELECT ON TABLE "public"."sponsored_content" TO "authenticated";
GRANT SELECT ON TABLE "public"."sponsored_content" TO "anon";



GRANT INSERT ON TABLE "public"."sponsored_impressions" TO "authenticated";



GRANT SELECT ON TABLE "public"."submissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."submission_stats_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."submission_stats_summary" TO "anon";



GRANT SELECT ON TABLE "public"."subscriptions" TO "authenticated";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."votes" TO "authenticated";



GRANT SELECT ON TABLE "public"."trending_content_24h" TO "authenticated";
GRANT ALL ON TABLE "public"."trending_content_24h" TO "service_role";



GRANT SELECT ON TABLE "public"."user_activity_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_activity_summary" TO "anon";



GRANT SELECT ON TABLE "public"."user_affinity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_affinity_scores" TO "service_role";



GRANT SELECT ON TABLE "public"."user_badge_stats" TO "authenticated";



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


































RESET ALL;
