import { errorResponse, methodNotAllowedResponse, publicCorsHeaders } from '@heyclaude/edge-runtime/utils/http.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface RouterContext {
  request: Request;
  url: URL;
  method: HttpMethod;
  originalMethod: HttpMethod;
  defaultCors?: Record<string, string>;
}

export interface RouteDefinition<C extends RouterContext> {
  name: string;
  match: (context: C) => boolean;
  handler: (context: C) => Promise<Response>;
  methods?: readonly HttpMethod[];
  cors?: Record<string, string>;
  errorContext?: string;
}

export interface RouterOptions<C extends RouterContext> {
  buildContext: (request: Request) => Promise<C> | C;
  routes: RouteDefinition<C>[];
  defaultRoute?: RouteDefinition<C>;
  defaultCors?: Record<string, string>;
  onNoMatch?: (context: C) => Promise<Response> | Response;
}

const DEFAULT_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

export function createRouter<C extends RouterContext>(options: RouterOptions<C>) {
  return async (request: Request): Promise<Response> => {
    const context = await options.buildContext(request);
    context.defaultCors = options.defaultCors ?? publicCorsHeaders;
    const route =
      options.routes.find((definition) => definition.match(context)) ?? options.defaultRoute;

    if (!route) {
      if (options.onNoMatch) {
        return options.onNoMatch(context);
      }
      const defaultCors: Record<string, string> = options.defaultCors ?? publicCorsHeaders;
      return await errorResponse(new Error('Not Found'), 'router:not_found', defaultCors);
    }

    const allowedMethods = route.methods?.length ? route.methods : DEFAULT_METHODS;
    const isHead = context.originalMethod === 'HEAD';
    const normalizedMethod =
      isHead && !allowedMethods.includes('HEAD') && allowedMethods.includes('GET')
        ? 'GET'
        : context.originalMethod;

    if (!allowedMethods.includes(normalizedMethod)) {
      const corsHeaders: Record<string, string> =
        route.cors ?? options.defaultCors ?? publicCorsHeaders;
      return methodNotAllowedResponse(normalizedMethod, corsHeaders);
    }

    if (context.originalMethod === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(route.cors ?? options.defaultCors),
      });
    }

    // Update method seen by downstream handlers (e.g., treat HEAD as GET when needed)
    if (context.method !== normalizedMethod) {
      context.method = normalizedMethod;
    }

    const response = await route.handler(context);
    const finalResponse = applyCors(response, route.cors ?? options.defaultCors);

    if (isHead) {
      return new Response(null, {
        status: finalResponse.status,
        headers: finalResponse.headers,
      });
    }

    return finalResponse;
  };
}

function applyCors(response: Response, cors?: Record<string, string>): Response {
  if (!cors) {
    return response;
  }

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function buildCorsHeaders(cors?: Record<string, string>): Headers {
  const headers = new Headers(cors ?? publicCorsHeaders);
  if (!headers.has('Vary')) {
    headers.set('Vary', 'Origin');
  }
  return headers;
}
