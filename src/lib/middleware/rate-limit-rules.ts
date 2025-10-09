/**
 * Rate Limit Rules Configuration
 * Centralized rate limiting rules for all API endpoints and routes
 *
 * Architecture:
 * - Type-safe configuration with Zod validation
 * - Endpoint classification system
 * - Pattern-based matching for dynamic routes
 * - Security-first approach with granular controls
 *
 * Rate Limit Tiers:
 * - Admin: 5 requests/hour (extremely restrictive)
 * - Heavy API: 50 requests/15min (moderate restrictions)
 * - Search: 100 requests/hour (search-specific)
 * - Submit: 10 requests/hour (form submissions)
 * - API: 1000 requests/hour (standard API access)
 * - LLMs.txt: 200 requests/hour (AI training data)
 *
 * @see src/middleware.ts - Middleware implementation
 * @see src/lib/rate-limiter.ts - Rate limiter instances
 */

import { z } from 'zod';
import type { RateLimiter } from '@/src/lib/rate-limiter';

// ============================================================================
// TYPE-SAFE SCHEMAS
// ============================================================================

/**
 * Endpoint type classification for rate limiting
 */
export const endpointTypeSchema = z.enum([
  'admin', // Administrative endpoints (extremely restrictive)
  'heavy_api', // Heavy data endpoints (moderate restrictions)
  'search', // Search endpoints (search-specific limits)
  'submit', // Form submission endpoints (restrictive)
  'api', // Standard API endpoints (generous)
  'static', // Static assets (no rate limiting)
]);

export type EndpointType = z.infer<typeof endpointTypeSchema>;

/**
 * Route pattern for matching endpoints
 */
export const routePatternSchema = z.object({
  pattern: z.union([z.string(), z.instanceof(RegExp)]),
  type: endpointTypeSchema,
  description: z.string(),
});

export type RoutePattern = z.infer<typeof routePatternSchema>;

/**
 * Exact route configuration for specific paths
 */
export const exactRouteConfigSchema = z.object({
  path: z.string(),
  limiterKey: z.enum(['admin', 'heavyApi', 'api', 'search', 'submit', 'llmstxt']),
  description: z.string(),
});

export type ExactRouteConfig = z.infer<typeof exactRouteConfigSchema>;

// ============================================================================
// EXACT ROUTE MAPPINGS
// ============================================================================

/**
 * Exact path matches - highest priority
 * These routes get specific rate limiters applied directly
 */
export const EXACT_ROUTE_CONFIG: readonly ExactRouteConfig[] = [
  // Admin endpoints (extremely restrictive)
  {
    path: '/api/cache/warm',
    limiterKey: 'admin',
    description: 'Cache warming endpoint - admin operations only',
  },

  // Heavy API endpoints (moderate restrictions)
  {
    path: '/api/all-configurations.json',
    limiterKey: 'heavyApi',
    description: 'All configurations - heavy dataset with moderate restrictions',
  },
  {
    path: '/api/guides/trending',
    limiterKey: 'heavyApi',
    description: 'Trending guides - moderate usage endpoint',
  },

  // Standard API endpoints (generous limits)
  {
    path: '/api/agents.json',
    limiterKey: 'api',
    description: 'Agents API - standard usage',
  },
  {
    path: '/api/mcp.json',
    limiterKey: 'api',
    description: 'MCP servers API - standard usage',
  },
  {
    path: '/api/rules.json',
    limiterKey: 'api',
    description: 'Rules API - standard usage',
  },
  {
    path: '/api/commands.json',
    limiterKey: 'api',
    description: 'Commands API - standard usage',
  },
  {
    path: '/api/hooks.json',
    limiterKey: 'api',
    description: 'Hooks API - standard usage',
  },
  {
    path: '/api/statuslines.json',
    limiterKey: 'api',
    description: 'Status lines API - standard usage',
  },
  {
    path: '/api/collections.json',
    limiterKey: 'api',
    description: 'Collections API - standard usage',
  },
] as const;

// ============================================================================
// PATTERN-BASED ROUTE CLASSIFICATION
// ============================================================================

/**
 * Pattern-based endpoint classification
 * Used for dynamic routes that don't match exact paths
 */
export const ROUTE_PATTERNS: readonly RoutePattern[] = [
  // Admin patterns
  {
    pattern: /^\/api\/admin\//,
    type: 'admin',
    description: 'Admin API endpoints',
  },
  {
    pattern: /^\/api\/cache\//,
    type: 'admin',
    description: 'Cache management endpoints',
  },

  // Heavy API patterns
  {
    pattern: /^\/api\/cron\//,
    type: 'heavy_api',
    description: 'Cron job endpoints',
  },
  {
    pattern: /^\/api\/webhooks\//,
    type: 'heavy_api',
    description: 'Webhook endpoints',
  },

  // Search patterns
  {
    pattern: /^\/api\/search/,
    type: 'search',
    description: 'Search API endpoints',
  },

  // Submit patterns
  {
    pattern: /^\/api\/submit/,
    type: 'submit',
    description: 'Form submission endpoints',
  },

  // Standard API patterns (catch-all for JSON APIs)
  {
    pattern: /^\/api\/[^/]+\.json$/,
    type: 'api',
    description: 'Dynamic content type APIs',
  },

  // Static patterns
  {
    pattern: /^\/api\/.*\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    type: 'static',
    description: 'Static assets (no rate limiting)',
  },
] as const;

// ============================================================================
// SPECIAL ROUTE HANDLERS
// ============================================================================

/**
 * LLMs.txt routes - special handling for AI training data access
 * Moderate rate limiting to prevent scraping abuse
 */
export const LLMSTXT_PATTERNS = ['/llms.txt', /\/llms\.txt$/] as const;

/**
 * Check if a pathname matches an LLMs.txt pattern
 */
export function isLLMsTxtRoute(pathname: string): boolean {
  return pathname === '/llms.txt' || pathname.endsWith('/llms.txt');
}

// ============================================================================
// ROUTE CLASSIFICATION LOGIC
// ============================================================================

/**
 * Classify an endpoint by its pathname
 * Returns the endpoint type for rate limiting
 *
 * Priority order:
 * 1. Exact path matches (EXACT_ROUTE_CONFIG)
 * 2. LLMs.txt special handling
 * 3. Pattern-based matching (ROUTE_PATTERNS)
 * 4. Default to 'api' type
 */
export function classifyEndpoint(pathname: string): EndpointType {
  // Check exact matches first
  const exactMatch = EXACT_ROUTE_CONFIG.find((config) => config.path === pathname);
  if (exactMatch) {
    // Map limiter keys to endpoint types
    const limiterToTypeMap: Record<ExactRouteConfig['limiterKey'], EndpointType> = {
      admin: 'admin',
      heavyApi: 'heavy_api',
      api: 'api',
      search: 'search',
      submit: 'submit',
      llmstxt: 'api', // LLMs.txt uses api type but with llmstxt limiter
    };
    return limiterToTypeMap[exactMatch.limiterKey];
  }

  // Check LLMs.txt routes
  if (isLLMsTxtRoute(pathname)) {
    return 'api'; // Uses llmstxt limiter but classified as api type
  }

  // Check pattern matches
  for (const routePattern of ROUTE_PATTERNS) {
    if (typeof routePattern.pattern === 'string') {
      if (pathname === routePattern.pattern) {
        return routePattern.type;
      }
    } else if (routePattern.pattern.test(pathname)) {
      return routePattern.type;
    }
  }

  // Default to API type for API endpoints
  if (pathname.startsWith('/api/')) {
    return 'api';
  }

  // Non-API endpoints get static classification (no rate limiting)
  return 'static';
}

/**
 * Get the rate limiter key for a specific pathname
 * This is used to select the appropriate rate limiter instance
 */
export function getRateLimiterKey(
  pathname: string
): 'admin' | 'heavyApi' | 'api' | 'search' | 'submit' | 'llmstxt' | null {
  // Check exact matches first
  const exactMatch = EXACT_ROUTE_CONFIG.find((config) => config.path === pathname);
  if (exactMatch) {
    return exactMatch.limiterKey;
  }

  // Check LLMs.txt routes
  if (isLLMsTxtRoute(pathname)) {
    return 'llmstxt';
  }

  // Classify endpoint and map to limiter key
  const endpointType = classifyEndpoint(pathname);

  // Map endpoint types to limiter keys
  const typeToLimiterMap: Record<EndpointType, ExactRouteConfig['limiterKey'] | null> = {
    admin: 'admin',
    heavy_api: 'heavyApi',
    search: 'search',
    submit: 'submit',
    api: 'api',
    static: null, // No rate limiting for static assets
  };

  return typeToLimiterMap[endpointType];
}

/**
 * Get a user-friendly description for a rate limited route
 */
export function getRouteDescription(pathname: string): string {
  // Check exact matches
  const exactMatch = EXACT_ROUTE_CONFIG.find((config) => config.path === pathname);
  if (exactMatch) {
    return exactMatch.description;
  }

  // Check patterns
  for (const routePattern of ROUTE_PATTERNS) {
    if (typeof routePattern.pattern === 'string') {
      if (pathname === routePattern.pattern) {
        return routePattern.description;
      }
    } else if (routePattern.pattern.test(pathname)) {
      return routePattern.description;
    }
  }

  // Default descriptions by endpoint type
  const endpointType = classifyEndpoint(pathname);
  const defaultDescriptions: Record<EndpointType, string> = {
    admin: 'Administrative endpoint',
    heavy_api: 'Heavy data API endpoint',
    search: 'Search endpoint',
    submit: 'Form submission endpoint',
    api: 'Standard API endpoint',
    static: 'Static asset',
  };

  return defaultDescriptions[endpointType];
}

/**
 * Build the rate limit configuration map
 * Maps pathnames to their rate limiter instances
 */
export function buildRateLimitConfig(rateLimiters: {
  admin: RateLimiter;
  heavyApi: RateLimiter;
  api: RateLimiter;
  search: RateLimiter;
  submit: RateLimiter;
  llmstxt: RateLimiter;
}): Record<string, RateLimiter> {
  const config: Record<string, RateLimiter> = {};

  // Build exact route mappings
  for (const route of EXACT_ROUTE_CONFIG) {
    config[route.path] = rateLimiters[route.limiterKey];
  }

  return config;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that all exact routes have valid limiter keys
 */
export function validateRateLimitConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate exact routes
  for (const route of EXACT_ROUTE_CONFIG) {
    try {
      exactRouteConfigSchema.parse(route);
    } catch (error) {
      errors.push(`Invalid exact route config for ${route.path}: ${error}`);
    }
  }

  // Validate route patterns
  for (const pattern of ROUTE_PATTERNS) {
    try {
      routePatternSchema.parse(pattern);
    } catch (error) {
      errors.push(`Invalid route pattern: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
