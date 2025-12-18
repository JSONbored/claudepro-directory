-- Migration: Fix MCP Server URL in Custom Access Token Hook
-- Version: 20251218130000
-- Applied via: Supabase MCP (feature branch)
-- Date: 2025-12-18
--
-- Description: Updates heyclaude_custom_access_token_hook to use the correct MCP server URL
-- that matches the edge function default (https://mcp.claudepro.directory/mcp).
-- This ensures the hook recognizes the resource parameter from OAuth 2.1 requests.
--
-- Related Issues: OAuth 2.1 setup - URL mismatch between hook and edge function
-- 
-- CRITICAL: This fixes the mismatch where:
-- - Hook was using: https://mcp.heyclau.de/mcp (hardcoded)
-- - Edge function uses: https://mcp.claudepro.directory/mcp (from env var or default)
-- These MUST match for OAuth 2.1 RFC 8707 resource parameter to work correctly.

CREATE OR REPLACE FUNCTION public.heyclaude_custom_access_token_hook(event jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  user_id uuid;
  user_metadata jsonb;
  custom_claims jsonb;
  resource_url text;
  current_aud jsonb;
  new_aud jsonb;
  mcp_server_url text := 'https://mcp.claudepro.directory/mcp'; -- FIXED: Changed from 'https://mcp.heyclau.de/mcp' to match edge function
begin
  -- Extract user ID from event
  user_id := (event->>'user_id')::uuid;
  
  -- Get user metadata from auth.users
  select raw_user_meta_data into user_metadata
  from auth.users
  where id = user_id;
  
  -- Build custom claims object (general purpose)
  -- Add any custom claims you want in the JWT here
  custom_claims := jsonb_build_object(
    -- FIXED: Changed from 'user' to 'authenticated' to match Supabase standard roles
    -- Supabase PostgREST expects 'authenticated' role for authenticated users
    -- The 'user' role doesn't exist in Postgres, causing "role 'user' does not exist" errors
    'role', coalesce(user_metadata->>'role', 'authenticated'),
    -- Example: Add user slug if present
    'slug', coalesce(user_metadata->>'slug', null),
    -- Example: Add account creation date
    'created_at', (select created_at::text from auth.users where id = user_id)
  );
  
  -- ========================================================================
  -- MCP OAuth 2.1 Resource Parameter Support (RFC 8707)
  -- ========================================================================
  -- Extract resource parameter from OAuth request
  -- The resource parameter may be in different locations depending on how
  -- Supabase passes it through the event
  resource_url := coalesce(
    event->'request'->>'resource',
    event->'request'->'query_params'->>'resource',
    event->'request'->'body'->>'resource',
    event->>'resource'
  );
  
  -- If resource parameter matches our MCP server URL, add it to audience
  if resource_url is not null and resource_url = mcp_server_url then
    -- Get current audience from claims
    current_aud := event->'claims'->'aud';
    
    -- Handle different audience formats
    if current_aud is null then
      -- No existing audience, create new with resource URL
      new_aud := to_jsonb(mcp_server_url);
    elsif jsonb_typeof(current_aud) = 'string' then
      -- Existing audience is a string
      if current_aud::text != mcp_server_url then
        -- Convert to array and add resource URL
        new_aud := jsonb_build_array(current_aud, mcp_server_url);
      else
        -- Already has resource URL, keep as is
        new_aud := current_aud;
      end if;
    elsif jsonb_typeof(current_aud) = 'array' then
      -- Existing audience is an array
      if not (current_aud ? mcp_server_url) then
        -- Add resource URL if not already present
        new_aud := current_aud || to_jsonb(mcp_server_url);
      else
        -- Already has resource URL, keep as is
        new_aud := current_aud;
      end if;
    else
      -- Fallback: create new with resource URL
      new_aud := to_jsonb(mcp_server_url);
    end if;
    
    -- Update claims with new audience
    event := jsonb_set(
      event,
      '{claims,aud}',
      new_aud
    );
  end if;
  
  -- Merge custom claims into event (general purpose)
  event := jsonb_set(
    event,
    '{claims}',
    coalesce(event->'claims', '{}'::jsonb) || custom_claims
  );
  
  return event;
end;
$$;

-- Ensure permissions are correct (should already be set, but ensuring they're in place)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.heyclaude_custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.heyclaude_custom_access_token_hook(jsonb) FROM authenticated, anon, public;

COMMENT ON FUNCTION public.heyclaude_custom_access_token_hook(jsonb) IS 'HeyClaude custom access token hook: Adds custom claims (role, slug, created_at) and includes MCP server URL (https://mcp.claudepro.directory/mcp) in audience when resource parameter is present (OAuth 2.1 RFC 8707)';
