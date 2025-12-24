/**
 * Tests for OAuth Metadata Route
 */

import { describe, it, expect } from '@jest/globals';
import { handleOAuthMetadata } from '@heyclaude/mcp-server/routes/oauth-metadata';
import { createMockEnv } from '../fixtures/test-utils.js';

describe('OAuth Metadata Route', () => {
  it('should handle oauth-authorization-server metadata', async () => {
    const env = createMockEnv({
      SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      MCP_SERVER_URL: 'https://mcp.example.com',
    });

    const request = new Request('https://example.com/.well-known/oauth-authorization-server');
    const response = await handleOAuthMetadata(request, env, '/.well-known/oauth-authorization-server');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.issuer).toBeDefined();
    expect(data.authorization_endpoint).toBeDefined();
    expect(data.token_endpoint).toBeDefined();
    expect(data.jwks_uri).toBeDefined();
    expect(data.response_types_supported).toContain('code');
    expect(data.grant_types_supported).toContain('authorization_code');
    expect(data.code_challenge_methods_supported).toContain('S256');
    expect(data.resource_parameter_supported).toBe(true);
    expect(data.mcp_version).toBe('2025-11-25');
  });

  it('should handle oauth-protected-resource metadata', async () => {
    const env = createMockEnv({
      SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      MCP_SERVER_URL: 'https://mcp.example.com',
    });

    const request = new Request('https://example.com/.well-known/oauth-protected-resource');
    const response = await handleOAuthMetadata(request, env, '/.well-known/oauth-protected-resource');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resource).toBeDefined();
    expect(data.authorization_servers).toBeDefined();
    expect(Array.isArray(data.authorization_servers)).toBe(true);
    expect(data.scopes_supported).toContain('mcp:tools');
    expect(data.scopes_supported).toContain('mcp:resources');
    expect(data.bearer_methods_supported).toContain('header');
    expect(data.resource_parameter_supported).toBe(true);
    expect(data.mcp_version).toBe('2025-11-25');
  });

  it('should return 404 for unknown paths', async () => {
    const env = createMockEnv();
    const request = new Request('https://example.com/.well-known/unknown');
    const response = await handleOAuthMetadata(request, env, '/.well-known/unknown');

    expect(response.status).toBe(404);
  });

  it('should set correct CORS headers', async () => {
    const env = createMockEnv({
      SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    });

    const request = new Request('https://example.com/.well-known/oauth-authorization-server');
    const response = await handleOAuthMetadata(request, env, '/.well-known/oauth-authorization-server');

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
  });
});

