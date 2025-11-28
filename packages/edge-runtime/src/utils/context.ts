import type { HttpMethod, RouterContext } from '@heyclaude/edge-runtime/utils/router.ts';
import { validatePathSegments, validateQueryString } from '@heyclaude/shared-runtime';

export interface StandardContext extends RouterContext {
  pathname: string;
  segments: string[];
  searchParams: URLSearchParams;
}

export interface ContextOptions {
  prefix?: string; // e.g. '/functions/v1/data-api' or just '/data-api'
}

function isValidHttpMethod(value: string): value is HttpMethod {
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  for (const validMethod of validMethods) {
    if (value === validMethod) {
      return true;
    }
  }
  return false;
}

export function buildStandardContext(request: Request, prefixes: string[] = []): StandardContext {
  const url = new URL(request.url);
  const methodUpper = request.method.toUpperCase();
  const originalMethod = isValidHttpMethod(methodUpper) ? methodUpper : 'GET';
  const normalizedMethod = originalMethod === 'HEAD' ? 'GET' : originalMethod;

  let pathname = url.pathname;

  // Strip known prefixes
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length);
      break; // Only strip one matching prefix
    }
  }

  pathname = pathname || '/';
  const segments = pathname === '/' ? [] : pathname.replace(/^\/+/, '').split('/').filter(Boolean);

  // Input validation
  const queryValidation = validateQueryString(url);
  if (!queryValidation.valid) {
    throw new Error(queryValidation.error);
  }

  const pathValidation = validatePathSegments(segments);
  if (!pathValidation.valid) {
    throw new Error(pathValidation.error);
  }

  return {
    request,
    url,
    pathname,
    segments,
    searchParams: url.searchParams,
    method: normalizedMethod,
    originalMethod,
  };
}
