/**
 * Route Scanner Unit Tests
 *
 * Tests the automatic route discovery and classification system.
 * Uses actual file system scanning (integration style) for realistic testing.
 *
 * Coverage goals:
 * - Route discovery from actual src/app directory
 * - Pattern classification integration
 * - Validation checks (low confidence, missing templates)
 * - Report generation and formatting
 */

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { printReport, type RouteScanReport, scanRoutes } from '@/src/lib/seo/route-scanner';

describe('scanRoutes', () => {
  it('discovers routes from src/app directory', async () => {
    const report = await scanRoutes();

    expect(report.totalRoutes).toBeGreaterThan(0);
    expect(report.routes).toBeInstanceOf(Array);
    expect(report.routes.length).toBe(report.totalRoutes);
  });

  it('includes homepage route', async () => {
    const report = await scanRoutes();

    const homepage = report.routes.find((r) => r.route === '/');

    expect(homepage).toBeDefined();
    expect(homepage?.classification.pattern).toBe('HOMEPAGE');
    expect(homepage?.classification.confidence).toBe(1.0);
    expect(homepage?.isDynamic).toBe(false);
  });

  it('classifies category routes correctly', async () => {
    const report = await scanRoutes();

    const categoryRoutes = report.routesByPattern.CATEGORY;

    expect(categoryRoutes.length).toBeGreaterThan(0);

    // Verify each category route has expected structure
    categoryRoutes.forEach((route) => {
      // Should be single segment (may include [category] dynamic route)
      expect(route.classification.segments.length).toBe(1);
      expect(route.classification.pattern).toBe('CATEGORY');
      expect(route.classification.confidence).toBe(1.0);
    });
  });

  it('classifies content detail routes correctly', async () => {
    const report = await scanRoutes();

    const detailRoutes = report.routesByPattern.CONTENT_DETAIL;

    expect(detailRoutes.length).toBeGreaterThan(0);

    // Verify dynamic segment detection
    detailRoutes.forEach((route) => {
      expect(route.isDynamic).toBe(true);
      expect(route.classification.pattern).toBe('CONTENT_DETAIL');
    });
  });

  it('classifies account routes correctly', async () => {
    const report = await scanRoutes();

    const accountRoutes = report.routesByPattern.ACCOUNT;

    expect(accountRoutes.length).toBeGreaterThan(0);

    // Verify all account routes start with /account
    accountRoutes.forEach((route) => {
      expect(route.route).toMatch(/^\/account/);
      expect(route.classification.pattern).toBe('ACCOUNT');
      expect(route.classification.confidence).toBe(1.0);
    });
  });

  it('classifies auth routes correctly', async () => {
    const report = await scanRoutes();

    const authRoutes = report.routesByPattern.AUTH;

    // May or may not have auth routes depending on project structure
    if (authRoutes.length > 0) {
      authRoutes.forEach((route) => {
        expect(route.route).toMatch(/^\/auth/);
        expect(route.classification.pattern).toBe('AUTH');
      });
    }
  });

  it('classifies static routes correctly', async () => {
    const report = await scanRoutes();

    const staticRoutes = report.routesByPattern.STATIC;

    // Verify static routes have lower confidence
    staticRoutes.forEach((route) => {
      expect(route.classification.pattern).toBe('STATIC');
      expect(route.classification.confidence).toBe(0.5);
    });
  });

  it('groups routes by pattern', async () => {
    const report = await scanRoutes();

    const patterns = [
      'HOMEPAGE',
      'CATEGORY',
      'CONTENT_DETAIL',
      'USER_PROFILE',
      'ACCOUNT',
      'TOOL',
      'STATIC',
      'AUTH',
    ] as const;

    patterns.forEach((pattern) => {
      expect(report.routesByPattern[pattern]).toBeInstanceOf(Array);
    });

    // Verify sum of all pattern groups equals total routes
    const totalByPattern = Object.values(report.routesByPattern).reduce(
      (sum, routes) => sum + routes.length,
      0
    );
    expect(totalByPattern).toBe(report.totalRoutes);
  });

  it('includes validation metadata', async () => {
    const report = await scanRoutes();

    expect(report.validation).toBeDefined();
    expect(report.validation.lowConfidenceRoutes).toBeInstanceOf(Array);
    expect(report.validation.missingTemplates).toBeInstanceOf(Array);
    expect(report.validation.reviewNeeded).toBeInstanceOf(Array);
  });

  it('identifies low confidence routes', async () => {
    const report = await scanRoutes();

    const lowConfidenceRoutes = report.validation.lowConfidenceRoutes;

    // All low confidence routes should have confidence < 1.0
    lowConfidenceRoutes.forEach((route) => {
      expect(route.classification.confidence).toBeLessThan(1.0);
    });
  });

  it('checks for missing templates', async () => {
    const report = await scanRoutes();

    // Should have no missing templates (all patterns have templates)
    expect(report.validation.missingTemplates).toEqual([]);
  });

  it('identifies routes needing review', async () => {
    const report = await scanRoutes();

    const reviewNeeded = report.validation.reviewNeeded;

    // Routes needing review should either have low confidence OR be deeply nested
    reviewNeeded.forEach((route) => {
      const isLowConfidence = route.classification.confidence < 1.0;
      const isDeeplyNested = route.isDynamic && route.classification.segments.length > 3;

      expect(isLowConfidence || isDeeplyNested).toBe(true);
    });
  });

  it('includes scan metadata', async () => {
    const report = await scanRoutes();

    expect(report.metadata).toBeDefined();
    expect(report.metadata.scannedAt).toBeTruthy();
    expect(report.metadata.scanDurationMs).toBeGreaterThanOrEqual(0);
    expect(report.metadata.appDirectory).toContain('src/app');
  });

  it('measures scan duration', async () => {
    const report = await scanRoutes();

    expect(report.metadata.scanDurationMs).toBeGreaterThan(0);
    expect(report.metadata.scanDurationMs).toBeLessThan(5000); // Should be fast (< 5s)
  });

  it('uses default app directory when not specified', async () => {
    const report = await scanRoutes();

    expect(report.metadata.appDirectory).toMatch(/src\/app$/);
  });

  it('accepts custom app directory', async () => {
    const customAppDir = join(process.cwd(), 'src', 'app');
    const report = await scanRoutes(customAppDir);

    expect(report.metadata.appDirectory).toBe(customAppDir);
  });

  it('includes file paths for all discovered routes', async () => {
    const report = await scanRoutes();

    report.routes.forEach((route) => {
      expect(route.filePath).toBeTruthy();
      expect(route.filePath).toContain('page.tsx');
    });
  });

  it('correctly identifies dynamic vs static routes', async () => {
    const report = await scanRoutes();

    // Homepage should NOT be dynamic
    const homepage = report.routes.find((r) => r.route === '/');
    expect(homepage?.isDynamic).toBe(false);

    // Category detail routes SHOULD be dynamic
    const detailRoutes = report.routesByPattern.CONTENT_DETAIL;
    detailRoutes.forEach((route) => {
      expect(route.isDynamic).toBe(true);
    });
  });

  it('produces deterministic results on repeated scans', async () => {
    const report1 = await scanRoutes();
    const report2 = await scanRoutes();

    expect(report1.totalRoutes).toBe(report2.totalRoutes);

    // Route paths should match (order might differ)
    const routes1 = report1.routes.map((r) => r.route).sort();
    const routes2 = report2.routes.map((r) => r.route).sort();

    expect(routes1).toEqual(routes2);
  });
});

describe('printReport', () => {
  it('prints report without throwing errors', async () => {
    const report = await scanRoutes();

    // Should not throw
    expect(() => printReport(report)).not.toThrow();
  });

  it('handles empty validation results gracefully', () => {
    const emptyReport: RouteScanReport = {
      totalRoutes: 0,
      routes: [],
      routesByPattern: {
        HOMEPAGE: [],
        CATEGORY: [],
        CONTENT_DETAIL: [],
        USER_PROFILE: [],
        ACCOUNT: [],
        TOOL: [],
        STATIC: [],
        AUTH: [],
      },
      validation: {
        lowConfidenceRoutes: [],
        missingTemplates: [],
        reviewNeeded: [],
      },
      metadata: {
        scannedAt: new Date().toISOString(),
        scanDurationMs: 0,
        appDirectory: '/test',
      },
    };

    expect(() => printReport(emptyReport)).not.toThrow();
  });
});
