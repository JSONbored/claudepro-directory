create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "pg_trgm" with schema "extensions";

create extension if not exists "unaccent" with schema "extensions";

create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";

create schema if not exists "migrations";

create schema if not exists "pgmq_public";

revoke delete on table "public"."mfa_failed_verification_attempts" from "anon";

revoke insert on table "public"."mfa_failed_verification_attempts" from "anon";

revoke references on table "public"."mfa_failed_verification_attempts" from "anon";

revoke select on table "public"."mfa_failed_verification_attempts" from "anon";

revoke trigger on table "public"."mfa_failed_verification_attempts" from "anon";

revoke truncate on table "public"."mfa_failed_verification_attempts" from "anon";

revoke update on table "public"."mfa_failed_verification_attempts" from "anon";

revoke delete on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke insert on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke references on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke select on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke trigger on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke truncate on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke update on table "public"."mfa_failed_verification_attempts" from "authenticated";

revoke delete on table "public"."password_failed_verification_attempts" from "anon";

revoke insert on table "public"."password_failed_verification_attempts" from "anon";

revoke references on table "public"."password_failed_verification_attempts" from "anon";

revoke select on table "public"."password_failed_verification_attempts" from "anon";

revoke trigger on table "public"."password_failed_verification_attempts" from "anon";

revoke truncate on table "public"."password_failed_verification_attempts" from "anon";

revoke update on table "public"."password_failed_verification_attempts" from "anon";

revoke delete on table "public"."password_failed_verification_attempts" from "authenticated";

revoke insert on table "public"."password_failed_verification_attempts" from "authenticated";

revoke references on table "public"."password_failed_verification_attempts" from "authenticated";

revoke select on table "public"."password_failed_verification_attempts" from "authenticated";

revoke trigger on table "public"."password_failed_verification_attempts" from "authenticated";

revoke truncate on table "public"."password_failed_verification_attempts" from "authenticated";

revoke update on table "public"."password_failed_verification_attempts" from "authenticated";

alter table "public"."announcement_dismissals" enable row level security;

alter table "public"."announcements" enable row level security;

alter table "public"."app_settings" enable row level security;

alter table "public"."bookmarks" enable row level security;

alter table "public"."category_configs" enable row level security;

alter table "public"."changelog" enable row level security;

alter table "public"."collection_items" enable row level security;

alter table "public"."companies" enable row level security;

alter table "public"."contact_commands" alter column "id" set default gen_random_uuid();

alter table "public"."contact_commands" enable row level security;

alter table "public"."contact_submissions" alter column "id" set default gen_random_uuid();

alter table "public"."contact_submissions" enable row level security;

alter table "public"."content" enable row level security;

alter table "public"."content_embeddings" enable row level security;

alter table "public"."content_generation_tracking" enable row level security;

alter table "public"."content_similarities" enable row level security;

alter table "public"."content_submissions" enable row level security;

alter table "public"."content_templates" enable row level security;

alter table "public"."content_time_metrics" enable row level security;

alter table "public"."content_votes" alter column "id" set default gen_random_uuid();

alter table "public"."content_votes" enable row level security;

alter table "public"."email_blocklist" enable row level security;

alter table "public"."email_engagement_summary" alter column "id" set default gen_random_uuid();

alter table "public"."email_engagement_summary" enable row level security;

alter table "public"."email_sequence_schedule" enable row level security;

alter table "public"."email_sequences" enable row level security;

alter table "public"."followers" enable row level security;

alter table "public"."form_field_configs" enable row level security;

alter table "public"."job_runs" enable row level security;

alter table "public"."job_subscription_audit_log" enable row level security;

alter table "public"."jobs" enable row level security;

alter table "public"."metadata_templates" enable row level security;

alter table "public"."newsletter_subscriptions" enable row level security;

alter table "public"."notification_dismissals" enable row level security;

alter table "public"."notifications" enable row level security;

alter table "public"."payment_plan_catalog" enable row level security;

alter table "public"."payments" enable row level security;

alter table "public"."quiz_options" alter column "id" set default gen_random_uuid();

alter table "public"."quiz_options" enable row level security;

alter table "public"."quiz_questions" alter column "id" set default gen_random_uuid();

alter table "public"."quiz_questions" enable row level security;

alter table "public"."rate_limit_tracker" enable row level security;

alter table "public"."review_helpful_votes" enable row level security;

alter table "public"."review_ratings" enable row level security;

alter table "public"."script_artifacts" enable row level security;

alter table "public"."script_cache" enable row level security;

alter table "public"."search_queries" alter column "id" set default gen_random_uuid();

alter table "public"."search_queries" enable row level security;

alter table "public"."sponsored_content" enable row level security;

alter table "public"."static_routes" alter column "id" set default gen_random_uuid();

alter table "public"."static_routes" enable row level security;

alter table "public"."structured_data_config" enable row level security;

alter table "public"."subscriptions" enable row level security;

alter table "public"."tier_display_config" enable row level security;

alter table "public"."user_collections" enable row level security;

alter table "public"."user_content" enable row level security;

alter table "public"."user_interactions" enable row level security;

alter table "public"."user_mcps" enable row level security;

alter table "public"."user_similarities" enable row level security;

alter table "public"."users" enable row level security;

alter table "public"."webhook_event_runs" enable row level security;

alter table "public"."webhook_events" enable row level security;

CREATE UNIQUE INDEX announcement_dismissals_pkey ON public.announcement_dismissals USING btree (user_id, announcement_id);

CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id);

CREATE UNIQUE INDEX app_settings_pkey ON public.app_settings USING btree (setting_key);

CREATE UNIQUE INDEX bookmarks_pkey ON public.bookmarks USING btree (id);

CREATE UNIQUE INDEX bookmarks_user_id_content_type_content_slug_key ON public.bookmarks USING btree (user_id, content_type, content_slug);

CREATE UNIQUE INDEX category_configs_content_loader_key ON public.category_configs USING btree (content_loader);

CREATE UNIQUE INDEX category_configs_pkey ON public.category_configs USING btree (category);

CREATE UNIQUE INDEX category_configs_url_slug_key ON public.category_configs USING btree (url_slug);

CREATE UNIQUE INDEX changelog_pkey ON public.changelog USING btree (id);

CREATE UNIQUE INDEX changelog_slug_key ON public.changelog USING btree (slug);

CREATE UNIQUE INDEX collection_items_collection_id_content_type_content_slug_key ON public.collection_items USING btree (collection_id, content_type, content_slug);

CREATE UNIQUE INDEX collection_items_pkey ON public.collection_items USING btree (id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);

CREATE UNIQUE INDEX contact_commands_command_id_key ON public.contact_commands USING btree (command_id);

CREATE UNIQUE INDEX contact_commands_pkey ON public.contact_commands USING btree (id);

CREATE UNIQUE INDEX contact_submissions_pkey ON public.contact_submissions USING btree (id);

CREATE INDEX content_embeddings_content_id_idx ON public.content_embeddings USING btree (content_id);

CREATE UNIQUE INDEX content_embeddings_content_id_key ON public.content_embeddings USING btree (content_id);

CREATE INDEX content_embeddings_embedding_idx ON public.content_embeddings USING hnsw (embedding extensions.vector_ip_ops) WITH (m='16', ef_construction='64');

CREATE INDEX content_embeddings_embedding_l2 ON public.content_embeddings USING ivfflat (embedding) WITH (lists='32');

CREATE INDEX content_embeddings_generated_at_idx ON public.content_embeddings USING btree (embedding_generated_at DESC);

CREATE UNIQUE INDEX content_embeddings_pkey ON public.content_embeddings USING btree (id);

CREATE UNIQUE INDEX content_generation_tracking_category_slug_key ON public.content_generation_tracking USING btree (category, slug);

CREATE UNIQUE INDEX content_generation_tracking_pkey ON public.content_generation_tracking USING btree (id);

CREATE UNIQUE INDEX content_pkey ON public.content USING btree (id);

CREATE UNIQUE INDEX content_similarities_pkey ON public.content_similarities USING btree (id);

CREATE UNIQUE INDEX content_submissions_pkey ON public.content_submissions USING btree (id);

CREATE UNIQUE INDEX content_templates_pkey ON public.content_templates USING btree (id);

CREATE UNIQUE INDEX content_time_metrics_pkey ON public.content_time_metrics USING btree (content_id);

CREATE UNIQUE INDEX content_votes_pkey ON public.content_votes USING btree (id);

CREATE UNIQUE INDEX email_blocklist_pkey ON public.email_blocklist USING btree (email);

CREATE UNIQUE INDEX email_engagement_summary_email_key ON public.email_engagement_summary USING btree (email);

CREATE UNIQUE INDEX email_engagement_summary_pkey ON public.email_engagement_summary USING btree (id);

CREATE UNIQUE INDEX email_sequence_schedule_pkey ON public.email_sequence_schedule USING btree (id);

CREATE UNIQUE INDEX email_sequence_schedule_unique_step ON public.email_sequence_schedule USING btree (sequence_id, email, step);

CREATE UNIQUE INDEX email_sequences_pkey ON public.email_sequences USING btree (id);

CREATE UNIQUE INDEX email_sequences_sequence_id_email_key ON public.email_sequences USING btree (sequence_id, email);

CREATE UNIQUE INDEX followers_follower_id_following_id_key ON public.followers USING btree (follower_id, following_id);

CREATE UNIQUE INDEX followers_pkey ON public.followers USING btree (id);

CREATE UNIQUE INDEX form_field_configs_form_type_field_name_key ON public.form_field_configs USING btree (form_type, field_name);

CREATE UNIQUE INDEX form_field_configs_pkey ON public.form_field_configs USING btree (id);

CREATE INDEX idx_announcement_dismissals_announcement_id ON public.announcement_dismissals USING btree (announcement_id);

CREATE INDEX idx_announcement_dismissals_user ON public.announcement_dismissals USING btree (user_id);

CREATE INDEX idx_announcements_active_dates ON public.announcements USING btree (active, start_date, end_date, priority DESC) WHERE (active = true);

CREATE INDEX idx_announcements_priority ON public.announcements USING btree (priority DESC, start_date DESC) WHERE (active = true);

CREATE INDEX idx_announcements_title_trgm ON public.announcements USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_app_settings_category ON public.app_settings USING btree (category);

CREATE INDEX idx_app_settings_enabled ON public.app_settings USING btree (enabled) WHERE (enabled = true);

CREATE INDEX idx_app_settings_key ON public.app_settings USING btree (setting_key);

CREATE INDEX idx_app_settings_setting_value_gin ON public.app_settings USING gin (setting_value);

CREATE INDEX idx_bookmarks_content_slug ON public.bookmarks USING btree (content_slug);

CREATE INDEX idx_bookmarks_content_user_lookup ON public.bookmarks USING btree (content_type, content_slug, user_id) INCLUDE (created_at);

CREATE INDEX idx_bookmarks_user_recent ON public.bookmarks USING btree (user_id, created_at DESC);

CREATE INDEX idx_bookmarks_user_type_created ON public.bookmarks USING btree (user_id, content_type, created_at DESC);

CREATE INDEX idx_category_configs_api_schema ON public.category_configs USING gin (api_schema);

CREATE INDEX idx_category_configs_badges_gin ON public.category_configs USING gin (badges);

CREATE INDEX idx_category_configs_category_covering ON public.category_configs USING btree (category) INCLUDE (title, plural_title, meta_description, keywords);

CREATE INDEX idx_category_configs_description_trgm ON public.category_configs USING gin (description extensions.gin_trgm_ops);

CREATE INDEX idx_category_configs_generation_config ON public.category_configs USING gin (generation_config);

CREATE INDEX idx_category_configs_generation_discovery ON public.category_configs USING gin (((generation_config -> 'discovery'::text)));

CREATE INDEX idx_category_configs_generation_field_defaults ON public.category_configs USING gin (((generation_config -> 'fieldDefaults'::text)));

CREATE INDEX idx_category_configs_primary_action_config_gin ON public.category_configs USING gin (primary_action_config);

CREATE INDEX idx_category_configs_sections_gin ON public.category_configs USING gin (sections);

CREATE INDEX idx_category_configs_show_on_homepage ON public.category_configs USING btree (show_on_homepage) WHERE (show_on_homepage = true);

CREATE INDEX idx_category_configs_title_trgm ON public.category_configs USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_category_configs_validation_config ON public.category_configs USING gin (validation_config);

CREATE INDEX idx_category_configs_validation_required ON public.category_configs USING gin (((validation_config -> 'requiredFields'::text)));

CREATE INDEX idx_changelog_changes_gin ON public.changelog USING gin (changes);

CREATE UNIQUE INDEX idx_changelog_git_commit_sha ON public.changelog USING btree (git_commit_sha) WHERE (git_commit_sha IS NOT NULL);

CREATE INDEX idx_changelog_has_added ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Added'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_has_changed ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Changed'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_has_deprecated ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Deprecated'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_has_fixed ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Fixed'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_has_removed ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Removed'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_has_security ON public.changelog USING btree (((jsonb_array_length(COALESCE((changes -> 'Security'::text), '[]'::jsonb)) > 0))) WHERE (published = true);

CREATE INDEX idx_changelog_published_featured ON public.changelog USING btree (release_date DESC, featured DESC) WHERE (published = true);

CREATE INDEX idx_changelog_slug_published ON public.changelog USING btree (slug) WHERE (published = true);

CREATE INDEX idx_collection_items_content_slug ON public.collection_items USING btree (content_slug);

CREATE INDEX idx_collection_items_order ON public.collection_items USING btree (collection_id, "order");

CREATE INDEX idx_collection_items_user_id ON public.collection_items USING btree (user_id);

CREATE INDEX idx_companies_description_trgm ON public.companies USING gin (description extensions.gin_trgm_ops);

CREATE INDEX idx_companies_featured ON public.companies USING btree (featured) WHERE (featured = true);

CREATE INDEX idx_companies_name ON public.companies USING btree (name);

CREATE INDEX idx_companies_name_trgm ON public.companies USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_companies_owner_id_created_at ON public.companies USING btree (owner_id, created_at DESC);

CREATE INDEX idx_companies_search_expr ON public.companies USING gin (to_tsvector('english'::regconfig, ((((name || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(industry, ''::text))));

CREATE INDEX idx_companies_slug_owned ON public.companies USING btree (slug) WHERE (owner_id IS NOT NULL);

CREATE INDEX idx_contact_commands_active ON public.contact_commands USING btree (is_active, display_order) WHERE (is_active = true);

CREATE INDEX idx_contact_commands_aliases ON public.contact_commands USING gin (aliases);

CREATE INDEX idx_contact_submissions_responded_by ON public.contact_submissions USING btree (responded_by) WHERE (responded_by IS NOT NULL);

CREATE INDEX idx_contact_submissions_status_created ON public.contact_submissions USING btree (status, created_at DESC) WHERE (status = ANY (ARRAY['pending'::public.submission_status, 'approved'::public.submission_status]));

CREATE INDEX idx_contact_submissions_user_id ON public.contact_submissions USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_content_author_sort ON public.content USING btree (author, created_at DESC) WHERE (author IS NOT NULL);

CREATE INDEX idx_content_author_user_id ON public.content USING btree (author_user_id) WHERE (author_user_id IS NOT NULL);

CREATE INDEX idx_content_avg_rating ON public.content USING btree (avg_rating DESC NULLS LAST);

CREATE INDEX idx_content_bookmark_count ON public.content USING btree (bookmark_count DESC);

CREATE INDEX idx_content_category_created_at ON public.content USING btree (category, created_at DESC);

CREATE INDEX idx_content_category_slug ON public.content USING btree (category, slug);

CREATE INDEX idx_content_category_slug_covering_opt ON public.content USING btree (category, slug) INCLUDE (title, display_title, seo_title, description, author, author_profile_url, created_at, updated_at, view_count, copy_count, bookmark_count, popularity_score);

CREATE INDEX idx_content_category_tags_btree ON public.content USING btree (category, slug) WHERE (category = ANY (ARRAY['agents'::public.content_category, 'mcp'::public.content_category, 'rules'::public.content_category, 'commands'::public.content_category, 'hooks'::public.content_category, 'statuslines'::public.content_category, 'skills'::public.content_category, 'collections'::public.content_category]));

CREATE INDEX idx_content_category_title_created ON public.content USING btree (category, title, created_at DESC) WHERE (title IS NOT NULL);

CREATE INDEX idx_content_category_updated_at ON public.content USING btree (category, updated_at DESC);

CREATE INDEX idx_content_copy_count ON public.content USING btree (copy_count DESC) WHERE (copy_count > 0);

CREATE INDEX idx_content_created_at ON public.content USING btree (created_at DESC);

CREATE INDEX idx_content_description_trgm ON public.content USING gin (description extensions.gin_trgm_ops);

CREATE INDEX idx_content_difficulty_score ON public.content USING btree (difficulty_score) WHERE (difficulty_score > 0);

CREATE INDEX idx_content_download_url ON public.content USING btree (download_url) WHERE (download_url IS NOT NULL);

CREATE INDEX idx_content_examples_gin ON public.content USING gin (examples);

CREATE INDEX idx_content_flags ON public.content USING btree (has_troubleshooting, has_prerequisites, has_breaking_changes) WHERE ((has_troubleshooting = true) OR (has_prerequisites = true) OR (has_breaking_changes = true));

CREATE INDEX idx_content_generation_category ON public.content_generation_tracking USING btree (category);

CREATE INDEX idx_content_generation_date ON public.content_generation_tracking USING btree (generated_at DESC);

CREATE INDEX idx_content_generation_discovery ON public.content_generation_tracking USING gin (discovery_metadata);

CREATE INDEX idx_content_generation_generated_by ON public.content_generation_tracking USING btree (generated_by);

CREATE INDEX idx_content_generation_validation ON public.content_generation_tracking USING btree (validation_passed);

CREATE INDEX idx_content_has_breaking_changes ON public.content USING btree (has_breaking_changes) WHERE (has_breaking_changes = true);

CREATE INDEX idx_content_has_prerequisites ON public.content USING btree (has_prerequisites) WHERE (has_prerequisites = true);

CREATE INDEX idx_content_has_troubleshooting ON public.content USING btree (has_troubleshooting) WHERE (has_troubleshooting = true);

CREATE INDEX idx_content_mcpb_storage_url ON public.content USING btree (mcpb_storage_url) WHERE (mcpb_storage_url IS NOT NULL);

CREATE INDEX idx_content_metadata ON public.content USING gin (metadata);

CREATE INDEX idx_content_popularity_score ON public.content USING btree (popularity_score DESC NULLS LAST);

CREATE INDEX idx_content_reading_time ON public.content USING btree (reading_time) WHERE (reading_time > 0);

CREATE INDEX idx_content_review_count ON public.content USING btree (review_count DESC);

CREATE INDEX idx_content_search_expr ON public.content USING gin (to_tsvector('english'::regconfig, ((((((COALESCE(title, ''::text) || ' '::text) || description) || ' '::text) || public.immutable_array_to_string(tags, ' '::text)) || ' '::text) || author)));

CREATE INDEX idx_content_similarities_factors_gin ON public.content_similarities USING gin (similarity_factors);

CREATE INDEX idx_content_similarities_score ON public.content_similarities USING btree (similarity_score DESC) WHERE (similarity_score >= 0.3);

CREATE INDEX idx_content_slug ON public.content USING btree (slug);

CREATE UNIQUE INDEX idx_content_slug_category_unique ON public.content USING btree (slug, category);

CREATE INDEX idx_content_submissions_author_trgm ON public.content_submissions USING gin (author extensions.gin_trgm_ops);

CREATE INDEX idx_content_submissions_content_data_gin ON public.content_submissions USING gin (content_data);

CREATE INDEX idx_content_submissions_created ON public.content_submissions USING btree (created_at DESC);

CREATE INDEX idx_content_submissions_description_trgm ON public.content_submissions USING gin (description extensions.gin_trgm_ops);

CREATE INDEX idx_content_submissions_moderated_by ON public.content_submissions USING btree (moderated_by);

CREATE INDEX idx_content_submissions_name_trgm ON public.content_submissions USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_content_submissions_search ON public.content_submissions USING gin (to_tsvector('english'::regconfig, ((name || ' '::text) || description)));

CREATE INDEX idx_content_submissions_spam ON public.content_submissions USING btree (spam_score) WHERE (spam_score > 0.5);

CREATE INDEX idx_content_submissions_status ON public.content_submissions USING btree (status);

CREATE INDEX idx_content_submissions_submitter ON public.content_submissions USING btree (submitter_id);

CREATE INDEX idx_content_submissions_type ON public.content_submissions USING btree (submission_type);

CREATE INDEX idx_content_tags ON public.content USING gin (tags);

CREATE INDEX idx_content_templates_category ON public.content_templates USING btree (category, display_order) WHERE (active = true);

CREATE INDEX idx_content_templates_featured ON public.content_templates USING btree (category, is_featured, display_order) WHERE ((active = true) AND (is_featured = true));

CREATE INDEX idx_content_templates_usage ON public.content_templates USING btree (usage_count DESC) WHERE (active = true);

CREATE INDEX idx_content_time_metrics_last_calculated ON public.content_time_metrics USING btree (last_calculated_at DESC);

CREATE INDEX idx_content_time_metrics_velocity ON public.content_time_metrics USING btree (velocity_7d DESC);

CREATE INDEX idx_content_time_metrics_views_7d ON public.content_time_metrics USING btree (views_7d DESC);

CREATE INDEX idx_content_title_trgm ON public.content USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_content_use_count ON public.content USING btree (use_count DESC);

CREATE INDEX idx_content_view_count ON public.content USING btree (view_count DESC);

CREATE INDEX idx_content_votes_content ON public.content_votes USING btree (content_slug, content_type);

CREATE INDEX idx_content_votes_session ON public.content_votes USING btree (session_id) WHERE (session_id IS NOT NULL);

CREATE UNIQUE INDEX idx_content_votes_unique_session ON public.content_votes USING btree (content_slug, content_type, session_id) WHERE ((session_id IS NOT NULL) AND (user_id IS NULL));

CREATE UNIQUE INDEX idx_content_votes_unique_user ON public.content_votes USING btree (content_slug, content_type, user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_content_votes_user ON public.content_votes USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_email_engagement_health ON public.email_engagement_summary USING btree (health_status);

CREATE INDEX idx_email_engagement_resend_contact ON public.email_engagement_summary USING btree (resend_contact_id);

CREATE INDEX idx_email_engagement_score ON public.email_engagement_summary USING btree (engagement_score DESC);

CREATE INDEX idx_email_engagement_updated ON public.email_engagement_summary USING btree (updated_at DESC);

CREATE INDEX idx_email_sequence_schedule_due ON public.email_sequence_schedule USING btree (due_at) WHERE (processed = false);

CREATE INDEX idx_email_sequence_schedule_due_processing ON public.email_sequence_schedule USING btree (sequence_id, processed, due_at) WHERE (processed = false);

CREATE INDEX idx_email_sequence_schedule_email ON public.email_sequence_schedule USING btree (email);

CREATE INDEX idx_email_sequences_email ON public.email_sequences USING btree (email);

CREATE INDEX idx_email_sequences_status ON public.email_sequences USING btree (status) WHERE (status = 'active'::public.email_sequence_status);

CREATE INDEX idx_followers_follower_id ON public.followers USING btree (follower_id);

CREATE INDEX idx_followers_following_id ON public.followers USING btree (following_id);

CREATE INDEX idx_followers_following_id_created_at ON public.followers USING btree (following_id, created_at DESC);

CREATE INDEX idx_form_field_configs_config_gin ON public.form_field_configs USING gin (config);

CREATE INDEX idx_form_field_configs_display_order ON public.form_field_configs USING btree (form_type, display_order);

CREATE INDEX idx_form_field_configs_enabled ON public.form_field_configs USING btree (enabled) WHERE (enabled = true);

CREATE INDEX idx_form_field_configs_form_type ON public.form_field_configs USING btree (form_type);

CREATE INDEX idx_job_runs_created_at ON public.job_runs USING btree (created_at DESC);

CREATE INDEX idx_job_runs_job_name ON public.job_runs USING btree (job_name);

CREATE INDEX idx_job_runs_status ON public.job_runs USING btree (status);

CREATE INDEX idx_job_subscription_audit_log_job_id ON public.job_subscription_audit_log USING btree (job_id);

CREATE INDEX idx_jobs_active ON public.jobs USING btree (active) WHERE (active = true);

CREATE INDEX idx_jobs_benefits_gin ON public.jobs USING gin (benefits);

CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id);

CREATE INDEX idx_jobs_description_trgm ON public.jobs USING gin (description extensions.gin_trgm_ops);

CREATE INDEX idx_jobs_discord_message_id ON public.jobs USING btree (discord_message_id) WHERE (discord_message_id IS NOT NULL);

CREATE INDEX idx_jobs_expires_at ON public.jobs USING btree (expires_at);

CREATE INDEX idx_jobs_is_placeholder ON public.jobs USING btree (is_placeholder) WHERE (is_placeholder = false);

CREATE INDEX idx_jobs_placeholder_active ON public.jobs USING btree (is_placeholder, status) WHERE ((is_placeholder = true) AND (status = 'active'::public.job_status));

CREATE INDEX idx_jobs_plan ON public.jobs USING btree (plan);

CREATE INDEX idx_jobs_requirements_gin ON public.jobs USING gin (requirements);

CREATE INDEX idx_jobs_search_expr ON public.jobs USING gin (to_tsvector('english'::regconfig, ((((title || ' '::text) || description) || ' '::text) || COALESCE(location, ''::text)))) WHERE (status = 'active'::public.job_status);

CREATE INDEX idx_jobs_slug_active ON public.jobs USING btree (slug) WHERE (status = 'active'::public.job_status);

CREATE INDEX idx_jobs_tags_gin ON public.jobs USING gin (tags);

CREATE INDEX idx_jobs_tier_active ON public.jobs USING btree (tier DESC, posted_at DESC) WHERE (status = 'active'::public.job_status);

CREATE INDEX idx_jobs_title_trgm ON public.jobs USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_jobs_user_id ON public.jobs USING btree (user_id);

CREATE INDEX idx_jobs_user_id_status ON public.jobs USING btree (user_id, status, created_at DESC);

CREATE INDEX idx_metadata_templates_active ON public.metadata_templates USING btree (active) WHERE (active = true);

CREATE INDEX idx_metadata_templates_route_active ON public.metadata_templates USING btree (route_pattern) WHERE (active = true);

CREATE INDEX idx_newsletter_confirmation_token ON public.newsletter_subscriptions USING btree (confirmation_token) WHERE (confirmation_token IS NOT NULL);

CREATE INDEX idx_newsletter_resend_contact_id ON public.newsletter_subscriptions USING btree (resend_contact_id) WHERE (resend_contact_id IS NOT NULL);

CREATE INDEX idx_newsletter_status ON public.newsletter_subscriptions USING btree (status) WHERE (status = 'active'::public.newsletter_subscription_status);

CREATE INDEX idx_newsletter_subscribed_at ON public.newsletter_subscriptions USING btree (subscribed_at DESC);

CREATE INDEX idx_newsletter_subscriptions_confirmed_active ON public.newsletter_subscriptions USING btree (email, subscribed_at DESC) WHERE ((confirmed = true) AND (status = 'active'::public.newsletter_subscription_status));

CREATE INDEX idx_notification_dismissals_notification_id ON public.notification_dismissals USING btree (notification_id);

CREATE INDEX idx_notification_dismissals_user ON public.notification_dismissals USING btree (user_id);

CREATE INDEX idx_notifications_active_expires ON public.notifications USING btree (active, expires_at, priority DESC) WHERE (active = true);

CREATE INDEX idx_notifications_title_trgm ON public.notifications USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_notifications_type_priority ON public.notifications USING btree (type, priority DESC) WHERE (active = true);

CREATE INDEX idx_payments_polar_transaction_id ON public.payments USING btree (polar_transaction_id);

CREATE INDEX idx_payments_product ON public.payments USING btree (product_type, product_id);

CREATE INDEX idx_payments_product_id ON public.payments USING btree (product_id);

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);

CREATE INDEX idx_quiz_options_order ON public.quiz_options USING btree (display_order);

CREATE INDEX idx_quiz_options_question ON public.quiz_options USING btree (question_id);

CREATE INDEX idx_quiz_questions_order ON public.quiz_questions USING btree (display_order);

CREATE INDEX idx_rate_limit_tracker_window ON public.rate_limit_tracker USING btree (window_start);

CREATE INDEX idx_review_helpful_votes_review_id ON public.review_helpful_votes USING btree (review_id);

CREATE INDEX idx_review_helpful_votes_user_id ON public.review_helpful_votes USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_review_ratings_content ON public.review_ratings USING btree (content_type, content_slug, created_at DESC);

CREATE INDEX idx_review_ratings_content_helpful ON public.review_ratings USING btree (content_type, content_slug, helpful_count DESC, created_at DESC);

CREATE INDEX idx_review_ratings_content_rating ON public.review_ratings USING btree (content_type, content_slug, rating DESC, created_at DESC);

CREATE INDEX idx_review_ratings_content_slug_rating ON public.review_ratings USING btree (content_slug, rating);

CREATE INDEX idx_review_ratings_content_slug_type_created ON public.review_ratings USING btree (content_slug, content_type, created_at DESC);

CREATE INDEX idx_review_ratings_helpful ON public.review_ratings USING btree (helpful_count DESC) WHERE (helpful_count > 0);

CREATE INDEX idx_review_ratings_rating ON public.review_ratings USING btree (rating, created_at DESC);

CREATE INDEX idx_review_ratings_user ON public.review_ratings USING btree (user_id, created_at DESC);

CREATE INDEX idx_search_queries_created_at ON ONLY public.search_queries USING btree (created_at DESC);

CREATE INDEX idx_search_queries_created_at_cleanup ON ONLY public.search_queries USING btree (created_at);

CREATE INDEX idx_search_queries_normalized ON ONLY public.search_queries USING btree (normalized_query text_pattern_ops);

CREATE INDEX idx_search_queries_user_id ON ONLY public.search_queries USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_search_queries_zero_results ON ONLY public.search_queries USING btree (normalized_query, created_at DESC) WHERE (result_count = 0);

CREATE INDEX idx_sponsored_content_active ON public.sponsored_content USING btree (active) WHERE (active = true);

CREATE INDEX idx_sponsored_content_dates ON public.sponsored_content USING btree (start_date, end_date);

CREATE INDEX idx_sponsored_content_lookup ON public.sponsored_content USING btree (content_id, content_type, active) WHERE (active = true);

CREATE INDEX idx_sponsored_content_user_id ON public.sponsored_content USING btree (user_id);

CREATE INDEX idx_static_routes_active_priority ON public.static_routes USING btree (is_active, sort_order) WHERE (is_active = true);

CREATE INDEX idx_static_routes_group_active ON public.static_routes USING btree (group_name, is_active, sort_order);

CREATE INDEX idx_static_routes_path_active ON public.static_routes USING btree (path) WHERE (is_active = true);

CREATE INDEX idx_structured_data_config_active ON public.structured_data_config USING btree (active) WHERE (active = true);

CREATE UNIQUE INDEX idx_structured_data_config_category_active ON public.structured_data_config USING btree (category) WHERE (active = true);

CREATE INDEX idx_subscriptions_polar_id ON public.subscriptions USING btree (polar_subscription_id);

CREATE INDEX idx_subscriptions_product ON public.subscriptions USING btree (product_type, product_id);

CREATE INDEX idx_subscriptions_product_id ON public.subscriptions USING btree (product_id);

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX idx_subscriptions_status_user ON public.subscriptions USING btree (status, user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE INDEX idx_user_collections_bookmark_count ON public.user_collections USING btree (bookmark_count DESC);

CREATE INDEX idx_user_collections_created_at ON public.user_collections USING btree (created_at DESC);

CREATE INDEX idx_user_collections_item_count ON public.user_collections USING btree (item_count DESC);

CREATE INDEX idx_user_collections_name_trgm ON public.user_collections USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_user_collections_public ON public.user_collections USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_user_collections_user_id ON public.user_collections USING btree (user_id);

CREATE INDEX idx_user_collections_view_count ON public.user_collections USING btree (view_count DESC) WHERE (is_public = true);

CREATE INDEX idx_user_content_active ON public.user_content USING btree (active) WHERE (active = true);

CREATE INDEX idx_user_content_type ON public.user_content USING btree (content_type);

CREATE INDEX idx_user_content_user_id ON public.user_content USING btree (user_id);

CREATE INDEX idx_user_interactions_content ON ONLY public.user_interactions USING btree (content_type, content_slug);

CREATE INDEX idx_user_interactions_metadata_gin ON ONLY public.user_interactions USING gin (metadata);

CREATE INDEX idx_user_interactions_search_metadata ON ONLY public.user_interactions USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX idx_user_interactions_user_content_type_created ON ONLY public.user_interactions USING btree (user_id, content_type, created_at DESC);

CREATE INDEX idx_user_mcps_active ON public.user_mcps USING btree (active) WHERE (active = true);

CREATE INDEX idx_user_mcps_company_id ON public.user_mcps USING btree (company_id);

CREATE INDEX idx_user_mcps_plan ON public.user_mcps USING btree (plan);

CREATE INDEX idx_user_mcps_slug ON public.user_mcps USING btree (slug);

CREATE INDEX idx_user_mcps_user_id ON public.user_mcps USING btree (user_id);

CREATE INDEX idx_user_similarities_score ON public.user_similarities USING btree (similarity_score DESC) WHERE (similarity_score >= 0.5);

CREATE INDEX idx_user_similarities_user_a ON public.user_similarities USING btree (user_a_id, similarity_score DESC);

CREATE INDEX idx_user_similarities_user_b ON public.user_similarities USING btree (user_b_id, similarity_score DESC);

CREATE INDEX idx_users_bio_trgm ON public.users USING gin (bio extensions.gin_trgm_ops);

CREATE INDEX idx_users_bookmark_count ON public.users USING btree (bookmark_count DESC);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_follower_count ON public.users USING btree (follower_count DESC);

CREATE INDEX idx_users_following_count ON public.users USING btree (following_count DESC);

CREATE INDEX idx_users_interests_gin ON public.users USING gin (interests);

CREATE INDEX idx_users_name_trgm ON public.users USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_users_profile_public ON public.users USING btree (profile_public) WHERE (profile_public = true);

CREATE INDEX idx_users_role ON public.users USING btree (role) WHERE (role = ANY (ARRAY['admin'::public.user_role, 'moderator'::public.user_role]));

CREATE INDEX idx_users_search_expr ON public.users USING gin (to_tsvector('english'::regconfig, ((((name || ' '::text) || COALESCE(bio, ''::text)) || ' '::text) || COALESCE(work, ''::text))));

CREATE UNIQUE INDEX idx_users_slug_public ON public.users USING btree (slug) WHERE (public = true);

CREATE INDEX idx_users_stats ON public.users USING btree (post_count, comment_count, votes_received_count) WHERE ((post_count > 0) OR (comment_count > 0) OR (votes_received_count > 0));

CREATE INDEX idx_users_submission_count ON public.users USING btree (submission_count DESC);

CREATE INDEX idx_webhook_events_bounce_email ON public.webhook_events USING btree (type, ((data ->> 'to'::text))) WHERE (type = 'email.bounced'::public.webhook_event_type);

CREATE INDEX idx_webhook_events_complaint_email ON public.webhook_events USING btree (type, ((data ->> 'to'::text))) WHERE (type = 'email.complained'::public.webhook_event_type);

CREATE INDEX idx_webhook_events_created_at ON public.webhook_events USING btree (created_at DESC);

CREATE INDEX idx_webhook_events_data ON public.webhook_events USING gin (data);

CREATE INDEX idx_webhook_events_next_retry ON public.webhook_events USING btree (next_retry_at) WHERE (next_retry_at IS NOT NULL);

CREATE INDEX idx_webhook_events_outbound_status ON public.webhook_events USING btree (direction, http_status_code, created_at DESC) WHERE (direction = 'outbound'::public.webhook_direction);

CREATE INDEX idx_webhook_events_processed ON public.webhook_events USING btree (processed) WHERE (processed = false);

CREATE INDEX idx_webhook_events_related_id ON public.webhook_events USING btree (related_id, created_at DESC) WHERE (related_id IS NOT NULL);

CREATE INDEX idx_webhook_events_source_direction_created ON public.webhook_events USING btree (source, direction, created_at DESC);

CREATE INDEX idx_webhook_events_source_type ON public.webhook_events USING btree (source, type, created_at DESC);

CREATE INDEX idx_webhook_events_source_unprocessed ON public.webhook_events USING btree (source, processed, created_at DESC) WHERE (processed = false);

CREATE INDEX idx_webhook_events_type ON public.webhook_events USING btree (type);

CREATE UNIQUE INDEX job_runs_pkey ON public.job_runs USING btree (id);

CREATE UNIQUE INDEX job_subscription_audit_log_pkey ON public.job_subscription_audit_log USING btree (id);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE UNIQUE INDEX jobs_slug_key ON public.jobs USING btree (slug);

CREATE UNIQUE INDEX metadata_templates_pkey ON public.metadata_templates USING btree (route_pattern);

CREATE UNIQUE INDEX mfa_failed_verification_attempts_pkey ON public.mfa_failed_verification_attempts USING btree (user_id, factor_id);

CREATE UNIQUE INDEX newsletter_subscriptions_email_key ON public.newsletter_subscriptions USING btree (email);

CREATE UNIQUE INDEX newsletter_subscriptions_pkey ON public.newsletter_subscriptions USING btree (id);

CREATE UNIQUE INDEX newsletter_subscriptions_resend_contact_id_key ON public.newsletter_subscriptions USING btree (resend_contact_id);

CREATE UNIQUE INDEX notification_dismissals_pkey ON public.notification_dismissals USING btree (user_id, notification_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX password_failed_verification_attempts_pkey ON public.password_failed_verification_attempts USING btree (user_id);

CREATE UNIQUE INDEX payment_plan_catalog_pkey ON public.payment_plan_catalog USING btree (plan, tier);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_polar_transaction_id_key ON public.payments USING btree (polar_transaction_id);

CREATE UNIQUE INDEX quiz_options_pkey ON public.quiz_options USING btree (id);

CREATE UNIQUE INDEX quiz_options_question_id_value_key ON public.quiz_options USING btree (question_id, value);

CREATE UNIQUE INDEX quiz_questions_pkey ON public.quiz_questions USING btree (id);

CREATE UNIQUE INDEX quiz_questions_question_id_key ON public.quiz_questions USING btree (question_id);

CREATE UNIQUE INDEX rate_limit_tracker_pkey ON public.rate_limit_tracker USING btree (identifier);

CREATE UNIQUE INDEX review_helpful_votes_pkey ON public.review_helpful_votes USING btree (id);

CREATE UNIQUE INDEX review_helpful_votes_review_id_user_id_key ON public.review_helpful_votes USING btree (review_id, user_id);

CREATE UNIQUE INDEX review_ratings_pkey ON public.review_ratings USING btree (id);

CREATE UNIQUE INDEX review_ratings_user_id_content_type_content_slug_key ON public.review_ratings USING btree (user_id, content_type, content_slug);

CREATE UNIQUE INDEX script_artifacts_pkey ON public.script_artifacts USING btree (id);

CREATE UNIQUE INDEX script_artifacts_script_artifact_name_idx ON public.script_artifacts USING btree (script, artifact_name);

CREATE UNIQUE INDEX script_cache_pkey ON public.script_cache USING btree (cache_key);

CREATE INDEX script_cache_script_idx ON public.script_cache USING btree (script);

CREATE INDEX search_queries_2025_11_created_at_idx ON public.search_queries_2025_11 USING btree (created_at DESC);

CREATE INDEX search_queries_2025_11_created_at_idx1 ON public.search_queries_2025_11 USING btree (created_at);

CREATE INDEX search_queries_2025_11_normalized_query_created_at_idx ON public.search_queries_2025_11 USING btree (normalized_query, created_at DESC) WHERE (result_count = 0);

CREATE INDEX search_queries_2025_11_normalized_query_idx ON public.search_queries_2025_11 USING btree (normalized_query text_pattern_ops);

CREATE UNIQUE INDEX search_queries_2025_11_pkey ON public.search_queries_2025_11 USING btree (id, created_at);

CREATE INDEX search_queries_2025_11_user_id_idx ON public.search_queries_2025_11 USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX search_queries_2025_12_created_at_idx ON public.search_queries_2025_12 USING btree (created_at DESC);

CREATE INDEX search_queries_2025_12_created_at_idx1 ON public.search_queries_2025_12 USING btree (created_at);

CREATE INDEX search_queries_2025_12_normalized_query_created_at_idx ON public.search_queries_2025_12 USING btree (normalized_query, created_at DESC) WHERE (result_count = 0);

CREATE INDEX search_queries_2025_12_normalized_query_idx ON public.search_queries_2025_12 USING btree (normalized_query text_pattern_ops);

CREATE UNIQUE INDEX search_queries_2025_12_pkey ON public.search_queries_2025_12 USING btree (id, created_at);

CREATE INDEX search_queries_2025_12_user_id_idx ON public.search_queries_2025_12 USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX search_queries_default_created_at_idx ON public.search_queries_default USING btree (created_at DESC);

CREATE INDEX search_queries_default_created_at_idx1 ON public.search_queries_default USING btree (created_at);

CREATE INDEX search_queries_default_normalized_query_created_at_idx ON public.search_queries_default USING btree (normalized_query, created_at DESC) WHERE (result_count = 0);

CREATE INDEX search_queries_default_normalized_query_idx ON public.search_queries_default USING btree (normalized_query text_pattern_ops);

CREATE UNIQUE INDEX search_queries_default_pkey ON public.search_queries_default USING btree (id, created_at);

CREATE INDEX search_queries_default_user_id_idx ON public.search_queries_default USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE UNIQUE INDEX search_queries_pkey ON ONLY public.search_queries USING btree (id, created_at);

CREATE UNIQUE INDEX sponsored_content_pkey ON public.sponsored_content USING btree (id);

CREATE UNIQUE INDEX static_routes_path_key ON public.static_routes USING btree (path);

CREATE UNIQUE INDEX static_routes_pkey ON public.static_routes USING btree (id);

CREATE UNIQUE INDEX structured_data_config_pkey ON public.structured_data_config USING btree (category);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_polar_subscription_id_key ON public.subscriptions USING btree (polar_subscription_id);

CREATE UNIQUE INDEX tier_display_config_pkey ON public.tier_display_config USING btree (tier);

CREATE UNIQUE INDEX unique_template_per_category ON public.content_templates USING btree (category, name);

CREATE UNIQUE INDEX user_collections_pkey ON public.user_collections USING btree (id);

CREATE UNIQUE INDEX user_collections_user_id_slug_key ON public.user_collections USING btree (user_id, slug);

CREATE UNIQUE INDEX user_content_content_type_slug_key ON public.user_content USING btree (content_type, slug);

CREATE UNIQUE INDEX user_content_pkey ON public.user_content USING btree (id);

CREATE INDEX user_interactions_2025_08_content_type_content_slug_idx ON public.user_interactions_2025_08 USING btree (content_type, content_slug);

CREATE INDEX user_interactions_2025_08_interaction_type_created_at_expr_idx ON public.user_interactions_2025_08 USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_2025_08_metadata_idx ON public.user_interactions_2025_08 USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_2025_08_pkey ON public.user_interactions_2025_08 USING btree (id, created_at);

CREATE INDEX user_interactions_2025_08_user_id_content_type_created_at_idx ON public.user_interactions_2025_08 USING btree (user_id, content_type, created_at DESC);

CREATE INDEX user_interactions_2025_09_content_type_content_slug_idx ON public.user_interactions_2025_09 USING btree (content_type, content_slug);

CREATE INDEX user_interactions_2025_09_interaction_type_created_at_expr_idx ON public.user_interactions_2025_09 USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_2025_09_metadata_idx ON public.user_interactions_2025_09 USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_2025_09_pkey ON public.user_interactions_2025_09 USING btree (id, created_at);

CREATE INDEX user_interactions_2025_09_user_id_content_type_created_at_idx ON public.user_interactions_2025_09 USING btree (user_id, content_type, created_at DESC);

CREATE INDEX user_interactions_2025_10_content_type_content_slug_idx ON public.user_interactions_2025_10 USING btree (content_type, content_slug);

CREATE INDEX user_interactions_2025_10_interaction_type_created_at_expr_idx ON public.user_interactions_2025_10 USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_2025_10_metadata_idx ON public.user_interactions_2025_10 USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_2025_10_pkey ON public.user_interactions_2025_10 USING btree (id, created_at);

CREATE INDEX user_interactions_2025_10_user_id_content_type_created_at_idx ON public.user_interactions_2025_10 USING btree (user_id, content_type, created_at DESC);

CREATE INDEX user_interactions_2025_11_content_type_content_slug_idx ON public.user_interactions_2025_11 USING btree (content_type, content_slug);

CREATE INDEX user_interactions_2025_11_interaction_type_created_at_expr_idx ON public.user_interactions_2025_11 USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_2025_11_metadata_idx ON public.user_interactions_2025_11 USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_2025_11_pkey ON public.user_interactions_2025_11 USING btree (id, created_at);

CREATE INDEX user_interactions_2025_11_user_id_content_type_created_at_idx ON public.user_interactions_2025_11 USING btree (user_id, content_type, created_at DESC);

CREATE INDEX user_interactions_2025_12_content_type_content_slug_idx ON public.user_interactions_2025_12 USING btree (content_type, content_slug);

CREATE INDEX user_interactions_2025_12_interaction_type_created_at_expr_idx ON public.user_interactions_2025_12 USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_2025_12_metadata_idx ON public.user_interactions_2025_12 USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_2025_12_pkey ON public.user_interactions_2025_12 USING btree (id, created_at);

CREATE INDEX user_interactions_2025_12_user_id_content_type_created_at_idx ON public.user_interactions_2025_12 USING btree (user_id, content_type, created_at DESC);

CREATE INDEX user_interactions_default_content_type_content_slug_idx ON public.user_interactions_default USING btree (content_type, content_slug);

CREATE INDEX user_interactions_default_interaction_type_created_at_expr_idx ON public.user_interactions_default USING btree (interaction_type, created_at, ((metadata ->> 'query'::text))) WHERE ((interaction_type = 'search'::public.interaction_type) AND ((metadata ->> 'query'::text) IS NOT NULL));

CREATE INDEX user_interactions_default_metadata_idx ON public.user_interactions_default USING gin (metadata);

CREATE UNIQUE INDEX user_interactions_default_pkey ON public.user_interactions_default USING btree (id, created_at);

CREATE INDEX user_interactions_default_user_id_content_type_created_at_idx ON public.user_interactions_default USING btree (user_id, content_type, created_at DESC);

CREATE UNIQUE INDEX user_interactions_pkey ON ONLY public.user_interactions USING btree (id, created_at);

CREATE UNIQUE INDEX user_mcps_pkey ON public.user_mcps USING btree (id);

CREATE UNIQUE INDEX user_mcps_slug_key ON public.user_mcps USING btree (slug);

CREATE UNIQUE INDEX user_similarities_pkey ON public.user_similarities USING btree (id);

CREATE UNIQUE INDEX user_similarities_user_a_id_user_b_id_key ON public.user_similarities USING btree (user_a_id, user_b_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX users_slug_key ON public.users USING btree (slug);

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username) WHERE (username IS NOT NULL);

CREATE UNIQUE INDEX webhook_event_runs_event_attempt_idx ON public.webhook_event_runs USING btree (webhook_event_id, attempt);

CREATE UNIQUE INDEX webhook_event_runs_pkey ON public.webhook_event_runs USING btree (id);

CREATE INDEX webhook_event_runs_status_idx ON public.webhook_event_runs USING btree (status, started_at);

CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id);

CREATE INDEX webhook_events_processed_idx ON public.webhook_events USING btree (source, processed, created_at);

CREATE UNIQUE INDEX webhook_events_svix_id_key ON public.webhook_events USING btree (svix_id);

alter table "public"."announcement_dismissals" add constraint "announcement_dismissals_pkey" PRIMARY KEY using index "announcement_dismissals_pkey";

alter table "public"."announcements" add constraint "announcements_pkey" PRIMARY KEY using index "announcements_pkey";

alter table "public"."app_settings" add constraint "app_settings_pkey" PRIMARY KEY using index "app_settings_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_pkey" PRIMARY KEY using index "bookmarks_pkey";

alter table "public"."category_configs" add constraint "category_configs_pkey" PRIMARY KEY using index "category_configs_pkey";

alter table "public"."changelog" add constraint "changelog_pkey" PRIMARY KEY using index "changelog_pkey";

alter table "public"."collection_items" add constraint "collection_items_pkey" PRIMARY KEY using index "collection_items_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."contact_commands" add constraint "contact_commands_pkey" PRIMARY KEY using index "contact_commands_pkey";

alter table "public"."contact_submissions" add constraint "contact_submissions_pkey" PRIMARY KEY using index "contact_submissions_pkey";

alter table "public"."content" add constraint "content_pkey" PRIMARY KEY using index "content_pkey";

alter table "public"."content_embeddings" add constraint "content_embeddings_pkey" PRIMARY KEY using index "content_embeddings_pkey";

alter table "public"."content_generation_tracking" add constraint "content_generation_tracking_pkey" PRIMARY KEY using index "content_generation_tracking_pkey";

alter table "public"."content_similarities" add constraint "content_similarities_pkey" PRIMARY KEY using index "content_similarities_pkey";

alter table "public"."content_submissions" add constraint "content_submissions_pkey" PRIMARY KEY using index "content_submissions_pkey";

alter table "public"."content_templates" add constraint "content_templates_pkey" PRIMARY KEY using index "content_templates_pkey";

alter table "public"."content_time_metrics" add constraint "content_time_metrics_pkey" PRIMARY KEY using index "content_time_metrics_pkey";

alter table "public"."content_votes" add constraint "content_votes_pkey" PRIMARY KEY using index "content_votes_pkey";

alter table "public"."email_blocklist" add constraint "email_blocklist_pkey" PRIMARY KEY using index "email_blocklist_pkey";

alter table "public"."email_engagement_summary" add constraint "email_engagement_summary_pkey" PRIMARY KEY using index "email_engagement_summary_pkey";

alter table "public"."email_sequence_schedule" add constraint "email_sequence_schedule_pkey" PRIMARY KEY using index "email_sequence_schedule_pkey";

alter table "public"."email_sequences" add constraint "email_sequences_pkey" PRIMARY KEY using index "email_sequences_pkey";

alter table "public"."followers" add constraint "followers_pkey" PRIMARY KEY using index "followers_pkey";

alter table "public"."form_field_configs" add constraint "form_field_configs_pkey" PRIMARY KEY using index "form_field_configs_pkey";

alter table "public"."job_runs" add constraint "job_runs_pkey" PRIMARY KEY using index "job_runs_pkey";

alter table "public"."job_subscription_audit_log" add constraint "job_subscription_audit_log_pkey" PRIMARY KEY using index "job_subscription_audit_log_pkey";

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."metadata_templates" add constraint "metadata_templates_pkey" PRIMARY KEY using index "metadata_templates_pkey";

alter table "public"."mfa_failed_verification_attempts" add constraint "mfa_failed_verification_attempts_pkey" PRIMARY KEY using index "mfa_failed_verification_attempts_pkey";

alter table "public"."newsletter_subscriptions" add constraint "newsletter_subscriptions_pkey" PRIMARY KEY using index "newsletter_subscriptions_pkey";

alter table "public"."notification_dismissals" add constraint "notification_dismissals_pkey" PRIMARY KEY using index "notification_dismissals_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."password_failed_verification_attempts" add constraint "password_failed_verification_attempts_pkey" PRIMARY KEY using index "password_failed_verification_attempts_pkey";

alter table "public"."payment_plan_catalog" add constraint "payment_plan_catalog_pkey" PRIMARY KEY using index "payment_plan_catalog_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."quiz_options" add constraint "quiz_options_pkey" PRIMARY KEY using index "quiz_options_pkey";

alter table "public"."quiz_questions" add constraint "quiz_questions_pkey" PRIMARY KEY using index "quiz_questions_pkey";

alter table "public"."rate_limit_tracker" add constraint "rate_limit_tracker_pkey" PRIMARY KEY using index "rate_limit_tracker_pkey";

alter table "public"."review_helpful_votes" add constraint "review_helpful_votes_pkey" PRIMARY KEY using index "review_helpful_votes_pkey";

alter table "public"."review_ratings" add constraint "review_ratings_pkey" PRIMARY KEY using index "review_ratings_pkey";

alter table "public"."script_artifacts" add constraint "script_artifacts_pkey" PRIMARY KEY using index "script_artifacts_pkey";

alter table "public"."script_cache" add constraint "script_cache_pkey" PRIMARY KEY using index "script_cache_pkey";

alter table "public"."search_queries" add constraint "search_queries_pkey" PRIMARY KEY using index "search_queries_pkey";

alter table "public"."search_queries_2025_11" add constraint "search_queries_2025_11_pkey" PRIMARY KEY using index "search_queries_2025_11_pkey";

alter table "public"."search_queries_2025_12" add constraint "search_queries_2025_12_pkey" PRIMARY KEY using index "search_queries_2025_12_pkey";

alter table "public"."search_queries_default" add constraint "search_queries_default_pkey" PRIMARY KEY using index "search_queries_default_pkey";

alter table "public"."sponsored_content" add constraint "sponsored_content_pkey" PRIMARY KEY using index "sponsored_content_pkey";

alter table "public"."static_routes" add constraint "static_routes_pkey" PRIMARY KEY using index "static_routes_pkey";

alter table "public"."structured_data_config" add constraint "structured_data_config_pkey" PRIMARY KEY using index "structured_data_config_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."tier_display_config" add constraint "tier_display_config_pkey" PRIMARY KEY using index "tier_display_config_pkey";

alter table "public"."user_collections" add constraint "user_collections_pkey" PRIMARY KEY using index "user_collections_pkey";

alter table "public"."user_content" add constraint "user_content_pkey" PRIMARY KEY using index "user_content_pkey";

alter table "public"."user_interactions" add constraint "user_interactions_pkey" PRIMARY KEY using index "user_interactions_pkey";

alter table "public"."user_interactions_2025_08" add constraint "user_interactions_2025_08_pkey" PRIMARY KEY using index "user_interactions_2025_08_pkey";

alter table "public"."user_interactions_2025_09" add constraint "user_interactions_2025_09_pkey" PRIMARY KEY using index "user_interactions_2025_09_pkey";

alter table "public"."user_interactions_2025_10" add constraint "user_interactions_2025_10_pkey" PRIMARY KEY using index "user_interactions_2025_10_pkey";

alter table "public"."user_interactions_2025_11" add constraint "user_interactions_2025_11_pkey" PRIMARY KEY using index "user_interactions_2025_11_pkey";

alter table "public"."user_interactions_2025_12" add constraint "user_interactions_2025_12_pkey" PRIMARY KEY using index "user_interactions_2025_12_pkey";

alter table "public"."user_interactions_default" add constraint "user_interactions_default_pkey" PRIMARY KEY using index "user_interactions_default_pkey";

alter table "public"."user_mcps" add constraint "user_mcps_pkey" PRIMARY KEY using index "user_mcps_pkey";

alter table "public"."user_similarities" add constraint "user_similarities_pkey" PRIMARY KEY using index "user_similarities_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."webhook_event_runs" add constraint "webhook_event_runs_pkey" PRIMARY KEY using index "webhook_event_runs_pkey";

alter table "public"."webhook_events" add constraint "webhook_events_pkey" PRIMARY KEY using index "webhook_events_pkey";

alter table "public"."announcement_dismissals" add constraint "announcement_dismissals_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE not valid;

alter table "public"."announcement_dismissals" validate constraint "announcement_dismissals_announcement_id_fkey";

alter table "public"."announcement_dismissals" add constraint "announcement_dismissals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."announcement_dismissals" validate constraint "announcement_dismissals_user_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_content_type_content_slug_key" UNIQUE using index "bookmarks_user_id_content_type_content_slug_key";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_user_id_fkey";

alter table "public"."category_configs" add constraint "category_configs_content_loader_key" UNIQUE using index "category_configs_content_loader_key";

alter table "public"."category_configs" add constraint "category_configs_url_slug_key" UNIQUE using index "category_configs_url_slug_key";

alter table "public"."changelog" add constraint "changelog_slug_key" UNIQUE using index "changelog_slug_key";

alter table "public"."collection_items" add constraint "collection_items_collection_id_content_type_content_slug_key" UNIQUE using index "collection_items_collection_id_content_type_content_slug_key";

alter table "public"."collection_items" add constraint "collection_items_collection_id_fkey" FOREIGN KEY (collection_id) REFERENCES public.user_collections(id) ON DELETE CASCADE not valid;

alter table "public"."collection_items" validate constraint "collection_items_collection_id_fkey";

alter table "public"."collection_items" add constraint "collection_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."collection_items" validate constraint "collection_items_user_id_fkey";

alter table "public"."companies" add constraint "companies_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."companies" validate constraint "companies_owner_id_fkey";

alter table "public"."companies" add constraint "companies_slug_key" UNIQUE using index "companies_slug_key";

alter table "public"."contact_commands" add constraint "contact_commands_command_id_key" UNIQUE using index "contact_commands_command_id_key";

alter table "public"."contact_submissions" add constraint "contact_submissions_responded_by_fkey" FOREIGN KEY (responded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."contact_submissions" validate constraint "contact_submissions_responded_by_fkey";

alter table "public"."contact_submissions" add constraint "contact_submissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."contact_submissions" validate constraint "contact_submissions_user_id_fkey";

alter table "public"."content" add constraint "content_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES public.users(id) not valid;

alter table "public"."content" validate constraint "content_author_user_id_fkey";

alter table "public"."content_embeddings" add constraint "content_embeddings_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE not valid;

alter table "public"."content_embeddings" validate constraint "content_embeddings_content_id_fkey";

alter table "public"."content_embeddings" add constraint "content_embeddings_content_id_key" UNIQUE using index "content_embeddings_content_id_key";

alter table "public"."content_generation_tracking" add constraint "content_generation_tracking_category_slug_key" UNIQUE using index "content_generation_tracking_category_slug_key";

alter table "public"."content_submissions" add constraint "content_submissions_moderated_by_fkey" FOREIGN KEY (moderated_by) REFERENCES auth.users(id) not valid;

alter table "public"."content_submissions" validate constraint "content_submissions_moderated_by_fkey";

alter table "public"."content_submissions" add constraint "content_submissions_submitter_id_fkey" FOREIGN KEY (submitter_id) REFERENCES auth.users(id) not valid;

alter table "public"."content_submissions" validate constraint "content_submissions_submitter_id_fkey";

alter table "public"."content_templates" add constraint "unique_template_per_category" UNIQUE using index "unique_template_per_category";

alter table "public"."content_time_metrics" add constraint "content_time_metrics_content_id_fkey" FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE not valid;

alter table "public"."content_time_metrics" validate constraint "content_time_metrics_content_id_fkey";

alter table "public"."content_votes" add constraint "content_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."content_votes" validate constraint "content_votes_user_id_fkey";

alter table "public"."content_votes" add constraint "fk_content_votes_content" FOREIGN KEY (content_slug, content_type) REFERENCES public.content(slug, category) ON DELETE CASCADE not valid;

alter table "public"."content_votes" validate constraint "fk_content_votes_content";

alter table "public"."email_engagement_summary" add constraint "email_engagement_summary_email_key" UNIQUE using index "email_engagement_summary_email_key";

alter table "public"."email_engagement_summary" add constraint "fk_resend_contact" FOREIGN KEY (resend_contact_id) REFERENCES public.newsletter_subscriptions(resend_contact_id) ON DELETE SET NULL not valid;

alter table "public"."email_engagement_summary" validate constraint "fk_resend_contact";

alter table "public"."email_sequence_schedule" add constraint "email_sequence_schedule_unique_step" UNIQUE using index "email_sequence_schedule_unique_step";

alter table "public"."email_sequences" add constraint "email_sequences_sequence_id_email_key" UNIQUE using index "email_sequences_sequence_id_email_key";

alter table "public"."followers" add constraint "followers_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."followers" validate constraint "followers_follower_id_fkey";

alter table "public"."followers" add constraint "followers_follower_id_following_id_key" UNIQUE using index "followers_follower_id_following_id_key";

alter table "public"."followers" add constraint "followers_following_id_fkey" FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."followers" validate constraint "followers_following_id_fkey";

alter table "public"."form_field_configs" add constraint "form_field_configs_form_type_field_name_key" UNIQUE using index "form_field_configs_form_type_field_name_key";

alter table "public"."job_subscription_audit_log" add constraint "job_subscription_audit_log_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."job_subscription_audit_log" validate constraint "job_subscription_audit_log_job_id_fkey";

alter table "public"."jobs" add constraint "jobs_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL not valid;

alter table "public"."jobs" validate constraint "jobs_company_id_fkey";

alter table "public"."jobs" add constraint "jobs_slug_key" UNIQUE using index "jobs_slug_key";

alter table "public"."jobs" add constraint "jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."jobs" validate constraint "jobs_user_id_fkey";

alter table "public"."newsletter_subscriptions" add constraint "newsletter_subscriptions_email_key" UNIQUE using index "newsletter_subscriptions_email_key";

alter table "public"."newsletter_subscriptions" add constraint "newsletter_subscriptions_resend_contact_id_key" UNIQUE using index "newsletter_subscriptions_resend_contact_id_key";

alter table "public"."notification_dismissals" add constraint "notification_dismissals_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE not valid;

alter table "public"."notification_dismissals" validate constraint "notification_dismissals_notification_id_fkey";

alter table "public"."notification_dismissals" add constraint "notification_dismissals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notification_dismissals" validate constraint "notification_dismissals_user_id_fkey";

alter table "public"."payments" add constraint "payments_polar_transaction_id_key" UNIQUE using index "payments_polar_transaction_id_key";

alter table "public"."payments" add constraint "payments_product_job_fkey" FOREIGN KEY (product_id) REFERENCES public.jobs(id) DEFERRABLE not valid;

alter table "public"."payments" validate constraint "payments_product_job_fkey";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."quiz_options" add constraint "quiz_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE not valid;

alter table "public"."quiz_options" validate constraint "quiz_options_question_id_fkey";

alter table "public"."quiz_options" add constraint "quiz_options_question_id_value_key" UNIQUE using index "quiz_options_question_id_value_key";

alter table "public"."quiz_questions" add constraint "quiz_questions_question_id_key" UNIQUE using index "quiz_questions_question_id_key";

alter table "public"."review_helpful_votes" add constraint "review_helpful_votes_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.review_ratings(id) ON DELETE CASCADE not valid;

alter table "public"."review_helpful_votes" validate constraint "review_helpful_votes_review_id_fkey";

alter table "public"."review_helpful_votes" add constraint "review_helpful_votes_review_id_user_id_key" UNIQUE using index "review_helpful_votes_review_id_user_id_key";

alter table "public"."review_helpful_votes" add constraint "review_helpful_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."review_helpful_votes" validate constraint "review_helpful_votes_user_id_fkey";

alter table "public"."review_ratings" add constraint "review_ratings_user_id_content_type_content_slug_key" UNIQUE using index "review_ratings_user_id_content_type_content_slug_key";

alter table "public"."review_ratings" add constraint "review_ratings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."review_ratings" validate constraint "review_ratings_user_id_fkey";

alter table "public"."search_queries" add constraint "search_queries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."search_queries" validate constraint "search_queries_user_id_fkey";

alter table "public"."search_queries_2025_11" add constraint "search_queries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."search_queries_2025_11" validate constraint "search_queries_user_id_fkey";

alter table "public"."search_queries_2025_12" add constraint "search_queries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."search_queries_2025_12" validate constraint "search_queries_user_id_fkey";

alter table "public"."search_queries_default" add constraint "search_queries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."search_queries_default" validate constraint "search_queries_user_id_fkey";

alter table "public"."sponsored_content" add constraint "sponsored_content_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."sponsored_content" validate constraint "sponsored_content_user_id_fkey";

alter table "public"."static_routes" add constraint "static_routes_path_key" UNIQUE using index "static_routes_path_key";

alter table "public"."subscriptions" add constraint "subscriptions_polar_subscription_id_key" UNIQUE using index "subscriptions_polar_subscription_id_key";

alter table "public"."subscriptions" add constraint "subscriptions_product_job_fkey" FOREIGN KEY (product_id) REFERENCES public.jobs(id) DEFERRABLE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_product_job_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."user_collections" add constraint "user_collections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_collections" validate constraint "user_collections_user_id_fkey";

alter table "public"."user_collections" add constraint "user_collections_user_id_slug_key" UNIQUE using index "user_collections_user_id_slug_key";

alter table "public"."user_content" add constraint "user_content_content_type_slug_key" UNIQUE using index "user_content_content_type_slug_key";

alter table "public"."user_content" add constraint "user_content_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_content" validate constraint "user_content_user_id_fkey";

alter table "public"."user_interactions" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_2025_08" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_2025_08" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_2025_09" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_2025_09" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_2025_10" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_2025_10" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_2025_11" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_2025_11" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_2025_12" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_2025_12" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_interactions_default" add constraint "user_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interactions_default" validate constraint "user_interactions_user_id_fkey";

alter table "public"."user_mcps" add constraint "user_mcps_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL not valid;

alter table "public"."user_mcps" validate constraint "user_mcps_company_id_fkey";

alter table "public"."user_mcps" add constraint "user_mcps_slug_key" UNIQUE using index "user_mcps_slug_key";

alter table "public"."user_mcps" add constraint "user_mcps_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_mcps" validate constraint "user_mcps_user_id_fkey";

alter table "public"."user_similarities" add constraint "user_similarities_user_a_id_fkey" FOREIGN KEY (user_a_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_similarities" validate constraint "user_similarities_user_a_id_fkey";

alter table "public"."user_similarities" add constraint "user_similarities_user_a_id_user_b_id_key" UNIQUE using index "user_similarities_user_a_id_user_b_id_key";

alter table "public"."user_similarities" add constraint "user_similarities_user_b_id_fkey" FOREIGN KEY (user_b_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_similarities" validate constraint "user_similarities_user_b_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_slug_key" UNIQUE using index "users_slug_key";

alter table "public"."webhook_event_runs" add constraint "webhook_event_runs_webhook_event_id_fkey" FOREIGN KEY (webhook_event_id) REFERENCES public.webhook_events(id) ON DELETE CASCADE not valid;

alter table "public"."webhook_event_runs" validate constraint "webhook_event_runs_webhook_event_id_fkey";

alter table "public"."webhook_events" add constraint "webhook_events_svix_id_key" UNIQUE using index "webhook_events_svix_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION migrations.track_user_interaction(p_content_type text, p_content_slug text, p_interaction_type text, p_session_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS public.track_user_interaction_result
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_result public.track_user_interaction_result;
begin
  insert into public.user_interactions(
    user_id,
    content_type,
    content_slug,
    interaction_type,
    session_id,
    metadata
  ) values (
    v_user_id,
    p_content_type,
    p_content_slug,
    p_interaction_type,
    p_session_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  v_result := ROW(TRUE, NULL::text)::public.track_user_interaction_result;
  return v_result;
exception
  when others then
    v_result := ROW(FALSE, SQLERRM)::public.track_user_interaction_result;
    return v_result;
end;
$function$
;

CREATE OR REPLACE FUNCTION pgmq_public.archive(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return pgmq.archive( queue_name := queue_name, msg_id := message_id ); end; $function$
;

CREATE OR REPLACE FUNCTION pgmq_public.delete(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return pgmq.delete( queue_name := queue_name, msg_id := message_id ); end; $function$
;

CREATE OR REPLACE FUNCTION pgmq_public.pop(queue_name text)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.pop( queue_name := queue_name ); end; $function$
;

CREATE OR REPLACE FUNCTION pgmq_public.read(queue_name text, sleep_seconds integer, n integer)
 RETURNS SETOF pgmq.message_record
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.read( queue_name := queue_name, vt := sleep_seconds, qty := n , conditional := '{}'::jsonb ); end; $function$
;

CREATE OR REPLACE FUNCTION pgmq_public.send(queue_name text, message jsonb, sleep_seconds integer DEFAULT 0)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.send( queue_name := queue_name, msg := message, delay := sleep_seconds ); end; $function$
;

CREATE OR REPLACE FUNCTION pgmq_public.send_batch(queue_name text, messages jsonb[], sleep_seconds integer DEFAULT 0)
 RETURNS SETOF bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin return query select * from pgmq.send_batch( queue_name := queue_name, msgs := messages, delay := sleep_seconds ); end; $function$
;

CREATE UNIQUE INDEX idx_mv_active_metadata_templates_route_pattern ON public.mv_active_metadata_templates USING btree (route_pattern);

CREATE UNIQUE INDEX idx_mv_timezone_names_name ON public.mv_timezone_names USING btree (name);

CREATE INDEX idx_trending_metrics_cache_all_time_popularity ON public.trending_metrics_cache USING btree (all_time_popularity_score DESC);

CREATE INDEX idx_trending_metrics_cache_category ON public.trending_metrics_cache USING btree (category);

CREATE UNIQUE INDEX idx_trending_metrics_cache_id ON public.trending_metrics_cache USING btree (id);

CREATE INDEX idx_trending_metrics_cache_trending_score ON public.trending_metrics_cache USING btree (trending_score DESC);

CREATE INDEX idx_trending_searches_count ON public.trending_searches USING btree (search_count DESC);

CREATE INDEX idx_trending_searches_last ON public.trending_searches USING btree (last_searched DESC);

CREATE INDEX mv_content_list_slim_category_idx ON public.mv_content_list_slim USING btree (category);

CREATE INDEX mv_content_list_slim_created_at_idx ON public.mv_content_list_slim USING btree (created_at DESC);

CREATE INDEX mv_content_list_slim_popularity_score_idx ON public.mv_content_list_slim USING btree (popularity_score DESC);

CREATE UNIQUE INDEX mv_content_list_slim_slug_category_idx ON public.mv_content_list_slim USING btree (slug, category);

CREATE UNIQUE INDEX mv_search_facets_category_idx ON public.mv_search_facets USING btree (category);

CREATE UNIQUE INDEX mv_site_urls_path_idx ON public.mv_site_urls USING btree (path);

CREATE UNIQUE INDEX mv_unified_search_entity_slug_idx ON public.mv_unified_search USING btree (entity_type, slug);

CREATE INDEX mv_unified_search_search_vector_idx ON public.mv_unified_search USING gin (search_vector);

grant delete on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant insert on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant references on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant select on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant trigger on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant truncate on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant update on table "public"."mfa_failed_verification_attempts" to "supabase_auth_admin";

grant delete on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant insert on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant references on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant select on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant trigger on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant truncate on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";

grant update on table "public"."password_failed_verification_attempts" to "supabase_auth_admin";


  create policy "Users can dismiss announcements"
  on "public"."announcement_dismissals"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can un-dismiss announcements"
  on "public"."announcement_dismissals"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own dismissals"
  on "public"."announcement_dismissals"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Announcements are viewable by everyone"
  on "public"."announcements"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can read enabled app_settings"
  on "public"."app_settings"
  as permissive
  for select
  to public
using ((enabled = true));



  create policy "Users can delete their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can insert their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Category configs are publicly readable"
  on "public"."category_configs"
  as permissive
  for select
  to public
using (true);



  create policy "Category configs are service-writable"
  on "public"."category_configs"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Published entries are viewable by everyone"
  on "public"."changelog"
  as permissive
  for select
  to public
using ((published = true));



  create policy "service_role_changelog_entries_all"
  on "public"."changelog"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can add items to their collections"
  on "public"."collection_items"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete items from their collections"
  on "public"."collection_items"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update items in their collections"
  on "public"."collection_items"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view items in their collections"
  on "public"."collection_items"
  as permissive
  for select
  to public
using (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_collections
  WHERE ((user_collections.id = collection_items.collection_id) AND (user_collections.is_public = true))))));



  create policy "Companies are viewable by everyone"
  on "public"."companies"
  as permissive
  for select
  to public
using (true);



  create policy "Company owners can update their companies"
  on "public"."companies"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can create companies"
  on "public"."companies"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Public can read active commands"
  on "public"."contact_commands"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Service role can manage contact commands"
  on "public"."contact_commands"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Anyone can insert contact submissions"
  on "public"."contact_submissions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Service role can delete contact submissions"
  on "public"."contact_submissions"
  as permissive
  for delete
  to public
using ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "Service role can update contact submissions"
  on "public"."contact_submissions"
  as permissive
  for update
  to public
using ((( SELECT auth.role() AS role) = 'service_role'::text))
with check ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "Users can view own contact submissions"
  on "public"."contact_submissions"
  as permissive
  for select
  to public
using (((( SELECT auth.role() AS role) = 'service_role'::text) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "content_delete_service_role"
  on "public"."content"
  as permissive
  for delete
  to service_role
using (true);



  create policy "content_insert_service_role"
  on "public"."content"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "content_select_anon"
  on "public"."content"
  as permissive
  for select
  to anon
using (true);



  create policy "content_select_authenticated"
  on "public"."content"
  as permissive
  for select
  to authenticated
using (true);



  create policy "content_select_service_role"
  on "public"."content"
  as permissive
  for select
  to service_role
using (true);



  create policy "content_update_service_role"
  on "public"."content"
  as permissive
  for update
  to service_role
using (true)
with check (true);



  create policy "Unified access policy"
  on "public"."content_embeddings"
  as permissive
  for all
  to public
using (((( SELECT auth.role() AS role) = ANY (ARRAY['anon'::text, 'authenticated'::text])) OR (( SELECT auth.role() AS role) = 'service_role'::text)))
with check ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "Authenticated users can view content generation tracking"
  on "public"."content_generation_tracking"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Service role can manage content generation tracking"
  on "public"."content_generation_tracking"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Content similarities are viewable by everyone"
  on "public"."content_similarities"
  as permissive
  for select
  to public
using (true);



  create policy "Service role has full access to content similarities"
  on "public"."content_similarities"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Moderators can update submissions"
  on "public"."content_submissions"
  as permissive
  for update
  to public
using (( SELECT (EXISTS ( SELECT 1
           FROM auth.users
          WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND ((users.raw_user_meta_data ->> 'role'::text) = 'moderator'::text)))) AS "exists"));



  create policy "Users and moderators can view submissions"
  on "public"."content_submissions"
  as permissive
  for select
  to public
using (((( SELECT auth.uid() AS uid) = submitter_id) OR ( SELECT (EXISTS ( SELECT 1
           FROM auth.users
          WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND ((users.raw_user_meta_data ->> 'role'::text) = 'moderator'::text)))) AS "exists")));



  create policy "Users can insert submissions"
  on "public"."content_submissions"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) = submitter_id) OR (submitter_id IS NULL)));



  create policy "Anonymous users view active templates"
  on "public"."content_templates"
  as permissive
  for select
  to anon
using ((active = true));



  create policy "Authenticated users manage templates"
  on "public"."content_templates"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow public read access"
  on "public"."content_time_metrics"
  as permissive
  for select
  to public
using (true);



  create policy "Allow service role write access"
  on "public"."content_time_metrics"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "content_votes_delete"
  on "public"."content_votes"
  as permissive
  for delete
  to public
using (((user_id = ( SELECT auth.uid() AS uid)) OR ((user_id IS NULL) AND (session_id IS NOT NULL))));



  create policy "content_votes_insert"
  on "public"."content_votes"
  as permissive
  for insert
  to public
with check (((user_id = ( SELECT auth.uid() AS uid)) OR ((user_id IS NULL) AND (session_id IS NOT NULL))));



  create policy "content_votes_select_own"
  on "public"."content_votes"
  as permissive
  for select
  to public
using (((user_id = ( SELECT auth.uid() AS uid)) OR ((user_id IS NULL) AND (session_id IS NOT NULL))));



  create policy "email_blocklist_block_anon"
  on "public"."email_blocklist"
  as permissive
  for all
  to anon
using (false);



  create policy "email_blocklist_block_authenticated"
  on "public"."email_blocklist"
  as permissive
  for all
  to authenticated
using (false);



  create policy "email_blocklist_service_role_all"
  on "public"."email_blocklist"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Service role can manage email engagement data"
  on "public"."email_engagement_summary"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Service role can manage all scheduled emails"
  on "public"."email_sequence_schedule"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view own scheduled emails"
  on "public"."email_sequence_schedule"
  as permissive
  for select
  to authenticated
using ((email = ((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::json ->> 'email'::text)));



  create policy "Service role can manage all email sequences"
  on "public"."email_sequences"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view own email sequences"
  on "public"."email_sequences"
  as permissive
  for select
  to authenticated
using ((email = ((( SELECT current_setting('request.jwt.claims'::text, true) AS current_setting))::json ->> 'email'::text)));



  create policy "Followers are viewable by everyone"
  on "public"."followers"
  as permissive
  for select
  to public
using (true);



  create policy "Users can follow others"
  on "public"."followers"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = follower_id));



  create policy "Users can unfollow others"
  on "public"."followers"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = follower_id));



  create policy "Form field configs are viewable by everyone"
  on "public"."form_field_configs"
  as permissive
  for select
  to public
using ((enabled = true));



  create policy "Service role has full access to form configs"
  on "public"."form_field_configs"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."job_subscription_audit_log"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Active jobs are viewable by everyone"
  on "public"."jobs"
  as permissive
  for select
  to public
using (((status = 'active'::public.job_status) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users can create jobs"
  on "public"."jobs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own jobs"
  on "public"."jobs"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Metadata templates are publicly readable"
  on "public"."metadata_templates"
  as permissive
  for select
  to public
using (true);



  create policy "Service role can manage metadata templates"
  on "public"."metadata_templates"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Anyone can subscribe"
  on "public"."newsletter_subscriptions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can unsubscribe"
  on "public"."newsletter_subscriptions"
  as permissive
  for update
  to public
using (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email))
with check (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email));



  create policy "Users can view their own newsletter subscription"
  on "public"."newsletter_subscriptions"
  as permissive
  for select
  to public
using (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email));



  create policy "Users can dismiss notifications"
  on "public"."notification_dismissals"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can un-dismiss notifications"
  on "public"."notification_dismissals"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own dismissals"
  on "public"."notification_dismissals"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Notifications are viewable by everyone"
  on "public"."notifications"
  as permissive
  for select
  to public
using (true);



  create policy "public_read_access"
  on "public"."payment_plan_catalog"
  as permissive
  for select
  to public
using (true);



  create policy "service_role_write_access"
  on "public"."payment_plan_catalog"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view their own payments"
  on "public"."payments"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Quiz options publicly readable"
  on "public"."quiz_options"
  as permissive
  for select
  to public
using (true);



  create policy "Quiz options service writable"
  on "public"."quiz_options"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Quiz questions publicly readable"
  on "public"."quiz_questions"
  as permissive
  for select
  to public
using (true);



  create policy "Quiz questions service writable"
  on "public"."quiz_questions"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Service role full access"
  on "public"."rate_limit_tracker"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Authenticated users can mark reviews helpful"
  on "public"."review_helpful_votes"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Helpful votes are viewable by everyone"
  on "public"."review_helpful_votes"
  as permissive
  for select
  to public
using (true);



  create policy "Service role has full access to helpful votes"
  on "public"."review_helpful_votes"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can remove their helpful votes"
  on "public"."review_helpful_votes"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Authenticated users can create reviews"
  on "public"."review_ratings"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Reviews are viewable by everyone"
  on "public"."review_ratings"
  as permissive
  for select
  to public
using (true);



  create policy "Service role has full access to reviews"
  on "public"."review_ratings"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can delete their own reviews"
  on "public"."review_ratings"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can update their own reviews"
  on "public"."review_ratings"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "script_artifacts_service_role"
  on "public"."script_artifacts"
  as permissive
  for all
  to service_role
using ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "script_cache_service_role"
  on "public"."script_cache"
  as permissive
  for all
  to service_role
using ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "Allow anonymous search query inserts"
  on "public"."search_queries"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Users can view own search history"
  on "public"."search_queries"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "service_role_full_access"
  on "public"."search_queries_2025_11"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."search_queries_2025_12"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."search_queries_default"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Active sponsored content is viewable by everyone"
  on "public"."sponsored_content"
  as permissive
  for select
  to public
using (((active = true) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Public read access"
  on "public"."static_routes"
  as permissive
  for select
  to public
using (true);



  create policy "Service role full access"
  on "public"."static_routes"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Service role can manage structured data config"
  on "public"."structured_data_config"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Structured data config is publicly readable"
  on "public"."structured_data_config"
  as permissive
  for select
  to public
using (true);



  create policy "Users can view their own subscriptions"
  on "public"."subscriptions"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Tier display config is publicly readable"
  on "public"."tier_display_config"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Public collections are viewable by everyone"
  on "public"."user_collections"
  as permissive
  for select
  to public
using (((is_public = true) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users can create their own collections"
  on "public"."user_collections"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete their own collections"
  on "public"."user_collections"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own collections"
  on "public"."user_collections"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Active user content is viewable by everyone"
  on "public"."user_content"
  as permissive
  for select
  to public
using (((active = true) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users can create content"
  on "public"."user_content"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own content"
  on "public"."user_content"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Anyone can insert interactions"
  on "public"."user_interactions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Service role has full access to interactions"
  on "public"."user_interactions"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view their own interactions"
  on "public"."user_interactions"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "service_role_full_access"
  on "public"."user_interactions_2025_08"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."user_interactions_2025_09"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."user_interactions_2025_10"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."user_interactions_2025_11"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."user_interactions_2025_12"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "service_role_full_access"
  on "public"."user_interactions_default"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Active MCPs are viewable by everyone"
  on "public"."user_mcps"
  as permissive
  for select
  to public
using (((active = true) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users can create MCPs"
  on "public"."user_mcps"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own MCPs"
  on "public"."user_mcps"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Service role has full access to user similarities"
  on "public"."user_similarities"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view their own similarities"
  on "public"."user_similarities"
  as permissive
  for select
  to public
using (((( SELECT auth.uid() AS uid) = user_a_id) OR (( SELECT auth.uid() AS uid) = user_b_id)));



  create policy "Public users are viewable by everyone"
  on "public"."users"
  as permissive
  for select
  to public
using (((public = true) OR (( SELECT auth.uid() AS uid) = id)));



  create policy "Users can update their own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "service_role_full_access"
  on "public"."webhook_event_runs"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Allow webhook inserts from external services"
  on "public"."webhook_events"
  as permissive
  for insert
  to public
with check (true);



  create policy "Service role can manage webhook events"
  on "public"."webhook_events"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can read their own webhook events"
  on "public"."webhook_events"
  as permissive
  for select
  to public
using (((( SELECT auth.role() AS role) = 'authenticated'::text) AND (((data ->> 'to'::text) = (( SELECT auth.jwt() AS jwt) ->> 'email'::text)) OR ((data -> 'to'::text) ? (( SELECT auth.jwt() AS jwt) ->> 'email'::text)) OR ((data -> 'to'::text) @> to_jsonb(ARRAY[(( SELECT auth.jwt() AS jwt) ->> 'email'::text)])))));


CREATE TRIGGER update_announcement_dismissals_updated_at BEFORE UPDATE ON public.announcement_dismissals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER track_app_setting_changes BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_app_setting_version();

CREATE TRIGGER bookmark_count_trigger AFTER INSERT OR DELETE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_bookmark_count();

CREATE TRIGGER trigger_update_content_bookmark_count AFTER INSERT OR DELETE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_content_bookmark_count();

CREATE TRIGGER trigger_update_user_bookmark_count AFTER INSERT OR DELETE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_user_bookmark_count();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_configs_updated_at BEFORE UPDATE ON public.category_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_changelog_entry_json_ld BEFORE INSERT OR UPDATE OF title, description, slug, created_at, updated_at, changes ON public.changelog FOR EACH ROW EXECUTE FUNCTION public.update_changelog_entry_json_ld();

CREATE TRIGGER trigger_generate_changelog_seo_fields BEFORE INSERT ON public.changelog FOR EACH ROW EXECUTE FUNCTION public.generate_changelog_seo_fields_trigger();

CREATE TRIGGER update_changelog_updated_at BEFORE UPDATE ON public.changelog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_collection_item_count_on_delete AFTER DELETE ON public.collection_items FOR EACH ROW EXECUTE FUNCTION public.update_user_collection_item_count();

CREATE TRIGGER trigger_update_collection_item_count_on_insert AFTER INSERT ON public.collection_items FOR EACH ROW EXECUTE FUNCTION public.update_user_collection_item_count();

CREATE TRIGGER update_collection_items_updated_at BEFORE UPDATE ON public.collection_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER companies_mv_refresh_trigger AFTER INSERT OR DELETE OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_mv_unified_search();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_json_ld BEFORE INSERT OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.trigger_regenerate_company_json_ld();

CREATE TRIGGER update_contact_commands_updated_at BEFORE UPDATE ON public.contact_commands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER content_author_user_id_post_count_trigger AFTER INSERT OR DELETE OR UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.update_user_post_count_from_content();

CREATE TRIGGER content_mv_refresh_trigger AFTER INSERT OR DELETE OR UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_mv_unified_search();

CREATE TRIGGER content_title_trigger BEFORE INSERT OR UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.set_title_from_slug();

CREATE TRIGGER content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.update_content_updated_at();

CREATE TRIGGER on_content_embedding_generation AFTER INSERT OR UPDATE ON public.content FOR EACH ROW WHEN (public.should_generate_embedding(new.title, new.description, new.tags, new.author)) EXECUTE FUNCTION public.trigger_enqueue_embedding_generation();

CREATE TRIGGER regenerate_json_ld_on_content_change BEFORE INSERT OR UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.trigger_regenerate_content_json_ld();

CREATE TRIGGER trigger_content_package_generation AFTER INSERT OR UPDATE ON public.content FOR EACH ROW WHEN ((((new.category = 'skills'::public.content_category) AND ((new.storage_url IS NULL) OR (new.storage_url = ''::text))) OR ((new.category = 'mcp'::public.content_category) AND ((new.mcpb_storage_url IS NULL) OR (new.mcpb_storage_url = ''::text))))) EXECUTE FUNCTION public.should_trigger_package_generation();

CREATE TRIGGER trigger_enqueue_mcp_package_generation AFTER INSERT OR UPDATE ON public.content FOR EACH ROW WHEN (((new.category = 'mcp'::public.content_category) AND (new.slug IS NOT NULL) AND (new.slug <> ''::text))) EXECUTE FUNCTION public.enqueue_mcp_package_generation();

CREATE TRIGGER trigger_generate_content_seo_fields BEFORE INSERT OR UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.generate_content_seo_fields_trigger();

CREATE TRIGGER trigger_update_content_popularity_score BEFORE INSERT OR UPDATE OF view_count, bookmark_count, review_count, created_at ON public.content FOR EACH ROW EXECUTE FUNCTION public.update_content_popularity_score();

CREATE TRIGGER content_embeddings_updated_at BEFORE UPDATE ON public.content_embeddings FOR EACH ROW EXECUTE FUNCTION public.update_content_embeddings_updated_at();

CREATE TRIGGER update_content_generation_tracking_updated_at BEFORE UPDATE ON public.content_generation_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER submission_discord_notification_insert AFTER INSERT ON public.content_submissions FOR EACH ROW EXECUTE FUNCTION public.notify_submission_discord();

CREATE TRIGGER submission_discord_notification_update AFTER UPDATE ON public.content_submissions FOR EACH ROW EXECUTE FUNCTION public.notify_submission_discord();

CREATE TRIGGER update_content_submissions_updated_at BEFORE UPDATE ON public.content_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_content_templates_updated_at BEFORE UPDATE ON public.content_templates FOR EACH ROW EXECUTE FUNCTION public.update_content_templates_updated_at();

CREATE TRIGGER update_email_blocklist_updated_at BEFORE UPDATE ON public.email_blocklist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_engagement_summary_updated_at BEFORE UPDATE ON public.email_engagement_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sequence_schedule_updated_at BEFORE UPDATE ON public.email_sequence_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION public.update_email_sequences_updated_at();

CREATE TRIGGER trigger_update_user_follow_counts AFTER INSERT OR DELETE ON public.followers FOR EACH ROW EXECUTE FUNCTION public.update_user_follow_counts();

CREATE TRIGGER update_followers_updated_at BEFORE UPDATE ON public.followers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_field_configs_updated_at BEFORE UPDATE ON public.form_field_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_job_runs_updated_at BEFORE UPDATE ON public.job_runs FOR EACH ROW EXECUTE FUNCTION public.update_job_runs_updated_at();

CREATE TRIGGER after_job_insert AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_new_job();

CREATE TRIGGER before_job_status_update BEFORE UPDATE ON public.jobs FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.notify_job_status_change();

CREATE TRIGGER generate_job_slug BEFORE INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.generate_job_slug_from_title();

CREATE TRIGGER job_discord_notification_insert AFTER INSERT ON public.jobs FOR EACH ROW WHEN (((new.status <> 'draft'::public.job_status) AND (NOT new.is_placeholder))) EXECUTE FUNCTION public.notify_job_discord();

CREATE TRIGGER job_discord_notification_update AFTER UPDATE ON public.jobs FOR EACH ROW WHEN (((old.status IS DISTINCT FROM new.status) OR (old.tier IS DISTINCT FROM new.tier) OR (old.title IS DISTINCT FROM new.title) OR (old.company IS DISTINCT FROM new.company) OR (old.description IS DISTINCT FROM new.description) OR (old.location IS DISTINCT FROM new.location) OR (old.salary IS DISTINCT FROM new.salary) OR (old.remote IS DISTINCT FROM new.remote) OR (old.type IS DISTINCT FROM new.type) OR (old.workplace IS DISTINCT FROM new.workplace) OR (old.experience IS DISTINCT FROM new.experience) OR (old.category IS DISTINCT FROM new.category))) EXECUTE FUNCTION public.notify_job_discord();

CREATE TRIGGER jobs_mv_refresh_trigger AFTER INSERT OR DELETE OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_mv_unified_search();

CREATE TRIGGER update_job_json_ld BEFORE INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trigger_regenerate_job_json_ld();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_refresh_metadata_templates_cache AFTER INSERT OR DELETE OR UPDATE ON public.metadata_templates FOR EACH ROW EXECUTE FUNCTION public.refresh_metadata_templates_cache_on_change();

CREATE TRIGGER update_metadata_templates_updated_at BEFORE UPDATE ON public.metadata_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER newsletter_rate_limit BEFORE INSERT ON public.newsletter_subscriptions FOR EACH ROW EXECUTE FUNCTION public.check_newsletter_rate_limit();

CREATE TRIGGER newsletter_updated_at_trigger BEFORE UPDATE ON public.newsletter_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_newsletter_updated_at();

CREATE TRIGGER update_notification_dismissals_updated_at BEFORE UPDATE ON public.notification_dismissals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_payment_plan_catalog_updated_at BEFORE UPDATE ON public.payment_plan_catalog FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_options_updated_at BEFORE UPDATE ON public.quiz_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_helpful_count_on_delete AFTER DELETE ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

CREATE TRIGGER trigger_update_helpful_count_on_insert AFTER INSERT ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

CREATE TRIGGER update_review_helpful_votes_updated_at BEFORE UPDATE ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_content_review_stats AFTER INSERT OR DELETE OR UPDATE ON public.review_ratings FOR EACH ROW EXECUTE FUNCTION public.update_content_review_stats();

CREATE TRIGGER update_content_aggregate_rating AFTER INSERT OR DELETE OR UPDATE ON public.review_ratings FOR EACH ROW EXECUTE FUNCTION public.trigger_update_aggregate_rating_debounced();

CREATE TRIGGER update_review_ratings_updated_at BEFORE UPDATE ON public.review_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_script_cache_updated_at BEFORE UPDATE ON public.script_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsored_content_updated_at BEFORE UPDATE ON public.sponsored_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_static_route_json_ld BEFORE INSERT OR UPDATE OF path, title, description, seo_title, seo_description, is_active ON public.static_routes FOR EACH ROW EXECUTE FUNCTION public.update_static_route_json_ld();

CREATE TRIGGER update_static_routes_updated_at BEFORE UPDATE ON public.static_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_structured_data_config_updated_at BEFORE UPDATE ON public.structured_data_config FOR EACH ROW EXECUTE FUNCTION public.update_structured_data_config_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tier_display_config_updated_at BEFORE UPDATE ON public.tier_display_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER generate_user_collections_slug BEFORE INSERT OR UPDATE ON public.user_collections FOR EACH ROW EXECUTE FUNCTION public.generate_collection_slug();

CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON public.user_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_user_submission_count AFTER INSERT OR DELETE ON public.user_content FOR EACH ROW EXECUTE FUNCTION public.update_user_submission_count();

CREATE TRIGGER update_user_content_updated_at BEFORE UPDATE ON public.user_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER generate_user_mcp_slug BEFORE INSERT ON public.user_mcps FOR EACH ROW EXECUTE FUNCTION public.generate_slug_from_name();

CREATE TRIGGER update_user_mcps_updated_at BEFORE UPDATE ON public.user_mcps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_similarities_updated_at BEFORE UPDATE ON public.user_similarities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER generate_users_slug BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.generate_user_slug();

CREATE TRIGGER trigger_user_json_ld BEFORE INSERT OR UPDATE OF slug, name, display_name, bio, website, social_x_link, image, work, follower_count, submission_count, profile_public ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_user_json_ld();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER users_mv_refresh_trigger AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_mv_unified_search();

CREATE TRIGGER enqueue_discord_error_notification AFTER INSERT ON public.webhook_events FOR EACH ROW WHEN ((new.error IS NOT NULL)) EXECUTE FUNCTION public.enqueue_discord_error_notification();

CREATE TRIGGER trigger_process_webhook BEFORE INSERT ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.process_webhook_event();

CREATE TRIGGER trigger_update_email_engagement AFTER INSERT ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.update_email_engagement();

CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated users can upload company logos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'company-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Authenticated users can upload skills"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'skills'::text));



  create policy "Public read access for company logos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'company-logos'::text));



  create policy "Public read access for mcpb packages"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'mcpb-packages'::text));



  create policy "Public read access for skills"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'skills'::text));



  create policy "Users can delete their own company logos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'company-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete their own skills"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'skills'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own company logos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'company-logos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own skills"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'skills'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'skills'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



