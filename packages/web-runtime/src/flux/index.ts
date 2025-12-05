/**
 * Flux Module
 *
 * Centralized routing for all flux operations (email, Discord, notifications, webhooks, etc.)
 * Replaces the flux-station Supabase Edge Functions with Vercel API routes.
 *
 * @see apps/web/src/app/api/flux/[...path]/route.ts for the catch-all route
 */

export { routeFluxRequest, handleOptions } from './router';
export type { PgmqMessage } from '../supabase/pgmq-client';
