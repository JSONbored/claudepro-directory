/**
 * Route Scanner - Automatic Route Discovery & Classification
 *
 * **Enterprise Pattern-Based Metadata Architecture (October 2025)**
 *
 * Automatically discovers all Next.js App Router pages and classifies them
 * into route patterns for metadata generation validation and documentation.
 *
 * **Purpose:**
 * - Validation: Catch new routes without proper metadata templates
 * - Documentation: Generate living documentation of all routes
 * - CI/CD Integration: Fail builds if routes don't match patterns
 * - Confidence Scoring: Identify routes with classification issues
 *
 * **Architecture:**
 * - File System Scan: Discovers all page.tsx files in src/app/
 * - Pattern Classification: Uses route-classifier.ts for pattern matching
 * - Template Validation: Verifies each pattern has metadata template
 * - Human-Readable Report: JSON + console output for debugging
 *
 * **Usage:**
 * ```typescript
 * const report = await scanRoutes();
 * console.log(`Found ${report.routes.length} routes`);
 * console.log(`${report.validation.missingTemplates.length} missing templates`);
 * ```
 *
 * @module lib/seo/route-scanner
 */

import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { METADATA_TEMPLATES } from '@/src/lib/seo/metadata-templates';
import type { RouteClassification, RoutePattern } from '@/src/lib/seo/route-classifier';
import { classifyRoute } from '@/src/lib/seo/route-classifier';

/**
 * Route Discovery Result
 *
 * Represents a discovered page.tsx file with its route path and classification.
 */
export interface DiscoveredRoute {
  /** Absolute file path to page.tsx */
  readonly filePath: string;
  /** Route path (e.g., /agents, /agents/[slug]) */
  readonly route: string;
  /** Route classification */
  readonly classification: RouteClassification;
  /** Whether route has dynamic segments */
  readonly isDynamic: boolean;
}

/**
 * Route Scanner Report
 *
 * Complete report of all discovered routes with validation results.
 */
export interface RouteScanReport {
  /** Total routes discovered */
  readonly totalRoutes: number;
  /** Discovered routes with classifications */
  readonly routes: readonly DiscoveredRoute[];
  /** Routes grouped by pattern */
  readonly routesByPattern: Record<RoutePattern, readonly DiscoveredRoute[]>;
  /** Validation results */
  readonly validation: {
    /** Routes with confidence < 1.0 (potential issues) */
    readonly lowConfidenceRoutes: readonly DiscoveredRoute[];
    /** Patterns without templates (should never happen) */
    readonly missingTemplates: readonly RoutePattern[];
    /** Routes that might need manual review */
    readonly reviewNeeded: readonly DiscoveredRoute[];
  };
  /** Scan metadata */
  readonly metadata: {
    /** Scan timestamp */
    readonly scannedAt: string;
    /** Scan duration in milliseconds */
    readonly scanDurationMs: number;
    /** App directory path */
    readonly appDirectory: string;
  };
}

/**
 * Convert file system path to route path
 *
 * Transforms Next.js App Router file paths into route paths.
 *
 * @param filePath - Absolute path to page.tsx
 * @param appDir - Absolute path to src/app directory
 * @returns Route path (e.g., /agents, /agents/[slug])
 *
 * @example
 * ```typescript
 * filePathToRoute('/path/to/src/app/agents/page.tsx', '/path/to/src/app')
 * // Returns: '/agents'
 *
 * filePathToRoute('/path/to/src/app/agents/[slug]/page.tsx', '/path/to/src/app')
 * // Returns: '/agents/[slug]'
 *
 * filePathToRoute('/path/to/src/app/page.tsx', '/path/to/src/app')
 * // Returns: '/'
 * ```
 */
function filePathToRoute(filePath: string, appDir: string): string {
  // Get relative path from app directory
  const relativePath = relative(appDir, filePath);

  // Remove 'page.tsx' from the end
  const routePath = relativePath.replace(/page\.tsx$/, '');

  // Convert to route format
  if (routePath === '') {
    return '/'; // Homepage
  }

  // Remove trailing slash and convert to route path
  const normalizedPath = routePath.replace(/\/$/, '');

  return `/${normalizedPath}`;
}

/**
 * Recursively discover all page.tsx files
 *
 * Walks the src/app directory tree to find all Next.js pages.
 *
 * @param directory - Directory to scan
 * @param appDir - Root app directory (for route path conversion)
 * @returns Array of discovered routes
 */
async function discoverRoutes(directory: string, appDir: string): Promise<DiscoveredRoute[]> {
  const routes: DiscoveredRoute[] = [];

  try {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (
          entry.name === 'api' || // API routes (not pages)
          entry.name === '_components' || // Private components
          entry.name.startsWith('_') || // Private directories
          entry.name.startsWith('.') // Hidden directories
        ) {
          continue;
        }

        // Recursively scan subdirectories
        const subRoutes = await discoverRoutes(fullPath, appDir);
        routes.push(...subRoutes);
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        // Found a page.tsx file
        const route = filePathToRoute(fullPath, appDir);
        const classification = classifyRoute(route);

        routes.push({
          filePath: fullPath,
          route,
          classification,
          isDynamic: classification.isDynamic,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }

  return routes;
}

/**
 * Scan all routes in src/app directory
 *
 * Discovers all Next.js pages, classifies them, and generates validation report.
 *
 * @param appDir - Optional app directory path (defaults to src/app)
 * @returns Complete route scan report
 *
 * @example
 * ```typescript
 * const report = await scanRoutes();
 *
 * // Print summary
 * console.log(`Total Routes: ${report.totalRoutes}`);
 * console.log(`By Pattern:`);
 * for (const [pattern, routes] of Object.entries(report.routesByPattern)) {
 *   console.log(`  ${pattern}: ${routes.length} routes`);
 * }
 *
 * // Check for issues
 * if (report.validation.lowConfidenceRoutes.length > 0) {
 *   console.warn('Routes with low confidence:');
 *   report.validation.lowConfidenceRoutes.forEach(route => {
 *     console.warn(`  ${route.route} (${route.classification.confidence})`);
 *   });
 * }
 * ```
 */
export async function scanRoutes(appDir?: string): Promise<RouteScanReport> {
  const startTime = Date.now();

  // Determine app directory
  const defaultAppDir = join(process.cwd(), 'src', 'app');
  const targetAppDir = appDir || defaultAppDir;

  // Discover all routes
  const routes = await discoverRoutes(targetAppDir, targetAppDir);

  // Group routes by pattern
  const routesByPattern: Record<RoutePattern, DiscoveredRoute[]> = {
    HOMEPAGE: [],
    CATEGORY: [],
    CONTENT_DETAIL: [],
    USER_PROFILE: [],
    ACCOUNT: [],
    TOOL: [],
    STATIC: [],
    AUTH: [],
  };

  for (const route of routes) {
    routesByPattern[route.classification.pattern].push(route);
  }

  // Validation checks
  const lowConfidenceRoutes = routes.filter((r) => r.classification.confidence < 1.0);

  // Check for patterns without templates (should never happen)
  const missingTemplates: RoutePattern[] = [];
  for (const pattern of Object.keys(METADATA_TEMPLATES) as RoutePattern[]) {
    if (!METADATA_TEMPLATES[pattern]) {
      missingTemplates.push(pattern);
    }
  }

  // Routes that might need manual review (low confidence OR complex dynamic routes)
  const reviewNeeded = routes.filter(
    (r) =>
      r.classification.confidence < 1.0 || (r.isDynamic && r.classification.segments.length > 3) // Deep nested dynamic routes
  );

  const endTime = Date.now();

  return {
    totalRoutes: routes.length,
    routes,
    routesByPattern: routesByPattern as Record<RoutePattern, readonly DiscoveredRoute[]>,
    validation: {
      lowConfidenceRoutes,
      missingTemplates,
      reviewNeeded,
    },
    metadata: {
      scannedAt: new Date().toISOString(),
      scanDurationMs: endTime - startTime,
      appDirectory: targetAppDir,
    },
  };
}

/**
 * Generate human-readable report
 *
 * Formats route scan report as console output for debugging/CI.
 *
 * @param report - Route scan report
 */
export function printReport(report: RouteScanReport): void {
  console.log('=== ROUTE SCANNER REPORT ===\n');
  console.log(`Scanned: ${report.metadata.appDirectory}`);
  console.log(`Duration: ${report.metadata.scanDurationMs}ms`);
  console.log(`Total Routes: ${report.totalRoutes}\n`);

  console.log('Routes by Pattern:');
  for (const [pattern, routes] of Object.entries(report.routesByPattern)) {
    console.log(`  ${pattern.padEnd(20)} ${routes.length} routes`);

    // Show first 3 routes as examples
    if (routes.length > 0) {
      routes.slice(0, 3).forEach((route) => {
        const confidenceIcon = route.classification.confidence === 1.0 ? '✓' : '⚠';
        const dynamicIcon = route.isDynamic ? '[D]' : '   ';
        console.log(
          `    ${confidenceIcon} ${dynamicIcon} ${route.route} (${route.classification.confidence.toFixed(1)})`
        );
      });

      if (routes.length > 3) {
        console.log(`    ... and ${routes.length - 3} more`);
      }
    }
  }

  // Validation section
  console.log('\n=== VALIDATION ===\n');

  if (report.validation.missingTemplates.length > 0) {
    console.log('❌ Missing Templates:');
    report.validation.missingTemplates.forEach((pattern) => {
      console.log(`  - ${pattern}`);
    });
  } else {
    console.log('✅ All patterns have templates');
  }

  if (report.validation.lowConfidenceRoutes.length > 0) {
    console.log(`\n⚠️  Low Confidence Routes (${report.validation.lowConfidenceRoutes.length}):`);
    report.validation.lowConfidenceRoutes.forEach((route) => {
      console.log(`  - ${route.route} (confidence: ${route.classification.confidence})`);
      console.log(`    Pattern: ${route.classification.pattern}`);
    });
  } else {
    console.log('✅ All routes classified with high confidence');
  }

  if (report.validation.reviewNeeded.length > 0) {
    console.log(`\n📋 Routes Needing Review (${report.validation.reviewNeeded.length}):`);
    report.validation.reviewNeeded.forEach((route) => {
      const reason =
        route.classification.confidence < 1.0 ? 'low confidence' : 'deep nested dynamic route';
      console.log(`  - ${route.route} (${reason})`);
    });
  }

  console.log('\n' + '='.repeat(60));
}
