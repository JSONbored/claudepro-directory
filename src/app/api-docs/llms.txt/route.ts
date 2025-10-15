/**
 * API Documentation llms.txt Route
 *
 * Provides machine-readable API documentation overview for AI consumption.
 * Exposes base URL, authentication, rate limits, endpoints, and usage examples.
 *
 * @route GET /api-docs/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import type { NextRequest } from 'next/server';
import { REVALIDATE_LLMS_TXT } from '@/src/lib/config/rate-limits.config';
import { APP_CONFIG } from '@/src/lib/constants';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Runtime configuration
 * Use Node.js runtime for better performance with text generation
 */
export const runtime = 'nodejs';

/**
 * ISR revalidation
 * API structure changes infrequently - revalidate every hour
 */
export const revalidate = REVALIDATE_LLMS_TXT;

/**
 * Handle GET request for API documentation llms.txt
 *
 * @param request - Next.js request object
 * @returns Plain text response with API documentation
 *
 * @remarks
 * This route generates complete API documentation in plain text format
 * following the llms.txt specification for AI-friendly consumption.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    requestLogger.info('API docs llms.txt generation started');
    const content = `# Claude Pro Directory REST API Documentation

> AI-optimized API documentation for the Claude Pro Directory platform
> Last updated: ${new Date().toISOString().split('T')[0]}

## Overview

A comprehensive REST API for accessing Claude configurations including agents, MCP servers, rules, commands, hooks, and statuslines. Browse, search, and discover community-contributed configurations with full TypeScript type safety.

## Base URL

${APP_CONFIG.url}/api

## Environments

- Production: ${APP_CONFIG.url}/api
- API Base Path: /api

## Authentication

No authentication required for public endpoints. All endpoints are publicly accessible with rate limiting applied.

## Rate Limiting

Rate limits enforced using Upstash Redis and Arcjet protection:

- Content endpoints: 100 requests per minute per IP
- Search endpoints: 50 requests per minute per IP
- Analytics endpoints: 30 requests per minute per IP

## Response Format

All responses returned in JSON format:

SUCCESS RESPONSE:
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-05T00:00:00.000Z"
}

ERROR RESPONSE:
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}

## HTTP Status Codes

- 200 OK: Successful request
- 400 Bad Request: Invalid parameters
- 404 Not Found: Resource does not exist
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server-side error

## Available Endpoints

### Content Discovery

GET /api/agents - List all AI agents
GET /api/agents/[slug] - Get specific agent by slug

GET /api/mcp - List all MCP servers
GET /api/mcp/[slug] - Get specific MCP server by slug

GET /api/commands - List all commands
GET /api/commands/[slug] - Get specific command by slug

GET /api/rules - List all rules
GET /api/rules/[slug] - Get specific rule by slug

GET /api/hooks - List all automation hooks
GET /api/hooks/[slug] - Get specific hook by slug

GET /api/statuslines - List all statuslines
GET /api/statuslines/[slug] - Get specific statusline by slug

GET /api/collections - List all collections
GET /api/collections/[slug] - Get specific collection by slug

### Search & Discovery

GET /api/search?q=[query] - Search across all content
Parameters:
  - q: Search query (required)
  - category: Filter by category (optional)
  - limit: Results limit (optional, default: 20)

### Analytics

GET /api/trending - Get trending configurations
Parameters:
  - category: Filter by category (optional)
  - limit: Results limit (optional, default: 10)
  - timeframe: Time window (optional: 24h, 7d, 30d)

## Quick Start Examples

### Fetch All Agents (TypeScript)
const response = await fetch('${APP_CONFIG.url}/api/agents');
const data = await response.json();
console.log(data.items); // Array of agents

### Search Content
const response = await fetch('${APP_CONFIG.url}/api/search?q=database&category=mcp');
const data = await response.json();
console.log(data.results);

### Get Trending Items
const response = await fetch('${APP_CONFIG.url}/api/trending?timeframe=7d&limit=10');
const data = await response.json();
console.log(data.trending);

## Features

- Content Discovery: Browse and search Claude configurations by category
- MCP Servers: Discover and integrate Model Context Protocol servers
- Rules & Commands: Find expert-crafted rules and automation commands
- Trending Analytics: Track popular and trending configurations
- Performance Optimized: Redis-backed caching with ISR revalidation
- Type-Safe: Full TypeScript support with Zod validation
- CORS Enabled: Cross-origin requests supported
- OpenAPI 3.1.0: Machine-readable specification available

## OpenAPI Specification

Full OpenAPI 3.1.0 specification available at:
${APP_CONFIG.url}/openapi.json

RFC 9727 API catalog available at:
${APP_CONFIG.url}/.well-known/api-catalog

## Technical Stack

- Framework: Next.js 15.5.2 (App Router, React 19)
- Runtime: Edge Runtime (Vercel Edge Functions)
- Database: Upstash Redis (caching + analytics)
- Validation: Zod schemas with TypeScript
- Rate Limiting: Arcjet + Upstash
- Revalidation: ISR (60-600s depending on endpoint)

## Support

- Documentation: ${APP_CONFIG.url}/api-docs
- GitHub Issues: https://github.com/shadowbook-pro/claudepro-directory/issues
- Community: ${APP_CONFIG.url}/community

---

Generated by Claude Pro Directory
${APP_CONFIG.url}
`;

    requestLogger.info('API docs llms.txt generated successfully');

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    requestLogger.error('Failed to generate API docs llms.txt', errorInstance);
    return handleApiError(errorInstance);
  }
}
