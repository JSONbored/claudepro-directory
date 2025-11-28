import { createRouter, type RouterContext, type RouterOptions } from '@heyclaude/edge-runtime/utils/router.ts';
import { jsonResponse } from '@heyclaude/edge-runtime/utils/http.ts';

export interface EdgeAppOptions<T extends RouterContext> extends RouterOptions<T> {
  // No extra options needed yet, just re-exporting router options
}

export function createEdgeApp<T extends RouterContext>(options: EdgeAppOptions<T>) {
  const router = createRouter(options);

  // Return the serve handler directly
  return async (request: Request): Promise<Response> => {
    try {
      return await router(request);
    } catch (error) {
      // Handle validation errors from buildContext
      if (
        error instanceof Error &&
        (error.message.includes('too long') || error.message.includes('invalid'))
      ) {
        return jsonResponse(
          {
            error: 'Bad Request',
            message: error.message,
          },
          400,
          options.defaultCors || {}
        );
      }

      // Re-throw to let Deno runtime handle 500s or outer catch blocks
      throw error;
    }
  };
}

/**
 * Convenience wrapper that calls Deno.serve
 */
export function serveEdgeApp<T extends RouterContext>(options: EdgeAppOptions<T>) {
  const handler = createEdgeApp(options);
  Deno.serve(handler);
}
