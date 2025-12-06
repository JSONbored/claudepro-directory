/**
 * @heyclaude/edge-runtime - Deno/Supabase Edge Function Runtime
 *
 * This package provides utilities specific to Supabase Edge Functions
 * running on Deno. For general-purpose utilities, see @heyclaude/shared-runtime.
 *
 * ## Active Edge Functions
 * - mcp-directory: MCP protocol implementation, OAuth2
 * - public-api: OG images, transforms, embedding/image queues, content generation
 *
 * ## What Belongs Here
 * - Deno-specific utilities and type definitions
 * - Supabase Edge Function middleware and routing
 * - PGMQ client for queue operations
 * - Storage utilities (upload, proxy)
 *
 * ## What Does NOT Belong Here (Migrated to web-runtime/shared-runtime)
 * - Discord notifications → @heyclaude/web-runtime/inngest
 * - Email templates → @heyclaude/web-runtime/email
 * - Webhook processing → @heyclaude/web-runtime/flux
 * - Analytics pulse → @heyclaude/web-runtime/inngest
 */

// Core App & Middleware
export * from './middleware/index.ts';
export * from './app.ts';

// Utilities
export * from './utils/context.ts';
export * from './utils/router.ts';
export * from './utils/http.ts';
export * from './utils/parse-json-body.ts';
export * from './utils/rate-limit-middleware.ts';
export * from './utils/logger-helpers.ts';
export * from './utils/database-errors.ts';
export * from './utils/auth.ts';

// Clients
export * from './clients/supabase.ts';

// Storage
export * from './utils/storage/client.ts';
export * from './utils/storage/upload.ts';
export * from './utils/storage/proxy.ts';

// PGMQ (Queue Operations)
export * from './utils/pgmq-client.ts';

// Integrations (only http-client remains)
export * from './utils/integrations/http-client.ts';

// Config
export * from './config/env.ts';
export * from './config/email-config.ts';
