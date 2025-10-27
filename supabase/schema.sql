


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



CREATE OR REPLACE FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  post_points INTEGER := 0;
  vote_points INTEGER := 0;
  comment_points INTEGER := 0;
  submission_points INTEGER := 0;
  total_reputation INTEGER := 0;
BEGIN
  -- Points from posts created (10 points each)
  SELECT COALESCE(COUNT(*) * 10, 0) INTO post_points
  FROM public.posts WHERE user_id = target_user_id;
  
  -- Points from votes received on posts (5 points each)
  SELECT COALESCE(SUM(p.vote_count) * 5, 0) INTO vote_points
  FROM public.posts p WHERE p.user_id = target_user_id;
  
  -- Points from comments created (2 points each)
  SELECT COALESCE(COUNT(*) * 2, 0) INTO comment_points
  FROM public.comments WHERE user_id = target_user_id;
  
  -- Points from merged submissions (20 points each)
  SELECT COALESCE(COUNT(*) * 20, 0) INTO submission_points
  FROM public.submissions WHERE user_id = target_user_id AND status = 'merged';
  
  total_reputation := post_points + vote_points + comment_points + submission_points;
  
  UPDATE public.users
  SET reputation_score = total_reputation, updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN total_reputation;
END;
$$;


ALTER FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") OWNER TO "postgres";


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
    CONSTRAINT "jobs_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['polar'::"text", 'mercury_invoice'::"text", 'manual'::"text"]))),
    CONSTRAINT "jobs_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['unpaid'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_review'::"text", 'active'::"text", 'expired'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."payment_status" IS 'Payment status: unpaid (default), paid (approved), refunded';



COMMENT ON COLUMN "public"."jobs"."payment_method" IS 'Payment method: polar (Polar.sh), mercury_invoice (Mercury invoicing), manual (admin override)';



COMMENT ON COLUMN "public"."jobs"."payment_date" IS 'Timestamp when payment was confirmed';



COMMENT ON COLUMN "public"."jobs"."payment_amount" IS 'Payment amount in USD (e.g., 299.00 for $299)';



COMMENT ON COLUMN "public"."jobs"."payment_reference" IS 'Payment reference ID (Polar order ID, Mercury invoice number, etc.)';



COMMENT ON COLUMN "public"."jobs"."admin_notes" IS 'Internal admin notes for review/approval process';



COMMENT ON COLUMN "public"."jobs"."search_vector" IS 'Full-text search vector (auto-maintained): title(A) + company(A) + description(B) + category(C) + tags(D)';



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
    CONSTRAINT "users_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."search_vector" IS 'Full-text search vector (auto-maintained): name(A) + bio(B) + work(C) + interests(D)';



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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


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


COMMENT ON TABLE "public"."content_items" IS 'Content directory items synced from Git /content/*.json files. Serves as database source for content delivery instead of /generated/*.ts imports. Enables PostgreSQL full-text search, SQL filtering, and real-time updates.';



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


COMMENT ON MATERIALIZED VIEW "public"."recommended_content" IS 'Personalized content recommendations per user. Refreshed every 2 hours. Formula: (affinity × 0.7) + (popularity × 0.3).';



COMMENT ON COLUMN "public"."recommended_content"."recommendation_score" IS 'Combined score: user affinity (70%) + content popularity (30%). Range: 0-100. Higher = better recommendation.';



COMMENT ON COLUMN "public"."recommended_content"."user_affinity" IS 'User affinity score for this content type. From user_affinities table.';



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


CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_slug" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_interactions_content_type_check" CHECK (("content_type" = ANY (ARRAY['agents'::"text", 'mcp'::"text", 'rules'::"text", 'commands'::"text", 'hooks'::"text", 'statuslines'::"text", 'collections'::"text"]))),
    CONSTRAINT "user_interactions_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'copy'::"text", 'bookmark'::"text", 'click'::"text", 'time_spent'::"text"])))
);


ALTER TABLE "public"."user_interactions" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_content_type_content_slug_key" UNIQUE ("user_id", "content_type", "content_slug");



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



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_category_slug_unique" UNIQUE ("category", "slug");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_content_a_type_content_a_slug_content__key" UNIQUE ("content_a_type", "content_a_slug", "content_b_type", "content_b_slug");



ALTER TABLE ONLY "public"."content_similarities"
    ADD CONSTRAINT "content_similarities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_content_type_content_slug_week_start_key" UNIQUE ("content_type", "content_slug", "week_start");



ALTER TABLE ONLY "public"."featured_configs"
    ADD CONSTRAINT "featured_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_polar_transaction_id_key" UNIQUE ("polar_transaction_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_helpful_votes"
    ADD CONSTRAINT "review_helpful_votes_review_id_user_id_key" UNIQUE ("review_id", "user_id");



ALTER TABLE ONLY "public"."review_ratings"
    ADD CONSTRAINT "review_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_ratings"
    ADD CONSTRAINT "review_ratings_user_id_content_type_content_slug_key" UNIQUE ("user_id", "content_type", "content_slug");



ALTER TABLE ONLY "public"."sponsored_clicks"
    ADD CONSTRAINT "sponsored_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_content"
    ADD CONSTRAINT "sponsored_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsored_impressions"
    ADD CONSTRAINT "sponsored_impressions_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_badges_active" ON "public"."badges" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_badges_category" ON "public"."badges" USING "btree" ("category");



CREATE INDEX "idx_bookmarks_content" ON "public"."bookmarks" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_bookmarks_content_slug" ON "public"."bookmarks" USING "btree" ("content_slug");



CREATE UNIQUE INDEX "idx_bookmarks_lookup" ON "public"."bookmarks" USING "btree" ("user_id", "content_type", "content_slug") INCLUDE ("id", "created_at");



CREATE INDEX "idx_bookmarks_user_id" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_bookmarks_user_recent" ON "public"."bookmarks" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_collection_items_collection_id" ON "public"."collection_items" USING "btree" ("collection_id");



CREATE INDEX "idx_collection_items_content" ON "public"."collection_items" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_collection_items_content_slug" ON "public"."collection_items" USING "btree" ("content_slug");



CREATE INDEX "idx_collection_items_order" ON "public"."collection_items" USING "btree" ("collection_id", "order");



CREATE INDEX "idx_collection_items_user_id" ON "public"."collection_items" USING "btree" ("user_id");



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



CREATE INDEX "idx_content_items_category" ON "public"."content_items" USING "btree" ("category");



CREATE INDEX "idx_content_items_category_slug" ON "public"."content_items" USING "btree" ("category", "slug");



CREATE INDEX "idx_content_items_data_gin" ON "public"."content_items" USING "gin" ("data");



CREATE INDEX "idx_content_items_git_hash" ON "public"."content_items" USING "btree" ("git_hash");



CREATE INDEX "idx_content_items_search_vector" ON "public"."content_items" USING "gin" ("search_vector");



CREATE INDEX "idx_content_items_slug" ON "public"."content_items" USING "btree" ("slug");



CREATE INDEX "idx_content_items_synced_at" ON "public"."content_items" USING "btree" ("synced_at" DESC);



CREATE UNIQUE INDEX "idx_content_popularity_pk" ON "public"."content_popularity" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_content_popularity_score" ON "public"."content_popularity" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_content_popularity_type" ON "public"."content_popularity" USING "btree" ("content_type");



CREATE INDEX "idx_content_similarities_content_a" ON "public"."content_similarities" USING "btree" ("content_a_type", "content_a_slug", "similarity_score" DESC);



CREATE INDEX "idx_content_similarities_content_b" ON "public"."content_similarities" USING "btree" ("content_b_type", "content_b_slug");



CREATE INDEX "idx_content_similarities_score" ON "public"."content_similarities" USING "btree" ("similarity_score" DESC) WHERE ("similarity_score" >= 0.3);



CREATE INDEX "idx_featured_configs_content" ON "public"."featured_configs" USING "btree" ("content_type", "content_slug");



CREATE INDEX "idx_featured_configs_rank" ON "public"."featured_configs" USING "btree" ("rank", "final_score" DESC);



CREATE INDEX "idx_featured_configs_week" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "week_end" DESC);



CREATE INDEX "idx_featured_configs_week_rank" ON "public"."featured_configs" USING "btree" ("week_start" DESC, "rank");



CREATE INDEX "idx_followers_follower_id" ON "public"."followers" USING "btree" ("follower_id");



CREATE INDEX "idx_followers_following_id" ON "public"."followers" USING "btree" ("following_id");



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



CREATE INDEX "idx_newsletter_confirmation_token" ON "public"."newsletter_subscriptions" USING "btree" ("confirmation_token") WHERE ("confirmation_token" IS NOT NULL);



CREATE INDEX "idx_newsletter_source" ON "public"."newsletter_subscriptions" USING "btree" ("source") WHERE ("source" IS NOT NULL);



CREATE INDEX "idx_newsletter_status" ON "public"."newsletter_subscriptions" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_newsletter_subscribed_at" ON "public"."newsletter_subscriptions" USING "btree" ("subscribed_at" DESC);



CREATE INDEX "idx_payments_polar_transaction_id" ON "public"."payments" USING "btree" ("polar_transaction_id");



CREATE INDEX "idx_payments_product" ON "public"."payments" USING "btree" ("product_type", "product_id");



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_user_created" ON "public"."posts" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_posts_user_vote" ON "public"."posts" USING "btree" ("user_id", "vote_count" DESC, "created_at" DESC);



CREATE INDEX "idx_posts_vote_count" ON "public"."posts" USING "btree" ("vote_count" DESC);



CREATE INDEX "idx_recommended_content_score" ON "public"."recommended_content" USING "btree" ("recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user" ON "public"."recommended_content" USING "btree" ("user_id", "recommendation_score" DESC);



CREATE INDEX "idx_recommended_content_user_type" ON "public"."recommended_content" USING "btree" ("user_id", "content_type", "recommendation_score" DESC);



CREATE INDEX "idx_review_helpful_votes_review" ON "public"."review_helpful_votes" USING "btree" ("review_id");



CREATE INDEX "idx_review_helpful_votes_user" ON "public"."review_helpful_votes" USING "btree" ("user_id");



CREATE INDEX "idx_review_ratings_content" ON "public"."review_ratings" USING "btree" ("content_type", "content_slug", "created_at" DESC);



CREATE INDEX "idx_review_ratings_content_slug_rating" ON "public"."review_ratings" USING "btree" ("content_slug", "rating");



CREATE INDEX "idx_review_ratings_helpful" ON "public"."review_ratings" USING "btree" ("helpful_count" DESC) WHERE ("helpful_count" > 0);



CREATE INDEX "idx_review_ratings_rating" ON "public"."review_ratings" USING "btree" ("rating", "created_at" DESC);



CREATE INDEX "idx_review_ratings_user" ON "public"."review_ratings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_sponsored_clicks_sponsored_id" ON "public"."sponsored_clicks" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_clicks_user_id" ON "public"."sponsored_clicks" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_content_active" ON "public"."sponsored_content" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_sponsored_content_dates" ON "public"."sponsored_content" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_sponsored_content_user_id" ON "public"."sponsored_content" USING "btree" ("user_id");



CREATE INDEX "idx_sponsored_impressions_sponsored_id" ON "public"."sponsored_impressions" USING "btree" ("sponsored_id");



CREATE INDEX "idx_sponsored_impressions_user_id" ON "public"."sponsored_impressions" USING "btree" ("user_id");



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



CREATE INDEX "idx_user_interactions_recent_views" ON "public"."user_interactions" USING "btree" ("user_id", "created_at" DESC, "interaction_type") WHERE ("interaction_type" = ANY (ARRAY['view'::"text", 'bookmark'::"text", 'copy'::"text"]));



CREATE INDEX "idx_user_interactions_session" ON "public"."user_interactions" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_user_interactions_type" ON "public"."user_interactions" USING "btree" ("interaction_type");



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



CREATE INDEX "idx_users_search_vector" ON "public"."users" USING "gin" ("search_vector");



CREATE INDEX "idx_users_slug" ON "public"."users" USING "btree" ("slug");



CREATE INDEX "idx_users_tier" ON "public"."users" USING "btree" ("tier");



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


CREATE OR REPLACE TRIGGER "generate_job_slug" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_user_collections_slug" BEFORE INSERT OR UPDATE ON "public"."user_collections" FOR EACH ROW EXECUTE FUNCTION "public"."generate_collection_slug"();



CREATE OR REPLACE TRIGGER "generate_user_mcp_slug" BEFORE INSERT ON "public"."user_mcps" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();



CREATE OR REPLACE TRIGGER "generate_users_slug" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."generate_user_slug"();



CREATE OR REPLACE TRIGGER "newsletter_updated_at_trigger" BEFORE UPDATE ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_newsletter_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_check_badges_on_reputation" AFTER UPDATE OF "reputation_score" ON "public"."users" FOR EACH ROW WHEN (("old"."reputation_score" IS DISTINCT FROM "new"."reputation_score")) EXECUTE FUNCTION "public"."check_badges_after_reputation"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_comment" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_comment"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_helpful_review" AFTER UPDATE OF "helpful_count" ON "public"."review_ratings" FOR EACH ROW WHEN (("old"."helpful_count" IS DISTINCT FROM "new"."helpful_count")) EXECUTE FUNCTION "public"."update_reputation_on_helpful_review"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_post" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_post"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_submission" AFTER INSERT OR UPDATE ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_submission"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_delete" AFTER DELETE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



CREATE OR REPLACE TRIGGER "trigger_reputation_on_vote_insert" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_reputation_on_vote"();



CREATE OR REPLACE TRIGGER "trigger_update_helpful_count_on_delete" AFTER DELETE ON "public"."review_helpful_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_helpful_count"();



CREATE OR REPLACE TRIGGER "trigger_update_helpful_count_on_insert" AFTER INSERT ON "public"."review_helpful_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_helpful_count"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_delete" AFTER DELETE ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_collection_item_count_on_insert" AFTER INSERT ON "public"."collection_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_collection_item_count"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_items_updated_at_trigger" BEFORE UPDATE ON "public"."content_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_items_updated_at"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_review_ratings_updated_at" BEFORE UPDATE ON "public"."review_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsored_content_updated_at" BEFORE UPDATE ON "public"."sponsored_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_collections_updated_at" BEFORE UPDATE ON "public"."user_collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_content_updated_at" BEFORE UPDATE ON "public"."user_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_mcps_updated_at" BEFORE UPDATE ON "public"."user_mcps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vote_count_on_delete" AFTER DELETE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_vote_count"();



CREATE OR REPLACE TRIGGER "update_vote_count_on_insert" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_vote_count"();



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



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Anyone can record sponsored clicks" ON "public"."sponsored_clicks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can record sponsored impressions" ON "public"."sponsored_impressions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can subscribe" ON "public"."newsletter_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can comment" ON "public"."comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can create reviews" ON "public"."review_ratings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can mark reviews helpful" ON "public"."review_helpful_votes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can vote" ON "public"."votes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (("active" = true));



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Companies are viewable by everyone" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Company owners can update their companies" ON "public"."companies" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Content is publicly readable" ON "public"."content_items" FOR SELECT USING (true);



CREATE POLICY "Content similarities are viewable by everyone" ON "public"."content_similarities" FOR SELECT USING (true);



CREATE POLICY "Featured configs are viewable by everyone" ON "public"."featured_configs" FOR SELECT USING (true);



CREATE POLICY "Followers are viewable by everyone" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "Helpful votes are viewable by everyone" ON "public"."review_helpful_votes" FOR SELECT USING (true);



CREATE POLICY "Posts are viewable by everyone" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Public collections are viewable by everyone" ON "public"."user_collections" FOR SELECT USING ((("is_public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Public users are viewable by everyone" ON "public"."users" FOR SELECT USING ((("public" = true) OR (( SELECT "auth"."uid"() AS "uid") = "id")));



CREATE POLICY "Reviews are viewable by everyone" ON "public"."review_ratings" FOR SELECT USING (true);



CREATE POLICY "Service role can manage content" ON "public"."content_items" TO "service_role" USING (true) WITH CHECK (true);



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



CREATE POLICY "Users can feature their own badges" ON "public"."user_badges" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can follow others" ON "public"."followers" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can insert their own bookmarks" ON "public"."bookmarks" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own webhook events" ON "public"."webhook_events" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("data" ->> 'to'::"text") = ("auth"."jwt"() ->> 'email'::"text")) OR (("data" -> 'to'::"text") ? ("auth"."jwt"() ->> 'email'::"text")) OR (("data" -> 'to'::"text") @> "to_jsonb"(ARRAY[("auth"."jwt"() ->> 'email'::"text")])))));



CREATE POLICY "Users can remove their helpful votes" ON "public"."review_helpful_votes" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can remove their own votes" ON "public"."votes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can unfollow others" ON "public"."followers" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "follower_id"));



CREATE POLICY "Users can unsubscribe" ON "public"."newsletter_subscriptions" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = "email")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = "email"));



CREATE POLICY "Users can update items in their collections" ON "public"."collection_items" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



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



CREATE POLICY "Users can view own submissions" ON "public"."submissions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own affinities" ON "public"."user_affinities" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own bookmarks" ON "public"."bookmarks" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own interactions" ON "public"."user_interactions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own newsletter subscription" ON "public"."newsletter_subscriptions" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own similarities" ON "public"."user_similarities" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_a_id") OR (( SELECT "auth"."uid"() AS "uid") = "user_b_id")));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Votes are viewable by everyone" ON "public"."votes" FOR SELECT USING (true);



ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_similarities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_helpful_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsored_impressions" ENABLE ROW LEVEL SECURITY;


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


















































































































































































































GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."batch_recalculate_reputation"("user_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."batch_update_user_affinity_scores"("p_user_ids" "uuid"[], "p_max_users" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_affinity_score_for_content"("p_user_id" "uuid", "p_content_type" "text", "p_content_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_all_user_affinities"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_reputation"("target_user_id" "uuid") TO "authenticated";



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



GRANT SELECT ON TABLE "public"."badges" TO "authenticated";
GRANT SELECT ON TABLE "public"."badges" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."bookmarks" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."collection_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."collection_items" TO "anon";



GRANT SELECT,INSERT ON TABLE "public"."comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."comments" TO "anon";



GRANT SELECT ON TABLE "public"."company_job_stats" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_popularity" TO "authenticated";



GRANT SELECT ON TABLE "public"."content_similarities" TO "authenticated";
GRANT SELECT ON TABLE "public"."content_similarities" TO "anon";



GRANT SELECT ON TABLE "public"."featured_configs" TO "authenticated";
GRANT SELECT ON TABLE "public"."featured_configs" TO "anon";



GRANT SELECT,INSERT,DELETE ON TABLE "public"."followers" TO "authenticated";
GRANT SELECT ON TABLE "public"."followers" TO "anon";



GRANT SELECT ON TABLE "public"."payments" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."posts" TO "authenticated";
GRANT SELECT ON TABLE "public"."posts" TO "anon";



GRANT SELECT ON TABLE "public"."user_affinities" TO "authenticated";



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



GRANT INSERT ON TABLE "public"."user_interactions" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_mcps" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_mcps" TO "anon";



GRANT SELECT ON TABLE "public"."user_similarities" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_stats" TO "authenticated";


































RESET ALL;
