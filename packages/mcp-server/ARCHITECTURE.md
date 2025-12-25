# MCP Server Architecture: Supabase Auth + Cloudflare Workers

This document explains the architecture of our OAuth 2.1 MCP server implementation.

## Overview

Our MCP server uses a **hybrid architecture** combining:

* **Supabase Auth** as the OAuth 2.1 Authorization Server
* **Cloudflare Workers** as the MCP server runtime and OAuth proxy

## Architecture Diagram

```
┌─────────────────┐
│  MCP Client     │
│  (Claude, etc.) │
└────────┬────────┘
         │
         │ 1. OAuth Authorization Request
         │    GET /oauth/authorize?client_id=...&code_challenge=...
         ▼
┌─────────────────────────────────────┐
│  Cloudflare Workers                 │
│  (apps/workers/heyclaude-mcp)       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ OAuth Proxy Layer             │ │
│  │ - /oauth/authorize            │ │
│  │ - /oauth/token                │ │
│  │ - /oauth/revoke               │ │
│  │ - /oauth/introspect           │ │
│  │ - /oauth/register             │ │
│  │ - /.well-known/oauth-*        │ │
│  └───────────────┬───────────────┘ │
│                  │                 │
│                  │ 2. Proxy Request│
│                  │    (adds resource param)│
│                  ▼                 │
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│  (OAuth 2.1 Authorization Server)  │
│                                     │
│  - Handles user authentication     │
│  - Issues authorization codes       │
│  - Exchanges codes for tokens       │
│  - Manages client registration     │
│  - Validates PKCE                   │
│  - Issues JWT tokens                │
└─────────────────┬───────────────────┘
                  │
                  │ 3. Redirect to Consent Page
                  │    (apps/web/oauth/consent)
                  ▼
┌─────────────────────────────────────┐
│  Next.js Web App                    │
│  (apps/web)                         │
│                                     │
│  - OAuth consent UI                 │
│  - User approval/denial             │
│  - Redirects back to Supabase        │
└─────────────────────────────────────┘
                  │
                  │ 4. Authorization Code
                  │    (redirected to client)
                  ▼
┌─────────────────┐
│  MCP Client     │
│  (receives code)│
└─────────────────┘
```

## Why This Architecture?

### Supabase Auth as Authorization Server

**Benefits:**

* ✅ **OAuth 2.1 Compliance**: Supabase Auth implements full OAuth 2.1 Server specification
* ✅ **PKCE Support**: Built-in PKCE validation (required for OAuth 2.1)
* ✅ **JWT Tokens**: Issues standard JWT access tokens
* ✅ **Client Management**: Built-in OAuth client registration and management
* ✅ **User Management**: Existing user authentication and session management
* ✅ **Security**: Industry-standard security practices and token handling

**What Supabase Handles:**

* User authentication (email/password, OAuth providers)
* Authorization code generation and validation
* Token exchange (code → access token + refresh token)
* PKCE validation (code\_challenge, code\_verifier)
* Client registration (if DCR enabled)
* Token revocation and introspection (if enabled)
* JWT signing and validation

### Cloudflare Workers as MCP Server

**Benefits:**

* ✅ **Edge Deployment**: Global edge network for low latency
* ✅ **Serverless**: No server management, auto-scaling
* ✅ **Cost-Effective**: Pay-per-request pricing
* ✅ **Fast Cold Starts**: Sub-10ms cold start times
* ✅ **MCP Protocol**: Handles MCP protocol requests (`/mcp` endpoint)

**What Cloudflare Workers Handles:**

* MCP protocol endpoint (`/mcp`) - requires authentication
* OAuth proxy layer (adds `resource` parameter for MCP compliance)
* OAuth metadata endpoints (`.well-known/oauth-*`)
* Rate limiting and security
* Request routing and CORS

## OAuth Flow Details

### 1. Authorization Request

**Client → Cloudflare Workers:**

```
GET /oauth/authorize?
  client_id=xxx&
  response_type=code&
  redirect_uri=https://client.com/callback&
  code_challenge=xxx&
  code_challenge_method=S256&
  scope=openid email mcp:tools
```

**Cloudflare Workers → Supabase Auth:**

* Validates required parameters (PKCE, response\_type, etc.)
* Adds `resource` parameter (RFC 8707) for MCP audience
* Redirects to Supabase Auth with all parameters

**Supabase Auth → Next.js Web App:**

* Redirects to `/oauth/consent?authorization_id=xxx`
* User sees consent page
* User approves/denies

**Next.js Web App → Supabase Auth:**

* Calls `approveAuthorization()` or `denyAuthorization()`
* Supabase generates authorization code

**Supabase Auth → Client:**

* Redirects to `redirect_uri` with `code=xxx&state=xxx`

### 2. Token Exchange

**Client → Cloudflare Workers:**

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=xxx&
redirect_uri=https://client.com/callback&
client_id=xxx&
code_verifier=xxx
```

**Cloudflare Workers → Supabase Auth:**

* Forwards request to Supabase Auth `/oauth/token`
* Supabase validates code, PKCE, and issues tokens

**Supabase Auth → Cloudflare Workers → Client:**

* Returns access token, refresh token, and metadata

### 3. MCP Protocol Requests

**Client → Cloudflare Workers:**

```
POST /mcp
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Cloudflare Workers:**

* Validates JWT token (checks audience, expiration, signature)
* Extracts user information from token
* Routes to MCP server handler
* Returns MCP protocol response

## OAuth Proxy Layer

The Cloudflare Workers act as a **thin proxy layer** that:

1. **Adds Resource Parameter (RFC 8707)**
   * Required for MCP spec compliance
   * Ensures tokens have correct audience claim
   * Added automatically to all authorization requests

2. **Validates OAuth Parameters**
   * PKCE validation (code\_challenge required, S256 only)
   * Response type validation (code only)
   * Redirect URI validation (http/https only)
   * Scope validation (defense in depth)

3. **Proxies to Supabase Auth**
   * All OAuth operations forward to Supabase
   * No token storage or validation in Workers
   * Pure proxy pattern for security

## Endpoints

### OAuth Endpoints (Proxied to Supabase)

* `GET /oauth/authorize` - Authorization request (adds resource param)
* `POST /oauth/token` - Token exchange
* `POST /oauth/revoke` - Token revocation (RFC 7009)
* `POST /oauth/introspect` - Token introspection (RFC 7662)
* `POST /oauth/register` - Dynamic client registration (RFC 7591)

### Metadata Endpoints (Served by Workers)

* `GET /.well-known/oauth-authorization-server` - Authorization server metadata
* `GET /.well-known/oauth-protected-resource` - Protected resource metadata

### MCP Protocol Endpoint

* `POST /mcp` - MCP protocol requests (requires authentication)

## DCR (Dynamic Client Registration)

**Question:** Do we need DCR in both Supabase and our codebase?

**Answer:**

* ✅ **Supabase**: Must have DCR enabled in OAuth 2.1 Server settings
* ✅ **Our Codebase**: Must proxy DCR requests to Supabase

**Why Both?**

1. **Supabase** handles the actual client registration (stores client credentials, validates metadata)
2. **Our Codebase** provides the `/oauth/register` endpoint that clients call
3. Our endpoint proxies requests to Supabase's DCR endpoint

**Setup:**

1. Enable OAuth 2.1 Server in Supabase dashboard
2. Enable Dynamic Client Registration in Supabase OAuth 2.1 Server settings
3. Our `/oauth/register` endpoint automatically proxies to Supabase

## Token Revocation & Introspection

**Question:** Do we need these endpoints?

**Answer:**

* ✅ **Recommended** for security and compliance
* ✅ **Optional** per OAuth 2.1 spec, but best practice

**Implementation:**

* Both endpoints proxy to Supabase Auth
* Supabase must have these features enabled in OAuth 2.1 Server settings
* Our endpoints provide the public-facing API that clients call

## Security Considerations

1. **No Token Storage**: Cloudflare Workers never store tokens
2. **JWT Validation**: Tokens validated on each MCP request
3. **PKCE Required**: All authorization requests require PKCE
4. **Resource Parameter**: Ensures tokens have correct audience
5. **Scope Validation**: Defense in depth (validated in proxy and Supabase)
6. **CORS**: Properly configured for OAuth flows

## Summary

* **Supabase Auth** = OAuth 2.1 Authorization Server (handles auth, tokens, clients)
* **Cloudflare Workers** = MCP Server + OAuth Proxy (adds resource param, serves MCP protocol)
* **Next.js Web App** = OAuth Consent UI (user approval/denial)
* **DCR** = Enabled in Supabase, proxied through our `/oauth/register` endpoint
* **Revocation/Introspection** = Proxied to Supabase, available through our endpoints

This architecture provides:

* ✅ Full OAuth 2.1 compliance
* ✅ MCP spec compliance (resource parameter)
* ✅ Security best practices
* ✅ Scalable, serverless deployment
* ✅ Industry-standard token handling
