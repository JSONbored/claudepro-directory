#!/usr/bin/env tsx
/**
 * Automated Bundle Analysis Script
 * Generates bundle size reports and tracks changes over time
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Bundle analysis result schema
const bundleAnalysisSchema = z.object({
  timestamp: z.string().datetime(),
  totalSize: z.number(),
  jsSize: z.number(),
  cssSize: z.number(),
  chunks: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      type: z.enum(['js', 'css', 'image', 'font', 'other']),
    })
  ),
  routes: z.array(
    z.object({
      path: z.string(),
      size: z.number(),
      firstLoadJS: z.number(),
    })
  ),
  performance: z.object({
    buildTime: z.number(),
    nodeMemoryUsage: z.number(),
  }),
});

type BundleAnalysis = z.infer<typeof bundleAnalysisSchema>;

class BundleAnalyzer {
  private readonly reportsDir = join(process.cwd(), '.next-bundle-reports');
  private readonly historyFile = join(this.reportsDir, 'bundle-history.json');

  constructor() {
    // Ensure reports directory exists
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Run bundle analysis
   */
  async analyze(): Promise<BundleAnalysis> {
    console.log('🔍 Starting bundle analysis...');
    const startTime = Date.now();

    try {
      // Build with bundle analyzer enabled
      console.log('📦 Building with bundle analyzer...');
      execSync('ANALYZE=true npm run build', {
        stdio: 'pipe',
        env: { ...process.env, ANALYZE: 'true' },
      });

      // Parse build output for size information
      const buildOutput = execSync('npm run build 2>&1', {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'production' },
      });

      // Extract bundle sizes from build output
      const analysis = this.parseBuildOutput(buildOutput);
      analysis.performance.buildTime = Date.now() - startTime;
      analysis.performance.nodeMemoryUsage = process.memoryUsage().heapUsed;

      // Save analysis to history
      this.saveToHistory(analysis);

      // Generate report
      this.generateReport(analysis);

      return analysis;
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse build output to extract bundle information
   */
  private parseBuildOutput(output: string): BundleAnalysis {
    const lines = output.split('\n');
    const chunks: BundleAnalysis['chunks'] = [];
    const routes: BundleAnalysis['routes'] = [];

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    // Parse chunk information
    const chunkPattern = /^\s*([◯●λƒ])\s+([\w/\-.[\]]+)\s+(\d+(?:\.\d+)?)\s*(kB|B)/;
    const routePattern =
      /^([◯●λƒ])\s+(\/[\w\-/[\]]*)\s+(\d+(?:\.\d+)?)\s*kB\s+(\d+(?:\.\d+)?)\s*kB/;

    for (const line of lines) {
      // Parse routes
      const routeMatch = line.match(routePattern);
      if (routeMatch) {
        const [, , path, size, firstLoad] = routeMatch;
        if (path && size && firstLoad) {
          routes.push({
            path,
            size: Number.parseFloat(size) * 1024,
            firstLoadJS: Number.parseFloat(firstLoad) * 1024,
          });
        }
      }

      // Parse chunks
      const chunkMatch = line.match(chunkPattern);
      if (chunkMatch) {
        const [, , name, sizeStr, unit] = chunkMatch;
        if (name && sizeStr && unit) {
          const size = Number.parseFloat(sizeStr) * (unit === 'kB' ? 1024 : 1);
          const type = name.endsWith('.js')
            ? 'js'
            : name.endsWith('.css')
              ? 'css'
              : name.includes('image')
                ? 'image'
                : name.includes('font')
                  ? 'font'
                  : 'other';

          chunks.push({ name, size, type });
          totalSize += size;

          if (type === 'js') jsSize += size;
          if (type === 'css') cssSize += size;
        }
      }
    }

    return bundleAnalysisSchema.parse({
      timestamp: new Date().toISOString(),
      totalSize,
      jsSize,
      cssSize,
      chunks,
      routes,
      performance: {
        buildTime: 0,
        nodeMemoryUsage: 0,
      },
    });
  }

  /**
   * Save analysis to history file
   */
  private saveToHistory(analysis: BundleAnalysis): void {
    let history: BundleAnalysis[] = [];

    if (existsSync(this.historyFile)) {
      try {
        const historyContent = readFileSync(this.historyFile, 'utf-8');
        history = JSON.parse(historyContent);
      } catch (error) {
        console.warn('⚠️ Could not read history file, starting fresh');
        // Log error for debugging but continue with empty history
        if (error instanceof Error) {
          console.debug('History file error:', error.message);
        }
      }
    }

    history.push(analysis);

    // Keep only last 30 analyses
    if (history.length > 30) {
      history = history.slice(-30);
    }

    writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    console.log('✅ Analysis saved to history');
  }

  /**
   * Generate human-readable report
   */
  private generateReport(analysis: BundleAnalysis): void {
    const reportPath = join(this.reportsDir, `bundle-report-${Date.now()}.md`);

    const report = `# Bundle Analysis Report

## Summary
- **Date**: ${new Date(analysis.timestamp).toLocaleString()}
- **Total Size**: ${this.formatSize(analysis.totalSize)}
- **JavaScript**: ${this.formatSize(analysis.jsSize)}
- **CSS**: ${this.formatSize(analysis.cssSize)}
- **Build Time**: ${(analysis.performance.buildTime / 1000).toFixed(2)}s

## Top 10 Largest Chunks
${analysis.chunks
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)
  .map((chunk, i) => `${i + 1}. **${chunk.name}**: ${this.formatSize(chunk.size)} (${chunk.type})`)
  .join('\n')}

## Route Sizes
${analysis.routes
  .sort((a, b) => b.firstLoadJS - a.firstLoadJS)
  .slice(0, 10)
  .map(
    (route) =>
      `- **${route.path}**: ${this.formatSize(route.size)} (First Load: ${this.formatSize(
        route.firstLoadJS
      )})`
  )
  .join('\n')}

## Recommendations
${this.generateRecommendations(analysis)}
`;

    writeFileSync(reportPath, report);
    console.log(`📊 Report generated: ${reportPath}`);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(analysis: BundleAnalysis): string {
    const recommendations: string[] = [];

    // Check for large chunks
    const largeChunks = analysis.chunks.filter((c) => c.size > 200 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(
        `- **Large chunks detected**: ${largeChunks.length} chunks over 200KB. Consider code splitting.`
      );
    }

    // Check for routes with high first load JS
    const heavyRoutes = analysis.routes.filter((r) => r.firstLoadJS > 150 * 1024);
    if (heavyRoutes.length > 0) {
      recommendations.push(
        `- **Heavy routes**: ${heavyRoutes.length} routes with >150KB first load JS. Consider lazy loading.`
      );
    }

    // Check JS/CSS ratio
    const jsRatio = analysis.jsSize / analysis.totalSize;
    if (jsRatio > 0.8) {
      recommendations.push(
        `- **High JavaScript ratio** (${(jsRatio * 100).toFixed(
          1
        )}%): Consider moving logic to the server.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Bundle size looks good!');
    }

    return recommendations.join('\n');
  }

  /**
   * Format size in human-readable format
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  /**
   * Compare with previous analysis
   */
  async compareWithPrevious(): Promise<void> {
    if (!existsSync(this.historyFile)) {
      console.log('No history found for comparison');
      return;
    }

    const history: BundleAnalysis[] = JSON.parse(readFileSync(this.historyFile, 'utf-8'));
    if (history.length < 2) {
      console.log('Not enough history for comparison');
      return;
    }

    const current = history[history.length - 1]!;
    const previous = history[history.length - 2]!;

    const sizeDiff = current.totalSize - previous.totalSize;
    const sizeChange = ((sizeDiff / previous.totalSize) * 100).toFixed(2);

    console.log('\n📈 Comparison with previous build:');
    console.log(
      `Total Size: ${this.formatSize(previous.totalSize)} → ${this.formatSize(current.totalSize)} (${sizeDiff > 0 ? '+' : ''}${sizeChange}%)`
    );
    console.log(
      `JavaScript: ${this.formatSize(previous.jsSize)} → ${this.formatSize(current.jsSize)}`
    );
    console.log(`CSS: ${this.formatSize(previous.cssSize)} → ${this.formatSize(current.cssSize)}`);
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer
    .analyze()
    .then(() => analyzer.compareWithPrevious())
    .then(() => {
      console.log('✨ Bundle analysis complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bundle analysis failed:', error);
      process.exit(1);
    });
}

export { BundleAnalyzer };
