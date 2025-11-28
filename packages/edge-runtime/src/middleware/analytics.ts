import type { Middleware } from '@heyclaude/edge-runtime/middleware/types.ts';
import type { StandardContext } from '@heyclaude/edge-runtime/utils/context.ts';
import { createDataApiContext, logInfo, logError, errorToString } from '@heyclaude/shared-runtime';

interface AnalyticsOptions {
  app?: string;
}

export function analytics(
  routeName: string,
  options?: AnalyticsOptions
): Middleware<StandardContext> {
  return async (ctx, next) => {
    const startedAt = performance.now();
    const appLabel = options?.app ?? 'data-api';
    
    // Extract resource from path if available (convention: /route/:resource)
    // This logic mimics existing respondWithAnalytics but is more generic
    const resource = ctx.segments.length > 1 ? ctx.segments[1] : undefined;

    const logContext = createDataApiContext(routeName, {
      path: ctx.pathname,
      method: ctx.method,
      ...(resource ? { resource } : {}),
      app: appLabel,
    });

    const logEvent = async (status: number, outcome: 'success' | 'error', error?: unknown) => {
      const durationMs = Math.round(performance.now() - startedAt);
      const logData: Record<string, unknown> = {
        route: routeName,
        path: ctx.pathname || '/',
        method: ctx.method,
        status,
        duration_ms: durationMs,
      };

      if (ctx.searchParams.toString()) {
        logData['query'] = ctx.searchParams.toString();
      }
      if (resource) {
        logData['resource'] = resource;
      }
      if (error) {
        logData['error'] = errorToString(error);
      }

      if (outcome === 'success') {
        logInfo('Route hit', { ...logContext, ...logData });
      } else {
        await logError('Route error', { ...logContext, ...logData }, error);
      }
    };

    try {
      const response = await next();
      await logEvent(response.status, 'success');
      return response;
    } catch (error) {
      // Attempt to get status from error object
      let status = 500;
      if (error instanceof Response) {
        status = error.status;
      } else if (typeof error === 'object' && error !== null && 'status' in error) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = (error as any).status;
        if (typeof s === 'number') status = s;
      }
      
      await logEvent(status, 'error', error);
      throw error;
    }
  };
}
