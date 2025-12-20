/**
 * Axiom OpenTelemetry Integration for Cloudflare Workers
 *
 * Configures OpenTelemetry tracing with Axiom exporter for distributed tracing
 * and observability. Uses @microlabs/otel-cf-workers for Cloudflare Workers support.
 *
 * Axiom secrets are fetched from Infisical using the same pattern as other secrets
 * (Supabase, Inngest). Uses recursive search to find secrets in subdirectories.
 */

import { instrument } from '@microlabs/otel-cf-workers';
import type { ResolveConfigFn } from '@microlabs/otel-cf-workers';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';

/**
 * Axiom configuration from Infisical
 */
interface AxiomConfig {
  apiToken: string;
  dataset: string;
  url?: string;
}

/**
 * Get Axiom configuration from Infisical
 *
 * Fetches Axiom secrets from Infisical using the same pattern as other secrets.
 * Uses recursive search to find secrets in subdirectories.
 *
 * @param env - Cloudflare Workers env object
 * @returns Axiom configuration or undefined if not configured
 */
async function getAxiomConfig(env: ExtendedEnv): Promise<AxiomConfig | undefined> {
  // Import Infisical utilities (dynamic import to avoid circular dependencies)
  // Using main export since specific path export may not be available until package is built
  const { getInfisicalSecret, getInfisicalEnvironment } = await import('@heyclaude/cloudflare-runtime');
  
  // Determine environment (dev, staging, prod) from worker config
  const infisicalEnv = getInfisicalEnvironment(env);

  // Fetch Axiom secrets from Infisical (async, recursive search)
  // Axiom secrets are optional - if not configured, observability will be disabled
  const [apiToken, dataset, url] = await Promise.all([
    getInfisicalSecret(env, 'AXIOM_API_TOKEN', infisicalEnv),
    getInfisicalSecret(env, 'AXIOM_DATASET', infisicalEnv),
    getInfisicalSecret(env, 'AXIOM_URL', infisicalEnv), // Optional, defaults to https://api.axiom.co
  ]);

  // If required secrets are missing, return undefined (observability disabled)
  if (!apiToken || !dataset) {
    return undefined;
  }

  return {
    apiToken,
    dataset,
    url: url || 'https://api.axiom.co', // Default Axiom URL
  };
}

/**
 * Resolve OpenTelemetry configuration for Cloudflare Workers
 *
 * This function is called by @microlabs/otel-cf-workers to configure
 * the OpenTelemetry SDK with Axiom exporter.
 *
 * NOTE: This function is async because it fetches secrets from Infisical.
 * The @microlabs/otel-cf-workers library supports async ResolveConfigFn.
 *
 * @param env - Cloudflare Workers env object
 * @returns OpenTelemetry configuration (Promise)
 */
export const resolveAxiomConfig = (async (env: ExtendedEnv) => {
  const axiomConfig = await getAxiomConfig(env);

  // If Axiom is not configured, return minimal config (no exporter)
  // Observability will be disabled but Worker will still function
  if (!axiomConfig) {
    return {
      serviceName: 'heyclaude-mcp',
      serviceVersion: '1.1.0',
    } as unknown as ReturnType<ResolveConfigFn>;
  }

  // Configure Axiom OTLP exporter
  // Axiom accepts OTLP over HTTP, so we use the standard OTLP HTTP exporter
  const exporter = new OTLPTraceExporter({
    url: `${axiomConfig.url}/api/v1/traces`,
    headers: {
      Authorization: `Bearer ${axiomConfig.apiToken}`,
      'X-Axiom-Dataset': axiomConfig.dataset,
    },
  });

  return {
    serviceName: 'heyclaude-mcp',
    serviceVersion: '1.1.0',
    traceExporter: exporter,
    instrumentations: [],
  } as unknown as ReturnType<ResolveConfigFn>;
}) as unknown as ResolveConfigFn;

/**
 * Instrument the Worker fetch handler with OpenTelemetry
 *
 * Wraps the fetch handler to automatically trace requests and export to Axiom.
 *
 * @param handler - The Worker fetch handler
 * @returns Instrumented handler with OpenTelemetry tracing
 */
export function instrumentHandler(
  handler: ExportedHandler<ExtendedEnv>
): ExportedHandler<ExtendedEnv> {
  return instrument(handler, resolveAxiomConfig);
}
