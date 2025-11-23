import type { Middleware } from './types.ts';
import type { StandardContext } from '../utils/context.ts';
import { createDataApiContext, logInfo, logError, errorToString } from '@heyclaude/shared-runtime';

export function analytics(routeName: string): Middleware<StandardContext> {
  return async (ctx, next) => {
    const startedAt = performance.now();
    
    // Extract resource from path if available (convention: /route/:resource)
    // This logic mimics existing respondWithAnalytics but is more generic
    const resource = ctx.segments.length > 1 ? ctx.segments[1] : undefined;

    const logContext = createDataApiContext(routeName, {
      path: ctx.pathname,
      method: ctx.method,
      ...(resource ? { resource } : {}),
    });

    const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
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
        logError('Route error', { ...logContext, ...logData }, error);
      }
    };

    try {
      const response = await next();
      logEvent(response.status, 'success');
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
      
      logEvent(status, 'error', error);
      throw error;
    }
  };
}
