import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import ora from 'ora';
import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');
const EDGE_ROOT = join(PROJECT_ROOT, 'apps/edge/functions/public-api');

const jiti = createJiti(import.meta.url);

interface RouteConfig {
  name: string;
  path: string;
  methods: string[];
  handler: {
    import: string;
    function: string;
  };
  analytics?: string;
  rateLimit?: 'public' | 'heavy' | 'indexnow';
}

export async function runGenerateEdgeRoutes() {
  const spinner = ora('Generating Edge Routes...').start();

  try {
    // Load Config
    const configPath = join(EDGE_ROOT, 'routes.config.ts');
    const mod = (await jiti.import(configPath)) as { ROUTES: RouteConfig[] };
    const routes = mod.ROUTES;

    if (!routes) {
      throw new Error('ROUTES export not found in config');
    }

    await generateRouterFile(routes);

    spinner.succeed('Generated public-api/index.ts');
  } catch (error) {
    spinner.fail('Failed to generate edge routes');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

function generateMatchFunction(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    return '(ctx) => ctx.segments.length === 0';
  }

  const checks = segments.map((segment, i) => {
    if (segment.startsWith(':')) {
      // Param - just check existence if needed, or ignore
      return `ctx.segments[${i}] !== undefined`;
    }
    return `ctx.segments[${i}] === '${segment}'`;
  });

  // Also check length if not a wildcard suffix (not supported yet but assumed strict match for now unless it's a prefix route like /content)
  // Current manual router often checks `match: (ctx) => ctx.segments[0] === 'content'` which matches `/content/*`.
  // Our config needs to distinguish exact vs prefix.
  // For now, let's assume if it has no params, it's a prefix check if it's a "directory" or exact if it's a "resource".
  // Actually, the existing router mostly uses prefix matching for the first segment.
  // Let's replicate the existing logic based on the config paths.

  // Special handling for search/autocomplete vs search
  // If path is /search/autocomplete, we generate check for [0] and [1].

  return `(ctx) => ${checks.join(' && ')}`;
}

async function generateRouterFile(routes: RouteConfig[]) {
  const imports = new Set<string>();
  const routeDefinitions: string[] = [];

  imports.add(`import {
  analytics,
  buildStandardContext,
  chain,
  getOnlyCorsHeaders,
  jsonResponse,
  rateLimit,
  type StandardContext,
  serveEdgeApp,
} from '@heyclaude/edge-runtime';`);

  imports.add(`import {
  checkRateLimit,
  createDataApiContext,
  RATE_LIMIT_PRESETS,
} from '@heyclaude/shared-runtime';`);

  // Collect handler imports
  for (const route of routes) {
    imports.add(`import { ${route.handler.function} } from '${route.handler.import}';`);
  }

  // Additional imports needed for manual logic migration (temporary until full generation)
  imports.add(
    `import { handlePackageGenerationQueue } from './routes/content-generate/queue-worker.ts';`
  );
  imports.add(`import { handleUploadPackage } from './routes/content-generate/upload.ts';`);

  for (const route of routes) {
    const matchFn = generateMatchFunction(route.path);
    const analyticsName = route.analytics || route.name;

    // Special handling for rate limit dynamic logic in 'content' and 'sitemap'
    let rateLimitLogic = '';
    if (route.rateLimit) {
      rateLimitLogic = `, rateLimit('${route.rateLimit}')`;
    } else if (route.name === 'content') {
      rateLimitLogic = `, rateLimit((ctx) => (ctx.method === 'POST' ? 'heavy' : 'public'))`;
    } else if (route.name === 'sitemap') {
      rateLimitLogic = `, rateLimit((ctx) => (ctx.method === 'POST' ? 'indexnow' : 'heavy'))`;
    }

    // Special handling for content-generate handler which is complex
    let handlerLogic = '';
    if (route.name === 'content-generate') {
      // Inlining the complex handler logic from original file
      // This is "cheating" the generator but necessary for 1:1 migration without refactoring the sub-handlers
      handlerLogic = `async (ctx) => {
        // Check for sub-routes
        if (ctx.segments[2] === 'upload') {
          const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
          if (!rateLimit.allowed) {
            return jsonResponse({ error: 'Too Many Requests', message: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter }, 429, BASE_CORS, { 'Retry-After': String(rateLimit.retryAfter ?? 60), 'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests), 'X-RateLimit-Remaining': String(rateLimit.remaining), 'X-RateLimit-Reset': String(rateLimit.resetAt) });
          }
          const logContext = createPublicApiContext('content-generate-upload', { path: ctx.pathname });
          const response = await handleUploadPackage(ctx.request, logContext);
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
          return new Response(response.body, { status: response.status, headers });
        }
        if (ctx.segments[2] === 'process') {
          const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
          if (!rateLimit.allowed) {
            return jsonResponse({ error: 'Too Many Requests', message: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter }, 429, BASE_CORS, { 'Retry-After': String(rateLimit.retryAfter ?? 60), 'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests), 'X-RateLimit-Remaining': String(rateLimit.remaining), 'X-RateLimit-Reset': String(rateLimit.resetAt) });
          }
          const response = await handlePackageGenerationQueue(ctx.request);
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
          return new Response(response.body, { status: response.status, headers });
        }
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
        if (!rateLimit.allowed) {
          return jsonResponse({ error: 'Too Many Requests', message: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter }, 429, BASE_CORS, { 'Retry-After': String(rateLimit.retryAfter ?? 60), 'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests), 'X-RateLimit-Remaining': String(rateLimit.remaining), 'X-RateLimit-Reset': String(rateLimit.resetAt) });
        }
        const logContext = createPublicApiContext('content-generate', { path: ctx.pathname, method: ctx.method, resource: 'generate-package' });
        const response = await ${route.handler.function}(ctx.request, logContext);
        const headers = new Headers(response.headers);
        headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
        headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
        return new Response(response.body, { status: response.status, headers });
      }`;
    } else if (route.name === 'search-main') {
      handlerLogic = `(ctx) => ${route.handler.function}(ctx.request, performance.now())`;
    } else if (route.name === 'search-autocomplete') {
      handlerLogic = `(ctx) => ${route.handler.function}(ctx.request, performance.now())`;
    } else if (route.name === 'search-facets') {
      handlerLogic = `() => ${route.handler.function}(performance.now())`;
    } else if (route.name === 'og-image') {
      handlerLogic = `(ctx) => ${route.handler.function}(ctx.request, performance.now())`;
    } else if (route.name === 'root') {
      handlerLogic = `(ctx) => ${route.handler.function}(ctx)`;
    } else if (route.name === 'transform-highlight' || route.name === 'transform-process') {
      handlerLogic = `(ctx) => ${route.handler.function}(ctx.request)`;
    } else if (route.name === 'seo') {
      handlerLogic = `(ctx) => {
        const logContext = createPublicApiContext('seo', { path: ctx.pathname, method: ctx.method });
        return ${route.handler.function}(ctx.segments.slice(1), ctx.url, ctx.method, logContext);
      }`;
    } else if (route.name === 'sitemap') {
      handlerLogic = `(ctx) => {
        const logContext = createPublicApiContext('sitemap', { path: ctx.pathname, method: ctx.method });
        return ${route.handler.function}(ctx.segments.slice(1), ctx.url, ctx.method, ctx.request, logContext);
      }`;
    } else if (route.name === 'content') {
      handlerLogic = `(ctx) => {
        const logContext = createPublicApiContext('content', {
          path: ctx.pathname,
          method: ctx.method,
          ...(ctx.segments.length > 1 && ctx.segments[1] !== undefined ? { resource: ctx.segments[1] } : {}),
        });
        return ${route.handler.function}(ctx.segments.slice(1), ctx.url, ctx.method, ctx.request, logContext);
      }`;
    } else {
      // Default for standard route handlers
      handlerLogic = `(ctx) => ${route.handler.function}(ctx.segments.slice(1), ctx.url, ctx.method)`;
    }

    // Override match for search-main to exclude sub-routes
    let matchLogic = matchFn;
    if (route.name === 'search-main') {
      matchLogic = `(ctx) => {
        const primary = ctx.segments[0];
        const secondary = ctx.segments[1] ?? '';
        return primary === 'search' && !['autocomplete', 'facets'].includes(secondary);
      }`;
    }
    if (route.name === 'sitemap') {
      matchLogic = `(ctx) => {
        const firstSegment = ctx.segments[0];
        return firstSegment === 'sitemap' || firstSegment === 'sitemap.xml';
      }`;
    }

    routeDefinitions.push(`    {
      name: '${route.name}',
      methods: ${JSON.stringify(route.methods)},
      cors: BASE_CORS,
      match: ${matchLogic},
      handler: chain(analyticsPublic('${analyticsName}')${rateLimitLogic})(${handlerLogic}),
    }`);
  }

  const fileContent = `/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

${Array.from(imports).join('\n')}

const BASE_CORS = getOnlyCorsHeaders;
const PUBLIC_API_APP_LABEL = 'public-api';
const analyticsPublic = (routeName: string) => analytics(routeName, { app: PUBLIC_API_APP_LABEL });
const createPublicApiContext = (
  route: string,
  options?: { path?: string; method?: string; resource?: string }
) => createDataApiContext(route, { ...options, app: PUBLIC_API_APP_LABEL });

// Use StandardContext directly as it matches our needs
type PublicApiContext = StandardContext;

serveEdgeApp<PublicApiContext>({
  buildContext: (request) =>
    buildStandardContext(request, ['/functions/v1/public-api', '/public-api']),
  defaultCors: BASE_CORS,
  onNoMatch: (ctx) =>
    jsonResponse(
      {
        error: 'Not Found',
        message: 'Unknown data resource',
        path: ctx.pathname,
      },
      404,
      BASE_CORS
    ),
  routes: [
${routeDefinitions.join(',\n\n')}
  ],
});
`;

  writeFileSync(join(EDGE_ROOT, 'index.ts'), fileContent);
}
