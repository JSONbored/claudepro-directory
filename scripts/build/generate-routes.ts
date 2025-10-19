#!/usr/bin/env tsx
/**
 * Route Generation Script
 *
 * Auto-generates route constants from Next.js app directory structure
 * Ensures routes.ts stays in sync with actual file system
 *
 * Features:
 * - Scans src/app directory for page.tsx files
 * - Converts file paths to Next.js routes
 * - Generates TypeScript constants with proper naming
 * - Categorizes routes (static, dynamic, API, etc.)
 * - Detects drift between generated and current routes
 *
 * Usage:
 *   npm run generate:routes        # Generate and update routes.ts
 *   npm run generate:routes --dry  # Show what would change
 *   npm run generate:routes --check # Exit 1 if drift detected
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllCategoryIds } from '../../src/lib/config/category-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');
const APP_DIR = join(ROOT, 'src/app');
const ROUTES_FILE = join(ROOT, 'src/lib/constants/routes.ts');

// ============================================================================
// Additional Routes (not file-based)
// ============================================================================

const ADDITIONAL_ROUTES: Route[] = [
  // Category routes (served by [category]/page.tsx but need explicit constants)
  ...getAllCategoryIds().map((category) => ({
    path: `/${category}`,
    constantName: category.toUpperCase().replace(/-/g, '_'),
    category: 'content' as const,
    isDynamic: false,
  })),
  // Special routes
  {
    path: '/compare',
    constantName: 'COMPARE',
    category: 'static' as const,
    isDynamic: false,
  },
  {
    path: '/llms.txt',
    constantName: 'LLMS_TXT',
    category: 'static' as const,
    isDynamic: false,
  },
  {
    path: '/manifest',
    constantName: 'MANIFEST',
    category: 'static' as const,
    isDynamic: false,
  },
  {
    path: '/account/companies',
    constantName: 'ACCOUNT_COMPANIES',
    category: 'account' as const,
    isDynamic: false,
  },
];

// ============================================================================
// Types
// ============================================================================

interface Route {
  path: string;
  constantName: string;
  category: 'static' | 'dynamic' | 'catch-all' | 'api' | 'auth' | 'account' | 'tools' | 'content';
  isDynamic: boolean;
  params?: string[];
}

// ============================================================================
// Route Discovery
// ============================================================================

function findPageFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];

  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results.push(...findPageFiles(fullPath, baseDir));
    } else if (entry === 'page.tsx') {
      // Found a route page
      results.push(fullPath);
    }
  }

  return results;
}

function filePathToRoute(filePath: string): string {
  // Get relative path from app directory
  const relativePath = relative(APP_DIR, dirname(filePath));

  if (relativePath === '') {
    // Root page.tsx -> /
    return '/';
  }

  // Remove route groups (folders in parentheses like (seo))
  const withoutGroups = relativePath.replace(/\([^)]+\)\/?/g, '');

  // Convert to route path
  let route = '/' + withoutGroups.replace(/\\/g, '/');

  // Clean up double slashes
  route = route.replace(/\/+/g, '/');

  return route;
}

function routeToConstantName(route: string): string {
  if (route === '/') return 'HOME';

  // Remove leading slash and convert to constant name
  let name = route
    .slice(1)
    .toUpperCase()
    .replace(/\[([^\]]+)\]/g, '_$1_') // [id] -> _ID_
    .replace(/\.\.\./g, 'CATCH_ALL_')
    .replace(/\//g, '_')
    .replace(/-/g, '_');

  // Clean up multiple underscores
  name = name.replace(/_+/g, '_').replace(/^_|_$/g, '');

  return name;
}

function categorizeRoute(route: string): Route['category'] {
  if (route.startsWith('/api')) return 'api';
  if (route.startsWith('/auth')) return 'auth';
  if (route.startsWith('/account')) return 'account';
  if (route.startsWith('/tools')) return 'tools';
  if (route.includes('[') && route.includes(']')) {
    if (route.includes('[...')) return 'catch-all';
    if (route.match(/\/\[category\]/)) return 'content';
    return 'dynamic';
  }
  return 'static';
}

function extractDynamicParams(route: string): string[] {
  const params: string[] = [];
  const matches = route.matchAll(/\[([^\]]+)\]/g);
  for (const match of matches) {
    params.push(match[1].replace('...', ''));
  }
  return params;
}

function discoverRoutes(): Route[] {
  const pageFiles = findPageFiles(APP_DIR);
  const routes: Route[] = [];

  for (const filePath of pageFiles) {
    const path = filePathToRoute(filePath);
    const constantName = routeToConstantName(path);
    const category = categorizeRoute(path);
    const isDynamic = path.includes('[');
    const params = isDynamic ? extractDynamicParams(path) : undefined;

    routes.push({
      path,
      constantName,
      category,
      isDynamic,
      params,
    });
  }

  // Add non-file-based routes
  routes.push(...ADDITIONAL_ROUTES);

  // Remove duplicates based on constantName
  const uniqueRoutes = Array.from(
    new Map(routes.map((route) => [route.constantName, route])).values()
  );

  // Sort by category, then alphabetically
  return uniqueRoutes.sort((a, b) => {
    if (a.category !== b.category) {
      const order = [
        'static',
        'content',
        'dynamic',
        'account',
        'tools',
        'auth',
        'api',
        'catch-all',
      ];
      return order.indexOf(a.category) - order.indexOf(b.category);
    }
    return a.path.localeCompare(b.path);
  });
}

// ============================================================================
// Code Generation
// ============================================================================

function generateRoutesFile(routes: Route[]): string {
  const header = `/**
 * Application Routes Configuration
 *
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated by: scripts/build/generate-routes.ts
 *
 * Single source of truth for all internal routes
 * Type-safe navigation with proper TypeScript support
 *
 * @example
 * \`\`\`typescript
 * import { ROUTES } from '@/src/lib/constants/routes';
 *
 * // Static routes
 * router.push(ROUTES.HOME);
 *
 * // Dynamic routes with helpers
 * router.push(ROUTES.CATEGORY_DETAIL({ category: 'agents', slug: 'example' }));
 * \`\`\`
 */

`;

  const staticRoutes = routes.filter((r) => !r.isDynamic);
  const dynamicRoutes = routes.filter((r) => r.isDynamic);

  let content = header;

  // Static routes object
  content += '// ============================================================================\n';
  content += '// Static Routes\n';
  content += '// ============================================================================\n\n';
  content += 'export const ROUTES = {\n';

  for (const route of staticRoutes) {
    const comment = route.category !== 'static' ? ` // ${route.category}` : '';
    content += `\t${route.constantName}: '${route.path}',${comment}\n`;
  }

  content += '} as const;\n\n';

  // Dynamic route helpers
  if (dynamicRoutes.length > 0) {
    content += '// ============================================================================\n';
    content += '// Dynamic Route Helpers\n';
    content +=
      '// ============================================================================\n\n';

    for (const route of dynamicRoutes) {
      if (!route.params) continue;

      const funcName = route.constantName;
      const paramsType = route.params.map((p) => `${p}: string`).join(', ');
      let routePath = route.path;

      // Build the route construction
      for (const param of route.params) {
        routePath = routePath.replace(`[${param}]`, `\${${param}}`);
      }

      content += '/**\n';
      content += ` * ${route.path}\n`;
      content += ' */\n';
      content += `export const ${funcName} = (params: { ${paramsType} }) => {\n`;
      content += `\tconst { ${route.params.join(', ')} } = params;\n`;
      content += `\treturn \`${routePath}\`;\n`;
      content += '};\n\n';
    }
  }

  // Export all route paths as array for validation
  content += '// ============================================================================\n';
  content += '// All Routes (for validation/testing)\n';
  content += '// ============================================================================\n\n';
  content += 'export const ALL_STATIC_ROUTES = [\n';
  for (const route of staticRoutes) {
    content += `\t'${route.path}',\n`;
  }
  content += '] as const;\n\n';

  content += 'export const ALL_DYNAMIC_ROUTE_PATTERNS = [\n';
  for (const route of dynamicRoutes) {
    content += `\t'${route.path}',\n`;
  }
  content += '] as const;\n';

  return content;
}

// ============================================================================
// Drift Detection
// ============================================================================

function detectDrift(newContent: string): { hasDrift: boolean; message: string } {
  if (!existsSync(ROUTES_FILE)) {
    return {
      hasDrift: true,
      message: 'routes.ts does not exist - will be created',
    };
  }

  const currentContent = readFileSync(ROUTES_FILE, 'utf-8');

  if (currentContent === newContent) {
    return {
      hasDrift: false,
      message: 'routes.ts is up to date',
    };
  }

  return {
    hasDrift: true,
    message: 'routes.ts is out of sync with app directory',
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry');
  const isCheckOnly = args.includes('--check');

  console.log('🔍 Scanning app directory for routes...\n');

  const routes = discoverRoutes();

  console.log(`Found ${routes.length} routes:`);
  console.log(`  - ${routes.filter((r) => !r.isDynamic).length} static routes`);
  console.log(`  - ${routes.filter((r) => r.isDynamic).length} dynamic routes\n`);

  const newContent = generateRoutesFile(routes);
  const { hasDrift, message } = detectDrift(newContent);

  console.log(`📊 ${message}\n`);

  if (!hasDrift) {
    console.log('✅ No changes needed');
    process.exit(0);
  }

  if (isCheckOnly) {
    console.log('❌ Routes are out of sync (--check mode)');
    console.log('   Run `npm run generate:routes` to update\n');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('📝 Dry run - would generate:\n');
    console.log(newContent);
    process.exit(0);
  }

  // Write the file
  writeFileSync(ROUTES_FILE, newContent, 'utf-8');
  console.log(`✅ Generated ${ROUTES_FILE}`);
  console.log(`   ${routes.length} routes exported\n`);
}

main();
